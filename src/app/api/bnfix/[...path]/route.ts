import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.BNFIX_API_BASE_URL ?? 'https://api.bnfix.com.br';
const AUTH_LOGIN_PATH = 'auth/login';

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const requestedPath = path.join('/');
  const isLoginRequest = requestedPath === AUTH_LOGIN_PATH;
  const target = new URL(requestedPath, `${API_BASE.replace(/\/$/, '')}/`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  for (const name of ['accept', 'content-type']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Login é público: nunca encaminhe uma sessão antiga para o backend.
  // Um JWT expirado no cookie faria o Quarkus responder 401 antes de validar
  // as novas credenciais.
  const authorization = isLoginRequest ? null : request.headers.get('authorization');
  if (authorization) {
    headers.set('authorization', authorization);
    const token = authorization.replace(/^Bearer\s+/i, '').trim();
    if (token) headers.set('cookie', `jwt=${token}`);
  }

  const response = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.arrayBuffer(),
    cache: 'no-store',
  });

  const proxyResponse = new NextResponse(response.body, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
      'cache-control': 'no-store, no-cache, must-revalidate',
    },
  });

  if (isLoginRequest) {
    // Remove o cookie legado do domínio do frontend. A sessão atual é mantida
    // pelo token retornado no corpo e armazenado pelo cliente.
    proxyResponse.cookies.set('jwt', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });
  }

  return proxyResponse;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
