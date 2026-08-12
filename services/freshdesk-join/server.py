"""
Local development server for the join Lambda handler.

Usage:
  pip install -r requirements.txt
  python server.py
"""

from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from dotenv import load_dotenv
from handler import lambda_handler

service_dir = Path(__file__).resolve().parent

# Shared local config for all services.
load_dotenv(service_dir.parent / '.env', override=False)
# Optional service-specific overrides.
load_dotenv(service_dir / '.env', override=True)

PORT = 8788


class Handler(BaseHTTPRequestHandler):
    def _handle(self, method):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode() if content_length else None

        event = {
            'httpMethod': method,
            'path': self.path,
            'headers': {k.lower(): v for k, v in self.headers.items()},
            'body': body,
        }

        result = lambda_handler(event, None)

        self.send_response(result['statusCode'])
        for k, v in result.get('headers', {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(result.get('body', '').encode())

    def do_POST(self):
        self._handle('POST')

    def do_OPTIONS(self):
        self._handle('OPTIONS')


if __name__ == '__main__':
    print(f'Freshdesk join proxy listening on http://localhost:{PORT}')
    HTTPServer(('', PORT), Handler).serve_forever()
