// api/index.ts

import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();

const API_BASE = process.env.VITE_API_BASE_URL ?? 'https://api.bnfix.com.br';

app.use(express.json({ strict: false }));

let ai: GoogleGenAI | null = null;

if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  } catch (err) {
    console.warn('[Gemini] Não foi possível inicializar o SDK:', err);
  }
}

// Proxy BNFix
app.use('/api/bnfix', async (req: Request, res: Response) => {
  const upstreamPath = req.originalUrl.replace(/^\/api\/bnfix/, '') || '/';
  const upstreamUrl = new URL(upstreamPath, API_BASE);

  if (req.url.includes('?')) {
    upstreamUrl.search = req.url.slice(req.url.indexOf('?'));
  }

  const headers: Record<string, string> = {};

  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (['host', 'content-length', 'cookie'].includes(key.toLowerCase())) continue;
    headers[key] = Array.isArray(value) ? value.join(', ') : value;
  }

  const authHeader = req.headers['authorization'] ?? '';
  const tokenMatch = (typeof authHeader === 'string' ? authHeader : '').match(/^Bearer\s+(.+)$/i);

  if (tokenMatch) {
    headers['Cookie'] = `jwt=${tokenMatch[1]}`;
    delete headers['authorization'];
    delete headers['Authorization'];
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method)
        ? undefined
        : req.body == null || Object.keys(req.body).length === 0
          ? undefined
          : JSON.stringify(req.body),
    });

    const contentType = upstreamResponse.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);

    const setCookie = upstreamResponse.headers.get('set-cookie');
    if (setCookie) res.setHeader('set-cookie', setCookie);

    const text = await upstreamResponse.text();

    return res.status(upstreamResponse.status).send(text);
  } catch (err) {
    console.error('[Proxy BNFix] Falha ao encaminhar requisição:', err);
    return res.status(502).json({ error: 'Falha ao conectar com a API BNFix.' });
  }
});

// Chatbot
app.post('/api/chatbot/message', async (req: Request, res: Response) => {
  const { message } = req.body as { message?: string };

  if (!message) {
    return res.status(400).json({ error: 'Mensagem é obrigatória.' });
  }

  if (ai) {
    try {
      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Pergunta do colaborador sobre benefícios corporativos: "${message}"`,
        config: {
          systemInstruction:
            'Você é o assistente oficial de benefícios corporativos da plataforma BNFix. Responda em Português de forma curta, simpática e profissional. Máximo 3 linhas.',
        },
      });

      return res.json({ text: result.text });
    } catch (err) {
      console.error('[Gemini] Erro na geração:', err);
    }
  }

  return res.json({
    text: 'Olá! Sou o assistente BNFix. Posso ajudar com dúvidas sobre benefícios, vouchers e pontuação.',
  });
});

// Rotas auxiliares
app.get('/api/events', (_req: Request, res: Response) => {
  res.json([]);
});

app.get('/api/metrics', (_req: Request, res: Response) => {
  res.json({
    activeBenefitsCount: 0,
    usersCount: 0,
    hiredBenefitsTotal: 0,
    pendingRequestsCount: 0,
    satisfactionRate: 0,
    companiesRegisteredCount: 0,
    suppliersCount: 0,
    esgWellnessScore: 0,
    esgEngagementScore: 0,
    surveysMetrics: {
      totalResponses: 0,
      promCount: 0,
      neutCount: 0,
      detrCount: 0,
      npsScore: 0,
      platformSatisfactionAvg: 0,
    },
    monthlyVoucherUsage: [],
    topBenefits: [],
  });
});

export default app;