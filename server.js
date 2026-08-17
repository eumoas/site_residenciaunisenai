require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const adminSessions = new Set();

async function saveRow(table, row) {
  if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_KEY === 'your_service_role_key_here') return false;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  });
  if (!response.ok) throw new Error(`Supabase ${table}: ${response.status}`);
  return true;
}

async function listRows(table) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=created_at.desc&limit=100`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!response.ok) throw new Error(`Supabase ${table}: ${response.status}`);
  return response.json();
}

function adminAuthorized(req) {
  const token = req.headers.cookie?.match(/hub_admin=([^;]+)/)?.[1];
  return Boolean(token && adminSessions.has(token));
}

function text(value, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

const CASE_LIBRARY = fs.readFileSync(
  path.join(__dirname, 'personas-ficticias-cases.md'),
  'utf-8'
);

const SYSTEM_PROMPT = `Você é o consultor de diagnóstico do Hub de Inovação Industrial — Residência Inteligência Artificial, UniSENAI SC. Sua tarefa é ler as respostas de uma empresa a um diagnóstico de prontidão para IA e escrever uma devolutiva curta, específica e acionável — nunca genérica.

Biblioteca de cases do Hub (use para recomendar o mais parecido com o desafio da empresa):
${CASE_LIBRARY}

Responda em português do Brasil, tom consultivo e direto, sem emojis e sem exagero de marketing.
- "title": no máximo 6 palavras, resume o estágio de prontidão da empresa.
- "text": 2 a 4 frases, cita elementos concretos das respostas da empresa (não repita os números do score).
- "recommendedCase": o nome de UMA persona da biblioteca acima cujo case se parece mais com o desafio descrito.
- "recommendedReason": 1 frase explicando a semelhança.
- "nextStep": uma ação concreta e específica que essa empresa pode dar a seguir no Hub.`;

function ruleBasedFallback(score) {
  let title, text;
  if (score <= 5) {
    title = 'Estágio de exploração';
    text = 'O melhor próximo passo é enquadrar o problema, localizar dados e escolher um indicador de valor antes de desenhar tecnologia.';
  } else if (score <= 10) {
    title = 'Pronto para estruturar um piloto';
    text = 'Há elementos importantes disponíveis. O Hub pode ajudar a fechar lacunas, formular a hipótese de retorno e desenhar um experimento mensurável.';
  } else {
    title = 'Pronto para acelerar';
    text = 'O desafio reúne boa parte das condições de um piloto. A próxima conversa deve validar viabilidade, arquitetura, investimento e critério de escala.';
  }
  return { title, text, recommendedCase: null, recommendedReason: null, nextStep: null, source: 'fallback' };
}

app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/admin/login', (req, res) => {
  if (!ADMIN_PASSWORD || req.body?.password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'invalid_credentials' });
  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.add(token);
  res.setHeader('Set-Cookie', `hub_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);
  return res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  const token = req.headers.cookie?.match(/hub_admin=([^;]+)/)?.[1];
  if (token) adminSessions.delete(token);
  res.setHeader('Set-Cookie', 'hub_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  return res.json({ ok: true });
});

app.get('/api/admin/overview', async (req, res) => {
  if (!adminAuthorized(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const [diagnostics, leads, startups, newsletter, residents] = await Promise.all([
      listRows('diagnostics'), listRows('company_leads'), listRows('startup_inquiries'), listRows('newsletter_subscribers'), listRows('resident_interests'),
    ]);
    return res.json({ diagnostics, leads, startups, newsletter, residents });
  } catch (err) { console.error(err.message); return res.status(503).json({ error: 'storage_unavailable' }); }
});

app.post('/api/diagnostico', async (req, res) => {
  const keys = ['q1', 'q2', 'q3', 'q4', 'q5'];
  const answers = keys.map((k) => Number(req.body?.[k]));
  if (answers.some((n) => !Number.isInteger(n) || n < 0 || n > 3)) {
    return res.status(400).json({ error: 'invalid_answers' });
  }
  const desafio = typeof req.body?.desafio === 'string' ? req.body.desafio.slice(0, 1000) : '';
  const score = answers.reduce((a, b) => a + b, 0);

  // Sem chave configurada, devolve o resultado local imediatamente.
  // Isso evita uma tentativa de rede desnecessária em desenvolvimento.
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_key_here') {
    const fallback = ruleBasedFallback(score);
    try { await saveRow('diagnostics', { q1: answers[0], q2: answers[1], q3: answers[2], q4: answers[3], q5: answers[4], score, challenge: desafio, result: fallback, source: 'fallback' }); } catch (dbErr) { console.error('Não foi possível salvar diagnóstico:', dbErr.message); }
    return res.json({ score, ...fallback });
  }

  try {
    const response = await ai.interactions.create({
      model: 'gemini-3.6-flash',
      system_instruction: SYSTEM_PROMPT,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            text: { type: 'string' },
            recommendedCase: { type: 'string' },
            recommendedReason: { type: 'string' },
            nextStep: { type: 'string' },
          },
          required: ['title', 'text', 'recommendedCase', 'recommendedReason', 'nextStep'],
        },
      },
      input: `Score de prontidão: ${score}/15.
Respostas (0=pior, 3=melhor):
1. Problema operacional definido: ${answers[0]}/3
2. Dados/imagens/sinais acessíveis: ${answers[1]}/3
3. Indicador capaz de demonstrar retorno: ${answers[2]}/3
4. Apoio de operação/engenharia/liderança: ${answers[3]}/3
5. Tempo técnico disponível para o projeto: ${answers[4]}/3

Desafio descrito pela empresa: ${desafio || '(não informado)'}`,
    });

    const parsed = JSON.parse(response.output_text);
    const result = { score, ...parsed, source: 'ai' };
    try { await saveRow('diagnostics', { q1: answers[0], q2: answers[1], q3: answers[2], q4: answers[3], q5: answers[4], score, challenge: desafio, result: parsed, source: 'ai' }); } catch (dbErr) { console.error('Não foi possível salvar diagnóstico:', dbErr.message); }
    return res.json(result);
  } catch (err) {
    console.error('Diagnóstico IA falhou, usando fallback baseado em regra:', err.message);
    const fallback = ruleBasedFallback(score);
    try { await saveRow('diagnostics', { q1: answers[0], q2: answers[1], q3: answers[2], q4: answers[3], q5: answers[4], score, challenge: desafio, result: fallback, source: 'fallback' }); } catch (dbErr) { console.error('Não foi possível salvar diagnóstico:', dbErr.message); }
    return res.json({ score, ...fallback });
  }
});

app.post('/api/lead', async (req, res) => {
  const row = { name: text(req.body?.name, 160), role: text(req.body?.role, 160), company: text(req.body?.company, 200), email: text(req.body?.email, 240), priority: text(req.body?.priority, 80), stage: text(req.body?.stage, 100), challenge: text(req.body?.challenge, 3000), consent: req.body?.consent === true };
  if (!row.name || !row.role || !row.company || !row.email || !row.priority || !row.stage || !row.challenge || !row.consent) return res.status(400).json({ error: 'invalid_lead' });
  try { if (!await saveRow('company_leads', row)) return res.status(503).json({ error: 'storage_not_configured' }); return res.status(201).json({ ok: true }); } catch (err) { console.error(err.message); return res.status(503).json({ error: 'storage_unavailable' }); }
});

app.post('/api/newsletter', async (req, res) => {
  const email = text(req.body?.email, 240);
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'invalid_email' });
  try { if (!await saveRow('newsletter_subscribers', { email })) return res.status(503).json({ error: 'storage_not_configured' }); return res.status(201).json({ ok: true }); } catch (err) { console.error(err.message); return res.status(503).json({ error: 'storage_unavailable' }); }
});

app.post('/api/resident-interest', async (req, res) => {
  const email = text(req.body?.email, 240);
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'invalid_email' });
  try { if (!await saveRow('resident_interests', { email })) return res.status(503).json({ error: 'storage_not_configured' }); return res.status(201).json({ ok: true }); } catch (err) { console.error(err.message); return res.status(503).json({ error: 'storage_unavailable' }); }
});

app.post('/api/startup-inquiry', async (req, res) => {
  const row = { startup: text(req.body?.startup, 200), name: text(req.body?.name, 160), email: text(req.body?.email, 240), website: text(req.body?.website, 500), solution: text(req.body?.solution, 3000), challenge: text(req.body?.challenge, 3000), consent: req.body?.consent === true };
  if (!row.startup || !row.name || !row.email || !row.solution || !row.challenge || !row.consent) return res.status(400).json({ error: 'invalid_startup_inquiry' });
  try { if (!await saveRow('startup_inquiries', row)) return res.status(503).json({ error: 'storage_not_configured' }); return res.status(201).json({ ok: true }); } catch (err) { console.error(err.message); return res.status(503).json({ error: 'storage_unavailable' }); }
});

app.listen(PORT, () => {
  console.log(`Hub rodando em http://localhost:${PORT}`);
});
