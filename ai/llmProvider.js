// Optional Live Gemini 2.5 Flash / OpenAI Hybrid Enhancement with Automatic Fallback
import { analyzeContractLocal } from './analyzer.js';

async function callGemini(apiKey, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
      }),
      signal: AbortSignal.timeout(18000)
    }
  );
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  return JSON.parse(data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
}

async function callOpenAI(apiKey, prompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'Return strict JSON only.' },
        { role: 'user', content: prompt }
      ]
    }),
    signal: AbortSignal.timeout(18000)
  });
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
  const data = await res.json();
  return JSON.parse(data?.choices?.[0]?.message?.content || '{}');
}

export async function analyzeContractHybrid({ text, title, requestedType = 'auto', fileName = null, llmConfig = {} }) {
  const base = analyzeContractLocal({ text, title, requestedType, fileName });
  const provider = llmConfig.provider || (process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'local');
  const apiKey =
    llmConfig.apiKey ||
    (provider === 'gemini' ? process.env.GEMINI_API_KEY : provider === 'openai' ? process.env.OPENAI_API_KEY : '');

  if (!apiKey || provider === 'local') return base;

  try {
    const prompt = `Analyze this ${base.contractType.label} and return JSON: {"executiveSummary": "2 crisp plain-English sentences"}.\nTEXT:\n${base.originalText.slice(0, 12000)}`;
    const ai = provider === 'gemini' ? await callGemini(apiKey, prompt) : await callOpenAI(apiKey, prompt);
    if (ai?.executiveSummary) base.executiveSummary = ai.executiveSummary;
    base.engine = provider === 'gemini' ? 'ContractLens Hybrid + Gemini 2.5 Flash' : 'ContractLens Hybrid + OpenAI GPT-4o-mini';
  } catch (err) {
    base.llmFallbackNote = `Live ${provider} unavailable (${err.message}); completed with built-in ContractLens Engine.`;
  }
  return base;
}
