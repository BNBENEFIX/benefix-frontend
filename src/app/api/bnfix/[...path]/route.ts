import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.BNFIX_API_BASE_URL ?? 'https://api.bnfix.com.br';

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const target = new URL(path.join('/'), `${API_BASE.replace(/\/$/, '')}/`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  for (const name of ['accept', 'content-type']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const authorization = request.headers.get('authorization');
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

  return new NextResponse(response.body, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
