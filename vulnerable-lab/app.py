import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).parent
HTML = (ROOT / "templates" / "index.html").read_text(encoding="utf-8")
JWT_NONE = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJkZW1vIiwicm9sZSI6ImFkbWluIn0."


def sql_fixture(value: str):
    upper = value.upper()
    if "'" in value and "1'='1" not in value and "1'='2" not in value:
        return 500, "You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version"
    if "1=2" in upper or "1'='2" in value:
        return 200, "No rows found."
    return 200, "Result row: demo product. " * 20


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
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if path == "/level1":
            self._send(200, '<html><title>Level 1</title><body><a href="/level2">Level 2</a></body></html>')
            return
        if path == "/level2":
            self._send(200, '<html><title>Level 2</title><body><a href="/level3">Level 3</a></body></html>')
            return
        if path == "/level3":
            self._send(200, '<html><title>Level 3</title><body><a href="/deep/search?id=1">Deep search</a></body></html>')
            return
        if path == "/deep/search":
            value = query.get("id", ["1"])[0]
            status, body = sql_fixture(value)
            self._send(status, f"<html><title>Deep Search</title><body>{body}</body></html>")
            return

        if path == "/api/profile":
            self._send(200, json.dumps({
                "username": "demo-user",
                "email": "demo@example.com",
                "role": "tester"
            }), "application/json")
            return

        if path == "/api/token":
            self._send(200, json.dumps({"access_token": JWT_NONE, "token_type": "bearer"}), "application/json")
            return

        if path == "/api/private":
            self._send(
                200,
                json.dumps({"username": "demo-user", "email": "demo@example.com", "role": "admin"}),
                "application/json",
                {"Cache-Control": "public, max-age=600"},
            )
            return

        if path == "/graphql":
            q = query.get("query", [""])[0]
            if "__schema" in q:
                self._send(200, json.dumps({"data": {"__schema": {"queryType": {"name": "Query"}}}}), "application/json")
            else:
                self._send(200, json.dumps({"data": {"__typename": "Query"}}), "application/json")
            return

        if path == "/search":
            value = query.get("id", ["1"])[0]
            status, body = sql_fixture(value)
            self._send(status, f"<html><title>Search</title><body>{body}</body></html>")
            return

        if path == "/reflect":
            value = query.get("q", [""])[0]
            if "{{7*7}}" in value:
                value = value.replace("{{7*7}}", "49")
            self._send(200, f"<html><title>Reflect</title><body>Echo: {value}</body></html>")
            return

        if path == "/redirect":
            target = query.get("next", ["/"])[0]
            self._send(302, b"", "text/plain", {"Location": target})
            return

        if path == "/.env":
            self._send(200, "APP_ENV=lab\nDATABASE_URL=mysql://demo:demo@localhost/demo\nSECRET_KEY=not-a-real-secret\n", "text/plain")
            return
        if path == "/.git/HEAD":
            self._send(200, "ref: refs/heads/main\n", "text/plain")
            return
        if path == "/.svn/entries":
            self._send(200, "10\ndir\n1234\n", "text/plain")
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
        if path == "/composer.json":
            self._send(200, json.dumps({"name":"vulnlab/demo","require":{"php":"^8.3"},"autoload":{"psr-4":{"App\\":"src/"}}}), "application/json")
            return
        if path == "/package.json":
            self._send(200, json.dumps({"name":"vulnlab","scripts":{"start":"node app.js"},"dependencies":{"express":"4.18.2"}}), "application/json")
            return
        if path in {"/openapi.json", "/swagger.json"}:
            self._send(200, json.dumps({"openapi":"3.1.0","info":{"title":"VulnLab API","version":"0.6"},"paths":{"/api/profile":{"get":{}},"/api/search":{"post":{}}}}), "application/json")
            return
        if path == "/actuator/health":
            self._send(200, json.dumps({"status":"UP","components":{"db":{"status":"UP"}}}), "application/json")
            return
        if path == "/wp-content/plugins/demo/jquery.js":
            self._send(200, "window.VulnLabWordPressFixture=true;", "application/javascript")
            return
        if path == "/robots.txt":
            self._send(200, "User-agent: *\nDisallow: /admin\n", "text/plain")
            return
        if path == "/health":
            self._send(200, '{"status":"ok","lab":"deliberately-vulnerable-v06"}', "application/json")
            return

        self._send(404, "Not found", "text/plain; charset=utf-8")

    def do_POST(self):
        parts = urlsplit(self.path)
        path = parts.path
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8", errors="replace")

        if path == "/api/search":
            try:
                payload = json.loads(raw or "{}")
            except Exception:
                payload = {}
            value = str(payload.get("id", "1"))
            status, body = sql_fixture(value)
            if status == 500:
                self._send(status, json.dumps({"error": body}), "application/json")
            else:
                self._send(status, json.dumps({"result": body, "echo": payload.get("q")}), "application/json")
            return

        if path == "/search-post":
            form = parse_qs(raw)
            value = form.get("id", ["1"])[0]
            status, body = sql_fixture(value)
            self._send(status, f"<html><title>POST Search</title><body>{body}</body></html>")
            return

        if path not in {"/login", "/profile/update"}:
            self._send(404, '{"error":"not found"}', "application/json")
            return

        form = parse_qs(raw)
        self._send(200, json.dumps({
            "ok": True,
            "username": form.get("username", [None])[0],
            "message": "Formulario recibido por el laboratorio vulnerable"
        }), "application/json")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), VulnerableHandler)
    print(f"VulnLab escuchando en http://0.0.0.0:{port}")
    server.serve_forever()
