import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).parent
HTML = (ROOT / "templates" / "index.html").read_text(encoding="utf-8")
INSECURE_JWT = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJkZW1vIiwicm9sZSI6ImFkbWluIn0."


class VulnerableHandler(BaseHTTPRequestHandler):
    server_version = "VulnLab/0.6"

    def _cors(self):
        origin = self.headers.get("Origin")
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Credentials", "true")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, TRACE, OPTIONS")

    def _common_response(self, status=200, content_type="text/html; charset=utf-8"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("X-Powered-By", "VulnLab-Python/0.6")
        self._cors()

    def _send(self, status, body, content_type="text/html; charset=utf-8", extra_headers=None):
        if isinstance(body, str):
            body = body.encode("utf-8")
        self._common_response(status, content_type)
        for key, value in (extra_headers or {}).items():
            self.send_header(key, value)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._common_response(204, "text/plain")
        self.send_header("Allow", "GET, POST, PUT, DELETE, PATCH, TRACE, OPTIONS")
        self.end_headers()

    def do_TRACE(self):
        marker = self.headers.get("X-SecuraScan-Probe", "")
        self._send(200, f"TRACE / HTTP/1.1\nX-SecuraScan-Probe: {marker}\n", "message/http")

    def do_GET(self):
        parts = urlsplit(self.path)
        path = parts.path
        query = parse_qs(parts.query, keep_blank_values=True)

        if path == "/":
            body = HTML.encode("utf-8")
            self._common_response(200)
            self.send_header("Set-Cookie", "session_demo=abc123; Path=/")
            self.send_header("Set-Cookie", "tracking_demo=user-42; Path=/")
            self.send_header("Set-Cookie", f"demo_jwt={INSECURE_JWT}; Path=/")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if path == "/api/profile":
            self._send(
                200,
                json.dumps({"username": "demo-user", "email": "demo@example.com", "role": "tester"}),
                "application/json",
                {"Cache-Control": "public, max-age=600"},
            )
            return

        if path == "/search":
            value = query.get("id", ["1"])[0]
            upper = value.upper()
            if "'" in value and "1'='1" not in value and "1'='2" not in value:
                self._send(500, "You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version")
                return
            if "1=2" in upper or "1'='2" in value:
                self._send(200, "<html><title>Search</title><body>No rows found.</body></html>")
                return
            self._send(200, "<html><title>Search</title><body>" + ("Result row: demo product. " * 20) + "</body></html>")
            return

        if path == "/reflect":
            value = query.get("q", [""])[0]
            self._send(200, f"<html><title>Reflect</title><body>Echo: {value}</body></html>")
            return

        if path == "/redirect":
            target = query.get("next", ["/"])[0]
            self._send(302, b"", "text/plain", {"Location": target})
            return

        if path == "/graphql":
            gql = query.get("query", [""])[0]
            if "__schema" in gql:
                self._send(200, json.dumps({"data": {"__schema": {"queryType": {"name": "Query"}}}}), "application/json")
            else:
                self._send(200, json.dumps({"data": {"__typename": "Query"}}), "application/json")
            return

        if path == "/robots.txt":
            self._send(200, "User-agent: *\nDisallow: /admin-lab\nSitemap: /sitemap.xml\n", "text/plain")
            return

        if path == "/sitemap.xml":
            self._send(200, """<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://securascan-v04-web-production.up.railway.app/reflect?q=hello</loc></url><url><loc>https://securascan-v04-web-production.up.railway.app/host-reflect</loc></url></urlset>""", "application/xml")
            return

        if path == "/static/app.js":
            self._send(200, """function vulnLabDemo(v){document.querySelector('#result')?.insertAdjacentHTML('beforeend', v)}\n//# sourceMappingURL=app.js.map\n""", "application/javascript")
            return

        if path == "/static/app.js.map":
            self._send(200, json.dumps({
                "version": 3,
                "file": "app.js",
                "sources": ["src/app.js"],
                "sourcesContent": ["export const api='/api/profile'; export function render(v){ document.querySelector('#result').innerHTML=v; }"],
                "names": [],
                "mappings": ""
            }), "application/json")
            return

        if path == "/host-reflect":
            forwarded = self.headers.get("X-Forwarded-Host")
            if forwarded:
                self._send(302, b"", "text/plain", {"Location": f"https://{forwarded}/reset-demo"})
            else:
                self._send(200, "<html><body>Host header lab fixture</body></html>")
            return

        if path == "/openapi.json":
            self._send(200, json.dumps({
                "openapi": "3.0.3",
                "info": {"title": "VulnLab API", "version": "0.6"},
                "paths": {"/api/profile": {"get": {}}, "/api/query": {"post": {}}}
            }), "application/json")
            return

        if path == "/package.json":
            self._send(200, json.dumps({
                "name": "vulnlab",
                "version": "0.6.0",
                "dependencies": {"express": "4.18.2", "jquery": "3.7.1"}
            }), "application/json")
            return

        if path == "/.env":
            self._send(200, "APP_ENV=lab\nDATABASE_URL=mysql://demo:demo@localhost/demo\nSECRET_KEY=not-a-real-secret\n", "text/plain")
            return

        if path == "/.git/HEAD":
            self._send(200, "ref: refs/heads/main\n", "text/plain")
            return

        if path == "/backup.zip":
            self._send(200, b"PK\x03\x04VULNLAB-FAKE-BACKUP", "application/zip")
            return

        if path == "/server-status":
            self._send(200, "<html><title>Apache Server Status</title><body>Server Uptime: 123 seconds</body></html>")
            return

        if path == "/phpinfo.php":
            self._send(200, "<html><title>phpinfo()</title><body>PHP Version 8.3.0</body></html>")
            return

        if path == "/files/":
            self._send(200, "<html><title>Index of /files/</title><body><h1>Index of /files/</h1></body></html>")
            return

        if path == "/health":
            self._send(200, '{"status":"ok","lab":"deliberately-vulnerable","version":"0.6"}', "application/json")
            return

        self._send(404, "Not found", "text/plain; charset=utf-8")

    def do_POST(self):
        parts = urlsplit(self.path)
        path = parts.path
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8", errors="replace")

        if path == "/api/query":
            try:
                data = json.loads(raw or "{}")
            except Exception:
                data = {}
            ident = str(data.get("id", "1"))
            q = str(data.get("q", ""))
            if "'" in ident:
                self._send(500, json.dumps({"error": "You have an error in your SQL syntax near quote"}), "application/json")
                return
            self._send(200, json.dumps({"ok": True, "id": ident, "q": q, "result": "demo"}), "application/json")
            return

        if path == "/search":
            form = parse_qs(raw)
            ident = form.get("id", ["1"])[0]
            if "'" in ident and "1'='1" not in ident and "1'='2" not in ident:
                self._send(500, "You have an error in your SQL syntax", "text/html")
                return
            if "1'='2" in ident or "1=2" in ident:
                self._send(200, "<html><body>No rows found.</body></html>")
                return
            self._send(200, "<html><body>" + ("POST result row. " * 20) + "</body></html>")
            return

        if path in {"/login", "/profile/update"}:
            form = parse_qs(raw)
            self._send(200, json.dumps({
                "ok": True,
                "username": form.get("username", [None])[0],
                "message": "Formulario recibido por el laboratorio vulnerable"
            }), "application/json")
            return

        self._send(404, '{"error":"not found"}', "application/json")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), VulnerableHandler)
    print(f"VulnLab v0.6 escuchando en http://0.0.0.0:{port}")
    server.serve_forever()
