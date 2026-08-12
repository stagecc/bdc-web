# Services

Local service wrappers for Lambda handlers used by the site.

## Shared Configuration

Copy `sample.env` to `.env` in this directory:

```bash
cp services/sample.env services/.env
```

Set the required values in `services/.env`:

```
FRESHDESK_DOMAIN=
FRESHDESK_API_KEY=
RECAPTCHA_SECRET_KEY=
```

Both service runners load `services/.env` automatically. You can add optional service-specific overrides in:

- `services/freshdesk/.env`
- `services/freshdesk-join/.env`

## Start Services

Run each service in its own terminal.

### Freshdesk proxy (ticket forms, FAQs, custom object forms)

```bash
cd services/freshdesk
pipenv install
pipenv run python server.py
```

Serves: `http://localhost:8787`

### Freshdesk join Lambda (join form only)

```bash
cd services/freshdesk-join
pipenv install
pipenv run python server.py
```

Serves: `http://localhost:8788`

## Site Env Wiring

Set these in `apps/site/.env`:

```
FRESHDESK_PROXY_URL=http://localhost:8787
FRESHDESK_JOIN_URL=http://localhost:8788
PUBLIC_RECAPTCHA_SITE_KEY=
```
