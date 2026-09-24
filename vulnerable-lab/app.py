import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).parent
HTML = (ROOT / "templates" / "index.html").read_text(encoding="utf-8")


class VulnerableHandler(BaseHTTPRequestHandler):
    server_version = "VulnLab/0.5"

    def _cors(self):
        origin = self.headers.get("Origin")
        if origin:
            # Deliberately unsafe: reflects arbitrary Origin and allows credentials.
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Credentials", "true")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")

    def _common_response(self, status=200, content_type="text/html; charset=utf-8"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("X-Powered-By", "VulnLab-Python/0.5")
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
        self.end_headers()

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

        if path == "/api/profile":
            self._send(200, json.dumps({
                "username": "demo-user",
                "email": "demo@example.com",
                "role": "tester"
            }), "application/json")
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
            # Deliberately unescaped reflection for scanner regression testing.
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
            self._send(200, '{"status":"ok","lab":"deliberately-vulnerable"}', "application/json")
            return

        self._send(404, "Not found", "text/plain; charset=utf-8")

    def do_POST(self):
        parts = urlsplit(self.path)
        if parts.path not in {"/login", "/profile/update"}:
            self._send(404, '{"error":"not found"}', "application/json")
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8", errors="replace")
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
