# Freshdesk Join Lambda

This service is the source of truth for the dedicated Join Lambda used by `apps/site/src/pages/join.astro`.

Unlike `services/freshdesk-proxy/handler.py`, this handler includes join-specific business logic:

- verifies reCAPTCHA
- rejects bot submissions via honeypot
- searches contacts by email
- updates existing contacts
- creates contacts when no existing record is found
- returns `409` with `already_exists` for duplicate create races

## Local Development

### Setup

```bash
pip install -r requirements.txt
```

Copy `services/sample.env` to `services/.env` and fill the required variables:

```
FRESHDESK_API_KEY=
FRESHDESK_DOMAIN=
RECAPTCHA_SECRET_KEY=
```

Optional: create `services/freshdesk-join/.env` only if you need service-specific overrides.

### Run

```bash
python server.py
```

The server listens on `http://localhost:8788`.

To route the site join page through local join Lambda, set `FRESHDESK_JOIN_URL=http://localhost:8788` in `apps/site/.env`.

## Deployment

Deploy `handler.py` from this directory as the Join Lambda function code.
