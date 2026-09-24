from __future__ import annotations
import hashlib,re
from app.scanner import rules_v06_base as base

def _fp(site_id,typ,loc):
    return hashlib.sha256(f"{site_id}|{typ}|{loc}".encode()).hexdigest()

def _f(site_id,typ,category,title,description,severity,recommendation,evidence,confidence="HIGH",loc=None):
    return {"fingerprint":_fp(site_id,typ,loc or typ),"type":typ,"category":category,"title":title,"description":description,"severity":severity,"confidence":confidence,"recommendation":recommendation,"evidence":evidence}

def evaluate(site_id:int,observations:dict):
    findings=list(base.evaluate(site_id,observations))
    seen={(x.get("type"),x.get("fingerprint")) for x in findings}
    extra=[]
    g=observations.get("graphql_v063") or {}
    if g.get("detected"):
        extra.append(_f(site_id,"GRAPHQL_ENDPOINT_DETECTED","GRAPHQL","Endpoint GraphQL detectado","SecuraScan confirmó una respuesta compatible con GraphQL.","INFO","Revisa autorización, límites de profundidad/complejidad y rate limiting.",{"url":g.get("url"),"status":g.get("status")},"HIGH",g.get("url") or "/graphql"))
    if g.get("introspection_enabled"):
        extra.append(_f(site_id,"GRAPHQL_INTROSPECTION_ENABLED","GRAPHQL","Introspección GraphQL habilitada","El endpoint GraphQL respondió a una consulta de introspección del esquema.","LOW","Valora restringir introspección en producción cuando no sea necesaria.",{"url":g.get("url")},"HIGH",(g.get("url") or "/graphql")+"|introspection"))
    mapping={
      "OPENAPI_JSON":("OPENAPI_SCHEMA_EXPOSED","Esquema OpenAPI accesible","INFO","Protege la documentación si es interna."),
      "SWAGGER_JSON":("SWAGGER_SCHEMA_EXPOSED","Esquema Swagger accesible","INFO","Protege la documentación si es interna."),
      "PACKAGE_JSON":("PACKAGE_JSON_EXPOSED","package.json accesible","LOW","Evita exponer metadatos de dependencias innecesarios."),
    }
    for p in observations.get("api_docs_v063") or []:
        if p.get("confirmed") and p.get("kind") in mapping:
            typ,title,sev,rec=mapping[p["kind"]]
            extra.append(_f(site_id,typ,"EXPOSURE",title,"SecuraScan confirmó el recurso mediante una firma de contenido.",sev,rec,{"path":p.get("path"),"status":p.get("status")},"HIGH",p.get("path")))
    for t in observations.get("technologies_v063") or []:
        version=t.get("version")
        if version and re.search(r"\d",str(version)):
            extra.append(_f(site_id,"TECHNOLOGY_VERSION_DISCLOSURE","EXPOSURE","Versión de tecnología expuesta","La respuesta permite inferir una versión concreta de tecnología.","LOW","Reduce banners/versiones innecesarios y mantén los componentes actualizados.",{"technology":t.get("name"),"version":version,"source":t.get("source")},"MEDIUM",f"{t.get('name')}|{version}"))
    existing_fp={x.get("fingerprint") for x in findings}
    for x in extra:
        if x["fingerprint"] not in existing_fp:
            findings.append(x); existing_fp.add(x["fingerprint"])
    return findings

calculate_score=base.calculate_score
risk_level=base.risk_level
