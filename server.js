require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

app.post('/api/diagnostico', async (req, res) => {
  const keys = ['q1', 'q2', 'q3', 'q4', 'q5'];
  const answers = keys.map((k) => Number(req.body?.[k]));
  if (answers.some((n) => !Number.isInteger(n) || n < 0 || n > 3)) {
    return res.status(400).json({ error: 'invalid_answers' });
  }
  const desafio = typeof req.body?.desafio === 'string' ? req.body.desafio.slice(0, 1000) : '';
  const score = answers.reduce((a, b) => a + b, 0);

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
    return res.json({ score, ...parsed, source: 'ai' });
  } catch (err) {
    console.error('Diagnóstico IA falhou, usando fallback baseado em regra:', err.message);
    return res.json({ score, ...ruleBasedFallback(score) });
  }
});

app.listen(PORT, () => {
  console.log(`Hub rodando em http://localhost:${PORT}`);
});
