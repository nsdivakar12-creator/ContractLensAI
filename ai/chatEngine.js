// Idea 5 — "Ask My Contract" Conversational AI
// Answers user questions grounded in the uploaded contract, pointing directly to Section & Page
// and offering a crisp "You should clarify" question!

import { formatCurrencyAmount } from './analyzer.js';

const INTENTS = [
  {
    name: 'top_three',
    keywords: ['three', '3', 'most important', 'summary', 'summarize', 'overview', 'should i sign', 'safe'],
    run: (a) => {
      const top = (a.findings || []).slice(0, 3);
      if (!top.length) {
        return {
          answer: `No major high-risk clauses were detected in **${a.title}** (Safety Score: ${a.safetyScore}/100). Verify exact names, dates, and amounts match your discussion.`,
          relevantSection: 'Overall Document',
          clarify: 'Are there any separate addenda or fee schedules outside this document?',
          citedFindings: []
        };
      }
      const list = top
        .map((f, i) => `${i + 1}. **${f.title}** *(Section: ${f.sectionTitle}, Page ${f.page})*\n   ${f.plainEnglish}`)
        .join('\n\n');
      return {
        answer: `Here are the **3 most important things** you should know before signing **${a.title}** (Safety Score: **${a.safetyScore}/100**, Grade ${a.grade}):\n\n${list}`,
        relevantSection: `${top[0].sectionTitle} (Page ${top[0].page})`,
        clarify: top[0].question,
        citedFindings: top.map((f) => f.id)
      };
    }
  },
  {
    name: 'reduce_payment',
    keywords: ['reduce my payment', 'deduct', 'salary', 'incentive', 'pay', 'fee', 'hidden', 'cost', 'charge', 'apr', 'interest', 'money'],
    run: (a) => {
      const hits = (a.findings || []).filter(
        (f) => f.dashboardGroup === 'fees' || /deduct|incentive|fee|apr|claw|pay|deposit/i.test(`${f.title} ${f.excerpt}`)
      );
      if (!hits.length) {
        return {
          answer: `I didn't find hidden fee or arbitrary pay deduction clauses in **${a.title}**.`,
          relevantSection: 'Payment & Fees',
          clarify: 'Can you confirm in writing that no additional administrative or deduction charges apply?',
          citedFindings: []
        };
      }
      const totalStr = formatCurrencyAmount(a.financialExposure?.totalAtRisk || 0, a.currency);
      const bullets = hits
        .slice(0, 3)
        .map((f) => `- **${f.title}** *(${f.sectionTitle} · Page ${f.page})*: ${f.plainEnglish}`)
        .join('\n\n');
      return {
        answer: `**Yes.** I found **${hits.length} payment/deduction risk(s)** (estimated **${totalStr}** exposure):\n\n${bullets}`,
        relevantSection: `${hits[0].sectionTitle} — Page ${hits[0].page}`,
        clarify: hits[0].question,
        citedFindings: hits.map((f) => f.id)
      };
    }
  },
  {
    name: 'cancel_leave',
    keywords: ['cancel', 'lose', 'leave', 'quit', 'two months', '2 months', 'early', 'termination', 'terminate', 'deactivate', 'renew', 'notice', 'prepay'],
    run: (a) => {
      const hits = (a.findings || []).filter(
        (f) =>
          f.category === 'termination' ||
          f.category === 'auto_renewal' ||
          /terminat|forfeit|notice|renew|prepay|deactivat|early/i.test(`${f.title} ${f.excerpt}`)
      );
      if (!hits.length) {
        return {
          answer: `No harsh cancellation or forfeiture traps were flagged in **${a.title}**. Still double-check the exact notice period before exiting.`,
          relevantSection: 'Term & Termination',
          clarify: 'What is the exact notice period and refund/settlement timeline if I exit early?',
          citedFindings: []
        };
      }
      const bullets = hits
        .slice(0, 3)
        .map((f) => `- **${f.title}** *(${f.sectionTitle} · Page ${f.page})*: ${f.plainEnglish}\n  *Suggested fair fix:* ${f.fairRedline}`)
        .join('\n\n');
      return {
        answer: `Exiting or cancelling early carries **${hits.length} serious risk(s)** in this agreement:\n\n${bullets}`,
        relevantSection: `${hits[0].sectionTitle} — Page ${hits[0].page}`,
        clarify: hits[0].question,
        citedFindings: hits.map((f) => f.id)
      };
    }
  },
  {
    name: 'change_negotiate',
    keywords: ['change', 'negotiate', 'redline', 'ask them', 'fix', 'push back'],
    run: (a) => {
      const top = (a.findings || []).slice(0, 4);
      const list = top
        .map((f, i) => `${i + 1}. **${f.title}** *(Page ${f.page})* → ${f.fairRedline}`)
        .join('\n\n');
      return {
        answer: `Here are the **top clauses you should ask them to change** before signing:\n\n${list}\n\nTip: Switch to **✨ Auto-Redline** in the Smart Reader to generate a clean rewritten version in 1 click!`,
        relevantSection: top[0] ? `${top[0].sectionTitle} — Page ${top[0].page}` : 'Full Agreement',
        clarify: top[0]?.question || 'Will you confirm all agreed revisions in writing?',
        citedFindings: top.map((f) => f.id)
      };
    }
  }
];

async function queryLiveLlm(question, analysis, llmConfig) {
  const provider = llmConfig?.provider || (process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'local');
  const apiKey =
    llmConfig?.apiKey ||
    (provider === 'gemini' ? process.env.GEMINI_API_KEY : provider === 'openai' ? process.env.OPENAI_API_KEY : '');
  if (!apiKey || provider === 'local') return null;

  const prompt = `You are ContractLens AI. Answer the user's question about their contract in clear, simple English, citing the relevant section and adding one practical question they should clarify before signing.
Contract: ${analysis.title}
Text:
"""
${analysis.originalText.slice(0, 12000)}
"""
Question: ${question}`;

  if (provider === 'gemini') {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(15000)
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  }

  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] }),
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  }
  return null;
}

export async function answerContractQuestion({ question, analysis, llmConfig = {} }) {
  const q = (question || '').trim();
  if (!q) throw new Error('Please type a question to ask your contract.');
  if (!analysis || !analysis.originalText) throw new Error('Please analyze or load a contract first.');

  try {
    const live = await queryLiveLlm(q, analysis, llmConfig);
    if (live) {
      return { answer: live, relevantSection: 'AI Full-Document Analysis', clarify: null, citedFindings: [], mode: 'live-llm' };
    }
  } catch {
    // Fallback to grounded engine
  }

  const lower = q.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    let score = 0;
    for (const kw of intent.keywords) {
      if (lower.includes(kw)) score += kw.includes(' ') ? 3 : 2;
    }
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }

  if (best && bestScore >= 2) {
    return { ...best.run(analysis), mode: 'contractlens-grounded' };
  }

  // Keyword match across findings
  const words = lower
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['what', 'does', 'this', 'contract', 'about', 'there', 'they', 'have', 'with', 'from', 'that', 'will'].includes(w));

  const matched = (analysis.findings || [])
    .map((f) => ({
      f,
      score: words.reduce((s, w) => s + (`${f.title} ${f.excerpt} ${f.plainEnglish}`.toLowerCase().includes(w) ? 2 : 0), 0)
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (matched.length > 0) {
    const top = matched.slice(0, 2).map((x) => x.f);
    return {
      answer: top
        .map((f) => `**${f.title}** *(${f.sectionTitle} · Page ${f.page})*:\n${f.plainEnglish}\n> "${f.excerpt.slice(0, 190)}${f.excerpt.length > 190 ? '…' : ''}"`)
        .join('\n\n'),
      relevantSection: `${top[0].sectionTitle} — Page ${top[0].page}`,
      clarify: top[0].question,
      citedFindings: top.map((f) => f.id),
      mode: 'contractlens-grounded'
    };
  }

  return { ...INTENTS[0].run(analysis), mode: 'contractlens-grounded' };
}
