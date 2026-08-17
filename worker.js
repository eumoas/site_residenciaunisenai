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
  if (!response.ok) throw new Error(`Supabase ${response.status}`);
}

async function api(request, env) {
  const url = new URL(request.url);
  const body = request.method === 'POST' ? await request.json() : {};
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
  try { await insert(env, route[0], route[1]); return Response.json({ ok: true }, { status: 201 }); } catch (error) { console.error(error); return Response.json({ error: 'storage_unavailable' }, { status: 503 }); }
}

export default { async fetch(request, env) { if (new URL(request.url).pathname.startsWith('/api/')) return api(request, env); return env.ASSETS.fetch(request); } };
