import os
import json
import base64
import urllib.request
import urllib.error
import urllib.parse


def verify_recaptcha(token):
    if not token:
        return {'success': False, 'error': 'Missing token'}

    data = urllib.parse.urlencode({
        'secret': os.getenv('RECAPTCHA_SECRET_KEY'),
        'response': token,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://www.google.com/recaptcha/api/siteverify',
        data=data,
        method='POST',
    )

    with urllib.request.urlopen(req, timeout=5) as res:
        return json.loads(res.read().decode())


def cors_headers(event):
    origin = event.get('headers', {}).get('origin')
    allowed_origins = [
        'https://biodatacatalyst.nhlbi.nih.gov',
        'https://staging.biodatacatalyst.nhlbi.nih.gov',
        'http://localhost:4321',
    ]

    headers = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
    }

    if origin in allowed_origins:
        headers['Access-Control-Allow-Origin'] = origin

    return headers


def _freshdesk_request(url, method, body, auth, headers):
    req = urllib.request.Request(url, method=method)
    req.add_header('Authorization', f'Basic {auth}')
    req.add_header('Content-Type', 'application/json')

    try:
        with urllib.request.urlopen(req, data=body) as res:
            return {
                'statusCode': res.getcode(),
                'headers': headers,
                'body': res.read().decode(),
            }
    except urllib.error.HTTPError as e:
        error = e.read().decode()
        print('[JOIN] Freshdesk error response:', error)
        return {
            'statusCode': e.code,
            'headers': headers,
            'body': json.dumps({'error': e.reason}),
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
        }


def _error(code, message, headers):
    return {
        'statusCode': code,
        'headers': headers,
        'body': json.dumps({'error': message}),
    }


def lambda_handler(event, context):
    print('[JOIN] Received event:', json.dumps(event))

    method = (
        event.get('requestContext', {}).get('http', {}).get('method')
        or event.get('httpMethod')
        or 'UNKNOWN'
    )

    headers = cors_headers(event)
    if 'Access-Control-Allow-Origin' not in headers:
        return _error(403, 'CORS origin not allowed', headers)

    if method == 'OPTIONS':
        return {'statusCode': 204, 'headers': headers, 'body': ''}

    if method != 'POST':
        return _error(405, f'Method {method} not allowed', headers)

    api_key = os.getenv('FRESHDESK_API_KEY')
    domain = os.getenv('FRESHDESK_DOMAIN')
    if not api_key or not domain:
        return _error(500, 'Missing FRESHDESK_API_KEY or FRESHDESK_DOMAIN', headers)

    body = event.get('body')
    if not body:
        return _error(400, 'Missing request body', headers)

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        return _error(400, 'Invalid JSON body', headers)

    recaptcha_token = payload.get('recaptcha_token')
    if not recaptcha_token:
        return _error(400, 'Missing reCAPTCHA token', headers)

    verification = verify_recaptcha(recaptcha_token)
    if not verification.get('success'):
        return _error(403, 'reCAPTCHA verification failed', headers)

    payload.pop('recaptcha_token', None)

    if payload.pop('website', ''):
        print('[JOIN] Honeypot field populated; discarding')
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'message': 'ok'})}

    email = payload.get('email')
    if not email:
        return _error(400, 'Missing email', headers)

    auth = base64.b64encode(f'{api_key}:X'.encode()).decode()
    base_url = f'https://{domain}/api/v2'

    search_url = f'{base_url}/contacts?email={urllib.parse.quote(email, safe="")}'
    search_req = urllib.request.Request(search_url, method='GET')
    search_req.add_header('Authorization', f'Basic {auth}')
    search_req.add_header('Content-Type', 'application/json')

    try:
        with urllib.request.urlopen(search_req) as res:
            contacts = json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        error = e.read().decode()
        print(f'[JOIN] Contact search failed ({e.code}): {error}')
        return {
            'statusCode': e.code,
            'headers': headers,
            'body': json.dumps({'error': e.reason}),
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
        }

    request_body = json.dumps(payload).encode('utf-8')

    if contacts:
        contact_id = contacts[0].get('id')
        update_url = f'{base_url}/contacts/{contact_id}'
        return _freshdesk_request(update_url, 'PUT', request_body, auth, headers)

    create_url = f'{base_url}/contacts'
    result = _freshdesk_request(create_url, 'POST', request_body, auth, headers)
    if result.get('statusCode') == 409:
        return {
            'statusCode': 409,
            'headers': headers,
            'body': json.dumps({'error': 'already_exists'}),
        }

    return result
