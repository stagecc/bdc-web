"""
join_handler.py

Handles the contact upsert flow for the /join route.

Called by handler.py after security checks (CORS, reCAPTCHA, honeypot)
have already passed. This module is responsible for one thing:
determining whether to create or update a Freshdesk contact based on
whether the submitted email already exists.

Why separate from handler.py?
    handler.py is a security proxy — its job is CORS, reCAPTCHA, honeypot,
    and forwarding. The upsert logic is business logic that doesn't belong
    there. Keeping it here makes both files easier to reason about and test.

Flow:
    1. Search for existing contact by email
       GET /api/v2/contacts?email={email}
    2. If found — update the existing contact
       PUT /api/v2/contacts/{id}
    3. If not found — create a new contact
       POST /api/v2/contacts

Error tagging:
    All print statements are prefixed with [JOIN] so they're immediately
    identifiable in CloudWatch logs without searching through combined
    proxy logs.
"""

import json
import urllib.error
import urllib.parse
import urllib.request


def handle_join(payload, auth, base_url, headers, proxy_request):
    """
    Create or update a Freshdesk contact based on email address.

    Args:
        payload (dict): Contact data from the form. Must include `email`.
            Already stripped of recaptcha_token and honeypot by handler.py.
        auth (str): base64-encoded Basic Auth header value.
        base_url (str): Freshdesk API base URL
            (e.g. https://org.freshdesk.com/api/v2).
        headers (dict): Response headers to return to the caller.
        proxy_request (callable): The _proxy_request function from handler.py.
            Passed in so this module doesn't duplicate HTTP request logic.

    Returns:
        dict: Lambda proxy integration response.
    """
    email = payload.get('email')
    if not email:
        print('[JOIN] ERROR: Missing email in payload')
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Missing email'}),
        }

    print(f'[JOIN] Processing contact for email: {email}')

    # Step 1 — Search for existing contact by email.
    # quote(email, safe='') ensures + signs in email addresses are encoded
    # as %2B rather than left as-is, which would be misinterpreted by
    # Freshdesk's query parser.
    search_url = f'{base_url}/contacts?email={urllib.parse.quote(email, safe="")}'
    search_req = urllib.request.Request(search_url, method='GET')
    search_req.add_header('Authorization', f'Basic {auth}')
    search_req.add_header('Content-Type', 'application/json')

    try:
        with urllib.request.urlopen(search_req) as res:
            contacts = json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        error = e.read().decode()
        print(f'[JOIN] ERROR: Contact search failed ({e.code}): {error}')
        return {
            'statusCode': e.code,
            'headers': headers,
            'body': json.dumps({'error': e.reason}),
        }
    except Exception as e:
        print(f'[JOIN] ERROR: Unexpected error during contact search: {e}')
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
        }

    body = json.dumps(payload).encode('utf-8')

    if contacts:
        # Step 2 — Contact exists. Update with PUT.
        contact_id = contacts[0].get('id')
        print(f'[JOIN] Contact found (id: {contact_id}), updating...')
        update_url = f'{base_url}/contacts/{contact_id}'
        return proxy_request(update_url, 'PUT', body, auth, headers)
    else:
        # Step 3 — Contact does not exist. Create with POST.
        print('[JOIN] No existing contact found, creating...')
        create_url = f'{base_url}/contacts'
        result = proxy_request(create_url, 'POST', body, auth, headers)

        # 409 means a contact with this email already exists — possible if
        # the email lookup missed it (e.g. race condition or Freshdesk lag).
        # Return a specific error code so FreshdeskContactForm can show
        # a friendly "already signed up" message rather than a generic error.
        if result.get('statusCode') == 409:
            return {
                'statusCode': 409,
                'headers': headers,
                'body': json.dumps({'error': 'already_exists'}),
            }

        return result