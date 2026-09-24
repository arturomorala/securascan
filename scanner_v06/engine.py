from __future__ import annotations

import base64
import hashlib
import json
import re
import time
import uuid
from collections import deque
from urllib.parse import parse_qsl, urlencode, urljoin, urlsplit, urlunsplit

import httpx
from bs4 import BeautifulSoup

from app.core.config import settings
from app.scanner import engine_v05 as v05

UA = "SecuraScan/0.6 (+authorized-non-destructive-security-audit)"
MAX_CRAWL_PAGES = 20
MAX_CRAWL_DEPTH = 3
MAX_LINKS_PER_PAGE = 60
MAX_ACTIVE_POST_FORMS = 4
MAX_ACTIVE_JSON_ENDPOINTS = 3
MAX_ENDPOINT_PROBES = 8
MAX_API_BODY = 300_000
SAFE_POST_PATH_HINTS = ("search", "query", "filter", "lookup", "check", "validate", "preview", "calculate", "test")
API_PATH_HINTS = ("/api/", "/graphql", "/v1/", "/v2/", "/rest/")
JWT_RE = re.compile(r"(?<![A-Za-z0-9_-])eyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]*(?![A-Za-z0-9_-])")


def _setting(name: str, default):
    return getattr(settings, name, default)


def _crawl_key(url: str) -> str:
    p = urlsplit(url)
    shape = sorted((k, "<v>") for k, _ in parse_qsl(p.query, keep_blank_values=True))
    return urlunsplit((p.scheme, p.netloc.lower(), p.path or "/", urlencode(shape), ""))


def _stable_pair(client: httpx.Client, method: str, url: str, *, data=None, json_data=None):
    a = v05._bounded_request(client, method, url, data=data, json_data=json_data, max_bytes=MAX_API_BODY)
    b = v05._bounded_request(client, method, url, data=data, json_data=json_data, max_bytes=MAX_API_BODY)
    return a, b, a["status_code"] == b["status_code"] and v05._similarity(a["text"], b["text"]) >= 0.88


def _parse_page(page_url: str, result: dict, root_url: str):
    base = v05._page_observations(page_url, result, root_url)
    base.update({"post_candidates": [], "api_candidates": [], "meta_generators": [], "script_srcs": []})
    ctype = result["headers"].get("content-type", "")
    if "html" not in ctype.lower():
        return base

    soup = BeautifulSoup(result["text"][: int(_setting("max_html_bytes", 1_000_000))], "html.parser")

    for meta in soup.find_all("meta"):
        if (meta.get("name") or "").lower() == "generator":
            val = (meta.get("content") or "").strip()
            if val:
                base["meta_generators"].append(val[:160])

    for script in soup.find_all("script"):
        src = (script.get("src") or "").strip()
        if src:
            base["script_srcs"].append(urljoin(page_url, src))

    for form in soup.find_all("form"):
        method = (form.get("method") or "get").lower()
        if method != "post":
            continue
        action = urljoin(page_url, (form.get("action") or page_url).strip())
        if not v05._same_origin(root_url, action):
            continue
        fields, has_password, has_file = [], False, False
        for inp in form.find_all(["input", "textarea", "select"]):
            name = (inp.get("name") or "").strip()
            typ = (inp.get("type") or "text").lower() if inp.name == "input" else inp.name
            if name:
                fields.append({"name": name[:120], "type": typ[:40], "value": (inp.get("value") or "")[:300]})
            has_password = has_password or typ == "password"
            has_file = has_file or typ == "file"
        base["post_candidates"].append({
            "url": action,
            "fields": fields,
            "has_password": has_password,
            "has_file": has_file,
            "enctype": (form.get("enctype") or "application/x-www-form-urlencoded").lower(),
        })

    for a in soup.find_all("a", href=True):
        u = urljoin(page_url, a.get("href"))
        if v05._same_origin(root_url, u) and any(h in (urlsplit(u).path or "").lower() for h in API_PATH_HINTS):
            base["api_candidates"].append({"url": u, "method": "GET", "source": "link"})

    script_text = "\n".join(s.get_text(" ", strip=False) for s in soup.find_all("script") if not s.get("src"))[:200_000]
    for m in re.finditer(r"""fetch\s*\(\s*['"]([^'"]+)['"]""", script_text, re.I):
        u = urljoin(page_url, m.group(1))
        if v05._same_origin(root_url, u):
            around = script_text[m.start():m.start()+500]
            method_m = re.search(r"""method\s*:\s*['"](GET|POST|PUT|PATCH|DELETE)['"]""", around, re.I)
            base["api_candidates"].append({"url": u, "method": (method_m.group(1).upper() if method_m else "GET"), "source": "javascript"})
    for m in re.finditer(r"""axios\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]""", script_text, re.I):
        u = urljoin(page_url, m.group(2))
        if v05._same_origin(root_url, u):
            base["api_candidates"].append({"url": u, "method": m.group(1).upper(), "source": "javascript"})
    for m in re.finditer(r"""\$\.(get|post)\s*\(\s*['"]([^'"]+)['"]""", script_text, re.I):
        u = urljoin(page_url, m.group(2))
        if v05._same_origin(root_url, u):
            base["api_candidates"].append({"url": u, "method": m.group(1).upper(), "source": "javascript"})
    return base


def _form_payload(fields: list[dict]) -> dict:
    out = {}
    for field in fields:
        name = field.get("name")
        typ = (field.get("type") or "").lower()
        if not name or typ in {"file", "submit", "button", "password"}:
            continue
        out[name] = field.get("value") or ("1" if typ in {"number", "range"} else "secscan")
    return out


def _safe_post_candidate(candidate: dict) -> bool:
    if candidate.get("has_password") or candidate.get("has_file"):
        return False
    if "multipart/form-data" in (candidate.get("enctype") or ""):
        return False
    path = (urlsplit(candidate.get("url") or "").path or "/").lower()
    return any(h in path for h in SAFE_POST_PATH_HINTS)


def _post_probes(client: httpx.Client, candidates: list[dict]):
    results, seen = [], set()
    boolean_budget = 2
    for c in candidates:
        if len(results) >= MAX_ACTIVE_POST_FORMS or not _safe_post_candidate(c):
            continue
        url = c.get("url")
        data = _form_payload(c.get("fields") or [])
        if not url or not data:
            continue
        key = (urlsplit(url).path, tuple(sorted(data)))
        if key in seen:
            continue
        seen.add(key)
        param = next(iter(data))
        value = str(data[param] or "1")
        try:
            base1, base2, stable = _stable_pair(client, "POST", url, data=data)
            quote_data = dict(data)
            quote_data[param] = value + "'"
            quote = v05._bounded_request(client, "POST", url, data=quote_data, max_bytes=MAX_API_BODY)
            base_error = bool(v05.SQL_ERROR_RE.search(base1["text"][:200_000]))
            quote_error = bool(v05.SQL_ERROR_RE.search(quote["text"][:200_000]))

            marker = f"<secscan-post-{uuid.uuid4().hex[:8]}>"
            marker_data = dict(data)
            marker_data[param] = marker
            reflected = v05._bounded_request(client, "POST", url, data=marker_data, max_bytes=MAX_API_BODY)
            html_reflection = marker in reflected["text"] and "html" in reflected["headers"].get("content-type", "").lower()

            boolean_signal, evidence = False, None
            if stable and boolean_budget > 0:
                boolean_budget -= 1
                tdata, fdata = dict(data), dict(data)
                if re.fullmatch(r"[+-]?\d+(?:\.\d+)?", value.strip()):
                    tdata[param], fdata[param] = value + " AND 1=1", value + " AND 1=2"
                else:
                    tdata[param], fdata[param] = value + "' AND '1'='1", value + "' AND '1'='2"
                tr = v05._bounded_request(client, "POST", url, data=tdata, max_bytes=MAX_API_BODY)
                fl = v05._bounded_request(client, "POST", url, data=fdata, max_bytes=MAX_API_BODY)
                sim_true, sim_false = v05._similarity(base1["text"], tr["text"]), v05._similarity(base1["text"], fl["text"])
                if sim_true >= 0.90 and sim_false <= 0.72 and abs(len(tr["text"]) - len(fl["text"])) >= 30:
                    boolean_signal = True
                    evidence = {"baseline_vs_true": round(sim_true, 3), "baseline_vs_false": round(sim_false, 3)}

            ssti_payload = f"secscan{uuid.uuid4().hex[:5]}{{{{7*7}}}}"
            expected = ssti_payload.split("{{", 1)[0] + "49"
            sdata = dict(data)
            sdata[param] = ssti_payload
            sr = v05._bounded_request(client, "POST", url, data=sdata, max_bytes=MAX_API_BODY)

            results.append({
                "method": "POST",
                "url_path": urlsplit(url).path or "/",
                "param": param[:120],
                "baseline_stable": stable,
                "sql_error_signal": stable and quote_error and not base_error,
                "sql_boolean_signal": boolean_signal,
                "sql_boolean_evidence": evidence,
                "html_reflection": html_reflection,
                "ssti_eval": expected in sr["text"] and expected not in base1["text"],
            })
        except Exception as exc:
            results.append({"method": "POST", "url_path": urlsplit(url).path or "/", "param": param[:120], "probe_error": type(exc).__name__})
    return results


def _stabilize_get_probes(client: httpx.Client, candidates: list[dict]):
    out, seen, boolean_budget = [], set(), 4
    for c in candidates:
        if len(out) >= 8:
            break
        url, param = c.get("url"), c.get("param")
        value = str(c.get("value") or "1")
        if not url or not param:
            continue
        key = (urlsplit(url).path, param)
        if key in seen:
            continue
        seen.add(key)
        try:
            baseline = v05._replace_param(url, param, value)
            base1, base2, stable = _stable_pair(client, "GET", baseline)
            quote = v05._bounded_request(client, "GET", v05._replace_param(url, param, value + "'"), max_bytes=MAX_API_BODY)
            base_error = bool(v05.SQL_ERROR_RE.search(base1["text"][:200_000]))
            quote_error = bool(v05.SQL_ERROR_RE.search(quote["text"][:200_000]))

            marker = f"<secscan-get-{uuid.uuid4().hex[:8]}>"
            reflected = v05._bounded_request(client, "GET", v05._replace_param(url, param, marker), max_bytes=MAX_API_BODY)
            html_reflection = marker in reflected["text"] and "html" in reflected["headers"].get("content-type", "").lower()

            redirect = False
            if param.lower() in {"url","uri","redirect","redirect_uri","return","returnto","return_url","next","continue","dest","destination","goto","target"}:
                rr = v05._bounded_request(client, "GET", v05._replace_param(url, param, "https://example.invalid/secscan-redirect"), max_bytes=50_000)
                loc = rr["headers"].get("location", "")
                redirect = rr["status_code"] in {301,302,303,307,308} and loc.startswith("https://example.invalid/")

            boolean_signal, evidence = False, None
            if stable and boolean_budget > 0:
                boolean_budget -= 1
                if re.fullmatch(r"[+-]?\d+(?:\.\d+)?", value.strip()):
                    tv, fv = value + " AND 1=1", value + " AND 1=2"
                else:
                    tv, fv = value + "' AND '1'='1", value + "' AND '1'='2"
                tr = v05._bounded_request(client, "GET", v05._replace_param(url, param, tv), max_bytes=MAX_API_BODY)
                fl = v05._bounded_request(client, "GET", v05._replace_param(url, param, fv), max_bytes=MAX_API_BODY)
                sim_true, sim_false = v05._similarity(base1["text"], tr["text"]), v05._similarity(base1["text"], fl["text"])
                if sim_true >= 0.90 and sim_false <= 0.72 and abs(len(tr["text"]) - len(fl["text"])) >= 30:
                    boolean_signal = True
                    evidence = {"baseline_vs_true": round(sim_true, 3), "baseline_vs_false": round(sim_false, 3)}

            ssti_payload = f"secscan{uuid.uuid4().hex[:5]}{{{{7*7}}}}"
            expected = ssti_payload.split("{{", 1)[0] + "49"
            sr = v05._bounded_request(client, "GET", v05._replace_param(url, param, ssti_payload), max_bytes=MAX_API_BODY)

            out.append({
                "method": "GET",
                "url_path": urlsplit(url).path or "/",
                "param": param[:120],
                "baseline_stable": stable,
                "sql_error_signal": stable and quote_error and not base_error,
                "sql_boolean_signal": boolean_signal,
                "sql_boolean_evidence": evidence,
                "html_reflection": html_reflection,
                "open_redirect": redirect,
                "ssti_eval": expected in sr["text"] and expected not in base1["text"],
            })
        except Exception as exc:
            out.append({"method": "GET", "url_path": urlsplit(url).path or "/", "param": param[:120], "probe_error": type(exc).__name__})
    return out


def _cors_probe(client: httpx.Client, url: str):
    origin = "https://securascan.invalid"
    out = {"url_path": urlsplit(url).path or "/", "test_origin": origin}
    for label, method, test_origin in (("get","GET",origin),("options","OPTIONS",origin),("null_origin","GET","null")):
        try:
            headers = {"Origin": test_origin}
            if method == "OPTIONS":
                headers["Access-Control-Request-Method"] = "GET"
                headers["Access-Control-Request-Headers"] = "Authorization, Content-Type"
            r = v05._bounded_request(client, method, url, headers=headers, max_bytes=100_000)
            h = {k.lower(): v for k, v in r["headers"].items()}
            out[label] = {
                "status": r["status_code"],
                "allow_origin": h.get("access-control-allow-origin"),
                "allow_credentials": (h.get("access-control-allow-credentials") or "").lower(),
                "allow_methods": h.get("access-control-allow-methods"),
                "allow_headers": h.get("access-control-allow-headers"),
                "vary": h.get("vary"),
            }
        except Exception as exc:
            out[label] = {"error": type(exc).__name__}
    return out


def _method_probe(client: httpx.Client, url: str):
    out = {"url_path": urlsplit(url).path or "/"}
    try:
        opt = v05._bounded_request(client, "OPTIONS", url, max_bytes=100_000)
        out["options_status"] = opt["status_code"]
        out["allow"] = opt["headers"].get("allow")
        out["cors_allow_methods"] = opt["headers"].get("access-control-allow-methods")
    except Exception as exc:
        out["options_error"] = type(exc).__name__
    try:
        marker = f"secscan-{uuid.uuid4().hex[:8]}"
        tr = v05._bounded_request(client, "TRACE", url, headers={"X-SecuraScan-Probe": marker}, max_bytes=100_000)
        out["trace_status"] = tr["status_code"]
        out["trace_echoed"] = marker in tr["text"] or "X-SecuraScan-Probe" in tr["text"]
    except Exception as exc:
        out["trace_error"] = type(exc).__name__
    return out


def _cache_observation(url: str, result: dict):
    h = {k.lower(): v for k, v in result["headers"].items()}
    path = (urlsplit(url).path or "/").lower()
    low = result["text"][:20_000].lower()
    sets_cookie = any(k.lower() == "set-cookie" for k, _ in result["header_items"])
    sensitive = sets_cookie or any(x in path for x in ("login","account","profile","session","auth","admin","private","user")) or any(x in low for x in ('"email"','"username"','"token"','"role"'))
    return {
        "url_path": urlsplit(url).path or "/",
        "cache_control": h.get("cache-control"),
        "pragma": h.get("pragma"),
        "expires": h.get("expires"),
        "sensitive": sensitive,
        "sets_cookie": sets_cookie,
    }


def _b64url_json(part: str):
    try:
        part += "=" * (-len(part) % 4)
        obj = json.loads(base64.urlsafe_b64decode(part.encode()).decode())
        return obj if isinstance(obj, dict) else None
    except Exception:
        return None


def _jwt_observations(result: dict):
    candidates = []
    for key, value in result["header_items"]:
        if key.lower() == "set-cookie" and "=" in value:
            candidates.extend(JWT_RE.findall(value.split(";",1)[0].split("=",1)[1]))
        elif key.lower() in {"authorization","x-access-token"}:
            candidates.extend(JWT_RE.findall(value))
    candidates.extend(JWT_RE.findall(result["text"][:200_000]))
    out, seen = [], set()
    now = int(time.time())
    for token in candidates[:10]:
        digest = hashlib.sha256(token.encode()).hexdigest()[:16]
        if digest in seen:
            continue
        seen.add(digest)
        parts = token.split(".")
        if len(parts) != 3:
            continue
        header, payload = _b64url_json(parts[0]), _b64url_json(parts[1])
        if not header or payload is None:
            continue
        exp = payload.get("exp")
        out.append({
            "fingerprint": digest,
            "alg": str(header.get("alg") or "")[:40],
            "typ": str(header.get("typ") or "")[:40],
            "claim_keys": sorted(str(k)[:80] for k in payload.keys())[:40],
            "has_exp": "exp" in payload,
            "hours_until_exp": round((exp-now)/3600,1) if isinstance(exp,(int,float)) else None,
            "has_iss": "iss" in payload,
            "has_aud": "aud" in payload,
        })
    return out


def _tech(pages: list[dict], root_result: dict):
    found = {}
    def add(name, confidence, source):
        rank = {"LOW":1,"MEDIUM":2,"HIGH":3}
        if not name:
            return
        prev = found.get(name)
        if not prev or rank[confidence] > rank[prev["confidence"]]:
            found[name] = {"name": name[:160], "confidence": confidence, "source": source}
    h = {k.lower():v for k,v in root_result["headers"].items()}
    add(h.get("server"), "MEDIUM", "Server")
    add(h.get("x-powered-by"), "HIGH", "X-Powered-By")
    for p in pages:
        for gen in p.get("meta_generators", []):
            add(gen, "HIGH", "meta-generator")
        for src in p.get("script_srcs", []):
            low = src.lower()
            if "jquery" in low: add("jQuery","HIGH","script")
            if "react" in low: add("React","MEDIUM","script")
            if "vue" in low: add("Vue.js","MEDIUM","script")
            if "angular" in low: add("Angular","MEDIUM","script")
            if "_next/" in low: add("Next.js","HIGH","asset-path")
            if "bootstrap" in low: add("Bootstrap","HIGH","script")
            if "wp-content" in low or "wp-includes" in low: add("WordPress","HIGH","asset-path")
    return sorted(found.values(), key=lambda x:x["name"].lower())[:40]


def _dedupe_api(candidates: list[dict], root_url: str):
    out, seen = [], set()
    for c in candidates:
        u = c.get("url")
        if not u or not v05._same_origin(root_url, u):
            continue
        p = urlsplit(u)
        clean = urlunsplit((p.scheme,p.netloc,p.path or "/",p.query,""))
        key = ((c.get("method") or "GET").upper(), clean)
        if key not in seen:
            seen.add(key)
            out.append({**c,"url":clean})
    return out[:30]


def _api_get(client: httpx.Client, candidate: dict):
    u = candidate["url"]
    item = {"url_path":urlsplit(u).path or "/","method":(candidate.get("method") or "GET").upper(),"source":candidate.get("source")}
    try:
        r = v05._bounded_request(client, "GET", u, max_bytes=MAX_API_BODY)
        ctype = r["headers"].get("content-type","").lower()
        item.update({"status":r["status_code"],"content_type":ctype,"is_json":"json" in ctype,"cache":_cache_observation(u,r),"jwt":_jwt_observations(r)})
        if "json" in ctype:
            try:
                obj=json.loads(r["text"])
                item["json_shape"]=sorted(obj.keys())[:30] if isinstance(obj,dict) else [type(obj).__name__]
            except Exception:
                item["json_parse_error"]=True
    except Exception as exc:
        item["error"]=type(exc).__name__
    return item


def _json_probes(client: httpx.Client, api_candidates: list[dict]):
    out, seen = [], set()
    for c in api_candidates:
        if len(out) >= MAX_ACTIVE_JSON_ENDPOINTS:
            break
        u = c.get("url")
        method = (c.get("method") or "").upper()
        path = (urlsplit(u).path if u else "") or "/"
        if not u or method != "POST" or path in seen or not any(h in path.lower() for h in SAFE_POST_PATH_HINTS):
            continue
        seen.add(path)
        payload={"id":"1","q":"secscan"}
        try:
            b1,b2,stable=_stable_pair(client,"POST",u,json_data=payload)
            q=dict(payload); q["id"]="1'"
            qr=v05._bounded_request(client,"POST",u,json_data=q,max_bytes=MAX_API_BODY)
            marker=f"<secscan-json-{uuid.uuid4().hex[:8]}>"
            mp=dict(payload); mp["q"]=marker
            mr=v05._bounded_request(client,"POST",u,json_data=mp,max_bytes=MAX_API_BODY)
            out.append({
                "method":"POST_JSON","url_path":path,"param":"id/q","baseline_stable":stable,
                "sql_error_signal":stable and not v05.SQL_ERROR_RE.search(b1["text"][:200_000]) and bool(v05.SQL_ERROR_RE.search(qr["text"][:200_000])),
                "reflection":marker in mr["text"],"content_type":mr["headers"].get("content-type","")
            })
        except Exception as exc:
            out.append({"method":"POST_JSON","url_path":path,"probe_error":type(exc).__name__})
    return out


def _graphql(client: httpx.Client, api_candidates: list[dict], root_url: str):
    urls=[c["url"] for c in api_candidates if "/graphql" in (urlsplit(c["url"]).path or "").lower()]
    urls.append(urljoin(root_url,"/graphql"))
    out=[]; seen=set()
    for u in urls[:3]:
        path=urlsplit(u).path or "/graphql"
        if path in seen: continue
        seen.add(path)
        try:
            q=urlencode({"query":"query SecuraScanProbe { __typename }"})
            r=v05._bounded_request(client,"GET",f"{u}?{q}",max_bytes=MAX_API_BODY)
            detected="json" in r["headers"].get("content-type","").lower() and ('"data"' in r["text"] or '"errors"' in r["text"])
            item={"url_path":path,"status":r["status_code"],"detected":detected,"introspection_enabled":False}
            if detected:
                iq=urlencode({"query":"query SecuraScanIntrospection { __schema { queryType { name } } }"})
                ir=v05._bounded_request(client,"GET",f"{u}?{iq}",max_bytes=MAX_API_BODY)
                item["introspection_enabled"]='"__schema"' in ir["text"] and '"data"' in ir["text"]
            out.append(item)
        except Exception as exc:
            out.append({"url_path":path,"detected":False,"error":type(exc).__name__})
    return out


def _extra_exposure(client: httpx.Client, root_url: str):
    probes=[
        ("SVN_ENTRIES","/.svn/entries"),
        ("COMPOSER_JSON","/composer.json"),
        ("PACKAGE_JSON","/package.json"),
        ("OPENAPI_JSON","/openapi.json"),
        ("SWAGGER_JSON","/swagger.json"),
        ("ACTUATOR_HEALTH","/actuator/health"),
    ]
    out=[]
    for kind,path in probes:
        try:
            r=v05._bounded_request(client,"GET",urljoin(root_url,path),max_bytes=16_384)
            low=r["text"].lower()
            confirmed=False
            if r["status_code"]==200:
                if kind=="SVN_ENTRIES": confirmed="dir" in low[:500] or "<?xml" in low[:200]
                elif kind=="COMPOSER_JSON": confirmed='"require"' in low and ('"name"' in low or '"autoload"' in low)
                elif kind=="PACKAGE_JSON": confirmed='"dependencies"' in low and ('"name"' in low or '"scripts"' in low)
                elif kind in {"OPENAPI_JSON","SWAGGER_JSON"}: confirmed='"openapi"' in low or '"swagger"' in low
                elif kind=="ACTUATOR_HEALTH": confirmed='"status"' in low and ("up" in low or "down" in low)
            out.append({"kind":kind,"path":path,"status":r["status_code"],"confirmed":confirmed})
        except Exception as exc:
            out.append({"kind":kind,"path":path,"confirmed":False,"error":type(exc).__name__})
    return out


def run_scan(url: str) -> tuple[dict, list[dict]]:
    obs, checks = v05.run_scan(url)
    root_url = obs["final_url"]
    timeout = httpx.Timeout(float(_setting("read_timeout",8)), connect=float(_setting("connect_timeout",5)))

    with httpx.Client(timeout=timeout, headers={"User-Agent":UA}, follow_redirects=False) as client:
        root_result=v05._bounded_request(client,"GET",root_url)
        queue=deque([(root_url,0)])
        visited=set()
        pages=[]
        get_candidates=[]
        post_candidates=[]
        api_candidates=[]
        endpoint_results={}

        while queue and len(pages)<MAX_CRAWL_PAGES:
            page_url,depth=queue.popleft()
            key=_crawl_key(page_url)
            if key in visited or depth>MAX_CRAWL_DEPTH:
                continue
            visited.add(key)
            try:
                result=root_result if page_url==root_url else v05._bounded_request(client,"GET",page_url)
                endpoint_results[page_url]=result
                po=_parse_page(page_url,result,root_url)
                po["depth"]=depth
                pages.append(po)
                get_candidates.extend(po.get("active_candidates",[]))
                post_candidates.extend(po.get("post_candidates",[]))
                api_candidates.extend(po.get("api_candidates",[]))
                if depth<MAX_CRAWL_DEPTH:
                    for href in po.get("links",[])[:MAX_LINKS_PER_PAGE]:
                        if v05._same_origin(root_url,href):
                            queue.append((href,depth+1))
            except Exception:
                continue

        api_candidates=_dedupe_api(api_candidates,root_url)
        endpoints=[root_url]+[p["url"] for p in pages[1:]]+[c["url"] for c in api_candidates]
        endpoints=list(dict.fromkeys(endpoints))[:MAX_ENDPOINT_PROBES]

        obs["active_probes"]=_stabilize_get_probes(client,get_candidates)
        obs["post_active_probes"]=_post_probes(client,post_candidates)
        obs["json_active_probes"]=_json_probes(client,api_candidates)
        obs["cors_endpoints"]=[_cors_probe(client,u) for u in endpoints]
        obs["method_endpoints"]=[_method_probe(client,u) for u in endpoints[:6]]
        obs["api_surface"]=[_api_get(client,c) for c in api_candidates[:12]]
        obs["graphql"]=_graphql(client,api_candidates,root_url)
        obs["technologies"]=_tech(pages,root_result)

        jwt=[]
        cache=[]
        for u,r in list(endpoint_results.items())[:12]:
            jwt.extend(_jwt_observations(r)); cache.append(_cache_observation(u,r))
        for item in obs["api_surface"]:
            jwt.extend(item.get("jwt") or [])
            if item.get("cache"): cache.append(item["cache"])
        obs["jwt"]=list({j["fingerprint"]:j for j in jwt}.values())[:10]
        obs["cache_observations"]=cache[:20]

        if pages:
            obs["pages_scanned"]=len(pages)
            obs["max_depth_reached"]=max(p.get("depth",0) for p in pages)
            obs["page_paths"]=[urlsplit(p["url"]).path or "/" for p in pages]
            obs["mixed_active"]=sum(p.get("mixed_active",0) for p in pages)
            obs["mixed_passive"]=sum(p.get("mixed_passive",0) for p in pages)
            obs["insecure_forms"]=sum(p.get("insecure_forms",0) for p in pages)
            obs["password_get_forms"]=sum(p.get("password_get_forms",0) for p in pages)
            obs["csrf_suspect_forms"]=sum(p.get("csrf_suspect_forms",0) for p in pages)
            obs["upload_forms"]=sum(p.get("upload_forms",0) for p in pages)
            obs["third_party_without_sri"]=[x for p in pages for x in p.get("third_party_without_sri",[])][:50]
            obs["directory_listing_pages"]=[urlsplit(p["url"]).path or "/" for p in pages if p.get("directory_listing")]
            obs["sql_error_leak_pages"]=[urlsplit(p["url"]).path or "/" for p in pages if p.get("sql_error_leak")]
            obs["sensitive_comment_keywords"]=sorted({x for p in pages for x in p.get("sensitive_comment_keywords",[])})[:30]
            risky={}
            for p in pages:
                for k,v in p.get("risky_js",{}).items():
                    risky[k]=risky.get(k,0)+v
            obs["risky_js"]=risky

        obs["forms_discovered"]=len(post_candidates)
        obs["api_candidates_discovered"]=len(api_candidates)
        obs["exposure_probes"]=(obs.get("exposure_probes") or [])+_extra_exposure(client,root_url)

        checks.extend([
            {"key":"crawl_v06","status":"PASS","data":{"pages_scanned":obs.get("pages_scanned"),"max_depth":obs.get("max_depth_reached"),"paths":obs.get("page_paths",[])}},
            {"key":"post_forms_v06","status":"PASS","data":{"discovered":len(post_candidates),"probes":obs["post_active_probes"]}},
            {"key":"api_json_v06","status":"PASS","data":{"discovered":len(api_candidates),"surface":obs["api_surface"],"active":obs["json_active_probes"]}},
            {"key":"cors_endpoints_v06","status":"PASS","data":{"endpoints":obs["cors_endpoints"]}},
            {"key":"http_methods_v06","status":"PASS","data":{"endpoints":obs["method_endpoints"]}},
            {"key":"graphql_v06","status":"PASS","data":{"probes":obs["graphql"]}},
            {"key":"jwt_v06","status":"PASS","data":{"tokens":obs["jwt"]}},
            {"key":"cache_v06","status":"PASS","data":{"observations":obs["cache_observations"]}},
            {"key":"technology_v06","status":"PASS","data":{"technologies":obs["technologies"]}},
        ])
    return obs, checks
