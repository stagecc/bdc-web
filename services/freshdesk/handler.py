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
    ]

    headers = {
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
    }

    if origin in allowed_origins:
        headers['Access-Control-Allow-Origin'] = origin

    return headers

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
        route_map = {
            'join': 'contacts',
            'cloud-credits': 'tickets'
        }
        # ensure target resource exists
        resource = route_map.get(path)
        if not resource:
            return _error(404, f'Unknown POST route: /{path}', headers)

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
        body = json.dumps(payload)
        
        url = f'{base_url}/{resource}'
        return _proxy_request(url, 'POST', body, auth, headers)


    return _error(405, f'Method {method} not allowed for /{path}', headers)

def _proxy_request(url, method, body, auth, headers):
    """
    send proxied HTTP request to Freshdesk with
    the given method, URL, and payload.

    Args:
        url (str): Freshdesk API URL
        method (str): HTTP method (GET, POST)
        body (str): request body (JSON string)
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
        if body:
            body = body.encode('utf-8')
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
