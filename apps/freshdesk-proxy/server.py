"""
Local development server that wraps the Lambda handler
with a standard HTTP server.

Usage:
  FRESHDESK_API_KEY=xxx FRESHDESK_DOMAIN=xxx RECAPTCHA_SECRET_KEY=xxx python server.py
"""

import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from app import lambda_handler

PORT = 8787

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

    def do_GET(self):
        self._handle('GET')

    def do_POST(self):
        self._handle('POST')

    def do_OPTIONS(self):
        self._handle('OPTIONS')

if __name__ == '__main__':
    print(f'Freshdesk proxy listening on http://localhost:{PORT}')
    HTTPServer(('', PORT), Handler).serve_forever()
