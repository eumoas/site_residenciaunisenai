export const RUBRIC_VERSION = '1.0.0';

export const CATEGORIES = {
  productivity: { label: 'Produtividade e capacidade', keywords: ['produtividade', 'capacidade', 'produção', 'gargalo', 'tempo de ciclo'] },
  maintenance: { label: 'Manutenção e disponibilidade', keywords: ['manutenção', 'parada', 'quebra', 'falha', 'ativo', 'equipamento'] },
  quality: { label: 'Qualidade e inspeção', keywords: ['qualidade', 'defeito', 'refugo', 'inspeção', 'não conformidade'] },
  safety: { label: 'Segurança e conformidade', keywords: ['segurança', 'acidente', 'risco', 'conformidade', 'nr-'] },
  energy: { label: 'Energia e sustentabilidade', keywords: ['energia', 'consumo', 'emissão', 'sustentabilidade', 'eficiência energética'] },
  planning: { label: 'Planejamento e otimização', keywords: ['planejamento', 'logística', 'estoque', 'programação', 'rota'] },
  knowledge: { label: 'Conhecimento e copilotos', keywords: ['conhecimento', 'documento', 'copiloto', 'assistente', 'manual'] },
  data: { label: 'Dados, integração e governança', keywords: ['dados', 'integração', 'sistema', 'governança', 'dashboard'] },
  other: { label: 'Outra oportunidade', keywords: [] },
};

export const QUESTIONS = [
  { id: 'core.process', dimension: 'value', text: 'Em qual processo ou ativo o desafio acontece?', type: 'text', required: true },
  { id: 'core.impact', dimension: 'value', text: 'Qual consequência mais importante esse problema provoca?', type: 'choice', options: [['low','Incômodo ou retrabalho pontual',1],['medium','Perda recorrente de tempo ou qualidade',2],['high','Paradas, perdas relevantes ou risco operacional',3],['critical','Impacto crítico em segurança ou continuidade',4]] },
  { id: 'core.indicator', dimension: 'value', text: 'Existe um indicador ou referência para medir o problema?', type: 'choice', options: [['none','Ainda não',0],['partial','Temos uma referência aproximada',1],['defined','Temos indicador definido',2],['target','Temos indicador e meta',3]] },
  { id: 'core.data', dimension: 'viability', text: 'Que evidências ou dados já existem?', type: 'choice', options: [['unknown','Ainda não sabemos',0],['manual','Registros manuais ou dispersos',1],['partial','Dados parciais e acessíveis',2],['structured','Dados estruturados e acessíveis',3]] },
  { id: 'core.sponsor', dimension: 'readiness', text: 'Existe alguém na operação para acompanhar a descoberta?', type: 'choice', options: [['none','Ainda não',0],['sponsor','Há uma pessoa interessada',1],['owner','Há um responsável e apoio da liderança',2],['team','Há equipe e tempo reservados',3]] },
  { id: 'core.urgency', dimension: 'urgency', text: 'Qual é a janela para tomar uma decisão?', type: 'choice', options: [['open','Sem prazo definido',0],['year','Próximos 6–12 meses',1],['quarter','Próximos 3 meses',2],['now','Nas próximas semanas',3]] },
  { id: 'maintenance.scale', category: 'maintenance', dimension: 'value', text: 'Com que frequência o ativo apresenta parada ou falha?', type: 'choice', options: [['rare','Eventualmente',1],['monthly','Mensalmente',2],['weekly','Semanalmente',3],['daily','Diariamente ou quase',4]] },
  { id: 'quality.scale', category: 'quality', dimension: 'value', text: 'Como o problema de qualidade é identificado hoje?', type: 'choice', options: [['late','Somente depois que chega ao fim do processo',1],['sample','Por amostragem',2],['inline','Durante o processo, com registro',3],['realtime','Em tempo real, com histórico',4]] },
  { id: 'energy.scale', category: 'energy', dimension: 'value', text: 'O consumo energético é medido por processo ou ativo?', type: 'choice', options: [['none','Não',0],['site','Somente no total da unidade',1],['area','Por área ou linha',2],['asset','Por ativo ou processo',3]] },
];

export function classifyChallenge(challenge) {
  const normalized = challenge.toLocaleLowerCase('pt-BR');
  let best = 'other'; let bestHits = 0;
  for (const [category, definition] of Object.entries(CATEGORIES)) {
    const hits = definition.keywords.filter(keyword => normalized.includes(keyword)).length;
    if (hits > bestHits) { best = category; bestHits = hits; }
  }
  return { category: best, confidence: Math.min(0.55 + bestHits * 0.12, 0.91) };
}

export function questionsFor(category, answered = []) {
  const done = new Set(answered);
  return QUESTIONS.filter(question => (!question.category || question.category === category) && !done.has(question.id)).slice(0, 7);
}

function valueOf(answer) { return typeof answer === 'number' ? answer : Number(answer?.value ?? 0); }

export function scoreOpportunity(category, answers = {}) {
  const v = id => valueOf(answers[id]);
  const dimensions = {
    value_potential: Math.min(100, 20 + v('core.impact') * 15 + v('core.indicator') * 8 + v(`${category}.scale`) * 7),
    technical_feasibility: Math.min(100, 25 + v('core.data') * 18),
    organizational_readiness: Math.min(100, 25 + v('core.sponsor') * 20),
    evidence_velocity: Math.min(100, 25 + v('core.indicator') * 15 + v('core.data') * 10),
    hub_fit: category === 'other' ? 45 : 80,
    urgency: Math.min(100, 20 + v('core.urgency') * 25),
  };
  const confidence = Math.min(100, 30 + Object.keys(answers).length * 10 + (category === 'other' ? 0 : 15));
  let route = 'SPRINT_DESCOBERTA';
  if (dimensions.hub_fit < 40) route = 'ENCAMINHAMENTO_OU_NUTRICAO';
  else if (dimensions.value_potential >= 65 && confidence < 50) route = 'REVISAO_ESPECIALIZADA';
  else if (dimensions.value_potential >= 55 && dimensions.technical_feasibility < 45) route = 'AVALIACAO_DADOS';
  else if (dimensions.hub_fit >= 70 && dimensions.value_potential >= 65 && dimensions.technical_feasibility >= 60) route = 'CONVERSA_ESPECIALISTA';
  else if (dimensions.value_potential >= 55) route = 'ESTRUTURAR_PILOTO';
  return { dimensions, confidence, route, rubric_version: RUBRIC_VERSION };
}

export function previewFor(category, scorecard) {
  const strengths = Object.entries(scorecard.dimensions).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([key]) => key);
  const gaps = Object.entries(scorecard.dimensions).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([key]) => key);
  return { category, category_label: CATEGORIES[category]?.label || CATEGORIES.other.label, strengths, gaps, route: scorecard.route, confidence: scorecard.confidence };
}
