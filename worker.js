import { classifyChallenge, CATEGORIES, QUESTIONS, questionsFor, scoreOpportunity, previewFor, executiveMapFor } from './opportunity-rules.js';

const fallback = (score) => score <= 5
  ? { title: 'Estágio de exploração', text: 'O melhor próximo passo é enquadrar o problema, localizar dados e escolher um indicador de valor antes de desenhar tecnologia.' }
  : score <= 10
    ? { title: 'Pronto para estruturar um piloto', text: 'Há elementos importantes disponíveis. O Hub pode ajudar a fechar lacunas, formular a hipótese de retorno e desenhar um experimento mensurável.' }
    : { title: 'Pronto para acelerar', text: 'O desafio reúne boa parte das condições de um piloto. A próxima conversa deve validar viabilidade, arquitetura, investimento e critério de escala.' };

const text = (value, max = 3000) => typeof value === 'string' ? value.trim().slice(0, max) : '';

async function insert(env, table, row) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase não configurado');
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}`, {
    method: 'POST', headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(row),
  });
  if (!response.ok) {
    const detail = (await response.text()).replace(/\s+/g, ' ').slice(0, 240);
    throw new Error(`Supabase ${response.status}: ${detail}`);
  }
}

async function upsert(env, table, row) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase não configurado');
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}`, {
    method: 'POST', headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates, return=minimal' }, body: JSON.stringify(row),
  });
  if (!response.ok) {
    const detail = (await response.text()).replace(/\s+/g, ' ').slice(0, 240);
    throw new Error(`Supabase ${response.status}: ${detail}`);
  }
}

async function selectRows(env, table, query) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase não configurado');
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}?${query}`, { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } });
  if (!response.ok) { const detail = (await response.text()).replace(/\s+/g, ' ').slice(0, 240); throw new Error(`Supabase ${response.status}: ${detail}`); }
  return response.json();
}

async function updateRow(env, table, query, row) {
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}?${query}`, { method: 'PATCH', headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(row) });
  if (!response.ok) { const detail = (await response.text()).replace(/\s+/g, ' ').slice(0, 240); throw new Error(`Supabase ${response.status}: ${detail}`); }
}

async function api(request, env) {
  const url = new URL(request.url);
  let body = {};
  if (request.method === 'POST') {
    try { body = await request.json(); } catch (error) { body = {}; }
  }
  if (url.pathname === '/api/health' && request.method === 'GET') {
    const configured = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
    let database = 'not_configured';
    if (configured) {
      try {
        const probe = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/company_leads?select=id&limit=1`, { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } });
        database = probe.ok ? 'ok' : `error_${probe.status}`;
      } catch (error) { database = 'unreachable'; }
    }
    return Response.json({ worker: 'ok', supabase: configured ? 'configured' : 'missing', database });
  }
  if (url.pathname === '/api/v2/opportunities/sessions' && request.method === 'POST') {
    const challenge = text(body.challenge, 2000);
    if (challenge.length < 30) return Response.json({ code: 'challenge_too_short', message: 'Descreva o desafio com pelo menos 30 caracteres.' }, { status: 400 });
    const sessionId = crypto.randomUUID(); const classification = classifyChallenge(challenge);
    const interpretation = { summary: `O principal desafio parece estar relacionado a ${CATEGORIES[classification.category].label.toLocaleLowerCase('pt-BR')}.`, category: classification.category, confidence: classification.confidence, status: 'inferred' };
    try {
      await insert(env, 'diagnostic_sessions', { id: sessionId, challenge, interpretation, entry_channel: body.entry_channel === 'hub_web' ? 'hub_web' : 'hub_web', locale: 'pt-BR' });
      await insert(env, 'opportunity_profiles', { session_id: sessionId, category: classification.category, profile: { category: interpretation } });
      await insert(env, 'diagnostic_events', { session_id: sessionId, event_name: 'diagnostic_started', metadata: {} });
      return Response.json({ session_id: sessionId, interpretation, confirmation_required: true }, { status: 201 });
    } catch (error) { console.error(error); return Response.json({ error: 'storage_unavailable' }, { status: 503 }); }
  }
  const confirmMatch = url.pathname.match(/^\/api\/v2\/opportunities\/sessions\/([^/]+)\/confirm$/);
  if (confirmMatch && request.method === 'POST') {
    try { await updateRow(env, 'diagnostic_sessions', `id=eq.${encodeURIComponent(confirmMatch[1])}`, { status: body.confirmed === true ? 'confirmed' : 'started' }); return Response.json({ ok: true }); }
    catch (error) { console.error(error); return Response.json({ error: 'session_unavailable' }, { status: 503 }); }
  }
  const nextMatch = url.pathname.match(/^\/api\/v2\/opportunities\/sessions\/([^/]+)\/next-question$/);
  if (nextMatch && request.method === 'GET') {
    try {
      const sessions = await selectRows(env, 'diagnostic_sessions', `select=id,challenge&id=eq.${encodeURIComponent(nextMatch[1])}`);
      if (!sessions[0]) return Response.json({ error: 'session_not_found' }, { status: 404 });
      const profiles = await selectRows(env, 'opportunity_profiles', `select=category&session_id=eq.${encodeURIComponent(nextMatch[1])}`);
      const answers = await selectRows(env, 'diagnostic_answers', `select=question_id&session_id=eq.${encodeURIComponent(nextMatch[1])}`);
      const questions = questionsFor(profiles[0]?.category || classifyChallenge(sessions[0].challenge).category, answers.map(answer => answer.question_id));
      const question = questions[0];
      if (!question) return Response.json({ done: true, progress: { answered: answers.length, estimated_remaining: 0 } });
      return Response.json({ question: { ...question, answer_type: question.type }, progress: { answered: answers.length, estimated_remaining: Math.max(0, questions.length - 1) } });
    } catch (error) { console.error(error); return Response.json({ error: 'session_unavailable' }, { status: 503 }); }
  }
  const answerMatch = url.pathname.match(/^\/api\/v2\/opportunities\/sessions\/([^/]+)\/answers$/);
  if (answerMatch && request.method === 'POST') {
    const questionId = text(body.question_id, 120); if (!questionId || body.answer === undefined) return Response.json({ error: 'invalid_answer' }, { status: 400 });
    try { await upsert(env, 'diagnostic_answers', { session_id: answerMatch[1], question_id: questionId, answer: body.answer }); return Response.json({ ok: true }); }
    catch (error) { console.error(error); return Response.json({ error: 'answer_unavailable' }, { status: 503 }); }
  }
  const previewMatch = url.pathname.match(/^\/api\/v2\/opportunities\/sessions\/([^/]+)\/preview$/);
  if (previewMatch && request.method === 'GET') {
    try {
      const profiles = await selectRows(env, 'opportunity_profiles', `select=category&session_id=eq.${encodeURIComponent(previewMatch[1])}`);
      const answersRows = await selectRows(env, 'diagnostic_answers', `select=question_id,answer&session_id=eq.${encodeURIComponent(previewMatch[1])}`);
      const answers = Object.fromEntries(answersRows.map(row => [row.question_id, row.answer])); const category = profiles[0]?.category || 'other'; const scorecard = scoreOpportunity(category, answers);
      await upsert(env, 'scorecards', { session_id: previewMatch[1], rubric_version: scorecard.rubric_version, dimensions: scorecard.dimensions, confidence: scorecard.confidence, route: scorecard.route });
      return Response.json({ scorecard, preview: previewFor(category, scorecard) });
    } catch (error) { console.error(error); return Response.json({ error: 'preview_unavailable' }, { status: 503 }); }
  }
  const identityMatch = url.pathname.match(/^\/api\/v2\/opportunities\/sessions\/([^/]+)\/identity$/);
  if (identityMatch && request.method === 'POST') {
    const identity = { session_id: identityMatch[1], name: text(body.name, 160), email: text(body.email, 240), company: text(body.company, 200), role: text(body.role, 160), consent: body.consent === true, consent_text_version: 'lead-contact-1.0' };
    if (!identity.name || !identity.email || !identity.company || !identity.role || !identity.consent) return Response.json({ code: 'identity_required', message: 'Preencha os dados e autorize o contato.' }, { status: 400 });
    try { await upsert(env, 'lead_identities', identity); await updateRow(env, 'diagnostic_sessions', `id=eq.${encodeURIComponent(identityMatch[1])}`, { status: 'contacted' }); await insert(env, 'diagnostic_events', { session_id: identityMatch[1], event_name: 'identity_completed', metadata: {} }); return Response.json({ ok: true }); }
    catch (error) { console.error(error); return Response.json({ error: 'identity_unavailable' }, { status: 503 }); }
  }
  const completeMatch = url.pathname.match(/^\/api\/v2\/opportunities\/sessions\/([^/]+)\/complete$/);
  if (completeMatch && request.method === 'POST') {
    try {
      const cards = await selectRows(env, 'scorecards', `select=dimensions,confidence,route,rubric_version&session_id=eq.${encodeURIComponent(completeMatch[1])}`);
      const profiles = await selectRows(env, 'opportunity_profiles', `select=category&session_id=eq.${encodeURIComponent(completeMatch[1])}`);
      const sessions = await selectRows(env, 'diagnostic_sessions', `select=challenge,interpretation&id=eq.${encodeURIComponent(completeMatch[1])}`);
      const answersRows = await selectRows(env, 'diagnostic_answers', `select=question_id,answer&session_id=eq.${encodeURIComponent(completeMatch[1])}`);
      const scorecard = cards[0]; const category = profiles[0]?.category || 'other';
      const answers = Object.fromEntries(answersRows.map(row => [row.question_id, row.answer]));
      const executiveMap = scorecard ? executiveMapFor(category, sessions[0]?.challenge || '', answers, scorecard) : null;
      if (sessions[0] && executiveMap) await updateRow(env, 'diagnostic_sessions', `id=eq.${encodeURIComponent(completeMatch[1])}`, { interpretation: { ...(sessions[0].interpretation || {}), executive_map: executiveMap } });
      await updateRow(env, 'diagnostic_sessions', `id=eq.${encodeURIComponent(completeMatch[1])}`, { status: 'completed' });
      return Response.json({ scorecard, executive_map: executiveMap, preview: scorecard ? previewFor(category, scorecard) : null, route: scorecard?.route || null, next_action: { type: 'request_conversation', label: executiveMap?.next_step || 'Conversar com especialista do Hub' } });
    } catch (error) { console.error(error); return Response.json({ error: 'completion_unavailable' }, { status: 503 }); }
  }
  if (url.pathname === '/api/diagnostico') {
    const values = ['q1', 'q2', 'q3', 'q4', 'q5'].map(key => Number(body[key]));
    if (values.some(value => !Number.isInteger(value) || value < 0 || value > 3)) return Response.json({ error: 'invalid_answers' }, { status: 400 });
    const score = values.reduce((sum, value) => sum + value, 0); const result = { score, ...fallback(score), source: 'fallback' };
    try { await insert(env, 'diagnostics', { q1: values[0], q2: values[1], q3: values[2], q4: values[3], q5: values[4], score, challenge: text(body.desafio, 1000), result: result, source: 'fallback' }); } catch (error) { console.error(error); }
    return Response.json(result);
  }
  const routes = {
    '/api/newsletter': ['newsletter_subscribers', { email: text(body.email, 240) }],
    '/api/resident-interest': ['resident_interests', { email: text(body.email, 240) }],
    '/api/lead': ['company_leads', { name: text(body.name, 160), role: text(body.role, 160), company: text(body.company, 200), email: text(body.email, 240), priority: text(body.priority, 80), stage: text(body.stage, 100), challenge: text(body.challenge), consent: body.consent === true }],
    '/api/startup-inquiry': ['startup_inquiries', { startup: text(body.startup, 200), name: text(body.name, 160), email: text(body.email, 240), website: text(body.website, 500), solution: text(body.solution), challenge: text(body.challenge), consent: body.consent === true }],
  };
  const route = routes[url.pathname];
  if (!route || request.method !== 'POST') return Response.json({ error: 'not_found' }, { status: 404 });
  try { await insert(env, route[0], route[1]); return Response.json({ ok: true }, { status: 201 }); } catch (error) { console.error(error); return Response.json({ error: 'storage_unavailable', detail: error.message }, { status: 503 }); }
}

export default { async fetch(request, env) { if (new URL(request.url).pathname.startsWith('/api/')) return api(request, env); return env.ASSETS.fetch(request); } };
