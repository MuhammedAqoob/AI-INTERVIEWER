import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL;
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days — matches JWT expiry

const SESSION_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_MAX_AGE,
};

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

function extractJwtFromSetCookie(setCookieHeader) {
  if (!setCookieHeader) return null;
  const headers = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];
  for (const header of headers) {
    const match = header.match(/(?:^|;\s*)token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

function buildHeaders(request, jwt) {
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  const accept = request.headers.get('accept');
  if (accept) headers.set('Accept', accept);
  if (jwt) headers.set('Authorization', `Bearer ${jwt}`);
  return headers;
}

function sanitizeResponseHeaders(backendResponse) {
  const headers = new Headers();
  const contentType = backendResponse.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  return headers;
}

async function proxyRequest(request, { params }) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { success: false, message: 'Proxy configuration error.' },
      { status: 500 }
    );
  }

  const path = (await params).proxy.join('/');
  const sessionJwt = request.cookies.get('session')?.value || null;

  const targetUrl = new URL(`/api/${path}`, BACKEND_URL);
  targetUrl.search = request.nextUrl.search;

  const fetchOptions = {
    method: request.method,
    headers: buildHeaders(request, sessionJwt),
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    fetchOptions.body = request.body;
    fetchOptions.duplex = 'half';
  }

  let backendResponse;
  try {
    backendResponse = await fetch(targetUrl.toString(), fetchOptions);
  } catch {
    return NextResponse.json(
      { success: false, message: 'Service temporarily unavailable.' },
      { status: 503 }
    );
  }

  const responseBody = await backendResponse.text();
  const responseHeaders = sanitizeResponseHeaders(backendResponse);

  // Set no-cache on all proxy responses — private API data must not be cached
  for (const [key, value] of Object.entries(NO_CACHE)) {
    responseHeaders.set(key, value);
  }

  const isAuthEndpoint =
    path === 'auth/login' || path === 'auth/register';
  const isLogout = path === 'auth/logout';

  if (isAuthEndpoint && backendResponse.ok) {
    const jwt = extractJwtFromSetCookie(
      backendResponse.headers.getSetCookie?.() ||
        backendResponse.headers.get('set-cookie')
    );
    if (jwt) {
      const cookieOptions = [
        `session=${jwt}`,
        `Path=/`,
        `Max-Age=${SESSION_MAX_AGE}`,
      ];
      if (SESSION_COOKIE.httpOnly) cookieOptions.push('HttpOnly');
      if (SESSION_COOKIE.secure) cookieOptions.push('Secure');
      cookieOptions.push(`SameSite=${SESSION_COOKIE.sameSite === 'lax' ? 'Lax' : 'Strict'}`);
      responseHeaders.append('Set-Cookie', cookieOptions.join('; '));
    }
  }

  if (isLogout) {
    const cookieOptions = [
      'session=',
      'Path=/',
      'Max-Age=0',
    ];
    if (SESSION_COOKIE.httpOnly) cookieOptions.push('HttpOnly');
    if (SESSION_COOKIE.secure) cookieOptions.push('Secure');
    cookieOptions.push(`SameSite=${SESSION_COOKIE.sameSite === 'lax' ? 'Lax' : 'Strict'}`);
    responseHeaders.append('Set-Cookie', cookieOptions.join('; '));
  }

  if (backendResponse.status === 401 && sessionJwt) {
    const cookieOptions = [
      'session=',
      'Path=/',
      'Max-Age=0',
    ];
    if (SESSION_COOKIE.httpOnly) cookieOptions.push('HttpOnly');
    if (SESSION_COOKIE.secure) cookieOptions.push('Secure');
    cookieOptions.push(`SameSite=${SESSION_COOKIE.sameSite === 'lax' ? 'Lax' : 'Strict'}`);
    responseHeaders.append('Set-Cookie', cookieOptions.join('; '));
  }

  return new NextResponse(responseBody, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

export async function GET(request, context) {
  return proxyRequest(request, context);
}

export async function POST(request, context) {
  return proxyRequest(request, context);
}

export async function DELETE(request, context) {
  return proxyRequest(request, context);
}
