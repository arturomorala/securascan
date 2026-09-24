from __future__ import annotations
import ipaddress, json, re, socket
from urllib.parse import urljoin, urlsplit
import httpx
from bs4 import BeautifulSoup
from app.scanner import engine_v06_base as base

UA="SecuraScan/0.6.3 (+authorized-non-destructive-security-audit)"
ALLOWED_PORTS={80,443,8080,8443}

def _public(url:str)->bool:
    p=urlsplit(url)
    if p.scheme not in {"http","https"} or not p.hostname: return False
    port=p.port or (443 if p.scheme=="https" else 80)
    if port not in ALLOWED_PORTS: return False
    try: infos=socket.getaddrinfo(p.hostname,port,type=socket.SOCK_STREAM)
    except socket.gaierror: return False
    if not infos: return False
    for info in infos:
        try: ip=ipaddress.ip_address(info[4][0].split("%")[0])
        except ValueError: return False
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved or ip.is_unspecified: return False
    return True

def _same_host(a,b):
    pa,pb=urlsplit(a),urlsplit(b)
    return (pa.hostname or "").lower()==(pb.hostname or "").lower()

def _get(client,url,root):
    if not _same_host(root,url) or not _public(url): raise ValueError("unsafe destination")
    r=client.get(url,follow_redirects=False)
    return r

def _graphql(client,root):
    url=urljoin(root,"/graphql")
    out={"url":url,"detected":False,"introspection_enabled":False}
    try:
        q='query SecuraScanProbe { __typename }'
        r=_get(client,url+"?query="+httpx.QueryParams({"query":q})["query"],root)
    except Exception:
        try:
            r=client.get(url,params={"query":q},follow_redirects=False) if _public(url) else None
        except Exception as exc:
            out["error"]=type(exc).__name__; return out
    if r is None: return out
    ctype=r.headers.get("content-type","").lower()
    txt=r.text[:200000]
    out["status"]=r.status_code
    out["detected"]=r.status_code<400 and "json" in ctype and ('"data"' in txt or '"errors"' in txt)
    if out["detected"]:
        iq='query SecuraScanIntrospection { __schema { queryType { name } } }'
        try:
            ir=client.get(url,params={"query":iq},follow_redirects=False)
            it=ir.text[:200000]
            out["introspection_enabled"]=ir.status_code<400 and '"__schema"' in it and '"data"' in it
        except Exception: pass
    return out

def _api_docs(client,root):
    out=[]
    for path,kind in [("/openapi.json","OPENAPI_JSON"),("/swagger.json","SWAGGER_JSON"),("/package.json","PACKAGE_JSON")]:
        url=urljoin(root,path)
        try:
            if not _public(url): continue
            r=client.get(url,follow_redirects=False)
            txt=r.text[:100000]
            low=txt.lower()
            confirmed=False
            if r.status_code==200:
                if kind=="OPENAPI_JSON": confirmed='"openapi"' in low
                elif kind=="SWAGGER_JSON": confirmed='"swagger"' in low or '"openapi"' in low
                else: confirmed='"dependencies"' in low and '"name"' in low
            out.append({"kind":kind,"path":path,"status":r.status_code,"confirmed":confirmed})
        except Exception as exc:
            out.append({"kind":kind,"path":path,"confirmed":False,"error":type(exc).__name__})
    return out

def _tech(client,root):
    out=[]
    try:
        r=_get(client,root,root)
    except Exception: return out
    def add(name,source,confidence="MEDIUM",version=None):
        if not name:return
        item={"name":str(name)[:120],"source":source,"confidence":confidence}
        if version:item["version"]=str(version)[:80]
        if item not in out: out.append(item)
    for header,conf in [("server","MEDIUM"),("x-powered-by","HIGH")]:
        value=r.headers.get(header)
        if value:
            m=re.search(r"([A-Za-z][A-Za-z0-9._-]*)(?:[/ ]([0-9][0-9A-Za-z._-]*))?",value)
            if m:add(m.group(1),header,conf,m.group(2))
    if "html" in r.headers.get("content-type","").lower():
        html=r.text[:500000]; low=html.lower(); soup=BeautifulSoup(html,"html.parser")
        gen=soup.find("meta",attrs={"name":re.compile("^generator$",re.I)})
        if gen and gen.get("content"): add(gen.get("content"),"meta-generator","HIGH")
        for name,needle,conf in [("WordPress","wp-content","HIGH"),("Next.js","/_next/","HIGH"),("jQuery","jquery","MEDIUM"),("React","react","LOW"),("Vue.js","vue","LOW"),("Angular","ng-version","MEDIUM")]:
            if needle in low:add(name,"html-signature",conf)
    return out

def run_scan(url:str):
    obs,checks=base.run_scan(url)
    root=obs.get("final_url") or url
    timeout=httpx.Timeout(8.0,connect=5.0)
    with httpx.Client(timeout=timeout,headers={"User-Agent":UA}) as client:
        obs["graphql_v063"]=_graphql(client,root)
        obs["api_docs_v063"]=_api_docs(client,root)
        obs["technologies_v063"]=_tech(client,root)
    checks.extend([
        {"key":"graphql_v063","status":"PASS","data":obs["graphql_v063"]},
        {"key":"api_docs_v063","status":"PASS","data":{"probes":obs["api_docs_v063"]}},
        {"key":"technology_v063","status":"PASS","data":{"technologies":obs["technologies_v063"]}},
    ])
    return obs,checks
