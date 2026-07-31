import os
import json
import base64
import urllib.request
import urllib.error

import urllib.parse
import urllib.request

def verify_recaptcha(token):
    print("---- reCAPTCHA verification started ----")

    if not token:
        print("ERROR: Missing reCAPTCHA token")
        return {"success": False, "error": "Missing token"}

    data = urllib.parse.urlencode({
        "secret": os.getenv('RECAPTCHA_SECRET_KEY'),
        "response": token,
    }).encode("utf-8")

    print("POSTing to Google reCAPTCHA verify endpoint...")

    req = urllib.request.Request(
        "https://www.google.com/recaptcha/api/siteverify",
        data=data,
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=5) as res:
        result = json.loads(res.read().decode())
        return result

def cors_headers(event):
    origin = event.get('headers', {}).get('origin')
    allowed_origins = [
        'https://biodatacatalyst.nhlbi.nih.gov',
        'https://staging.biodatacatalyst.nhlbi.nih.gov',
        'http://localhost:8000',
        'http://localhost:4321',
    ]

    headers = {
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
    }

    if origin in allowed_origins:
        headers['Access-Control-Allow-Origin'] = origin

    return headers

def _upsert_contact(payload, auth, base_url, headers):
    """
    Create or update a Freshdesk contact based on email address.

    Why upsert?
    Submitting any form (tickets, custom objects) automatically creates a
    Freshdesk contact for the submitter's email. If a user later tries to
    join and their email already exists as a contact, a straight POST would
    fail with a 409 conflict. The upsert pattern handles both cases cleanly:
    new users get created, returning users get updated without error.

    Flow:
        1. Search for an existing contact by email
        2. If found — update the existing contact with PUT
        3. If not found — create a new contact with POST

    Args:
        payload (dict): Contact data from the form. Must include `email`.
        auth (str): base64-encoded Basic Auth header value.
        base_url (str): Freshdesk API base URL (e.g. https://org.freshdesk.com/api/v2).
        headers (dict): Response headers to return to the caller.

    Returns:
        dict: Lambda proxy integration response.
    """
    email = payload.get('email')
    if not email:
        return _error(400, 'Missing email in contact payload', headers)

    print(f'Upserting contact for email: {email}')

    # Step 1 — Search for existing contact by email.
    # Freshdesk returns a list — we take the first match if any exist.
    search_url = f'{base_url}/contacts?email={urllib.parse.quote(email)}'
    search_req = urllib.request.Request(search_url, method='GET')
    search_req.add_header('Authorization', f'Basic {auth}')
    search_req.add_header('Content-Type', 'application/json')

    try:
        with urllib.request.urlopen(search_req) as res:
            contacts = json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        error = e.read().decode()
        print(f'Error searching for contact: {error}')
        return {
            'statusCode': e.code,
            'headers': headers,
            'body': json.dumps({'error': e.reason})
        }
    except Exception as e:
        print(f'Unexpected error searching for contact: {e}')
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

    body = json.dumps(payload).encode('utf-8')

    if contacts:
        # Step 2 — Contact exists. Update with PUT.
        contact_id = contacts[0].get('id')
        print(f'Contact found (id: {contact_id}), updating...')
        update_url = f'{base_url}/contacts/{contact_id}'
        return _proxy_request(update_url, 'PUT', body, auth, headers)
    else:
        # Step 3 — Contact does not exist. Create with POST.
        print('No existing contact found, creating new contact...')
        create_url = f'{base_url}/contacts'
        return _proxy_request(create_url, 'POST', body, auth, headers)


def lambda_handler(event, context):
    """
    AWS Lambda function handler. think: router.

    Args:
        event (dict): event data passed to the Lambda function
        context (object): context object passed to the Lambda function

    Returns:
        dict: response object containing the status code, headers, and body
    """
    print('Received event:', json.dumps(event))

    method = (
        event.get('requestContext', {}).get('http', {}).get('method')  # HTTP API v2
        or event.get('httpMethod')  # REST API v1
        or 'UNKNOWN'
    )

    path = event.get('rawPath') or event.get('path', '/')
    path = path.lstrip('/').lower()  # normalize path like 'faqs', 'join', etc.

    headers = cors_headers(event)

    if 'Access-Control-Allow-Origin' not in headers:
        return _error(403, 'CORS origin not allowed', headers)
        
    api_key = os.getenv('FRESHDESK_API_KEY')
    domain = os.getenv('FRESHDESK_DOMAIN')
    if not api_key or not domain:
        return _error(500, 'Missing FRESHDESK_API_KEY or FRESHDESK_DOMAIN', headers)

    auth = base64.b64encode(f'{api_key}:X'.encode()).decode()
    base_url = f'https://{domain}/api/v2'

    # preflight
    if method == 'OPTIONS':
        return { 'statusCode': 204, 'headers': headers, 'body': '' }

    # GET /faqs
    if method == 'GET':
        path = event.get('rawPath') or event.get('path', '/')
        print('Requested path:', path)

        normalized_path = path.strip('/')
        if normalized_path == 'faqs':
            url = f'{base_url}/solutions/folders/60000230495/articles'
            print('Matched /faqs route, fetching:', url)
            return _proxy_request(url, 'GET', None, auth, headers)
        else:
            print('No route match for path:', normalized_path)
            return _error(404, 'Not Found', headers)
    
    # POST routes (/cloud-credits, /join)
    if method == 'POST':
        # ensure body exists
        body = event.get('body')
        if not body:
            return _error(400, 'Missing request body', headers)
        
        # parse JSON body
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            return _error(400, 'Invalid JSON body', headers)
               
        # recaptcha verification
        recaptcha_token = payload.get('recaptcha_token')
        if not recaptcha_token:
            return _error(400, 'Missing reCAPTCHA token!', headers)
        
        verification = verify_recaptcha(recaptcha_token)
        print('reCAPTCHA verification result:', verification)
        if not verification.get('success'):
            return _error(403, 'reCAPTCHA verification failed', headers)
        
        # remove token before forwarding
        payload.pop('recaptcha_token', None)

        # honeypot check — silently discard bot submissions.
        # real users never see or fill this field.
        # the bot sees a success response and doesn't know it was caught.
        if payload.pop('website', ''):
            print('Honeypot field populated — discarding submission silently')
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'ok'})
            }

        # /join — upsert contact (check by email, update or create)
        # handled separately from the generic route_map because it requires
        # a search-then-write flow rather than a direct POST.
        if path == 'join':
            return _upsert_contact(payload, auth, base_url, headers)

        # generic POST routes — direct proxy to Freshdesk
        route_map = {
            'cloud-credits': 'tickets',
            'published-research': 'tickets',
        }

        resource = route_map.get(path)
        if not resource:
            return _error(404, f'Unknown POST route: /{path}', headers)

        url = f'{base_url}/{resource}'
        return _proxy_request(url, 'POST', json.dumps(payload).encode('utf-8'), auth, headers)

    return _error(405, f'Method {method} not allowed for /{path}', headers)

def _proxy_request(url, method, body, auth, headers):
    """
    Send a proxied HTTP request to Freshdesk with the given method, URL,
    and payload.

    Args:
        url (str): Freshdesk API URL
        method (str): HTTP method (GET, POST, PUT)
        body (bytes): request body (encoded JSON bytes) or None for GET
        auth (str): base64-encoded Basic Auth header
        headers (dict): response headers to return to the caller

    Returns:
        dict: Lambda proxy integration response.
    """
    print(f'Proxying request to {url} with method {method}')
    req = urllib.request.Request(url, method=method)
    req.add_header('Authorization', f'Basic {auth}')
    req.add_header('Content-Type', 'application/json')

    try:
        with urllib.request.urlopen(req, data=body) as res:
            response_body = res.read().decode()
            return {
                'statusCode': res.getcode(),
                'headers': headers,
                'body': response_body
            }
    except urllib.error.HTTPError as e:
        error = e.read().decode()
        print('Freshdesk error response:', error)
        print('Freshdesk error code:', e.code)

        if e.code == 409:
            return {
                'statusCode': 409,
                'headers': headers,
                'body': json.dumps({'error': 'already_exists'})
            }

        return {
            'statusCode': e.code,
            'headers': headers,
            'body': json.dumps({ 'error': e.reason })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({ 'error': str(e) })
        }

def _error(code, message, headers):
    """
    error response helper
    """
    print(f'Error: {code} - {message}')
    return {
        'statusCode': code,
        'headers': headers,
        'body': json.dumps({ 'error': message })
    }
