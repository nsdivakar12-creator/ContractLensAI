// Idea 6 — Contract Comparison AI ("Compare Before You Accept")
// Extracts structured key terms side-by-side (Rent, Deposit, Notice, Late Fee, Renewal, APR, Payout)
// supporting both ₹ (INR) and $ (USD), plus AI explanation of every unfavorable shift!

import { analyzeContractLocal, detectCurrency } from '../ai/analyzer.js';

function extractTermValue(text, patterns, fallback = 'Not specified') {
  for (const rx of patterns) {
    const m = rx.exec(text);
    if (m) return (m[1] || m[0]).replace(/\s+/g, ' ').trim();
  }
  return fallback;
}

function extractNumeric(str) {
  const m = String(str || '').match(/(\d+(?:,\d{2,3})*(?:\.\d+)?)/);
  return m ? parseFloat(m[1].replace(/,/g, '')) : null;
}

function extractStructuredTerms(text) {
  const currency = detectCurrency(text);
  const rent = extractTermValue(text, [
    /(?:monthly\s+(?:base\s+)?rent(?:\s+is|\s*:)?\s*)([₹$]\s?[\d,]+(?:\.\d{2})?)/i,
    /rent\s+of\s+([₹$]\s?[\d,]+)/i
  ]);
  const deposit = extractTermValue(text, [
    /(?:security\s+deposit(?:\s+of|\s+is|\s*:)?\s*)([₹$]\s?[\d,]+(?:\.\d{2})?)/i,
    /(?:deposit\s+of\s+)([₹$]\s?[\d,]+)/i
  ]);
  const notice = extractTermValue(text, [
    /notice\s+period(?:\s+is|\s+of|\s*:)?\s*(\d+\s*(?:days?|months?))/i,
    /(?:at\s+least|minimum|providing)\s+(\d+|thirty|sixty|ninety|one|two|three)\s*\(?\d*\)?\s*(days?|months?)\s+(?:written\s+)?notice/i,
    /(\d+\s*(?:days?|months?))\s+(?:prior\s+)?(?:written\s+)?notice/i
  ]);
  const lateFee = extractTermValue(text, [
    /(?:late\s+(?:fee|charge)(?:\s+of|\s+is|\s*:)?\s*)([₹$]\s?[\d,]+(?:\s*\+\s*[₹$][\d,]+\/day|\s+plus\s+[₹$][\d,]+\s+per\s+day)?|\d+%)/i
  ]);
  const renewal = /automatically\s+renew|auto[- ]?renew/i.test(text)
    ? 'Automatic Renewal'
    : /manual\s+renewal|renewal\s+(?:is\s+)?manual|month-to-month|mutual\s+written\s+consent|opt-in/i.test(text)
    ? 'Manual / Mutual Opt-In'
    : 'Not specified';

  const apr = extractTermValue(text, [
    /(?:apr|interest\s+rate)(?:\s+is|\s+of|\s*:)?\s*(\d+(?:\.\d+)?%)/i
  ]);
  const payout = extractTermValue(text, [
    /(net[- ]?\d+\s*basis|weekly\s+payout|monthly\s+salary|bi-weekly)/i,
    /(?:pay|rate)(?:\s+is|\s+of)?\s*([₹$]\s?[\d,]+(?:\.\d{2})?\s*(?:per\s+hour|\/\s*(?:hr|order|month)))/i
  ]);
  const hiddenFees = extractTermValue(text, [
    /(?:mandatory\s+(?:recurring\s+)?(?:monthly\s+)?(?:charges|fees)[^.\n]{0,80})/i,
    /(?:origination[^.\n]{0,55})/i,
    /no\s+hidden\s+(?:fees|charges)|fee-free/i
  ], 'None detected');

  return { currency, rent, deposit, notice, lateFee, renewal, apr, payout, hiddenFees };
}

function buildComparisonTable(textA, textB) {
  const a = extractStructuredTerms(textA);
  const b = extractStructuredTerms(textB);
  const rows = [];

  const addRow = (category, valA, valB, lowerIsBetter = true) => {
    if (valA === 'Not specified' && valB === 'Not specified') return;
    let verdict = 'same';
    if (valA !== valB) {
      const numA = extractNumeric(valA);
      const numB = extractNumeric(valB);
      if (category === 'Renewal') {
        verdict = valB === 'Automatic Renewal' && valA !== 'Automatic Renewal'
          ? 'worse_b'
          : valA === 'Automatic Renewal' && valB !== 'Automatic Renewal'
          ? 'better_b'
          : 'changed';
      } else if (numA !== null && numB !== null && lowerIsBetter) {
        verdict = numB > numA ? 'worse_b' : numB < numA ? 'better_b' : 'same';
      } else {
        verdict = 'changed';
      }
    }
    rows.push({ category, valueA: valA, valueB: valB, verdict });
  };

  addRow('Monthly Rent', a.rent, b.rent, true);
  addRow('Security Deposit', a.deposit, b.deposit, true);
  addRow('Notice Period', a.notice, b.notice, true);
  addRow('Late Fee', a.lateFee, b.lateFee, true);
  addRow('Renewal', a.renewal, b.renewal, true);
  addRow('Interest Rate / APR', a.apr, b.apr, true);
  addRow('Pay / Payout Cycle', a.payout, b.payout, false);

  return rows;
}

export function compareContracts({ contractA, contractB }) {
  const resultA = analyzeContractLocal({
    text: contractA.text,
    title: contractA.title || 'Contract A',
    requestedType: contractA.contractType || 'auto'
  });
  const resultB = analyzeContractLocal({
    text: contractB.text,
    title: contractB.title || 'Contract B',
    requestedType: contractB.contractType || 'auto'
  });

  const tableRows = buildComparisonTable(contractA.text, contractB.text);
  const rulesA = new Map(resultA.findings.map((f) => [f.ruleId, f]));
  const rulesB = new Map(resultB.findings.map((f) => [f.ruleId, f]));

  const resolvedRisks = [...rulesA.values()].filter((f) => !rulesB.has(f.ruleId));
  const newRisks = [...rulesB.values()].filter((f) => !rulesA.has(f.ruleId));
  const remainingRisks = [...rulesB.values()].filter((f) => rulesA.has(f.ruleId));

  // Build plain-English change narrative
  const worseItems = tableRows.filter((r) => r.verdict === 'worse_b').map((r) => `${r.category.toLowerCase()} (${r.valueA} → ${r.valueB})`);
  const betterItems = tableRows.filter((r) => r.verdict === 'better_b').map((r) => `${r.category.toLowerCase()} (${r.valueA} → ${r.valueB})`);

  let aiNarrative = '';
  if (worseItems.length > 0) {
    aiNarrative += `${resultB.title} is stricter or costlier on: ${worseItems.join(', ')}. `;
  }
  if (betterItems.length > 0) {
    aiNarrative += `${resultB.title} improves on: ${betterItems.join(', ')}. `;
  }
  if (resultB.safetyScore > resultA.safetyScore) {
    aiNarrative += `Overall, ${resultB.title} is safer by +${resultB.safetyScore - resultA.safetyScore} points (${resolvedRisks.length} risks eliminated).`;
  } else if (resultA.safetyScore > resultB.safetyScore) {
    aiNarrative += `Overall, ${resultA.title} is significantly safer by +${resultA.safetyScore - resultB.safetyScore} points (${newRisks.length} new risk traps appear in ${resultB.title}).`;
  } else {
    aiNarrative += `Both contracts carry a similar overall safety score (${resultA.safetyScore}/100). Review the side-by-side table carefully before accepting.`;
  }

  return {
    currency: resultA.currency || resultB.currency || '₹',
    scoreDelta: resultB.safetyScore - resultA.safetyScore,
    exposureDelta: (resultA.financialExposure?.totalAtRisk || 0) - (resultB.financialExposure?.totalAtRisk || 0),
    winner: resultB.safetyScore > resultA.safetyScore ? 'B' : resultA.safetyScore > resultB.safetyScore ? 'A' : 'tie',
    aiNarrative: aiNarrative.trim(),
    tableRows,
    resolvedRisks,
    newRisks,
    remainingRisks,
    contractA: resultA,
    contractB: resultB
  };
}
