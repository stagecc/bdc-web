# Freshdesk Proxy

This is the source of truth for the AWS Lambda function that proxies requests between the site and the Freshdesk API. The Lambda handles CORS, reCAPTCHA verification, and authenticated forwarding to Freshdesk.

The site references this proxy via the `FRESHDESK_PROXY_URL` environment variable (with a fallback to the production Lambda URL), so **most site development does not require running this service locally**.

## Local Development

The local server is only needed when working on the Lambda function itself. It wraps `handler.py` in a standard HTTP server so changes can be tested without redeploying to AWS.

### Setup

```bash
pip install -r requirements.txt
```

Copy `.env` and fill in your credentials:

```
FRESHDESK_API_KEY=
FRESHDESK_DOMAIN=
RECAPTCHA_SECRET_KEY=
```

### Run

```bash
python server.py
```

The server starts on `http://localhost:8787`.

To route the site through the local proxy, set `FRESHDESK_PROXY_URL=http://localhost:8787` in `apps/site/.env`.

## Deployment

`handler.py` is deployed as-is to AWS Lambda. It has no dependencies beyond the Python standard library.
