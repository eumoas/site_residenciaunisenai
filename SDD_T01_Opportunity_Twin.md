# SDD — T-01 Opportunity Twin

**Sistema:** Hub de Inovação Industrial — Residência Inteligência Artificial / UniSENAI SC  
**Componente:** Evolução da ferramenta T-01 — Diagnóstico de Prontidão  
**Versão:** 1.0  
**Status:** Proposta para implementação  
**Data:** 17 de agosto de 2026  
**Documento para:** produto, engenharia, dados, IA, UX, comercial e especialistas do Hub

---

## 1. Resumo executivo

A T-01 atual utiliza cinco perguntas com respostas discretas, soma uma pontuação de 0 a 15 e gera uma recomendação textual. Essa solução mede parcialmente a prontidão para executar um piloto, mas não identifica com profundidade se o desafio representa uma oportunidade relevante de negócio para a empresa e para o Hub.

Este SDD especifica a evolução da T-01 para o **Opportunity Twin**, um diagnóstico industrial conversacional, adaptativo e auditável. A solução deverá compreender o desafio relatado, selecionar perguntas de aprofundamento, estimar separadamente valor, viabilidade, prontidão, velocidade de evidência e aderência ao Hub, gerar um mapa executivo e encaminhar a oportunidade para a rota comercial adequada.

O **Gemini, já disponível na solução**, será usado para compreensão, extração e comunicação. Pontuação, elegibilidade, faixas de resultado e roteamento comercial deverão permanecer determinísticos e versionados.

### Resultado esperado

Ao concluir a experiência, a empresa deverá entender:

1. Qual oportunidade industrial foi identificada.
2. Qual indicador deveria demonstrar valor.
3. Quais evidências e dados já existem.
4. Quais lacunas impedem um piloto.
5. Qual experimento inicial é recomendado.
6. Qual é o próximo passo com o Hub.

O Hub deverá receber um registro estruturado, qualificado e acionável — não apenas um texto livre ou uma nota única.

---

## 2. Contexto atual

### 2.1 Funcionamento observado da T-01

A implementação atual:

- apresenta cinco perguntas;
- atribui valores de 0 a 3 por pergunta;
- calcula um total entre 0 e 15;
- envia respostas e descrição opcional para `/api/diagnostico`;
- utiliza uma resposta local genérica se a API falhar;
- preenche o campo de desafio do formulário comercial com um resumo do resultado;
- coleta os dados de contato somente no formulário posterior.

### 2.2 Limitações

- Pesos equivalentes para dimensões com impactos diferentes.
- Ausência de setor, processo, ativo, escala operacional e tipo de perda.
- Ausência de estimativa de impacto econômico ou operacional.
- Descrição do desafio opcional.
- Falta de perguntas específicas por categoria de oportunidade.
- Não mede urgência, janela de decisão, patrocínio, orçamento ou governança.
- Não avalia integração IT/OT, segurança, privacidade ou acessibilidade dos dados.
- Não compara oportunidades diferentes da mesma empresa.
- Resultado sem nível de confiança ou indicação clara de hipóteses.
- Personalização textual limitada pela baixa quantidade de contexto.
- Ausência de lead scoring e roteamento explícito.

---

## 3. Objetivos

### 3.1 Objetivos de produto

- Transformar a T-01 em uma experiência de descoberta de valor.
- Entregar utilidade antes de solicitar todos os dados de contato.
- Reduzir a fricção de entrada para empresas ainda exploratórias.
- Aumentar a proporção de leads com problema, indicador e próximo passo definidos.
- Permitir que especialistas iniciem a conversa com contexto estruturado.
- Encaminhar leads para reunião, sprint de descoberta, avaliação de dados ou nutrição.

### 3.2 Objetivos técnicos

- Implementar perguntas adaptativas e versionadas.
- Separar interpretação por IA de decisões determinísticas.
- Manter rastreabilidade das entradas, extrações, scores e regras aplicadas.
- Permitir evolução independente do modelo, prompt, rubrica e catálogo de casos.
- Operar com fallback seguro quando o Gemini estiver indisponível, exceder o tempo limite ou retornar uma saída inválida.
- Integrar o resultado com o formulário existente e, futuramente, com CRM.

### 3.3 Não objetivos da primeira versão

- Emitir laudo técnico definitivo.
- Prometer ROI, economia ou prazo sem evidência suficiente.
- Substituir a avaliação de especialistas.
- Realizar orçamento ou proposta comercial automaticamente.
- Aprovar ou recusar empresas exclusivamente por decisão de IA.
- Processar dados industriais sensíveis ou sigilosos sem fluxo específico de consentimento.
- Produzir diagnóstico causal do processo industrial.

---

## 4. Princípios de projeto

1. **Valor antes do cadastro:** entregar uma leitura inicial antes de pedir identificação completa.
2. **Perguntar apenas o necessário:** cada pergunta deve reduzir uma incerteza relevante.
3. **IA interpreta; regras decidem:** o LLM não calcula scores finais nem define sozinho o roteamento.
4. **Sem falsa precisão:** estimativas devem usar faixas, premissas e confiança.
5. **Evidência acima de fluência:** respostas elegantes não compensam dados insuficientes.
6. **Humano no circuito:** especialistas validam oportunidades de alto impacto ou alto risco.
7. **Progressive profiling:** coletar dados pessoais e comerciais de forma gradual.
8. **Auditabilidade:** toda conclusão deve apontar entradas e regras que a sustentam.
9. **Privacidade por padrão:** minimizar coleta e separar conteúdo industrial de dados pessoais.
10. **Mobile first e acessível:** a jornada deve funcionar por teclado, leitor de tela e telas pequenas.

### 4.1 Premissa tecnológica confirmada

- A solução já possui integração com uma LLM Gemini.
- Toda a página já utiliza Supabase para captação e persistência de dados.
- O Opportunity Twin deverá reutilizar essa integração, suas credenciais e o padrão de implantação existente sempre que forem compatíveis com os requisitos deste SDD.
- O Supabase será o sistema de registro da jornada, preservando a integração atual e evoluindo seu esquema por migrações controladas.
- O modelo e a versão exatos do Gemini deverão ser configuráveis por ambiente e registrados em cada execução.
- A existência do Gemini não transfere a ele decisões de scoring, elegibilidade ou roteamento.
- A camada de acesso continuará encapsulada para permitir testes, fallback e futura migração sem reescrever o domínio.

---

## 5. Personas e jornadas

### 5.1 Personas principais

#### Executivo industrial

Busca impacto, prioridade, retorno e clareza sobre o próximo investimento.

#### Gestor de operação, manutenção ou qualidade

Conhece o problema, mas pode não dominar a arquitetura de IA ou os requisitos de dados.

#### Especialista de dados, automação ou TI

Consegue detalhar fontes, integrações, infraestrutura e limitações técnicas.

#### Especialista do Hub

Precisa decidir rapidamente se deve aprofundar, solicitar informações ou encaminhar a oportunidade.

### 5.2 Jornada principal

1. Visitante seleciona **Mapear uma oportunidade**.
2. Descreve o desafio por texto; áudio e anexos ficam para fase posterior.
3. Sistema extrai uma hipótese estruturada e pede confirmação.
4. Motor escolhe de três a sete perguntas adaptativas.
5. Sistema apresenta leitura preliminar sem exigir contato.
6. Visitante informa e-mail corporativo para receber o mapa completo e permitir contato.
7. Sistema gera o mapa executivo, lead score e rota sugerida.
8. Oportunidade é encaminhada ao responsável apropriado.
9. Especialista revisa, corrige e registra o desfecho.

### 5.3 Estados de saída

- **Acelerar:** oportunidade relevante, evidências mínimas presentes e boa aderência.
- **Estruturar piloto:** oportunidade promissora com lacunas solucionáveis.
- **Descobrir valor:** problema existente, mas impacto ou indicador insuficientemente definidos.
- **Preparar dados:** valor plausível, porém dados inacessíveis ou inadequados.
- **Nutrir:** baixa urgência ou baixa maturidade atual.
- **Encaminhar:** necessidade válida, mas fora da aderência do Hub.
- **Revisão especializada:** alto impacto potencial com baixa confiança ou risco elevado.

---

## 6. Escopo funcional

### 6.1 RF-01 — Entrada do desafio

O sistema deve exigir uma descrição inicial mínima de 30 caracteres e orientar o usuário a informar:

- processo ou ativo envolvido;
- comportamento ou perda observada;
- frequência ou escala;
- consequência operacional;
- objetivo desejado.

O sistema não deve exigir termos técnicos de IA.

### 6.2 RF-02 — Extração estruturada

O sistema deve extrair, quando presentes:

- setor industrial;
- unidade, área ou processo;
- ativo ou etapa produtiva;
- categoria da oportunidade;
- problema observado;
- consequência;
- indicador atual;
- valor de referência;
- meta;
- frequência e escala;
- dados citados;
- restrições;
- urgência;
- pessoas ou áreas envolvidas.

Cada campo extraído deve conter `value`, `source`, `confidence` e `status`.

### 6.3 RF-03 — Confirmação da interpretação

Antes de aprofundar, o sistema deve apresentar uma frase curta:

> Entendi que o principal desafio é [problema] em [processo], causando [consequência]. Está correto?

O usuário poderá confirmar, editar ou declarar que a interpretação está incorreta.

### 6.4 RF-04 — Classificação da oportunidade

Categorias iniciais:

- produtividade e capacidade;
- manutenção e disponibilidade;
- qualidade e inspeção;
- segurança e conformidade;
- energia e sustentabilidade;
- planejamento e otimização;
- conhecimento e copilotos;
- dados, integração e governança;
- outra / ainda não classificada.

### 6.5 RF-05 — Perguntas adaptativas

O motor deverá selecionar perguntas com base em:

- categoria inferida;
- campos ausentes;
- confiança da extração;
- respostas anteriores;
- informação necessária para score;
- riscos de segurança ou privacidade;
- orçamento máximo de perguntas.

Regras:

- mínimo de três e máximo de sete perguntas adaptativas na experiência padrão;
- no máximo uma pergunta por tela;
- permitir “não sei” quando aplicável;
- não repetir informação já fornecida;
- explicar por que uma pergunta sensível ou complexa é necessária;
- encerrar antecipadamente quando o ganho de informação for baixo.

### 6.6 RF-06 — Banco de perguntas

Cada pergunta deve possuir:

```yaml
id: maintenance.downtime_cost.v1
category: maintenance
dimension: value_potential
text: Qual é o impacto aproximado de uma hora de parada deste ativo?
answer_type: money_range
required: false
options: []
eligibility_rule: "category == 'maintenance' && downtime_cost is null"
score_rule_id: value.downtime_cost.v1
sensitivity: commercial
version: 1
```

O conteúdo deverá ser gerenciado por configuração versionada, não embutido diretamente na interface.

### 6.7 RF-07 — Estimativa de valor

Quando houver dados suficientes, o sistema deverá estimar uma faixa de oportunidade. Exemplos:

- custo de parada × horas evitáveis;
- volume × taxa de refugo × custo unitário;
- tempo de inspeção × volume × custo-hora;
- consumo energético × redução plausível configurada;
- tempo de planejamento × recorrência × custo-hora.

Toda estimativa deve registrar:

- fórmula utilizada;
- entradas fornecidas pelo usuário;
- premissas do sistema;
- unidade;
- intervalo mínimo e máximo;
- confiança;
- aviso de que se trata de hipótese para validação.

Se não houver dados suficientes, o resultado deve indicar “impacto ainda não estimável” e a informação faltante.

### 6.8 RF-08 — Scoring multidimensional

O sistema deve calcular seis dimensões independentes, de 0 a 100:

| Dimensão | Peso comercial inicial | Definição |
|---|---:|---|
| Potencial de valor | 30% | Relevância econômica, operacional ou de segurança |
| Viabilidade técnica | 20% | Dados, integração, observabilidade e complexidade |
| Prontidão organizacional | 15% | Patrocínio, ponto focal e disponibilidade |
| Velocidade para evidência | 10% | Facilidade de produzir aprendizado mensurável |
| Aderência ao Hub | 20% | Compatibilidade com competências e modelo de atuação |
| Urgência | 5% | Janela de decisão e prioridade declarada |

O **nível de confiança** será exibido separadamente e não fará parte da média.

#### Regras críticas

- Segurança crítica pode elevar prioridade, mas não deve ser convertida artificialmente em valor financeiro.
- Ausência de dados não zera potencial de valor; reduz viabilidade e confiança.
- Ausência de patrocinador não invalida tecnicamente a oportunidade; reduz prontidão.
- Scores devem ser calculados exclusivamente por regras versionadas.
- Alterações de pesos devem criar nova versão de rubrica.

### 6.9 RF-09 — Resultado preliminar

Antes da captura de contato, mostrar:

- oportunidade identificada;
- categoria;
- duas forças;
- duas lacunas;
- rota recomendada em linguagem simples;
- convite para receber o mapa completo.

Não exibir score numérico isolado sem interpretação.

### 6.10 RF-10 — Captura progressiva

Para liberar o mapa completo, solicitar:

- nome;
- e-mail corporativo;
- empresa;
- cargo ou área;
- consentimento de contato.

Campos adicionais podem ser solicitados posteriormente e não devem bloquear o resultado inicial.

### 6.11 RF-11 — Mapa executivo

O mapa completo deve conter:

1. Resumo do desafio.
2. Oportunidade prioritária.
3. Indicador sugerido.
4. Potencial de valor ou informação necessária para estimá-lo.
5. Scores por dimensão.
6. Nível de confiança.
7. Evidências fornecidas.
8. Hipóteses e lacunas.
9. Dados necessários.
10. Possível abordagem tecnológica.
11. Experimento recomendado.
12. Critério inicial de sucesso.
13. Riscos e cuidados.
14. Próximo passo com o Hub.

### 6.12 RF-12 — Roteamento

O motor deverá aplicar regras configuráveis:

```text
SE aderência >= 70 E valor >= 65 E viabilidade >= 60
ENTÃO rota = CONVERSA_ESPECIALISTA

SE valor >= 65 E confiança < 50
ENTÃO rota = REVISAO_ESPECIALIZADA

SE valor >= 55 E viabilidade < 45
ENTÃO rota = AVALIACAO_DADOS

SE valor não estimável E clareza_problema < 50
ENTÃO rota = SPRINT_DESCOBERTA

SE aderência < 40
ENTÃO rota = ENCAMINHAMENTO_OU_NUTRICAO
```

As regras finais deverão ser validadas pelo Hub durante calibração.

### 6.13 RF-13 — Área de revisão interna

Especialistas autorizados deverão visualizar:

- dados de contato;
- transcript da jornada;
- extrações e fontes;
- scores e versão da rubrica;
- relatório gerado;
- alertas de risco;
- rota sugerida;
- ações: confirmar, corrigir, atribuir, solicitar informação e registrar desfecho.

### 6.14 RF-14 — Feedback para aprendizado

Registrar feedback estruturado do especialista:

- classificação correta/incorreta;
- score adequado/superestimado/subestimado;
- oportunidade qualificada/não qualificada;
- reunião realizada;
- sprint iniciado;
- piloto iniciado;
- motivo de perda;
- observação livre.

Esse feedback poderá apoiar calibração futura, mas não deverá atualizar regras automaticamente em produção.

---

## 7. Arquitetura proposta

```text
[Web UI / Wizard conversacional]
            |
            v
[Opportunity API / Cloudflare Worker]
     |          |            |
     v          v            v
[Orquestrador] [Rules Engine] [Consent & Identity]
     |          |            |
     v          v            v
[Gemini Gateway] [Score Config] [Supabase Data Layer]
     |
     v
[Knowledge Retrieval: casos, tecnologias, especialistas]
            |
            v
[Report Builder + Routing + Analytics]
```

### 7.1 Componentes

#### Web UI

- Jornada de uma pergunta por tela.
- Persistência local temporária.
- Barra de progresso não linear (“faltam cerca de 3 perguntas”).
- Confirmação de interpretações.
- Resultado preliminar e captura progressiva.

#### Opportunity API

- Cria e atualiza sessões.
- Valida payloads.
- Remove conteúdo não permitido.
- Orquestra extração, perguntas, scoring, relatório e roteamento.

#### Gemini Gateway

- Adaptador sobre a integração Gemini já existente.
- Configuração explícita de modelo por ambiente, sem hardcode na interface.
- Prompts versionados.
- Saída obrigatoriamente estruturada por JSON Schema.
- Timeout, retry limitado e circuit breaker.
- Registro de modelo Gemini, versão, parâmetros, latência, tokens e versão do prompt, sem armazenar raciocínio oculto.
- Interface interna desacoplada do SDK do Gemini para facilitar testes e evolução.

#### Rules Engine

- Determina elegibilidade das perguntas.
- Calcula scores e faixas de valor.
- Aplica gates e regras de roteamento.
- Mantém versão de rubrica e catálogo de regras.

#### Knowledge Retrieval

- Recupera somente casos, competências, tecnologias e especialistas aprovados.
- Não deve inventar cases semelhantes.
- Cada recomendação deve manter o ID da fonte interna utilizada.

#### Supabase Data Layer

- Reutiliza o Supabase já empregado pela página para captação de dados.
- É o sistema de registro de sessões, respostas, oportunidades, identidades consentidas, scorecards, rotas e feedback dos especialistas.
- Deve separar logicamente dados pessoais, conteúdo industrial e eventos analíticos.
- Toda alteração de esquema deve ser entregue por migração versionada e reversível.
- A aplicação cliente não deve receber `service_role_key` nem executar operações administrativas.
- Escritas públicas devem passar pela API existente ou por uma função segura com validação, rate limiting e políticas de acesso.
- Row Level Security deve ser habilitada e testada nas tabelas expostas pelas APIs do Supabase.
- A implementação deve primeiro mapear as tabelas e funções atuais para evitar duplicação e quebra da captação já existente.

#### Integração comercial

- Fase 1: registrar a oportunidade qualificada no Supabase e acionar o fluxo interno já utilizado pela página, quando existente.
- Fase 2: CRM via adaptador, evitando dependência direta no domínio central.

---

## 8. Modelo de dados

O modelo abaixo deverá ser implementado no Supabase. Antes de criar tabelas, o Codex deverá inspecionar o esquema atual e produzir um mapeamento entre estruturas existentes e estruturas propostas. Tabelas atuais compatíveis devem ser evoluídas; não devem ser duplicadas apenas para reproduzir os nomes deste SDD.

### 8.0 Estratégia de esquema Supabase

- Preservar os registros e endpoints de captação atuais.
- Preferir chaves UUID geradas no banco.
- Utilizar `timestamptz` para datas e horários.
- Utilizar constraints e enums controlados para estados críticos.
- Armazenar respostas flexíveis em `jsonb`, mantendo campos pesquisáveis em colunas quando necessários para operação e analytics.
- Criar índices conforme as consultas reais, especialmente para sessão, categoria, rota, status e datas.
- Manter versão da rubrica, prompt, modelo Gemini e consentimento em cada registro aplicável.
- Evitar armazenar transcript ou prompt completo em logs operacionais.
- Usar migrações SQL versionadas e incluir procedimento de rollback.
- Respeitar schemas e convenções já existentes na instalação.

### 8.1 Entidades principais

#### `diagnostic_session`

```json
{
  "id": "uuid",
  "status": "started|qualified|contacted|completed|expired",
  "locale": "pt-BR",
  "entry_channel": "hub_web",
  "rubric_version": "1.0.0",
  "prompt_version": "gemini-extract-1.0.0",
  "model_provider": "google",
  "model_name": "configured-by-environment",
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601",
  "expires_at": "ISO-8601"
}
```

#### `opportunity_profile`

```json
{
  "session_id": "uuid",
  "category": "maintenance",
  "sector": {"value": "têxtil", "confidence": 0.81, "source": "initial_challenge"},
  "process": {"value": "acabamento", "confidence": 0.92, "source": "initial_challenge"},
  "problem": {"value": "paradas não planejadas", "confidence": 0.94, "source": "initial_challenge"},
  "impact": {"value": "perda de produção", "confidence": 0.79, "source": "answer-3"},
  "evidence": [],
  "assumptions": [],
  "missing_information": []
}
```

#### `diagnostic_answer`

```json
{
  "id": "uuid",
  "session_id": "uuid",
  "question_id": "maintenance.downtime_hours.v1",
  "answer": {"range_min": 8, "range_max": 16, "unit": "hours/month"},
  "answered_at": "ISO-8601"
}
```

#### `scorecard`

```json
{
  "session_id": "uuid",
  "rubric_version": "1.0.0",
  "dimensions": {
    "value_potential": {"score": 72, "evidence_ids": ["answer-2"], "rule_ids": ["value.downtime.v1"]},
    "technical_feasibility": {"score": 48, "evidence_ids": ["answer-4"], "rule_ids": ["data.timeseries.v1"]},
    "organizational_readiness": {"score": 65},
    "evidence_velocity": {"score": 58},
    "hub_fit": {"score": 80},
    "urgency": {"score": 60}
  },
  "confidence": 54,
  "route": "AVALIACAO_DADOS"
}
```

#### `lead_identity`

Armazenar separadamente:

- nome;
- e-mail;
- empresa;
- cargo;
- consentimento;
- timestamp e versão do texto de consentimento.

### 8.2 Relações propostas

```text
diagnostic_session 1 ── 1 opportunity_profile
diagnostic_session 1 ── N diagnostic_answer
diagnostic_session 1 ── N diagnostic_event
diagnostic_session 1 ── 1 scorecard
diagnostic_session 1 ── 0..1 lead_identity
diagnostic_session 1 ── N specialist_review
```

`lead_identity` deve permanecer separado do conteúdo do diagnóstico, com acesso mais restrito. A associação ocorrerá por `session_id` ou identificador interno equivalente, nunca pelo e-mail como chave primária.

---

## 9. Contratos de API

Os contratos públicos abaixo permanecem sob `/api/v2`. A interface web não deve escrever diretamente em tabelas sensíveis. A API deverá validar o payload, aplicar regras de negócio e persistir no Supabase. Caso a arquitetura atual utilize Supabase Edge Functions em vez de Cloudflare Worker para determinada operação, o contrato HTTP e as regras de domínio deverão permanecer equivalentes.

### 9.1 Criar sessão

`POST /api/v2/opportunities/sessions`

```json
{
  "challenge": "Temos paradas frequentes...",
  "locale": "pt-BR",
  "entry_channel": "hub_web"
}
```

Resposta `201`:

```json
{
  "session_id": "uuid",
  "interpretation": {
    "summary": "O principal desafio parece ser...",
    "category": "maintenance",
    "confidence": 0.82
  },
  "confirmation_required": true
}
```

### 9.2 Confirmar interpretação

`POST /api/v2/opportunities/sessions/{id}/confirm`

```json
{
  "confirmed": true,
  "corrected_summary": null
}
```

### 9.3 Obter próxima pergunta

`GET /api/v2/opportunities/sessions/{id}/next-question`

Resposta:

```json
{
  "question": {
    "id": "maintenance.downtime_hours.v1",
    "text": "Quantas horas de parada não planejada ocorrem em um mês típico?",
    "answer_type": "numeric_range",
    "unit": "hours/month",
    "allow_unknown": true
  },
  "progress": {"answered": 2, "estimated_remaining": 3}
}
```

### 9.4 Enviar resposta

`POST /api/v2/opportunities/sessions/{id}/answers`

```json
{
  "question_id": "maintenance.downtime_hours.v1",
  "answer": {"range_min": 8, "range_max": 16}
}
```

### 9.5 Obter leitura preliminar

`GET /api/v2/opportunities/sessions/{id}/preview`

Não deve retornar dados pessoais nem relatório completo.

### 9.6 Registrar contato e consentimento

`POST /api/v2/opportunities/sessions/{id}/identity`

```json
{
  "name": "Nome",
  "email": "nome@empresa.com.br",
  "company": "Empresa",
  "role": "Gerente de Manutenção",
  "consent": true,
  "consent_text_version": "lead-contact-1.0"
}
```

### 9.7 Gerar resultado completo

`POST /api/v2/opportunities/sessions/{id}/complete`

Resposta:

```json
{
  "scorecard": {},
  "executive_map": {},
  "route": "AVALIACAO_DADOS",
  "next_action": {
    "type": "request_conversation",
    "label": "Conversar com especialista em dados industriais"
  }
}
```

### 9.8 Idempotência e erros

- Endpoints de escrita devem aceitar `Idempotency-Key`.
- Erros devem usar `{code, message, retryable, correlation_id}`.
- Não retornar stack traces ao cliente.
- `complete` deve ser idempotente para a mesma versão de respostas e rubrica.

---

## 10. Uso de IA

### 10.1 Tarefas permitidas ao Gemini

- Extrair campos de texto não estruturado.
- Classificar categoria com confiança.
- Reformular a interpretação para confirmação.
- Sugerir perguntas candidatas dentro do catálogo permitido.
- Redigir o mapa executivo a partir de dados e scores fornecidos.
- Resumir evidências e lacunas.

### 10.2 Tarefas proibidas ao Gemini

- Definir score final diretamente.
- Inventar valores, cases, sensores, sistemas ou dados existentes.
- Declarar viabilidade técnica definitiva.
- Prometer redução, ROI, payback ou prazo.
- Escolher uma rota fora das regras configuradas.
- Alterar consentimento ou dados de identidade.
- Executar ações comerciais externas sem fluxo autorizado.

### 10.3 Saída estruturada do Gemini

Toda chamada deve usar JSON Schema estrito. Exemplo de extração:

```json
{
  "category": "maintenance",
  "category_confidence": 0.82,
  "fields": [
    {
      "name": "problem",
      "value": "paradas não planejadas",
      "source_quote": "as máquinas param sem aviso",
      "confidence": 0.94
    }
  ],
  "unknowns": ["downtime_hours", "downtime_cost", "data_sources"]
}
```

### 10.4 Recuperação de conhecimento

O catálogo deverá conter registros aprovados:

```yaml
case_id: CASE-014
title: Detecção de anomalias em séries temporais
status: approved
industries: [energy, manufacturing]
categories: [maintenance]
data_modalities: [time_series]
evidence_level: experimental_validation
public_description: "..."
owner: hub-team
```

O relatório só poderá mencionar casos retornados pelo mecanismo de recuperação e marcados como aprovados.

### 10.5 Fallback

Se o Gemini falhar, exceder o tempo limite ou não respeitar o schema:

- preservar a sessão;
- apresentar categorias explícitas para escolha;
- usar banco determinístico de perguntas;
- calcular scores normalmente;
- gerar relatório por templates;
- informar que a personalização avançada está temporariamente indisponível sem expor detalhes internos.

---

## 11. Segurança, privacidade e LGPD

- Coletar apenas dados necessários para diagnóstico e contato.
- Exibir aviso para não inserir segredos industriais, credenciais ou dados pessoais de terceiros.
- Separar identidade de conteúdo industrial no armazenamento.
- Criptografar dados em trânsito e em repouso.
- Aplicar controles de acesso por função na área interna.
- Registrar acesso e alterações relevantes.
- Definir política de retenção para sessões abandonadas e leads concluídos.
- Permitir atendimento a solicitações de acesso, correção e eliminação.
- Não usar conteúdo industrial para treinamento de modelos sem base legal e autorização específica.
- Redigir ou bloquear credenciais, chaves, CPF, dados bancários e outros padrões sensíveis.
- Anexos futuros devem passar por antivírus, validação de tipo, limite de tamanho e extração isolada.
- A integração Gemini deve utilizar a configuração corporativa existente, com política adequada de retenção, não treinamento, região e tratamento de dados confirmada pela organização.
- Configurar e testar políticas RLS do Supabase para impedir leitura ou alteração entre sessões.
- Manter chaves administrativas do Supabase exclusivamente no servidor.
- Restringir consultas internas por função e registrar operações privilegiadas.
- Normalizar e proteger e-mails; não utilizá-los em URLs, logs ou eventos analíticos.
- Revisar buckets do Supabase Storage antes da futura fase de anexos, com acesso privado e URLs temporárias.

### 11.1 Proteção contra prompt injection

- Tratar texto e anexos do usuário como dados, não como instruções de sistema.
- Isolar conteúdo recuperado em campos delimitados.
- Permitir apenas ferramentas predefinidas e sem efeitos externos na etapa de análise.
- Validar saídas com schema e regras de domínio.
- Nunca permitir que o modelo escolha URLs, endpoints ou destinatários livremente.

---

## 12. Requisitos não funcionais

### 12.1 Desempenho

- P95 para operações sem IA: até 500 ms.
- P95 para próxima pergunta com IA: até 4 s.
- P95 para relatório completo: até 8 s.
- A interface deve apresentar estado de processamento após 300 ms.

### 12.2 Disponibilidade e resiliência

- Meta inicial de disponibilidade: 99,5% mensal.
- Timeout por chamada ao Gemini configurável, inicialmente 6 s.
- No máximo uma repetição automática para erro transitório.
- Circuit breaker e fallback determinístico.
- Sessões retomáveis pelo mesmo navegador por até 24 horas.

### 12.3 Acessibilidade

- Alvo WCAG 2.2 nível AA.
- Fluxo completo operável por teclado.
- Foco visível e retorno de erro associado ao campo.
- Progresso anunciado por tecnologia assistiva.
- Sem dependência exclusiva de cor.
- Respeitar `prefers-reduced-motion`.

### 12.4 Observabilidade

- `correlation_id` por sessão e requisição.
- Métricas de latência, falhas, fallback e custo de IA.
- Logs sem texto industrial integral ou dados pessoais.
- Alertas para aumento de erro, abandono ou roteamentos anômalos.
- Monitoramento de falhas de persistência, violações de RLS e saturação de conexões do Supabase.

---

## 13. Analytics e métricas

### 13.1 Eventos

- `diagnostic_started`
- `challenge_submitted`
- `interpretation_confirmed`
- `interpretation_corrected`
- `question_answered`
- `question_skipped`
- `preview_viewed`
- `identity_started`
- `identity_completed`
- `diagnostic_completed`
- `route_assigned`
- `meeting_requested`
- `diagnostic_abandoned`
- `specialist_reviewed`
- `opportunity_outcome_recorded`

Cada evento deve conter apenas IDs e atributos não sensíveis necessários para análise.

### 13.2 Métricas de produto

- Taxa de início do diagnóstico.
- Taxa de conclusão da leitura preliminar.
- Conversão da leitura preliminar para identificação.
- Conversão para conversa com especialista.
- Tempo mediano de conclusão.
- Pergunta com maior abandono.
- Percentual de interpretação corrigida.
- Distribuição de rotas e categorias.

### 13.3 Métricas de qualidade comercial

- Percentual de leads com problema e indicador definidos.
- Percentual de oportunidades confirmadas pelo especialista.
- Precisão da rota sugerida.
- Reuniões realizadas por diagnóstico concluído.
- Sprints e pilotos iniciados.
- Tempo entre diagnóstico e primeira ação.
- Motivos de perda.

### 13.4 Guardrails

- Taxa de fallback por modelo.
- Percentual de relatórios com afirmações corrigidas.
- Divergência entre score automático e revisão humana.
- Incidentes de privacidade ou conteúdo sensível.
- Custos de IA por diagnóstico concluído.

---

## 14. UX e conteúdo

### 14.1 Entrada recomendada na página

Título:

> Onde sua indústria está perdendo capacidade, margem ou segurança?

Texto:

> Descreva um desafio real. A inteligência do Hub fará as perguntas certas e organizará uma primeira rota de oportunidade.

CTA primário: **Mapear uma oportunidade**  
CTA secundário: **Falar com um especialista**

### 14.2 Linguagem

- Evitar “sua empresa está pronta para IA?”.
- Falar primeiro de problema, indicador e resultado.
- Explicar termos como OEE, MTBF ou falso rejeite quando usados.
- Diferenciar fato informado, hipótese e recomendação.
- Não usar linguagem de aprovação automática.

### 14.3 Confiança

Exibir no resultado:

- “Informado pela empresa”.
- “Inferido a partir da descrição”.
- “Hipótese para validação”.
- “Ainda não informado”.

---

## 15. Estratégia de implementação

### Fase 0 — Descoberta e calibração

- Realizar entrevistas com especialistas e equipe comercial.
- Analisar diagnósticos e projetos anteriores.
- Definir categorias, perguntas, evidências e rotas.
- Criar conjunto anonimizado de casos de teste.
- Validar texto de consentimento e retenção.

### Fase 1 — MVP determinístico

- Nova interface conversacional.
- Descrição obrigatória e confirmação de interpretação por regras simples.
- Catálogo versionado de perguntas.
- Scoring multidimensional determinístico.
- Mapa executivo por template.
- Captura progressiva e endpoint de lead.
- Analytics do funil.
- Migrações Supabase, RLS e compatibilidade com os formulários de captação existentes.

### Fase 2 — IA adaptativa

- Extração estruturada por LLM.
- Seleção adaptativa de perguntas dentro do catálogo.
- Redação personalizada do relatório.
- Recuperação de casos e especialistas aprovados.
- Confiança e evidências por campo.

### Fase 3 — Multimodal e integração comercial

- Áudio com transcrição e confirmação.
- Upload controlado de planilhas, PDFs e imagens.
- Estimadores por categoria.
- CRM e agenda.
- Supabase Storage para anexos, somente após revisão de segurança e privacidade.
- Painel de revisão e feedback.

### Fase 4 — Calibração contínua

- Comparar recomendação com desfechos.
- Ajustar rubricas por versão.
- Testar perguntas e CTAs.
- Expandir catálogo de oportunidades e casos.

---

## 16. Testes

### 16.1 Testes unitários

- Regras de elegibilidade das perguntas.
- Cálculo de cada dimensão.
- Gates e roteamento.
- Fórmulas de estimativa.
- Cálculo de confiança.
- Redação e bloqueio de dados sensíveis.
- Validação de schemas.
- Mapeamento entre payloads da API e registros Supabase.

### 16.2 Testes de contrato

- Todos os endpoints e códigos de erro.
- Idempotência de `answers`, `identity` e `complete`.
- Compatibilidade entre versões de UI e API.
- Resposta do Gemini Gateway fora do schema.
- Persistência idempotente no Supabase.
- Compatibilidade com os endpoints e formulários atuais de captação.

### 16.3 Testes de IA

Criar dataset de avaliação contendo:

- descrições claras e incompletas;
- problemas com múltiplas oportunidades;
- siglas e termos industriais;
- inputs adversariais e prompt injection;
- informações contraditórias;
- casos fora do escopo;
- dados potencialmente sensíveis.

Avaliar:

- acurácia de categoria;
- precisão de extração;
- taxa de campos inventados;
- qualidade da pergunta selecionada;
- fidelidade do relatório às evidências;
- consistência entre execuções.

### 16.4 Testes de jornada

- Conclusão por desktop, mobile e teclado.
- Retomada de sessão.
- Correção da interpretação.
- Usuário que responde “não sei”.
- Falha, timeout ou resposta inválida do Gemini.
- Lead sem e-mail corporativo.
- Consentimento não concedido.
- Abandono e retorno.

### 16.5 Testes de segurança

- Prompt injection.
- XSS e HTML malicioso.
- Injeção em campos e logs.
- Enumeração de sessões.
- Rate limiting.
- Acesso indevido à área interna.
- Tentativas de leitura e escrita entre sessões sob as políticas RLS.
- Exposição acidental de `service_role_key` ou segredos Supabase no cliente.
- Upload malicioso na fase multimodal.

---

## 17. Critérios de aceite do MVP

O MVP estará pronto quando:

1. O usuário conseguir concluir o fluxo sem contato até a leitura preliminar.
2. A descrição do desafio for obrigatória e confirmada.
3. A ferramenta aplicar de três a sete perguntas relevantes sem repetições.
4. Os seis scores forem calculados por regras versionadas.
5. O resultado separar evidências, inferências, hipóteses e lacunas.
6. O mapa executivo indicar indicador, dados necessários, experimento e próximo passo.
7. O contato for capturado com consentimento versionado.
8. O Hub receber lead, scorecard, relatório e rota em formato estruturado.
9. A indisponibilidade do LLM não impedir a conclusão.
10. O fluxo passar nos testes essenciais de acessibilidade, segurança e responsividade.
11. Nenhum case não aprovado puder aparecer no resultado.
12. Nenhuma estimativa financeira puder ser exibida sem fórmula, entradas e premissas.
13. Analytics permitirem medir o funil completo.
14. Especialistas conseguirem corrigir classificação e registrar desfecho.
15. Os formulários atuais continuarem captando dados no Supabase sem regressão.
16. Migrações, constraints, índices e políticas RLS do Supabase passarem nos testes automatizados.

---

## 18. Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Diagnóstico parecer um laudo | Alto | Avisos claros, linguagem de hipótese e revisão humana |
| LLM inventar dados ou cases | Alto | JSON Schema, RAG restrito, validação e regras determinísticas |
| Jornada ficar longa | Alto | Limite de perguntas, encerramento antecipado e analytics de abandono |
| Score não refletir qualidade comercial | Alto | Calibração com casos reais e versionamento de rubrica |
| Coleta de informação industrial sensível | Alto | Minimização, aviso, redação e controles de acesso |
| Estimativa gerar expectativa indevida | Alto | Faixas, premissas, confiança e proibição de promessa |
| Dependência operacional do Gemini | Médio | Adaptador, timeout, circuit breaker, observabilidade e fallback determinístico |
| Integração precoce com CRM limitar o produto | Médio | Supabase como sistema de registro e CRM por adaptador desacoplado |
| Quebra da captação Supabase existente | Alto | Inventário do esquema, migrações compatíveis, feature flag e testes de regressão |
| Política RLS incorreta expor dados | Alto | Negar por padrão, testes entre sessões e revisão antes da publicação |
| Baixa adesão dos especialistas | Médio | Painel simples, feedback rápido e participação na calibração |

---

## 19. Decisões pendentes

- Qual CRM será integrado futuramente ao Supabase?
- Quais tabelas, views, funções, triggers e Edge Functions do Supabase já atendem à captação atual?
- A página escreve no Supabase por Cloudflare Worker, Edge Functions ou acesso direto com chave pública?
- Supabase Auth é utilizado na área interna ou deverá ser incorporado?
- Quem será responsável por cada rota?
- Quais dados industriais podem ser armazenados e por quanto tempo?
- Quais casos reais estão autorizados para recomendação?
- O mapa completo será exibido na tela, enviado por e-mail ou ambos?
- Haverá agenda integrada na primeira versão?
- Qual modelo/versão do Gemini está implantado em cada ambiente?
- A integração Gemini existente utiliza Gemini API, Vertex AI ou outro endpoint corporativo?
- Quais configurações de região, retenção, segurança e não treinamento já estão vigentes?
- Quais categorias devem entrar no MVP?
- Quais limites numéricos de score serão aprovados na calibração?
- Quais indicadores definem uma oportunidade comercial bem-sucedida para o Hub?

---

## 20. Instruções de execução para o Codex

Ao implementar este SDD:

1. Inspecione a base existente e preserve a identidade visual do Hub.
2. Não altere os formulários atuais sem mapear seus contratos e dependências.
3. Implemente primeiro o domínio, schemas e rules engine; depois conecte o Gemini por meio do adaptador existente.
4. Mantenha prompts, perguntas, rubricas e rotas em arquivos versionados.
5. Não coloque chaves, e-mails ou configurações sensíveis no código cliente.
6. Inspecione primeiro o esquema Supabase atual; depois crie migrações compatíveis com as entidades deste documento, sem duplicar tabelas equivalentes.
7. Adicione testes antes de substituir a T-01 em produção.
8. Mantenha a T-01 atual disponível por feature flag durante validação.
9. Não invente integrações ausentes. Use adaptadores e mocks explicitamente identificados.
10. Entregue documentação de execução local, variáveis de ambiente, migrações Supabase, políticas RLS e rollback.

### Ordem recomendada de PRs

1. `feat/opportunity-domain-and-schemas`
2. `feat/adaptive-question-engine`
3. `feat/multidimensional-scoring`
4. `feat/opportunity-wizard-ui`
5. `feat/gemini-extraction-gateway`
6. `feat/executive-map-and-routing`
7. `feat/lead-capture-and-analytics`
8. `feat/internal-review-panel`
9. `chore/t01-feature-flag-and-migration`
10. `chore/supabase-rls-and-data-migration`

### Definição de pronto por PR

- implementação;
- testes automatizados;
- documentação atualizada;
- telemetria necessária;
- tratamento de erro e fallback;
- revisão de acessibilidade;
- nenhuma informação sensível em logs;
- compatibilidade com feature flag;
- evidência de teste local.

---

## 21. Anexo — Exemplo de resultado

### Oportunidade identificada

**Antecipar paradas não planejadas em equipamento crítico da etapa de acabamento.**

### Leitura

- Potencial de valor: alto, ainda sem estimativa financeira confiável.
- Viabilidade técnica: média.
- Prontidão organizacional: média-alta.
- Velocidade para evidência: média.
- Aderência ao Hub: alta.
- Confiança da análise: 58%.

### Evidências informadas

- Existem registros de manutenção.
- O equipamento apresenta paradas recorrentes.
- Há um ponto focal de manutenção.

### Lacunas

- Horas mensais de parada ainda não informadas.
- Não foi confirmada a existência de séries temporais de sensores.
- Custo ou perda de produção por hora ainda não definido.

### Experimento recomendado

Realizar uma avaliação de dados com amostra de históricos de manutenção, eventos de parada e sinais disponíveis. O objetivo inicial será verificar se os eventos possuem antecedência observável suficiente para justificar um piloto preditivo.

### Próximo passo

**Avaliação de dados com especialista do Hub.**

### Aviso

Esta é uma hipótese de oportunidade construída com as informações fornecidas. Viabilidade, impacto e arquitetura deverão ser validados com a equipe técnica e operacional.
