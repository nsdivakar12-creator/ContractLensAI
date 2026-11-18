// ContractLens AI — Modular Intelligence Extensions
// Adds: Risk DNA (#3), Combined Clause Risks (#5), Missing Information (#6),
// Custom "What Can Go Wrong?" Flow (#7), Before You Sign (#8), User Role Perspective (#9),
// Version History (#13), Clause Relationship Map (#14), Cross-Contract Memory (#22),
// 4-Level Explanations (#24), and 8-Language Flexible Voice Assistant (#25)

import { analyzeContractLocal, formatCurrencyAmount } from './analyzer.js';

export const USER_ROLES = [
  { id: 'tenant', icon: '🏠', label: 'Tenant', perspective: 'as a Tenant renting this property' },
  { id: 'employee', icon: '💼', label: 'Employee', perspective: 'as an Employee accepting this role' },
  { id: 'gig_worker', icon: '🚴', label: 'Gig Worker', perspective: 'as a Gig / Delivery Partner' },
  { id: 'borrower', icon: '💰', label: 'Borrower', perspective: 'as a Borrower taking this loan' },
  { id: 'employer', icon: '🏢', label: 'Employer', perspective: 'as an Employer reviewing enforceability & fairness' },
  { id: 'lender', icon: '🏦', label: 'Lender', perspective: 'as a Lender reviewing compliance & risk' },
  { id: 'other', icon: '⚖️', label: 'Other Signer', perspective: 'as the signing party' }
];

export const VOICE_LANGUAGES = [
  { code: 'en', name: 'English', speechLang: 'en-US' },
  { code: 'hi', name: 'हिन्दी (Hindi)', speechLang: 'hi-IN' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', speechLang: 'kn-IN' },
  { code: 'ta', name: 'தமிழ் (Tamil)', speechLang: 'ta-IN' },
  { code: 'te', name: 'తెలుగు (Telugu)', speechLang: 'te-IN' },
  { code: 'mr', name: 'मराठी (Marathi)', speechLang: 'mr-IN' },
  { code: 'es', name: 'Español (Spanish)', speechLang: 'es-ES' },
  { code: 'fr', name: 'Français (French)', speechLang: 'fr-FR' }
];

/**
 * #24: Attach 4-level explanation depth (Legal / Simple / Beginner / Example) to every finding
 */
export function attachFourLevelExplanations(findings = [], currency = '₹') {
  const sampleAmt = currency === '₹' ? '₹25,000' : '$1,500';
  return findings.map((f) => ({
    ...f,
    explanationLevels: {
      legal: f.excerpt,
      simple: f.plainEnglish,
      beginner: `If you've never read a contract before: ${f.plainEnglish} Simply put, this rule tilts the balance against you and could create unexpected obligations unless clarified before signing.`,
      example: `Example: Suppose an unexpected situation happens mid-contract. Because of "${f.title}", you could face an avoidable hit (such as ${sampleAmt}+ or losing rights/flexibility) — even when you assumed standard fair rules applied. ${f.worstCase}`
    }
  }));
}

/**
 * #3: Contract Risk DNA (7 visual decision-support indicators)
 */
export function computeContractRiskDNA(analysis) {
  const findings = analysis.findings || [];
  const hasRule = (rx) => findings.some((f) => rx.test(`${f.ruleId} ${f.title} ${f.category}`));
  const countRule = (rx) => findings.filter((f) => rx.test(`${f.ruleId} ${f.title} ${f.category}`)).length;

  const clamp = (n) => Math.max(12, Math.min(96, Math.round(n)));

  const financialRisk = clamp(18 + countRule(/fee|apr|origination|net-60|unilateral|deposit/i) * 21);
  const renewalRisk = clamp(14 + countRule(/renew|prepayment/i) * 34 + (hasRule(/notice/i) ? 15 : 0));
  const penaltyRisk = clamp(15 + countRule(/late|forfeiture|liquidated|penalty|gag|cross-default/i) * 23);
  const responsibilityRisk = clamp(18 + countRule(/repair|habitability|indemnity|exclusivity|ip/i) * 22);
  const lockInRisk = clamp(16 + countRule(/renew|non-compete|exclusivity|forfeiture|prepayment/i) * 21);
  const legalComplexity = clamp((analysis.readingLevel?.originalGrade || 13) * 5.1);
  const deadlineRisk = clamp(18 + (analysis.extractedReminders?.length || 1) * 14 + (hasRule(/renew|late/i) ? 20 : 0));

  const dimensions = [
    { key: 'financial', label: 'Financial Risk', score: financialRisk },
    { key: 'renewal', label: 'Renewal Risk', score: renewalRisk },
    { key: 'penalty', label: 'Penalty Risk', score: penaltyRisk },
    { key: 'responsibility', label: 'Responsibility Risk', score: responsibilityRisk },
    { key: 'lockin', label: 'Lock-in Risk', score: lockInRisk },
    { key: 'complexity', label: 'Legal Complexity', score: legalComplexity },
    { key: 'deadline', label: 'Deadline Risk', score: deadlineRisk }
  ];

  const overallRisk = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length);
  const overallBand =
    overallRisk >= 70 ? 'HIGH ATTENTION' : overallRisk >= 45 ? 'MODERATE ATTENTION' : 'LOW-MODERATE RISK';

  return {
    overallRisk,
    overallBand,
    disclaimer: 'AI-generated decision-support indicators (not legally authoritative advice).',
    dimensions
  };
}

/**
 * #5: Hidden / Combined Clause Detector (detects compounding clause interactions!)
 */
export function detectCombinedClauseRisks(analysis) {
  const findings = analysis.findings || [];
  const byId = (id) => findings.find((f) => f.ruleId === id);
  const combos = [];

  const checkPair = (idA, idB, title, explanation, impactLevel = 'high') => {
    const a = byId(idA);
    const b = byId(idB);
    if (a && b) {
      combos.push({
        id: `combo-${idA}-${idB}`,
        title,
        impactLevel,
        clauseA: { id: a.id, title: a.title, section: a.sectionTitle, page: a.page, excerpt: a.excerpt },
        clauseB: { id: b.id, title: b.title, section: b.sectionTitle, page: b.page, excerpt: b.excerpt },
        relationship: explanation
      });
    }
  };

  checkPair(
    'unilateral-rate-modification',
    'net-60-90-holdback',
    'Compounding Earnings Uncertainty & Deduction Trap',
    'Together, unilateral incentive/rate reductions PLUS 60–90 day holdbacks & subjective clawbacks mean your pay can be reduced and withheld simultaneously without objective recourse.'
  );
  checkPair(
    'auto-renewal-rent-hike',
    'early-termination-forfeiture',
    'Lock-In & Double-Penalty Exit Trap',
    'An automatic renewal with a strict 90-day cutoff combined with full security deposit forfeiture creates a severe trap: missing one date locks you in, while trying to exit costs your entire deposit + 3 months rent.'
  );
  checkPair(
    'mandatory-junk-fees',
    'deposit-vague-deductions',
    'Front-End & Back-End Financial Bleed',
    'Recurring non-optional add-on fees inflate your cost every month, while vague move-out "other obligations" allow major deductions when you leave.'
  );
  checkPair(
    'origination-fee-deduction',
    'predatory-apr-compounding',
    'Phantom Principal + Compounding Interest Multiplier',
    'Deducting 9% upfront while charging 38%+ daily-compounded APR on the full headline principal significantly increases your true effective borrowing cost.'
  );
  checkPair(
    'prepayment-penalty',
    'unilateral-rate-modification',
    'Rate-Hike Trap With Blocked Escape',
    'The lender can hike your interest rate on short notice, yet the prepayment/foreclosure penalty punishes you if you try to refinance or pay off the loan early.'
  );
  checkPair(
    'gig-exclusivity-misclassification',
    'overbroad-non-compete',
    'Total Income Restriction (During & After Contract)',
    'Strict exclusivity prevents working on other platforms during the contract, while the 24-month non-compete tries to block your livelihood even after the agreement ends.'
  );
  checkPair(
    'sweeping-ip-assignment',
    'overbroad-non-compete',
    'Career & Side-Project Lockout',
    'Claiming personal off-hours inventions plus imposing a 24-month industry ban restricts both what you own and where you can work next.'
  );
  checkPair(
    'repair-shifting-habitability',
    'unannounced-entry-liability-arbitration',
    'Asymmetric Landlord Accountability Risk',
    'Shifting major repairs onto you while waiving landlord negligence liability leaves you paying for building upkeep with minimal legal recourse.'
  );

  // Generic fallback if >= 2 findings exist but none of the curated pairs matched
  if (combos.length === 0 && findings.length >= 2) {
    combos.push({
      id: 'combo-general',
      title: 'Interacting Financial & Exit Risk Clauses',
      impactLevel: 'medium',
      clauseA: { id: findings[0].id, title: findings[0].title, section: findings[0].sectionTitle, page: findings[0].page, excerpt: findings[0].excerpt },
      clauseB: { id: findings[1].id, title: findings[1].title, section: findings[1].sectionTitle, page: findings[1].page, excerpt: findings[1].excerpt },
      relationship: 'These two provisions operate together and may magnify your total financial or operational exposure if a dispute or early exit occurs.'
    });
  }

  return combos;
}

/**
 * #6: Missing Information Detector ("WHAT IS UNCLEAR?")
 */
export function detectMissingInformation(analysis) {
  const text = (analysis.originalText || '').toLowerCase();
  const domain = analysis.contractType?.type || 'rental';
  const unclearItems = [];

  // Pull unclear gaps directly from flagged clauses
  for (const f of (analysis.findings || []).slice(0, 4)) {
    if (f.unclearWording) {
      unclearItems.push({
        id: `gap-${f.ruleId}`,
        label: f.title,
        issue: f.unclearWording,
        ask: f.question,
        page: f.page
      });
    }
  }

  // Check domain-specific missing protections
  if (!/grace\s+period|5[- ]day/i.test(text) && (domain === 'rental' || domain === 'loan')) {
    unclearItems.push({
      id: 'gap-grace',
      label: 'Payment Grace Period Not Clearly Specified',
      issue: 'No clear 5-day grace period is stated before late penalties begin.',
      ask: 'Is there a standard 5-day grace period before any late charge applies?',
      page: 1
    });
  }
  if (!/itemized\s+(?:bill|receipt)|written\s+breakdown/i.test(text) && domain === 'rental') {
    unclearItems.push({
      id: 'gap-damage-def',
      label: 'Definition of "Damage" vs. Normal Wear Unclear',
      issue: 'The contract does not require itemized bills or clearly separate ordinary wear and tear from tenant damage.',
      ask: 'Will you define exact permitted deposit deductions and provide itemized receipts?',
      page: 1
    });
  }
  if (!/dispute\s+timeline|appeal\s+process|within\s+\d+\s+days\s+of\s+dispute/i.test(text)) {
    unclearItems.push({
      id: 'gap-dispute-time',
      label: 'No Clear Dispute Resolution Timeline',
      issue: 'No clear timeline or neutral escalation path is specified if you challenge an unfair deduction or charge.',
      ask: 'If I dispute a deduction or charge, how many days do we have to resolve it in writing?',
      page: 1
    });
  }

  return unclearItems.slice(0, 6);
}

/**
 * #14: Legal Clause Relationship Map (Interactive visual graph data)
 */
export function buildClauseRelationshipMap(analysis) {
  const findings = analysis.findings || [];
  const buckets = {
    payment: { id: 'payment', label: 'PAYMENT & RATES', icon: '💰', clauses: [] },
    incentives: { id: 'incentives', label: 'FEES / INCENTIVES', icon: '📊', clauses: [] },
    deductions: { id: 'deductions', label: 'DEDUCTIONS / DEPOSIT', icon: '✂️', clauses: [] },
    penalties: { id: 'penalties', label: 'PENALTIES / FINES', icon: '⚠️', clauses: [] },
    renewals: { id: 'renewals', label: 'RENEWAL & LOCK-IN', icon: '🔄', clauses: [] },
    termination: { id: 'termination', label: 'TERMINATION & RIGHTS', icon: '🚪', clauses: [] }
  };

  for (const f of findings) {
    const hay = `${f.ruleId} ${f.title} ${f.category}`.toLowerCase();
    if (/apr|origination|net-60|unilateral/.test(hay)) buckets.payment.clauses.push(f);
    if (/junk|upfront|unilateral|incentive/.test(hay)) buckets.incentives.clauses.push(f);
    if (/deposit|deduct|claw|holdback|origination/.test(hay)) buckets.deductions.clauses.push(f);
    if (/late|liquidated|penalty|gag|cross-default|prepayment/.test(hay)) buckets.penalties.clauses.push(f);
    if (/renew|prepayment|non-compete|exclusivity/.test(hay)) buckets.renewals.clauses.push(f);
    if (/terminat|forfeiture|arbitration|indemnity|habitability|ip/.test(hay)) buckets.termination.clauses.push(f);
  }

  const nodes = Object.values(buckets).map((b) => ({
    id: b.id,
    label: b.label,
    icon: b.icon,
    count: b.clauses.length,
    riskTone: b.clauses.some((c) => c.trafficLight === 'red')
      ? 'red'
      : b.clauses.length > 0
      ? 'yellow'
      : 'green',
    clauses: b.clauses.map((c) => ({ id: c.id, title: c.title, page: c.page, plainEnglish: c.plainEnglish }))
  }));

  const edges = [
    ['payment', 'incentives'],
    ['incentives', 'deductions'],
    ['deductions', 'penalties'],
    ['penalties', 'renewals'],
    ['renewals', 'termination']
  ];

  return { nodes, edges };
}

/**
 * #8 & #9: "Before You Sign" Readiness Score + Role Perspective ("Who Am I?")
 */
export function buildBeforeYouSign(analysis, roleId = 'auto') {
  const domain = analysis.contractType?.type || 'rental';
  const defaultRole = domain === 'rental' ? 'tenant' : domain === 'loan' ? 'borrower' : 'gig_worker';
  const resolvedRoleId = roleId && roleId !== 'auto' ? roleId : defaultRole;
  const role = USER_ROLES.find((r) => r.id === resolvedRoleId) || USER_ROLES[0];

  const isCounterparty = resolvedRoleId === 'employer' || resolvedRoleId === 'lender';
  const readinessScore = isCounterparty ? Math.min(92, analysis.safetyScore + 28) : analysis.safetyScore;
  const topQuestions = (analysis.questionsToAsk || []).slice(0, 3).map((q) => q.question);

  const perspectiveNote = isCounterparty
    ? `Viewing ${role.perspective}: Several clauses appear aggressively one-sided and could face statutory enforceability challenges or cause signer pushback.`
    : `Viewing ${role.perspective}: This readiness score reflects how fair, transparent, and low-risk the agreement looks from YOUR side before signing.`;

  return {
    role,
    readinessScore,
    perspectiveNote,
    redCount: analysis.trafficLightCounts?.red || 0,
    yellowCount: analysis.trafficLightCounts?.yellow || 0,
    greenCount: analysis.trafficLightCounts?.green || 1,
    topQuestions: topQuestions.length
      ? topQuestions
      : [
          'Can payment or fee structures change without written advance notice?',
          'Under what exact conditions can deductions or penalties apply?',
          'How do renewal and early cancellation work?'
        ],
    disclaimer:
      'ContractLens AI provides informational decision-support analysis and does not replace professional legal advice.'
  };
}

/**
 * #7: Custom Hypothetical "What Can Go Wrong?" Step-by-Step Scenario Flow Simulator
 */
export function simulateHypotheticalScenario({ analysis, question = '' }) {
  const q = (question || '').trim();
  if (!q) throw new Error('Please enter a "What if..." scenario question.');

  const lower = q.toLowerCase();
  const findings = analysis.findings || [];
  const cur = analysis.currency || '₹';
  const text = analysis.originalText || '';

  const findMatch = (rx) => findings.find((f) => rx.test(`${f.ruleId} ${f.title} ${f.excerpt}`));

  // Scenario 1: Leaving / resigning / cancelling / breaking early
  if (/leave|resign|quit|cancel|break|exit|early|month/i.test(lower)) {
    const exitClause = findMatch(/forfeiture|terminat|early|notice|prepayment/i);
    const depClause = findMatch(/deposit/i);
    const ncClause = findMatch(/non-compete/i);

    const steps = [
      { stage: 'Trigger Event', detail: q, tone: 'info' },
      {
        stage: 'Notice & Exit Condition',
        detail: exitClause
          ? `Triggered "${exitClause.title}" (Page ${exitClause.page}): ${exitClause.plainEnglish}`
          : 'Check stated notice period (typically 30–60 days written notice required).',
        tone: exitClause ? 'red' : 'yellow'
      }
    ];
    if (depClause) {
      steps.push({
        stage: 'Deposit / Unpaid Dues Impact',
        detail: `Deposit clause (Page ${depClause.page}) may subject your deposit to forfeiture or delayed 90-day adjustment.`,
        tone: 'red'
      });
    }
    if (ncClause) {
      steps.push({
        stage: 'Post-Exit Restriction Risk',
        detail: `"${ncClause.title}" (Page ${ncClause.page}) attempts to restrict competing work after leaving.`,
        tone: 'red'
      });
    }
    steps.push({
      stage: 'Estimated Exposure & Recommended Action',
      detail: `Estimated potential exposure: up to ${formatCurrencyAmount(analysis.financialExposure?.totalAtRisk || 0, cur)} (estimate only, not a guaranteed legal outcome). Ask for written mutual exit terms before signing.`,
      tone: 'yellow'
    });
    return { scenarioTitle: q, groundedClauses: [exitClause, depClause, ncClause].filter(Boolean).map((c) => c.id), steps };
  }

  // Scenario 2: Missing payments / late EMI / default
  if (/miss|late|payment|emi|default|bounce|delay/i.test(lower)) {
    const lateClause = findMatch(/late|apr|cross-default/i);
    const crossClause = findMatch(/cross-default|wage|judgment/i);
    const steps = [
      { stage: 'Trigger Event', detail: q, tone: 'info' },
      {
        stage: 'Immediate Late Penalty',
        detail: lateClause
          ? `Triggered "${lateClause.title}" (Page ${lateClause.page}): ${lateClause.plainEnglish}`
          : 'Late fees and interest charges may begin accruing after the due date.',
        tone: lateClause ? 'red' : 'yellow'
      },
      {
        stage: 'Escalation / Acceleration Risk',
        detail: crossClause
          ? `"${crossClause.title}" (Page ${crossClause.page}) may trigger full balance recall, bank auto-debit retries, or aggressive recovery.`
          : 'Repeated missed payments can affect credit score and trigger default clauses.',
        tone: crossClause ? 'red' : 'yellow'
      },
      {
        stage: 'Preventive Recommendation',
        detail: 'Request a 5-day grace period, written cure notice before default, and cap on bounce/late penalties before signing.',
        tone: 'green'
      }
    ];
    return { scenarioTitle: q, groundedClauses: [lateClause, crossClause].filter(Boolean).map((c) => c.id), steps };
  }

  // Scenario 3: Account suspended / deactivated / fired / incentives cut
  if (/suspend|deactivat|fire|deduct|incentive|cut|complaint|rating/i.test(lower)) {
    const payClause = findMatch(/unilateral|net-60|holdback|deduct/i);
    const termClause = findMatch(/forfeiture|terminat|deactivat/i);
    const steps = [
      { stage: 'Trigger Event', detail: q, tone: 'info' },
      {
        stage: 'Immediate Account / Pay Consequence',
        detail: termClause
          ? `Triggered "${termClause.title}" (Page ${termClause.page}): ${termClause.plainEnglish}`
          : 'Platform/employer may suspend access pending review.',
        tone: 'red'
      },
      {
        stage: 'Pending Earnings Risk',
        detail: payClause
          ? `"${payClause.title}" (Page ${payClause.page}) allows withholding or recalculating pending payouts.`
          : 'Verify how completed earnings are settled upon deactivation.',
        tone: payClause ? 'red' : 'yellow'
      },
      {
        stage: 'Protective Question to Ask',
        detail: 'Ask in writing: "If my account is paused or disputed, will all already-completed earnings still be paid out on schedule with a clear appeal process?"',
        tone: 'green'
      }
    ];
    return { scenarioTitle: q, groundedClauses: [payClause, termClause].filter(Boolean).map((c) => c.id), steps };
  }

  // Scenario 4: General grounded fallback
  const top = findings[0];
  const hasRelevantText = q
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .some((w) => text.toLowerCase().includes(w));

  return {
    scenarioTitle: q,
    groundedClauses: top ? [top.id] : [],
    steps: [
      { stage: 'Hypothetical Scenario', detail: q, tone: 'info' },
      {
        stage: hasRelevantText ? 'Related Contract Risk Identified' : 'Not Explicitly Specified in Document',
        detail:
          hasRelevantText && top
            ? `Related clause "${top.title}" (Page ${top.page}): ${top.plainEnglish}`
            : 'I could not find this exact hypothetical clearly addressed in the uploaded contract — which itself is a gap worth clarifying in writing.',
        tone: hasRelevantText ? 'yellow' : 'info'
      },
      {
        stage: 'Suggested Safeguard',
        detail: top
          ? `Ask before signing: "${top.question}"`
          : 'Request a short written addendum clarifying how this situation will be handled.',
        tone: 'green'
      }
    ]
  };
}

/**
 * #22: Personal Contract Memory — Ask across ALL saved contracts in the Vault!
 */
export function queryContractMemory(allAnalyses = [], question = '') {
  const q = (question || '').trim().toLowerCase();
  if (!allAnalyses.length) {
    return {
      answer: 'Your Personal Contract Vault is empty right now. Analyze 1 or more contracts first so ContractLens Memory can search across them!',
      matchedContracts: []
    };
  }

  if (/auto[- ]?renew|renewal/i.test(q)) {
    const matches = allAnalyses.filter((a) =>
      (a.findings || []).some((f) => /renew/i.test(`${f.ruleId} ${f.title}`))
    );
    return {
      answer: matches.length
        ? `Found **${matches.length} contract(s)** in your Vault with automatic renewal conditions: ${matches.map((m) => `**${m.title}**`).join(', ')}.`
        : 'None of your currently saved contracts have an automatic renewal trap detected.',
      matchedContracts: matches.map((m) => ({ id: m.id, title: m.title, score: m.safetyScore }))
    };
  }

  if (/highest\s+financial|most\s+expensive|biggest\s+risk|riskiest|worst/i.test(q)) {
    const sorted = [...allAnalyses].sort(
      (a, b) => (b.financialExposure?.totalAtRisk || 0) - (a.financialExposure?.totalAtRisk || 0)
    );
    const top = sorted[0];
    return {
      answer: `Your highest financial-risk contract is **${top.title}** (Safety Score: **${top.safetyScore}/100**, estimated exposure: **${formatCurrencyAmount(
        top.financialExposure?.totalAtRisk || 0,
        top.currency
      )}**).`,
      matchedContracts: sorted.slice(0, 3).map((m) => ({ id: m.id, title: m.title, score: m.safetyScore }))
    };
  }

  if (/notice|30\s*days|60\s*days|90\s*days/i.test(q)) {
    const matches = allAnalyses.filter((a) => /(?:60|90|sixty|ninety)\s*\(?(?:60|90)?\)?\s*days|3\s*months/i.test(a.originalText || ''));
    return {
      answer: matches.length
        ? `Found **${matches.length} contract(s)** with notice periods longer than 30 days: ${matches.map((m) => `**${m.title}**`).join(', ')}.`
        : 'None of your saved contracts appear to require a notice period longer than 30 days.',
      matchedContracts: matches.map((m) => ({ id: m.id, title: m.title, score: m.safetyScore }))
    };
  }

  if (/penalty|penalties|fine|liquidated|forfeit/i.test(q)) {
    const matches = allAnalyses.filter((a) =>
      (a.findings || []).some((f) => /penalty|late|forfeit|liquidated|gag|prepayment/i.test(`${f.ruleId} ${f.title}`))
    );
    return {
      answer: matches.length
        ? `Found **${matches.length} contract(s)** containing penalty or forfeiture clauses: ${matches.map((m) => `**${m.title}**`).join(', ')}.`
        : 'No major penalty clauses found across your saved contracts.',
      matchedContracts: matches.map((m) => ({ id: m.id, title: m.title, score: m.safetyScore }))
    };
  }

  return {
    answer: `You currently have **${allAnalyses.length} contract(s)** stored in ContractLens Memory. Try asking: *"Which of my contracts have automatic renewal?"*, *"Which contract has the highest financial risk?"*, or *"Which contracts have notice periods longer than 30 days?"*`,
    matchedContracts: allAnalyses.slice(0, 4).map((m) => ({ id: m.id, title: m.title, score: m.safetyScore }))
  };
}

/**
 * #13: Multi-Version History Tracker (Version 1 -> Version 2 -> Version 3)
 */
export function analyzeVersionHistory(versions = []) {
  const valid = versions.filter((v) => v && v.text && v.text.trim().length > 25);
  if (valid.length < 2) throw new Error('Please provide at least 2 versions to track changes over time.');

  const analyzed = valid.map((v, i) =>
    analyzeContractLocal({ text: v.text, title: v.label || `Version ${i + 1}` })
  );

  const transitions = [];
  for (let i = 1; i < analyzed.length; i++) {
    const prev = analyzed[i - 1];
    const curr = analyzed[i];
    const prevMap = new Map(prev.findings.map((f) => [f.ruleId, f]));
    const currMap = new Map(curr.findings.map((f) => [f.ruleId, f]));

    const added = [...currMap.values()].filter((f) => !prevMap.has(f.ruleId));
    const removed = [...prevMap.values()].filter((f) => !currMap.has(f.ruleId));
    transitions.push({
      from: prev.title,
      to: curr.title,
      scoreFrom: prev.safetyScore,
      scoreTo: curr.safetyScore,
      scoreDelta: curr.safetyScore - prev.safetyScore,
      addedRisks: added.map((f) => f.title),
      removedRisks: removed.map((f) => f.title)
    });
  }

  return {
    versions: analyzed.map((a) => ({
      title: a.title,
      safetyScore: a.safetyScore,
      grade: a.grade,
      redCount: a.trafficLightCounts.red,
      yellowCount: a.trafficLightCounts.yellow,
      exposure: formatCurrencyAmount(a.financialExposure.totalAtRisk, a.currency)
    })),
    transitions
  };
}

/**
 * #25 + User's Special Request: Flexible 8-Language Voice Assistant (NEVER locked to English!)
 */
export function buildMultilingualVoiceScript({ analysis, lang = 'en', customTopic = 'briefing' }) {
  const langMeta = VOICE_LANGUAGES.find((l) => l.code === lang) || VOICE_LANGUAGES[0];
  const score = analysis.safetyScore;
  const red = analysis.trafficLightCounts?.red || 0;
  const yellow = analysis.trafficLightCounts?.yellow || 0;
  const exposure = formatCurrencyAmount(analysis.financialExposure?.totalAtRisk || 0, analysis.currency);
  const top1 = analysis.findings?.[0];
  const topTitles = (analysis.findings || []).slice(0, 3).map((f) => f.title).join(', ');

  // Support voice command topics ("cancel", "fees", "briefing") in ALL 8 languages!
  const templates = {
    en: {
      briefing: `ContractLens briefing for ${analysis.title}. Readiness score is ${score} out of 100. We found ${red} high-risk red clauses and ${yellow} yellow attention clauses, with estimated exposure of ${exposure}. Top warnings: ${topTitles || 'none'}. Consider clarifying these points before signing.`,
      cancel: top1
        ? `Regarding cancellation and exit: look at ${top1.sectionTitle} on page ${top1.page}. ${top1.plainEnglish} Ask: ${top1.question}`
        : `No harsh cancellation trap was detected in ${analysis.title}, but verify the written notice window.`
    },
    hi: {
      briefing: `${analysis.title} के लिए ContractLens सारांश। रेडीनेस स्कोर 100 में से ${score} है। हमें ${red} लाल उच्च-जोखिम शर्तें और ${yellow} पीली ध्यान देने योग्य शर्तें मिलीं, जिनमें लगभग ${exposure} का वित्तीय जोखिम हो सकता है। मुख्य चेतावनियाँ: ${topTitles || 'कोई बड़ा जोखिम नहीं'}। हस्ताक्षर करने से पहले इन्हें स्पष्ट करें।`,
      cancel: top1
        ? `रद्द करने या बाहर निकलने के नियम के लिए पेज ${top1.page} पर ${top1.sectionTitle} देखें। ${top1.plainEnglish}`
        : `इस अनुबंध में कोई बड़ा रद्दीकरण जाल नहीं मिला, फिर भी नोटिस अवधि जांच लें।`
    },
    kn: {
      briefing: `${analysis.title} ಒಪ್ಪಂದದ ContractLens ಸಾರಾಂಶ. ಸುರಕ್ಷತಾ ಅಂಕ 100 ರಲ್ಲಿ ${score}. ${red} ಕೆಂಪು ಹೆಚ್ಚಿನ ಅಪಾಯದ ಷರತ್ತುಗಳು ಮತ್ತು ${yellow} ಹಳದಿ ಷರತ್ತುಗಳು ಕಂಡುಬಂದಿವೆ. ಅಂದಾಜು ಆರ್ಥಿಕ ಅಪಾಯ ${exposure}. ಪ್ರಮುಖ ಎಚ್ಚರಿಕೆಗಳು: ${topTitles || 'ಯಾವುದೂ ಇಲ್ಲ'}. ಸಹಿ ಮಾಡುವ ಮೊದಲು ಪ್ರಶ್ನಿಸಿ.`,
      cancel: top1
        ? `ಒಪ್ಪಂದ ರದ್ದು ಮಾಡುವ ನಿಯಮಕ್ಕಾಗಿ ಪುಟ ${top1.page} ರಲ್ಲಿರುವ ${top1.sectionTitle} ನೋಡಿ. ${top1.plainEnglish}`
        : `ಯಾವುದೇ ಕಠಿಣ ರದ್ದತಿ ಷರತ್ತು ಕಂಡುಬಂದಿಲ್ಲ, ಆದರೆ ನೋಟಿಸ್ ಅವಧಿಯನ್ನು ದೃಢೀಕರಿಸಿ.`
    },
    ta: {
      briefing: `${analysis.title} ஒப்பந்தத்திற்கான ContractLens சுருக்கம். பாதுகாப்பு மதிப்பெண் 100-க்கு ${score}. ${red} சிவப்பு அபாய விதிகளும் ${yellow} மஞ்சள் விதிகளும் உள்ளன. மதிப்பிடப்பட்ட ஆபத்து ${exposure}. முக்கிய எச்சரிக்கைகள்: ${topTitles || 'எதுவும் இல்லை'}. கையெழுத்திடும் முன் தெளிவுபடுத்தவும்.`,
      cancel: top1
        ? `ரத்து விதிகளுக்கு பக்கம் ${top1.page}-இல் உள்ள ${top1.sectionTitle} பகுதியைப் பார்க்கவும். ${top1.plainEnglish}`
        : `கடுமையான ரத்து விதி எதுவும் இல்லை, அறிவிப்பு காலத்தை மட்டும் உறுதிப்படுத்தவும்.`
    },
    te: {
      briefing: `${analysis.title} ఒప్పందం కోసం ContractLens సారాంశం. భద్రతా స్కోరు 100 లో ${score}. ${red} ఎరుపు అధిక ప్రమాద నిబంధనలు మరియు ${yellow} పసుపు నిబంధనలు గుర్తించబడ్డాయి. అంచనా ఆర్థిక ప్రభావం ${exposure}. ముఖ్య హెచ్చరికలు: ${topTitles || 'లేవు'}. సంతకం చేసే ముందు స్పష్టత తీసుకోండి.`,
      cancel: top1
        ? `రద్దు నిబంధనల కోసం పేజీ ${top1.page} లోని ${top1.sectionTitle} చూడండి. ${top1.plainEnglish}`
        : `కఠినమైన రద్దు నిబంధన కనిపించలేదు, కానీ నోటీసు వ్యవధిని తనిఖీ చేయండి.`
    },
    mr: {
      briefing: `${analysis.title} करारासाठी ContractLens सारांश. तयारी गुण 100 पैकी ${score} आहेत. आम्हाला ${red} लाल उच्च-धोका आणि ${yellow} पिवळ्या अटी आढळल्या, अंदाजे आर्थिक धोका ${exposure} आहे. मुख्य सूचना: ${topTitles || 'काहीही नाही'}. स्वाक्षरी करण्यापूर्वी स्पष्टीकरण घ्या.`,
      cancel: top1
        ? `करार रद्द करण्याच्या अटींसाठी पान ${top1.page} वरील ${top1.sectionTitle} पहा. ${top1.plainEnglish}`
        : `कठोर रद्दीकरण अट आढळली नाही, तरीही नोटीस कालावधी तपासा.`
    },
    es: {
      briefing: `Resumen de ContractLens para ${analysis.title}. Puntuación de preparación: ${score} sobre 100. Detectamos ${red} cláusulas rojas de alto riesgo y ${yellow} amarillas, con exposición estimada de ${exposure}. Alertas principales: ${topTitles || 'ninguna'}. Clarifica estos puntos antes de firmar.`,
      cancel: top1
        ? `Sobre cancelación, revisa ${top1.sectionTitle} en la página ${top1.page}. ${top1.plainEnglish}`
        : `No se detectó una trampa grave de cancelación, pero confirma el plazo de preaviso.`
    },
    fr: {
      briefing: `Synthèse ContractLens pour ${analysis.title}. Score de préparation : ${score} sur 100. Nous avons relevé ${red} clauses rouges à haut risque et ${yellow} clauses jaunes, pour une exposition estimée à ${exposure}. Alertes clés : ${topTitles || 'aucune'}. Clarifiez ces points avant de signer.`,
      cancel: top1
        ? `Concernant la résiliation, consultez ${top1.sectionTitle} à la page ${top1.page}. ${top1.plainEnglish}`
        : `Aucun piège majeur de résiliation détecté, mais vérifiez le délai de préavis.`
    }
  };

  const pack = templates[langMeta.code] || templates.en;
  return {
    lang: langMeta.code,
    languageName: langMeta.name,
    speechLang: langMeta.speechLang,
    heading: `${langMeta.name} — Audio & Plain-Language Briefing`,
    spokenBriefing: pack[customTopic] || pack.briefing,
    jumpToFindingId: top1?.id || null,
    availableLanguages: VOICE_LANGUAGES
  };
}
