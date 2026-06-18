/**
 * Servidor Express — BNFix Frontend
 *
 * Responsabilidades:
 *  1. Proxy reverso para a API real BNFix (https://api.bnfix.com.br)
 *     → Evita CORS no browser em desenvolvimento
 *  2. Chatbot Gemini AI (rota local /api/chatbot/message)
 *  3. Rotas auxiliares sem equivalente na API real ainda:
 *     /api/events, /api/metrics (dados agregados)
 *  4. Serve o build do Vite em produção
 *
 * NOTA: Todos os dados de usuários, benefícios, solicitações, etc.
 * são buscados diretamente da API BNFix pelo frontend via JWT.
 * Este servidor NÃO mantém banco em memória.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// ── Gemini AI (opcional) ──────────────────────────────────────────────────────

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

const app = express();
const PORT = Number(process.env.PORT ?? 3000);
const API_BASE = process.env.VITE_API_BASE_URL ?? 'https://api.bnfix.com.br';

app.use(express.json({
  // Não rejeita body vazio — alguns endpoints PUT/PATCH não enviam body
  strict: false,
}));

// ── Proxy BNFix real API ─────────────────────────────────────────────────────

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

  // O backend Quarkus autentica via cookie 'jwt'. Extraímos o token do
  // header Authorization (Bearer <token>) e injetamos como cookie.
  // Removemos o Authorization para evitar conflito no backend que tenta
  // validar ambos (Bearer + cookie) com lógicas diferentes.
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
      body: ['GET', 'HEAD'].includes(req.method) ? undefined
          : (req.body == null || Object.keys(req.body).length === 0) ? undefined
          : JSON.stringify(req.body),
    });

    console.log(`[Proxy] ${req.method} ${upstreamUrl.pathname} → ${upstreamResponse.status}`);

    res.status(upstreamResponse.status);

    const contentType = upstreamResponse.headers.get('content-type');
    if (contentType) {
      res.setHeader('content-type', contentType);
    }

    const setCookie = upstreamResponse.headers.get('set-cookie');
    if (setCookie) {
      res.setHeader('set-cookie', setCookie);
    }

    const text = await upstreamResponse.text();
    res.send(text);
  } catch (err) {
    console.error('[Proxy BNFix] Falha ao encaminhar requisição:', err);
    res.status(502).json({ error: 'Falha ao conectar com a API BNFix.' });
  }
});

// ── Base de conhecimento para fallback do chatbot ─────────────────────────────

const FAQ_KB = `
PLATAFORMA BNFIX — BENEFÍCIOS CORPORATIVOS SAAS

Perfis de acesso:
- Administrador: gerencia empresas, fornecedores e visualiza métricas globais.
- Gerente (RH): aprova solicitações de colaboradores, publica comunicados e exporta relatórios ESG.
- Funcionário: solicita benefícios, usa vouchers/cupons, avalia e participa de pesquisas.

Recursos disponíveis:
- Catálogo de benefícios com filtro por categoria e avaliação.
- Vouchers digitais com QR Code para validação nas redes parceiras.
- Cupons de desconto emitidos pelos fornecedores.
- Pesquisas periódicas de NPS e satisfação.
- Gamificação: pontos acumulados por engajamento (solicitar, avaliar, pesquisar).
- Relatórios ESG para o RH.
- Calendário de eventos de saúde e bem-estar.
`;

function getFallbackResponse(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('oi') || m.includes('olá') || m.includes('hello'))
    return 'Olá! Sou o assistente BNFix. Posso ajudar com dúvidas sobre benefícios, vouchers, pontuação e muito mais.';
  if (m.includes('voucher') || m.includes('qr'))
    return 'Seus vouchers digitais ficam no painel "Meus Benefícios". Clique em "Ver QR Code" para apresentar na recepção da rede parceira.';
  if (m.includes('pont') || m.includes('gamif') || m.includes('nível'))
    return 'Você acumula pontos ao solicitar benefícios (+100 pts), avaliar (+50 pts) e participar de pesquisas (+150 pts). Níveis: Bronze, Prata, Ouro e Diamante.';
  if (m.includes('rh') || m.includes('aprova') || m.includes('solicit'))
    return 'Suas solicitações são analisadas pelo RH da empresa. Acompanhe o status em "Histórico de Solicitações" no seu painel.';
  return 'Como posso ajudar? Pergunte sobre benefícios disponíveis, como usar vouchers ou como ganhar mais pontos de engajamento.';
}

// ── Chatbot ───────────────────────────────────────────────────────────────────

app.post('/api/chatbot/message', async (req: Request, res: Response) => {
  const { message } = req.body as { message?: string };
  if (!message) return res.status(400).json({ error: 'Mensagem é obrigatória.' });

  if (ai) {
    try {
      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Pergunta do colaborador sobre benefícios corporativos: "${message}"`,
        config: {
          systemInstruction: `Você é o assistente oficial de benefícios corporativos da plataforma BNFix.
${FAQ_KB}
Responda em Português de forma curta, simpática e profissional. Máximo 3 linhas.`,
        },
      });
      return res.json({ text: result.text });
    } catch (err) {
      console.error('[Gemini] Erro na geração:', err);
    }
  }

  return res.json({ text: getFallbackResponse(message) });
});

// ── Eventos de calendário (sem endpoint no backend real por ora) ───────────────

app.get('/api/events', (_req: Request, res: Response) => {
  res.json([
    {
      id: 'e_1',
      title: 'Workshop de Saúde Mental',
      date: '2026-06-20',
      type: 'health',
      color: '#ec4899',
      description: 'Palestra com psicólogos sobre gestão de ansiedade no trabalho.',
    },
    {
      id: 'e_2',
      title: 'Ginástica Laboral Online',
      date: '2026-06-27',
      type: 'wellness',
      color: '#3b82f6',
      description: 'Sessão de alongamento coletivo transmitida ao vivo.',
    },
    {
      id: 'e_3',
      title: 'Desafio Fitness Wellhub',
      date: '2026-07-05',
      type: 'campaign',
      color: '#10b981',
      description: 'Acumule o dobro de pontos frequentando a academia 3x nesta semana.',
    },
  ]);
});

// ── Métricas agregadas (calculadas a partir da API real no futuro) ─────────────
// Por ora retorna estrutura compatível com os dashboards existentes.

app.get('/api/metrics', (_req: Request, res: Response) => {
  res.json({
    activeBenefitsCount:    0,
    usersCount:             0,
    hiredBenefitsTotal:     0,
    pendingRequestsCount:   0,
    satisfactionRate:       0,
    companiesRegisteredCount: 0,
    suppliersCount:         0,
    esgWellnessScore:       0,
    esgEngagementScore:     0,
    surveysMetrics: {
      totalResponses:          0,
      promCount:               0,
      neutCount:               0,
      detrCount:               0,
      npsScore:                0,
      platformSatisfactionAvg: 0,
    },
    monthlyVoucherUsage: [],
    topBenefits:         [],
  });
});

// ── Rotas auxiliares (surveys, announcements, etc.) mantidas para UI ───────────

// Estas rotas retornam listas vazias para forçar o frontend a mostrar estado vazio
// correto (sem dados fictícios) enquanto o backend não implementa esses endpoints.

const emptyList = (_req: Request, res: Response) => res.json([]);

app.get('/api/benefits',           emptyList);
app.get('/api/requests',           emptyList);
app.get('/api/vouchers',           emptyList);
app.get('/api/coupons',            emptyList);
app.get('/api/announcements',      emptyList);
app.get('/api/feedbacks',          emptyList);
app.get('/api/surveys/campaigns',  emptyList);
app.get('/api/surveys/responses',  emptyList);
app.get('/api/users',              emptyList);
app.get('/api/recommendations',    emptyList);

// POST/PUT stub — retorna 501 Not Implemented para rotas sem backend real
const notImplemented = (_req: Request, res: Response) =>
  res.status(501).json({ error: 'Endpoint não implementado no backend ainda.' });

app.post('/api/benefits',               notImplemented);
app.put('/api/benefits/:id',            notImplemented);
app.delete('/api/benefits/:id',         notImplemented);
app.post('/api/requests',               notImplemented);
app.put('/api/requests/:id',            notImplemented);
app.post('/api/vouchers/redeem',        notImplemented);
app.post('/api/coupons',                notImplemented);
app.post('/api/announcements',          notImplemented);
app.post('/api/feedbacks',              notImplemented);
app.post('/api/surveys/campaigns',      notImplemented);
app.put('/api/surveys/campaigns/:id/close', notImplemented);
app.post('/api/surveys/responses',      notImplemented);
app.post('/api/contact',               (_req, res) => res.json({ success: true }));

// ── Inicialização do servidor ─────────────────────────────────────────────────

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BNFix] Servidor rodando em http://0.0.0.0:${PORT}`);
    console.log(`[BNFix] API real: ${API_BASE}`);
    console.log(`[BNFix] Gemini: ${ai ? 'ativo' : 'inativo (sem GEMINI_API_KEY)'}`);
  });
}

startServer();
