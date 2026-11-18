// ContractLens AI — Hackathon Winning Edge Modules
// 1. Jurisdiction Legality Shield (India / California / NY / US / UK)
// 2. What-If Financial Shock Simulator (₹ & $ aware!)
// 3. 1-Click Auto-Redline Diff Rewriter & Projected Score
// 4. Live AI Negotiation Sparring Arena
// 5. 6-Language Plain-English & Voice Briefing (EN, HI, KN, TA, ES, FR)

import { formatCurrencyAmount } from './analyzer.js';

export const JURISDICTIONS = [
  { id: 'india', label: 'India (Contract Act / MTA / RBI)' },
  { id: 'us_general', label: 'US Federal / General' },
  { id: 'california', label: 'California (US)' },
  { id: 'new_york', label: 'New York (US)' },
  { id: 'uk_eu', label: 'UK / EU Consumer Law' }
];

const STATUTORY_MATRIX = {
  'overbroad-non-compete': {
    india: {
      status: 'likely_illegal',
      badge: 'VOID Under Section 27',
      citation: 'Indian Contract Act, 1872 §27',
      note: 'Post-termination non-compete restraints stopping you from working in your trade/profession are strictly VOID in India.'
    },
    california: {
      status: 'likely_illegal',
      badge: 'Strictly VOID in California',
      citation: 'CA Bus. & Prof. Code §16600',
      note: 'Non-competes are void in California and attempting to enforce them violates state law.'
    },
    default: {
      status: 'restricted',
      badge: 'Frequently Unenforceable',
      citation: 'Restraint-of-Trade Doctrine',
      note: '24-month nationwide/global non-competes for gig workers or contractors fail judicial reasonableness tests.'
    }
  },
  'repair-shifting-habitability': {
    india: {
      status: 'likely_illegal',
      badge: 'Landlord Duty Under MTA',
      citation: 'Model Tenancy Act §15 & Transfer of Property Act §108',
      note: 'Structural, plumbing, and electrical wiring upkeep remain the landlord’s statutory responsibility.'
    },
    california: {
      status: 'likely_illegal',
      badge: 'Void Under CA Civil Code',
      citation: 'CA Civil Code §1941.1 & §1953',
      note: 'Any residential lease clause waiving habitability is legally void.'
    },
    new_york: {
      status: 'likely_illegal',
      badge: 'Void Under NY RPL §235-b',
      citation: 'NY Real Property Law §235-b',
      note: 'Warranty of habitability cannot be waived in residential leases.'
    },
    default: {
      status: 'likely_illegal',
      badge: 'Void Habitability Waiver',
      citation: 'Implied Warranty of Habitability',
      note: 'Landlords cannot force residential tenants to waive basic livability or pay for structural systems.'
    }
  },
  'deposit-vague-deductions': {
    india: {
      status: 'restricted',
      badge: 'Exceeds MTA Cap & Refund Rule',
      citation: 'Model Tenancy Act, 2021 §11',
      note: 'MTA recommends capping residential deposits at 2 months rent and forbids deducting for ordinary wear and tear.'
    },
    california: {
      status: 'likely_illegal',
      badge: 'Violates 21-Day Rule',
      citation: 'CA Civil Code §1950.5',
      note: 'Deposits must be refunded within 21 days with itemized receipts; normal wear and tear cannot be deducted.'
    },
    new_york: {
      status: 'likely_illegal',
      badge: 'Violates 14-Day Rule & 1-Mo Cap',
      citation: 'NY Gen. Oblig. Law §7-108',
      note: 'NY caps security deposits at 1 month rent and mandates itemized return within 14 days.'
    },
    default: {
      status: 'likely_illegal',
      badge: 'Exceeds Statutory Refund Window',
      citation: 'Tenant Security Deposit Statutes',
      note: '90-day holds and charging for normal wear & tear violate most residential tenancy statutes.'
    }
  },
  'cross-default-wage-judgment': {
    india: {
      status: 'likely_illegal',
      badge: 'Violates RBI & Contract Act §28',
      citation: 'Indian Contract Act §28 & RBI Fair Practices Code',
      note: 'Waiving court rights (confession of judgment) is void under §28; e-NACH mandates must stay revocable and salary attachment requires a court decree.'
    },
    default: {
      status: 'likely_illegal',
      badge: 'Banned by FTC / EFTA',
      citation: '16 CFR §444.2 & EFTA 15 U.S.C. §1693k',
      note: 'Confession of judgment and mandatory irrevocable electronic debits are banned in consumer lending.'
    }
  },
  'predatory-apr-compounding': {
    india: {
      status: 'likely_illegal',
      badge: 'Violates RBI Penal Charge Rules',
      citation: 'RBI Circular on Penal Charges (Aug 2023) & Digital Lending Guidelines',
      note: 'RBI prohibits capitalizing/compounding penal interest onto loan principal and requires upfront Key Fact Statement (KFS) disclosure.'
    },
    new_york: {
      status: 'likely_illegal',
      badge: 'Exceeds NY Usury Cap',
      citation: 'NY Gen. Oblig. Law §5-501',
      note: 'Exceeds New York’s 16% civil / 25% criminal usury thresholds.'
    },
    default: {
      status: 'restricted',
      badge: 'Exceeds Consumer APR Caps',
      citation: 'Consumer Credit Rate Cap Laws (36% Threshold)',
      note: 'Daily-compounded rates above 36% APR trigger predatory lending protections in many jurisdictions.'
    }
  },
  'unannounced-entry-liability-arbitration': {
    india: {
      status: 'likely_illegal',
      badge: 'Unilateral Arbitrator Invalid',
      citation: 'Model Tenancy Act §17 & Perkins Eastman SC Ruling (Arbitration Act §12(5))',
      note: 'Landlords must give 24h written notice before entry, and Supreme Court precedent invalidates sole unilateral appointment of an arbitrator by one party.'
    },
    default: {
      status: 'likely_illegal',
      badge: 'Violates Privacy & Fairness Law',
      citation: 'Quiet Enjoyment & Unconscionability Doctrine',
      note: 'Entry without 24h notice and one-sided arbitrator selection are widely unenforceable.'
    }
  },
  'sweeping-ip-assignment': {
    india: {
      status: 'restricted',
      badge: 'Exceeds Copyright Act §17',
      citation: 'Indian Copyright Act, 1957 §17(c)',
      note: 'Employer IP ownership covers work created in the course of employment — personal off-hours creations and post-exit trailers should be excluded.'
    },
    california: {
      status: 'likely_illegal',
      badge: 'Violates CA Labor Code §2870',
      citation: 'CA Labor Code §2870',
      note: 'Off-hours personal inventions made on your own equipment unrelated to company business are statutorily protected.'
    },
    default: {
      status: 'restricted',
      badge: 'Overbroad — Carve Out Required',
      citation: 'Employee Invention Protection Statutes',
      note: 'Demand a Prior Inventions & Personal Side-Projects carve-out and strike any 12-month trailer clause.'
    }
  },
  'uncapped-indemnity-gag': {
    india: {
      status: 'restricted',
      badge: 'Punitive Fines Capped (§74)',
      citation: 'Indian Contract Act, 1872 §74',
      note: 'Arbitrary ₹50,000 per-post fines are treated as unenforceable penalties rather than genuine loss.'
    },
    default: {
      status: 'likely_illegal',
      badge: 'Restricted by CRFA / NLRA',
      citation: 'Consumer Review Fairness Act',
      note: 'Gag fines penalizing truthful public reviews are unlawful.'
    }
  }
};

export function evaluateJurisdictionLegality(analysis, jurisdictionId = 'india') {
  const jInfo = JURISDICTIONS.find((j) => j.id === jurisdictionId) || JURISDICTIONS[0];
  const clauses = (analysis.findings || []).map((f) => {
    const entry = STATUTORY_MATRIX[f.ruleId];
    if (!entry) {
      return {
        findingId: f.id,
        title: f.title,
        status: 'enforceable_risky',
        badge: 'Legal But Unfair — Negotiate',
        citation: 'Freedom of Contract / Market Benchmark',
        note: 'Because this term can be legally enforced once signed, negotiate it in writing beforehand.'
      };
    }
    const spec = entry[jurisdictionId] || entry.default;
    return { findingId: f.id, title: f.title, ...spec };
  });

  return {
    jurisdiction: jInfo,
    illegalCount: clauses.filter((c) => c.status === 'likely_illegal').length,
    restrictedCount: clauses.filter((c) => c.status === 'restricted').length,
    clauses
  };
}

export function buildWhatIfScenarios(analysis) {
  const domain = analysis.contractType?.type || 'rental';
  const cur = analysis.currency || '₹';
  const isInr = cur === '₹';
  const fIds = new Set((analysis.findings || []).map((f) => f.ruleId));

  if (domain === 'rental') {
    return [
      {
        id: 'sim-exit',
        icon: '✈️',
        title: 'You relocate cities in Month 5',
        activeByDefault: true,
        predatoryCost: fIds.has('early-termination-forfeiture') ? (isInr ? 252000 : 10750) : (isInr ? 28000 : 2150),
        fairCost: isInr ? 28000 : 2150,
        explanation: fIds.has('early-termination-forfeiture')
          ? `Forfeits your entire security deposit PLUS 3 months liquidated rent damages (${formatCurrencyAmount(isInr ? 252000 : 10750, cur)} shock)!`
          : 'Standard 1-month notice exit with deposit refunded.'
      },
      {
        id: 'sim-renew',
        icon: '📅',
        title: 'You forget registered-post notice 90 days before expiry',
        activeByDefault: true,
        predatoryCost: fIds.has('auto-renewal-rent-hike') ? (isInr ? 50400 : 3096) : 0,
        fairCost: 0,
        explanation: fIds.has('auto-renewal-rent-hike')
          ? `Silently auto-renews for 12 more months at a +15% rent hike (${formatCurrencyAmount(isInr ? 50400 : 3096, cur)} extra/yr).`
          : 'Converts safely to opt-in renewal with zero surprise hike.'
      },
      {
        id: 'sim-repair',
        icon: '🔧',
        title: 'Concealed plumbing & AC compressor fail in Month 3',
        activeByDefault: false,
        predatoryCost: fIds.has('repair-shifting-habitability') ? (isInr ? 25000 : 1500) : 0,
        fairCost: 0,
        explanation: fIds.has('repair-shifting-habitability')
          ? `The "AS-IS" repair-shifting clause forces YOU to pay up to ${formatCurrencyAmount(isInr ? 25000 : 1500, cur)} for landlord infrastructure.`
          : 'Landlord covers 100% of structural & major utility repairs.'
      },
      {
        id: 'sim-fees',
        icon: '💸',
        title: '12 months of mandatory add-on & upfront junk fees',
        activeByDefault: true,
        predatoryCost: (fIds.has('mandatory-junk-fees') ? (isInr ? 69000 : 2100) : 0) + (fIds.has('non-refundable-upfront-fees') ? (isInr ? 22500 : 825) : 0),
        fairCost: 0,
        explanation: 'Mandatory monthly amenity/tech/billing charges plus non-refundable painting & move-in fees silently drain your wallet.'
      }
    ];
  }

  if (domain === 'loan') {
    return [
      {
        id: 'sim-day1',
        icon: '🏦',
        title: 'Day 1 disbursement hits your bank account',
        activeByDefault: true,
        predatoryCost: fIds.has('origination-fee-deduction') ? (isInr ? 20500 : 1470) : 0,
        fairCost: 0,
        explanation: `Upfront 9% origination + verification fee (${formatCurrencyAmount(isInr ? 20500 : 1470, cur)}) deducted before payout while charging 38.5% APR on the full principal!`
      },
      {
        id: 'sim-foreclose',
        icon: '🚀',
        title: 'You close the loan early after 12 months',
        activeByDefault: true,
        predatoryCost: fIds.has('prepayment-penalty') ? (isInr ? 34000 : 2950) : 0,
        fairCost: 0,
        explanation: '6% foreclosure penalty + 6 months unearned interest punishes you for paying off debt early.'
      },
      {
        id: 'sim-cross',
        icon: '⚡',
        title: 'You dispute an unrelated credit card bill',
        activeByDefault: false,
        predatoryCost: fIds.has('cross-default-wage-judgment') ? (isInr ? 50000 : 3750) : 0,
        fairCost: 0,
        explanation: 'Cross-Default clause lets this lender demand immediate full payoff + 25% collection fees even if you paid every EMI on time!'
      },
      {
        id: 'sim-emi-fees',
        icon: '💳',
        title: '36 months of account maintenance & UPI convenience fees',
        activeByDefault: true,
        predatoryCost: fIds.has('mandatory-junk-fees') ? (isInr ? 26964 : 1675) : 0,
        fairCost: 0,
        explanation: 'Recurring monthly maintenance and per-payment convenience fees add thousands on top of interest.'
      }
    ];
  }

  return [
    {
      id: 'sim-next-gig',
      icon: '🚫',
      title: 'You switch to another platform / tech company after exiting',
      activeByDefault: true,
      predatoryCost: fIds.has('overbroad-non-compete') ? (isInr ? 250000 : 50000) : 0,
      fairCost: 0,
      explanation: `24-month non-compete threatens an immediate ${formatCurrencyAmount(isInr ? 250000 : 50000, cur)} liquidated damages penalty!`
    },
    {
      id: 'sim-clawback',
      icon: '📉',
      title: 'Platform cuts incentives or withholds payout over a rating dispute',
      activeByDefault: true,
      predatoryCost: fIds.has('net-60-90-holdback') || fIds.has('unilateral-rate-modification') ? (isInr ? 35000 : 4500) : 0,
      fairCost: 0,
      explanation: 'Unilateral retroactive incentive cuts & subjective 100% clawbacks put your earned payouts at constant risk.'
    },
    {
      id: 'sim-ip',
      icon: '💻',
      title: 'You build a personal weekend side project',
      activeByDefault: false,
      predatoryCost: fIds.has('sweeping-ip-assignment') ? (isInr ? 200000 : 25000) : 0,
      fairCost: 0,
      explanation: fIds.has('sweeping-ip-assignment')
        ? 'Sweeping IP & 12-month Trailer Clause tries to claim ownership of your off-hours personal creations!'
        : 'Off-hours personal projects remain 100% yours.'
    },
    {
      id: 'sim-review',
      icon: '💬',
      title: 'You post an honest review about working conditions',
      activeByDefault: false,
      predatoryCost: fIds.has('uncapped-indemnity-gag') ? (isInr ? 50000 : 10000) : 0,
      fairCost: 0,
      explanation: fIds.has('uncapped-indemnity-gag')
        ? `Gag clause threatens a ${formatCurrencyAmount(isInr ? 50000 : 10000, cur)} fine per negative public post.`
        : 'Truthful reviews carry zero financial penalty.'
    }
  ];
}

export function generateAutoRedline(analysis, fixFindingIds = []) {
  const fixSet = new Set(fixFindingIds);
  const text = analysis.originalText || '';
  const allFindings = analysis.findings || [];
  const remaining = allFindings.filter((f) => !fixSet.has(f.id));
  const fixed = allFindings.filter((f) => fixSet.has(f.id));
  const remPenalty = remaining.reduce((sum, f) => sum + (f.weight || 10), 0);
  const projectedScore = Math.max(8, Math.min(98, Math.round(100 * Math.exp(-remPenalty / 72))));
  const projectedGrade = projectedScore < 30 ? 'F' : projectedScore < 50 ? 'D' : projectedScore < 68 ? 'C' : projectedScore < 84 ? 'B' : 'A';

  const fixedSpans = fixed
    .filter((f) => typeof f.start === 'number' && f.end > f.start)
    .sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  const segments = [];
  const cleanParts = [];
  let cursor = 0;

  for (const f of fixedSpans) {
    const start = Math.max(f.start, cursor);
    if (start >= f.end) continue;
    if (start > cursor) {
      const chunk = text.slice(cursor, start);
      segments.push({ type: 'unchanged', text: chunk });
      cleanParts.push(chunk);
    }
    segments.push({ type: 'replaced', findingId: f.id, title: f.title, removed: text.slice(start, f.end), inserted: f.fairRedline });
    cleanParts.push(f.fairRedline);
    cursor = f.end;
  }
  if (cursor < text.length) {
    const tail = text.slice(cursor);
    segments.push({ type: 'unchanged', text: tail });
    cleanParts.push(tail);
  }

  return {
    originalScore: analysis.safetyScore,
    originalGrade: analysis.grade,
    projectedScore,
    projectedGrade,
    scoreGain: projectedScore - analysis.safetyScore,
    fixedCount: fixed.length,
    remainingCount: remaining.length,
    segments,
    cleanContractText: cleanParts.join('')
  };
}

const PERSONAS = {
  rental: { role: 'Property Manager / Landlord Rep', avatar: '🏢', opening: "That's our standard apartment lease format — all residents sign the same draft." },
  loan: { role: 'Loan Underwriting Officer', avatar: '🏦', opening: 'These rates and fee terms are generated automatically by our lending policy.' },
  employment: { role: 'Platform Legal / HR Operations', avatar: '💼', opening: 'We use one uniform partner/contractor template for everyone to keep onboarding quick.' }
};

export function simulateNegotiationTurn({ analysis, clauseId, difficulty = 'tough', userMessage = '', turnNumber = 1, currentLeverage = 35 }) {
  const domain = analysis.contractType?.type || 'rental';
  const persona = PERSONAS[domain] || PERSONAS.employment;
  const finding = (analysis.findings || []).find((f) => f.id === clauseId) || (analysis.findings || [])[0];

  if (!finding) {
    return {
      persona,
      opponentReply: 'This contract looks fairly clean. What specific point would you like clarified?',
      leverageScore: 80,
      concessionStatus: 'conceded',
      coachTip: 'Ask for written confirmation that no separate hidden fee schedule applies.',
      suggestedMoves: ['Can you confirm all fees are contained in this agreement?']
    };
  }

  if (!userMessage.trim()) {
    return {
      persona,
      clauseTitle: finding.title,
      opponentReply: `${persona.opening} Regarding "${finding.title}" — what exactly did you want changed?`,
      leverageScore: 35,
      concessionStatus: 'opening',
      coachTip: `Anchor to market norms ("${finding.benchmark}") and offer concrete fair wording.`,
      suggestedMoves: [
        `I'm ready to sign today, but "${finding.title}" is far outside market norms. ${finding.benchmark} Can we update it to: "${finding.fairRedline}"?`,
        `My legal review flagged "${finding.title}" as potentially unenforceable under statutory protections (Indian Contract Act / RBI / Tenancy Law). Let's revise it to protect both sides.`,
        `I'm comparing another offer with standard fair terms — removing "${finding.title}" gets my signature immediately.`
      ]
    };
  }

  const lower = userMessage.toLowerCase();
  let delta = 12;
  const strengths = [];
  if (/law|statut|illegal|void|rbi|section 27|section 74|mta|ftc|efta|civil code|legal|unenforceable/i.test(lower)) {
    delta += 22;
    strengths.push('Cited legal/statutory leverage');
  }
  if (/benchmark|standard|market|other offer|competing|alternative|cannot sign|walk away/i.test(lower)) {
    delta += 18;
    strengths.push('Used BATNA & market benchmark');
  }
  if (/update|replace|cap|mutual|30 days|24 hours|weekly|net-15|remove|redline|sign today|in writing/i.test(lower)) {
    delta += 18;
    strengths.push('Proposed actionable redline');
  }
  if (/please|ready to sign|excited|fair for both|appreciate/i.test(lower)) {
    delta += 8;
    strengths.push('Collaborative deal-closing tone');
  }

  const diffMod = difficulty === 'hardball' ? -10 : difficulty === 'reasonable' ? 12 : 0;
  const newLeverage = Math.max(15, Math.min(100, currentLeverage + delta + diffMod));

  if (newLeverage >= 80 || (difficulty === 'reasonable' && newLeverage >= 68)) {
    return {
      persona,
      clauseTitle: finding.title,
      opponentReply: `Fair point — you clearly know your rights and market benchmarks. I got quick approval from management: we will accept your fair wording on "${finding.title}". Sending the revised draft right now!`,
      leverageScore: newLeverage,
      concessionStatus: 'conceded',
      coachTip: `🏆 CONCESSION WON! (${strengths.join(' · ') || 'Strong counter-offer'}). Select another clause to win your next redline!`,
      suggestedMoves: ['Thank you! Please email the updated written addendum and I will sign right away.'],
      turnNumber: turnNumber + 1
    };
  }

  if (newLeverage >= 55) {
    return {
      persona,
      clauseTitle: finding.title,
      opponentReply: `I see your point on "${finding.title}". I can't erase the whole clause unilaterally, so what if we soften it halfway? Would a partial adjustment work?`,
      leverageScore: newLeverage,
      concessionStatus: 'compromise',
      coachTip: 'They blinked! Hold firm and tie signing today to your exact fair redline wording + statutory rules.',
      suggestedMoves: [
        `I appreciate meeting halfway — if we adopt this exact clean text ("${finding.fairRedline}"), I'll sign today.`,
        `Half-measures still create unenforceable legal risk under local law. Aligning with standard terms (${finding.benchmark}) keeps both of us safe.`
      ],
      turnNumber: turnNumber + 1
    };
  }

  return {
    persona,
    clauseTitle: finding.title,
    opponentReply: `Honestly, "${finding.title}" is just standard boilerplate — we rarely enforce it in practice and everyone else signs it without fuss.`,
    leverageScore: newLeverage,
    concessionStatus: 'pushback',
    coachTip: 'Classic "we never enforce it" pushback! Reply: "If you never enforce it, let’s update the written text to match!" and cite law + benchmark.',
    suggestedMoves: [
      `If you never intend to enforce "${finding.title}", updating the text to "${finding.fairRedline}" has zero downside and lets me sign today.`,
      `Under statutory law & standard market practice (${finding.benchmark}), this clause is non-standard. I'm comparing two offers and need this fixed in writing.`
    ],
    turnNumber: turnNumber + 1
  };
}

const LANG_PACKS = {
  en: {
    name: 'English',
    speechLang: 'en-US',
    heading: 'Plain-English Voice Briefing',
    build: (a) =>
      `Attention before signing ${a.title}. ContractLens gives this ${a.contractType.label} a Safety Score of ${a.safetyScore} out of 100, Grade ${a.grade}. We found ${a.trafficLightCounts.red} high-risk red clauses and ${a.trafficLightCounts.yellow} yellow attention clauses, with ${formatCurrencyAmount(a.financialExposure.totalAtRisk, a.currency)} in estimated risk exposure. Top warnings: ${a.findings.slice(0, 3).map((f) => f.title).join(', ')}. Ask the suggested questions before signing.`
  },
  hi: {
    name: 'हिन्दी (Hindi)',
    speechLang: 'hi-IN',
    heading: 'सरल हिन्दी सारांश और ऑडियो ब्रीफिंग',
    build: (a) =>
      `${a.title} पर हस्ताक्षर करने से पहले सावधान रहें। ContractLens ने इसे 100 में से ${a.safetyScore} सुरक्षा स्कोर (ग्रेड ${a.grade}) दिया है। इसमें ${a.trafficLightCounts.red} लाल (उच्च जोखिम) और ${a.trafficLightCounts.yellow} पीली (ध्यान देने योग्य) शर्तें मिली हैं, जिनमें लगभग ${formatCurrencyAmount(a.financialExposure.totalAtRisk, a.currency)} का वित्तीय खतरा है। मुख्य चेतावनियाँ: ${a.findings.slice(0, 3).map((f) => f.title).join(', ')}। हस्ताक्षर करने से पहले इन शर्तों को लिखित रूप में बदलवाएं।`
  },
  kn: {
    name: 'ಕನ್ನಡ (Kannada)',
    speechLang: 'kn-IN',
    heading: 'ಸರಳ ಕನ್ನಡ ವಿವರಣೆ ಮತ್ತು ಆಡಿಯೋ ಸಾರಾಂಶ',
    build: (a) =>
      `${a.title} ಒಪ್ಪಂದಕ್ಕೆ ಸಹಿ ಹಾಕುವ ಮೊದಲು ಎಚ್ಚರ! ContractLens ಈ ಒಪ್ಪಂದಕ್ಕೆ 100 ರಲ್ಲಿ ${a.safetyScore} ಸುರಕ್ಷತಾ ಅಂಕ (ಗ್ರೇಡ್ ${a.grade}) ನೀಡಿದೆ. ಇದರಲ್ಲಿ ${a.trafficLightCounts.red} ಕೆಂಪು (ಹೆಚ್ಚಿನ ಅಪಾಯ) ಮತ್ತು ${a.trafficLightCounts.yellow} ಹಳದಿ ಷರತ್ತುಗಳಿವೆ, ಅಂದಾಜು ${formatCurrencyAmount(a.financialExposure.totalAtRisk, a.currency)} ಆರ್ಥಿಕ ಅಪಾಯವಿದೆ. ಪ್ರಮುಖ ಎಚ್ಚರಿಕೆಗಳು: ${a.findings.slice(0, 3).map((f) => f.title).join(', ')}.`
  },
  ta: {
    name: 'தமிழ் (Tamil)',
    speechLang: 'ta-IN',
    heading: 'எளிய தமிழ் விளக்கம் & ஆடியோ சுருக்கம்',
    build: (a) =>
      `${a.title} ஒப்பந்தத்தில் கையெழுத்திடும் முன் கவனம்! ContractLens இதற்கு 100-க்கு ${a.safetyScore} பாதுகாப்பு மதிப்பெண் (தரம் ${a.grade}) வழங்கியுள்ளது. இதில் ${a.trafficLightCounts.red} சிவப்பு அபாய விதிகளும் ${formatCurrencyAmount(a.financialExposure.totalAtRisk, a.currency)} கட்டண ஆபத்தும் உள்ளன. முக்கிய எச்சரிக்கைகள்: ${a.findings.slice(0, 3).map((f) => f.title).join(', ')}.`
  },
  es: {
    name: 'Español (Spanish)',
    speechLang: 'es-ES',
    heading: 'Resumen en Español y Briefing de Voz',
    build: (a) =>
      `Atención antes de firmar ${a.title}. ContractLens otorga una puntuación de seguridad de ${a.safetyScore} sobre 100 (Grado ${a.grade}), con ${a.trafficLightCounts.red} cláusulas rojas de alto riesgo y ${formatCurrencyAmount(a.financialExposure.totalAtRisk, a.currency)} en exposición financiera. Principales alertas: ${a.findings.slice(0, 3).map((f) => f.title).join(', ')}.`
  },
  fr: {
    name: 'Français (French)',
    speechLang: 'fr-FR',
    heading: 'Synthèse en Français et Briefing Audio',
    build: (a) =>
      `Attention avant de signer ${a.title}. ContractLens attribue un score de sécurité de ${a.safetyScore} sur 100 (Note ${a.grade}), avec ${a.trafficLightCounts.red} clauses rouges à haut risque et ${formatCurrencyAmount(a.financialExposure.totalAtRisk, a.currency)} d'exposition financière. Alertes clés : ${a.findings.slice(0, 3).map((f) => f.title).join(', ')}.`
  }
};

export function getLocalizedBriefing(analysis, lang = 'en') {
  const pack = LANG_PACKS[lang] || LANG_PACKS.en;
  return {
    lang: LANG_PACKS[lang] ? lang : 'en',
    languageName: pack.name,
    speechLang: pack.speechLang,
    heading: pack.heading,
    spokenBriefing: pack.build(analysis)
  };
}
