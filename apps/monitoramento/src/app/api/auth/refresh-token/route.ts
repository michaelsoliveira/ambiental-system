// pages/api/auth/refresh-token.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ message: 'Método não permitido.' }, { status: 405 });
  }

  try {
    // Busca o refresh token do cookie, localStorage, session ou body
    const { refreshToken } = await req.json();
    
    if (!refreshToken) {
      return NextResponse.json({ message: 'Refresh token ausente.' }, { status: 400 });
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      refresh_token: data.refresh_token,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Erro no refresh-token API route:', error);
    return NextResponse.json({ message: 'Erro interno no servidor.' }, { status: 500 });
  }
}
