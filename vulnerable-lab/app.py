import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs

ROOT = Path(__file__).parent
HTML = (ROOT / "templates" / "index.html").read_text(encoding="utf-8")


class VulnerableHandler(BaseHTTPRequestHandler):
    server_version = "VulnLab/0.1"

    def _cors(self):
        origin = self.headers.get("Origin")
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Credentials", "true")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

    def _common_response(self, status=200, content_type="text/html; charset=utf-8"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self._cors()

    def do_OPTIONS(self):
        self._common_response(204, "text/plain")
        self.end_headers()

    def do_GET(self):
        if self.path == "/":
            body = HTML.encode("utf-8")
            self._common_response(200)
            self.send_header("Set-Cookie", "session_demo=abc123; Path=/")
            self.send_header("Set-Cookie", "tracking_demo=user-42; Path=/")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if self.path == "/api/profile":
            body = json.dumps({
                "username": "demo-user",
                "email": "demo@example.com",
                "role": "tester"
            }).encode("utf-8")
            self._common_response(200, "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if self.path == "/health":
            body = b'{"status":"ok","lab":"deliberately-vulnerable"}'
            self._common_response(200, "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        self._common_response(404, "text/plain; charset=utf-8")
        body = b"Not found"
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/login":
            self._common_response(404, "application/json")
            body = b'{"error":"not found"}'
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8", errors="replace")
        form = parse_qs(raw)
        body = json.dumps({
            "ok": True,
            "username": form.get("username", [None])[0],
            "message": "Formulario recibido por el laboratorio vulnerable"
        }).encode("utf-8")
        self._common_response(200, "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), VulnerableHandler)
    print(f"VulnLab escuchando en http://0.0.0.0:{port}")
    server.serve_forever()
