from __future__ import annotations

from app.scanner import rules_v05 as v05

fp = v05.fp
finding = v05.finding


def _cors_findings(site_id: int, cors: dict):
    out=[]
    path=cors.get("url_path") or "/"
    loc=f"cors:{path}"
    origin=cors.get("test_origin")
    reflected=[]
    reflected_creds=False
    broad=set()
    wildcard_creds=[]
    for label in ("get","options"):
        c=cors.get(label) or {}
        acao=c.get("allow_origin")
        acac=(c.get("allow_credentials") or "").lower()
        if acao=="*" and acac=="true": wildcard_creds.append(label)
        elif origin and acao==origin:
            reflected.append(label); reflected_creds=reflected_creds or acac=="true"
        methods=(c.get("allow_methods") or "").upper()
        for m in ("PUT","DELETE","PATCH","TRACE"):
            if m in methods: broad.add(m)
    if wildcard_creds:
        out.append(finding(site_id,"CORS_WILDCARD_CREDENTIALS","CORS","CORS con comodín y credenciales","La política CORS combina origen comodín y credenciales.","HIGH","Usa una allowlist explícita de orígenes y revisa el uso de credenciales.",{"path":path,"probes":wildcard_creds},"HIGH",loc))
    if reflected:
        out.append(finding(site_id,"CORS_ORIGIN_REFLECTION","CORS","CORS refleja orígenes arbitrarios","El endpoint devolvió como permitido un Origin de prueba controlado por SecuraScan.","HIGH" if reflected_creds else "MEDIUM","Valida Origin contra una allowlist estricta.",{"path":path,"probes":reflected,"credentials":reflected_creds},"HIGH",loc))
    if broad:
        out.append(finding(site_id,"CORS_BROAD_METHODS","CORS","CORS anuncia métodos sensibles","La política CORS anuncia métodos que amplían la superficie de ataque.","LOW","Expón solo los métodos realmente necesarios.",{"path":path,"methods":sorted(broad)},"MEDIUM",loc))
    nc=cors.get("null_origin") or {}
    if nc.get("allow_origin")=="null" and (nc.get("allow_credentials") or "").lower()=="true":
        out.append(finding(site_id,"CORS_NULL_ORIGIN_CREDENTIALS","CORS","CORS permite Origin null con credenciales","El endpoint permite Origin: null junto con credenciales.","HIGH","No confíes en el origen null para contenido autenticado.",{"path":path},"HIGH",loc))
    return out


def _probe_findings(site_id:int, probes:list[dict]):
    out=[]
    for p in probes:
        path=p.get("url_path") or "/"; param=p.get("param") or "unknown"; method=p.get("method") or "GET"; loc=f"{method}:{path}:{param}"
        if p.get("sql_error_signal"):
            out.append(finding(site_id,"SQLI_ERROR_SIGNAL","INJECTION",f"Posible SQL injection basada en errores ({method})","Una mutación controlada produjo una firma de error SQL ausente en la respuesta base estable.","HIGH","Usa consultas parametrizadas/prepared statements.",{"path":path,"parameter":param,"method":method,"baseline_stable":p.get("baseline_stable")},"HIGH",loc))
        if p.get("sql_boolean_signal"):
            out.append(finding(site_id,"SQLI_BOOLEAN_SIGNAL","INJECTION",f"Posible SQL injection booleana ({method})","Expresiones booleanas controladas produjeron respuestas diferenciales compatibles con SQLi.","HIGH","Usa consultas parametrizadas y revisa manualmente el parámetro.",{"path":path,"parameter":param,"method":method,**(p.get("sql_boolean_evidence") or {})},"MEDIUM",loc))
        if p.get("html_reflection"):
            out.append(finding(site_id,"HTML_INJECTION_REFLECTION","XSS",f"Entrada reflejada sin escapar ({method})","Un marcador HTML inerte apareció sin escapar en una respuesta HTML.","MEDIUM","Aplica encoding contextual y valida el flujo de datos.",{"path":path,"parameter":param,"method":method},"MEDIUM",loc))
        if p.get("ssti_eval"):
            out.append(finding(site_id,"SSTI_EXPRESSION_EVAL","INJECTION","Posible Server-Side Template Injection","Una expresión matemática inocua fue evaluada por el servidor.","HIGH","No interpoles entrada del usuario en plantillas; usa parámetros/escaping.",{"path":path,"parameter":param,"method":method},"HIGH",loc))
        if p.get("open_redirect"):
            out.append(finding(site_id,"OPEN_REDIRECT","REDIRECTS","Redirección abierta detectada","Un parámetro aceptó un destino externo controlado.","MEDIUM","Usa destinos relativos o una allowlist estricta.",{"path":path,"parameter":param},"HIGH",loc))
        if p.get("reflection") and method=="POST_JSON":
            out.append(finding(site_id,"JSON_INPUT_REFLECTION","API","Entrada JSON reflejada por la API","La API refleja un marcador controlado; no implica XSS por sí solo.","INFO","Valida y serializa de forma segura los valores de la API.",{"path":path},"LOW",loc))
    return out


def evaluate(site_id:int, observations:dict)->list[dict]:
    base=dict(observations)
    base["cors"]={}
    findings=v05.evaluate(site_id,base)

    findings.extend(_probe_findings(site_id,observations.get("post_active_probes",[])))
    findings.extend(_probe_findings(site_id,observations.get("json_active_probes",[])))

    for c in observations.get("cors_endpoints",[]):
        findings.extend(_cors_findings(site_id,c))

    for m in observations.get("method_endpoints",[]):
        path=m.get("url_path") or "/"
        if m.get("trace_status") and m.get("trace_status")<400 and m.get("trace_echoed"):
            findings.append(finding(site_id,"HTTP_TRACE_ENABLED","METHODS","Método HTTP TRACE habilitado","El servidor respondió a TRACE y reflejó la cabecera de prueba.","MEDIUM","Deshabilita TRACE salvo necesidad explícita.",{"path":path,"status":m.get("trace_status")},"HIGH",path))
        advertised=" ".join(x for x in [m.get("allow"),m.get("cors_allow_methods")] if x).upper()
        methods=sorted({x for x in ("PUT","DELETE","PATCH") if x in advertised})
        if methods:
            findings.append(finding(site_id,"SENSITIVE_HTTP_METHODS_ADVERTISED","METHODS","Métodos HTTP sensibles anunciados","OPTIONS/CORS anuncia métodos que pueden modificar estado; no implica acceso no autorizado por sí solo.","LOW","Expón únicamente métodos necesarios y protégelos con autorización.",{"path":path,"methods":methods},"LOW",path))

    for token in observations.get("jwt",[]):
        loc="jwt:"+(token.get("fingerprint") or "unknown")
        if (token.get("alg") or "").lower()=="none":
            findings.append(finding(site_id,"JWT_ALG_NONE","AUTH","JWT usa algoritmo none","Se observó un JWT cuyo header declara alg=none.","HIGH","Rechaza tokens sin firma y fija algoritmos permitidos.",{"alg":token.get("alg"),"claims":token.get("claim_keys")},"HIGH",loc))
        if not token.get("has_exp"):
            findings.append(finding(site_id,"JWT_NO_EXP","AUTH","JWT sin expiración","Se observó un JWT sin claim exp.","MEDIUM","Define y valida una expiración adecuada.",{"claims":token.get("claim_keys")},"MEDIUM",loc))
        hours=token.get("hours_until_exp")
        if isinstance(hours,(int,float)) and hours>24*30:
            findings.append(finding(site_id,"JWT_LONG_LIFETIME","AUTH","JWT con vida útil muy larga","El token observado parece válido durante más de 30 días.","LOW","Reduce la vida útil de access tokens.",{"hours_until_exp":hours},"MEDIUM",loc))

    for g in observations.get("graphql",[]):
        if not g.get("detected"): continue
        path=g.get("url_path") or "/graphql"
        findings.append(finding(site_id,"GRAPHQL_ENDPOINT_DETECTED","GRAPHQL","Endpoint GraphQL detectado","SecuraScan confirmó una respuesta compatible con GraphQL.","INFO","Revisa autorización y límites de complejidad/profundidad.",{"path":path},"HIGH",path))
        if g.get("introspection_enabled"):
            findings.append(finding(site_id,"GRAPHQL_INTROSPECTION_ENABLED","GRAPHQL","Introspección GraphQL habilitada","El endpoint respondió a una consulta de introspección del esquema.","LOW","Valora restringir introspección en producción si no es necesaria.",{"path":path},"HIGH",path))

    for c in observations.get("cache_observations",[]):
        if not c.get("sensitive"): continue
        cc=(c.get("cache_control") or "").lower(); path=c.get("url_path") or "/"
        if "public" in cc or "s-maxage" in cc:
            findings.append(finding(site_id,"SENSITIVE_RESPONSE_PUBLIC_CACHE","CACHE","Respuesta sensible cacheable públicamente","Una respuesta sensible o que establece cookie permite caché compartida.","MEDIUM","Usa Cache-Control: no-store/private en respuestas sensibles.",{"path":path,"cache_control":c.get("cache_control")},"HIGH",path))
        elif not any(x in cc for x in ("no-store","private")):
            findings.append(finding(site_id,"SENSITIVE_CACHE_CONTROL_WEAK","CACHE","Control de caché débil en respuesta sensible","No se observó no-store/private en una respuesta potencialmente sensible.","LOW","Revisa la política de caché del endpoint.",{"path":path,"cache_control":c.get("cache_control")},"LOW",path))

    mapping={
        "SVN_ENTRIES":("SVN_METADATA_EXPOSED","Metadatos .svn accesibles","HIGH","Impide servir directorios de control de versiones."),
        "COMPOSER_JSON":("COMPOSER_JSON_EXPOSED","composer.json accesible","LOW","Evita exponer metadatos de dependencias innecesarios."),
        "PACKAGE_JSON":("PACKAGE_JSON_EXPOSED","package.json accesible","LOW","Evita exponer metadatos de dependencias innecesarios."),
        "OPENAPI_JSON":("OPENAPI_SCHEMA_EXPOSED","Esquema OpenAPI accesible","INFO","Protege la documentación si es interna y revisa endpoints administrativos."),
        "SWAGGER_JSON":("SWAGGER_SCHEMA_EXPOSED","Esquema Swagger accesible","INFO","Protege la documentación si es interna."),
        "ACTUATOR_HEALTH":("ACTUATOR_HEALTH_EXPOSED","Endpoint Actuator accesible","LOW","Expón solo información mínima y protege endpoints de gestión."),
    }
    for p in observations.get("exposure_probes",[]):
        if p.get("confirmed") and p.get("kind") in mapping:
            typ,title,sev,rec=mapping[p["kind"]]; path=p.get("path") or p["kind"]
            findings.append(finding(site_id,typ,"EXPOSURE",title,"SecuraScan confirmó el recurso mediante una firma de contenido sin almacenar contenido sensible.",sev,rec,{"path":path,"status":p.get("status")},"HIGH",path))
    return findings


WEIGHTS=v05.WEIGHTS
CONF=v05.CONF
CAPS={**v05.CAPS,"API":20,"AUTH":30,"GRAPHQL":15,"CACHE":20,"METHODS":15,"INJECTION":40,"CORS":35,"EXPOSURE":40}


def calculate_score(findings:list[dict])->int:
    by={}
    for x in findings:
        cat=x.get("category","OTHER")
        by[cat]=by.get(cat,0)+WEIGHTS.get(x.get("severity","INFO"),0)*CONF.get(x.get("confidence","HIGH"),1)
    penalty=sum(min(v,CAPS.get(k,30)) for k,v in by.items())
    return max(0,min(100,round(100-penalty)))


risk_level=v05.risk_level
