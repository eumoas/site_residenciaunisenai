# Residência Inteligência Artificial · Hub de Inovação Industrial

Site institucional da Residência em IA (UniSENAI SC) com um diagnóstico de prontidão para IA industrial gerado por Claude.

## Requisitos

- Node.js 18+ (testado em 22)
- Uma chave gratuita da API do Gemini (opcional — sem ela, o diagnóstico cai automaticamente no texto padrão) → [aistudio.google.com/apikey](https://aistudio.google.com/apikey), sem cartão de crédito

## Como rodar

```bash
npm install
cp .env.example .env   # edite e cole sua GEMINI_API_KEY
npm start               # http://localhost:3000
```

Sem `GEMINI_API_KEY` configurada, o site funciona normalmente — o diagnóstico (`/api/diagnostico`) apenas usa o texto padrão em vez do parecer gerado pela IA.

## Estrutura

| Arquivo/pasta | O que é |
|---|---|
| `server.js` | Servidor Express: serve o site estático e expõe `POST /api/diagnostico` |
| `index.html` | Site principal do Hub (landing, cases, diagnóstico, equipe) |
| `apresentacao.html` | Apresentação executiva (versão para reunião/pitch) |
| `hub-v1.html` | Versão anterior da landing, mantida como referência |
| `portfolio-miriam.html` | Portfólio individual (visão computacional & IA) |
| `hub-config.js` | Dados públicos editáveis: contato, links, equipe (`teamMembers`) |
| `personas-ficticias-cases.md` | Biblioteca de cases usada como contexto para o diagnóstico de IA |
| `assets/hero/` | Poster e vídeo de abertura usados em `index.html`, `hub-v1.html` e `apresentacao.html` |
| `assets/brand/` | Logos institucionais (UniSENAI, FIESC) |
| `assets/companies/` | Logos das empresas participantes (`legacy/` são as versões usadas só em `hub-v1.html`/`apresentacao.html`) |
| `assets/people/` | Fotos das personas fictícias (`originals/` guarda os arquivos originais enviados, antes do recorte/conversão) |
| `assets/team/` | Fotos da equipe real — veja `assets/team/README.md` |
| `assets/content/` | Imagens de fundo usadas nas seções de conteúdo |
| `assets/unused/` | Arquivos enviados ao projeto mas sem uso em nenhuma página no momento |

## O diagnóstico com IA

O formulário "Diagnóstico de prontidão" (T-01) calcula o score localmente (0–15) e envia as respostas — mais um campo opcional de texto livre sobre o desafio da empresa — para `POST /api/diagnostico`. O servidor:

1. Chama a API do Gemini (`gemini-3.6-flash`, plano gratuito, via Interactions API) com a biblioteca de cases (`personas-ficticias-cases.md`) como contexto, pedindo um parecer personalizado em JSON estruturado: título, texto do diagnóstico, case mais parecido (com o motivo) e próximo passo sugerido.
2. Se a chamada falhar por qualquer motivo (sem chave, limite de uso, resposta bloqueada), responde com o texto padrão baseado em regra — o mesmo formato de resposta, então o frontend nunca quebra.

## Antes de publicar

`personas-ficticias-cases.md` deixa isso explícito, mas vale repetir aqui: os cases e depoimentos são **fictícios**, criados para preencher o site antes de haver casos reais. Substitua por indústrias parceiras de verdade antes de qualquer publicação pública.

## Equipe

Para adicionar integrantes ao site, edite `teamMembers` em `hub-config.js` — veja `assets/team/README.md` para o formato das fotos.
