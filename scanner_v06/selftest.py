from app.scanner import engine, rules

def main():
    assert engine._crawl_key("https://example.com/a?id=1") == engine._crawl_key("https://example.com/a?id=2")
    assert engine._safe_post_candidate({"url":"https://example.com/search","has_password":False,"has_file":False,"enctype":"application/x-www-form-urlencoded"})
    assert not engine._safe_post_candidate({"url":"https://example.com/login","has_password":True,"has_file":False,"enctype":"application/x-www-form-urlencoded"})
    assert engine._b64url_json("eyJhbGciOiJub25lIn0") == {"alg":"none"}

    cors={"url_path":"/api/profile","test_origin":"https://securascan.invalid",
          "get":{"allow_origin":"https://securascan.invalid","allow_credentials":"true"},
          "options":{"allow_origin":"https://securascan.invalid","allow_credentials":"true","allow_methods":"GET, POST, DELETE"},
          "null_origin":{"allow_origin":"null","allow_credentials":"true"}}
    types={f["type"] for f in rules._cors_findings(1,cors)}
    assert "CORS_ORIGIN_REFLECTION" in types
    assert "CORS_NULL_ORIGIN_CREDENTIALS" in types
    assert "CORS_BROAD_METHODS" in types

    probes=[{"method":"POST","url_path":"/search","param":"id","baseline_stable":True,
             "sql_error_signal":True,"sql_boolean_signal":True,"html_reflection":False,
             "ssti_eval":False,"open_redirect":False}]
    ptypes={f["type"] for f in rules._probe_findings(1,probes)}
    assert "SQLI_ERROR_SIGNAL" in ptypes
    assert "SQLI_BOOLEAN_SIGNAL" in ptypes
    print("SecuraScan v0.6 self-test: PASS")

if __name__ == "__main__":
    main()
