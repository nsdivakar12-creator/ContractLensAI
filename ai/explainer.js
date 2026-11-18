// Ideas 2, 3, 4 — Real-Time Clause Explainer Engine
// Powers:
// - Idea 2: ContractLens Browser Assistant ("Explain this" / "Check risks" on any webpage)
// - Idea 3: Floating "Explain with AI" button inside the interactive PDF/Document Reader
// - Idea 4: Embedded "Understand This with AI" Partner Widget (Snabbit/Rapido/Blinkit/Loan Apps)

import { analyzeContractLocal } from './analyzer.js';
import { LEGAL_GLOSSARY } from './legalTranslator.js';

const MICRO_PATTERNS = [
  {
    match: /security\s+deposit|adjustment\s+for\s+damages|other\s+obligations|wear\s+and\s+tear/i,
    trafficLight: 'red',
    label: 'Security Deposit Deduction Clause',
    simpleMeaning:
      'The landlord may keep part or all of your security deposit to cover damages, unpaid dues, painting, or vague "other obligations."',
    whatIsUnclear:
      'The agreement does not clearly define what counts as "other obligations" or separate normal wear and tear from actual damage.',
    affectsIncomeOrWallet: 'Yes — your refundable deposit could be heavily reduced without itemized proof.',
    deductionsRisk: 'Possible deductions for painting, wear & tear, admin charges, and undefined dues.',
    whyYouShouldCheck:
      'Vague deposit wording is the #1 source of tenant-landlord disputes at move-out.',
    askBeforeAgreeing: [
      'Can you provide a written list of the exact situations in which the security deposit will be deducted?',
      'Will you confirm normal wear and tear is excluded and itemized bills are shared within 15–21 days?'
    ]
  },
  {
    match: /adjust\s+incentives|deduct\s+applicable\s+charges|modify\s+compensation|recalculate\s+pay|claw\s+back|incentive\s+structures/i,
    trafficLight: 'red',
    label: 'Payment, Incentives & Deductions Clause',
    simpleMeaning:
      'The platform can change your incentive rates, modify payout rules, or deduct charges from your earnings whenever it chooses.',
    whatIsUnclear:
      'The agreement does not specify when changes can happen, maximum deduction caps, or how much advance notice you will get.',
    affectsIncomeOrWallet: 'Yes — your take-home earnings may drop unpredictably even for the same effort.',
    deductionsRisk: 'Platform can deduct penalties, cancelled-slot charges, or claw back payouts on subjective complaints.',
    whyYouShouldCheck:
      'You need predictable pay rules and advance written notice before any payout cut takes effect.',
    askBeforeAgreeing: [
      'Can incentives or base pay be changed without prior written notice?',
      'What exact deductions can be applied to my earnings, and is there a dispute/appeal process?'
    ]
  },
  {
    match: /automatically\s+renew|auto[- ]?renew|registered\s+post|certified\s+mail|increased\s+by\s+\d+%/i,
    trafficLight: 'red',
    label: 'Automatic Renewal & Price Escalation',
    simpleMeaning:
      'If you forget to cancel months before the end date using formal mail, you get locked into another full year—often at a higher rent or price.',
    whatIsUnclear:
      'Strict notice deadlines (60–90 days early) and postal requirements make it easy to miss by mistake.',
    affectsIncomeOrWallet: 'Yes — locks you into 12 extra months plus an automatic 10%–15% hike.',
    deductionsRisk: 'Breaking the auto-renewed term usually triggers deposit forfeiture or break fees.',
    whyYouShouldCheck:
      'Opt-in renewal with 30-day email notice is much safer than silent auto-renewal.',
    askBeforeAgreeing: [
      'Can we remove automatic renewal so it only renews if both sides confirm in writing?',
      'Can cancellation notice be sent via email 30 days prior instead of 90 days by registered post?'
    ]
  },
  {
    match: /origination|processing\s+fee|apr|compounded\s+daily|prepayment|foreclosure|cross-default|e-nach|auto-debit/i,
    trafficLight: 'red',
    label: 'Loan Cost, APR & Default Trap',
    simpleMeaning:
      'This loan term adds hidden upfront fee deductions, high compounding interest, early payoff penalties, or harsh default triggers.',
    whatIsUnclear:
      'Headline numbers often hide the true all-in APR and total rupee/dollar cost across the full loan tenure.',
    affectsIncomeOrWallet: 'Yes — increases your total repayment significantly and may trigger bank bounce fees.',
    deductionsRisk: 'Upfront origination deductions, bounce charges, and foreclosure penalties.',
    whyYouShouldCheck:
      'Ask for a written Key Fact Statement (KFS) showing net disbursed cash and exact total repayment.',
    askBeforeAgreeing: [
      'What is the exact net amount transferred to my bank and the true all-in APR?',
      'Can I close or prepay the loan early with zero foreclosure penalty?'
    ]
  },
  {
    match: /non-compete|exclusivity|intellectual\s+property|personal\s+time|trailer\s+clause|liquidated\s+damages/i,
    trafficLight: 'red',
    label: 'Work Freedom, IP & Penalty Restriction',
    simpleMeaning:
      'Restricts where you can work next, blocks you from working on other apps/clients, claims your personal side projects, or imposes a huge fixed fine.',
    whatIsUnclear:
      'Overbroad scope ("anywhere in India/world" or "personal time") goes far beyond protecting genuine trade secrets.',
    affectsIncomeOrWallet: 'Yes — limits your future income options and exposes you to steep penalty claims.',
    deductionsRisk: 'Threatens fixed liquidated damages fines or forfeiture of unpaid earnings.',
    whyYouShouldCheck:
      'Many broad non-competes and off-hours IP grabs are legally unenforceable (e.g., Indian Contract Act §27 / CA §16600).',
    askBeforeAgreeing: [
      'Can we remove the non-compete/exclusivity restriction and rely on a standard NDA?',
      'Will you confirm my off-hours personal projects remain 100% mine?'
    ]
  },
  {
    match: /indemnif|not\s+be\s+liable|negligence|arbitration|waives?|confession\s+of\s+judgment|disparagement/i,
    trafficLight: 'yellow',
    label: 'Liability, Indemnity & Rights Waiver',
    simpleMeaning:
      'Shifts legal risk onto your shoulders, limits the company/landlord’s responsibility, or restricts how you can resolve disputes in court.',
    whatIsUnclear:
      'Often lacks any financial cap on your liability or forces one-sided arbitrator selection.',
    affectsIncomeOrWallet: 'Potentially severe — uncapped legal fees or third-party claims can threaten personal savings.',
    deductionsRisk: 'You could be billed for the other side’s attorney fees even if you dispute an unfair charge.',
    whyYouShouldCheck:
      'Every party should remain accountable for its own negligence, with capped mutual liability.',
    askBeforeAgreeing: [
      'Can we cap my liability and make indemnity and legal-fee recovery strictly mutual?',
      'Can disputes be resolved in local courts or by a mutually agreed neutral arbitrator?'
    ]
  }
];

/**
 * Explains ANY selected sentence, paragraph, webpage snippet, or partner onboarding clause!
 */
export function explainSelectedPassage({ text = '', contextMode = 'reader' }) {
  const clean = (text || '').trim();
  if (clean.length < 10) {
    throw new Error('Please select or provide at least a short sentence (10+ characters) to explain.');
  }

  // Detect any legal jargon words inside the selected passage
  const lower = clean.toLowerCase();
  const detectedTerms = LEGAL_GLOSSARY.filter(
    (g) => lower.includes(g.term.toLowerCase()) || (g.aliases || []).some((a) => lower.includes(a.toLowerCase()))
  ).map((g) => ({
    id: g.id,
    term: g.term,
    simpleMeaning: g.simpleMeaning,
    eli5: g.eli5
  }));

  // Match targeted micro-pattern first
  const matchedPattern = MICRO_PATTERNS.find((p) => p.match.test(clean));
  if (matchedPattern) {
    return {
      contextMode,
      excerpt: clean.slice(0, 360),
      trafficLight: matchedPattern.trafficLight,
      label: matchedPattern.label,
      simpleMeaning: matchedPattern.simpleMeaning,
      whatIsUnclear: matchedPattern.whatIsUnclear,
      affectsIncomeOrWallet: matchedPattern.affectsIncomeOrWallet,
      deductionsRisk: matchedPattern.deductionsRisk,
      whyYouShouldCheck: matchedPattern.whyYouShouldCheck,
      askBeforeAgreeing: matchedPattern.askBeforeAgreeing,
      detectedTerms
    };
  }

  // Fallback: run full analyzer on passage if long enough
  if (clean.length >= 40) {
    try {
      const mini = analyzeContractLocal({ text: clean, title: 'Selected Passage' });
      if (mini.findings.length > 0) {
        const f = mini.findings[0];
        return {
          contextMode,
          excerpt: clean.slice(0, 360),
          trafficLight: f.trafficLight,
          label: f.title,
          simpleMeaning: f.plainEnglish,
          whatIsUnclear: f.unclearWording,
          affectsIncomeOrWallet: f.whyItMatters,
          deductionsRisk: f.worstCase,
          whyYouShouldCheck: f.whyItMatters,
          askBeforeAgreeing: [f.question],
          detectedTerms
        };
      }
    } catch {
      // fall through
    }
  }

  // Clean/informational passage response (Green / Yellow)
  const hasMoneyOrDate = /[₹$]\s?[\d,]+|\d+%|\d+\s*(?:days?|months?|years?)/i.test(clean);
  return {
    contextMode,
    excerpt: clean.slice(0, 360),
    trafficLight: hasMoneyOrDate ? 'yellow' : 'green',
    label: hasMoneyOrDate ? 'Financial / Timeline Term — Verify Numbers' : 'Standard / Informational Clause',
    simpleMeaning: hasMoneyOrDate
      ? 'This sentence states specific amounts, percentages, or deadlines that define your financial or timing commitments.'
      : 'This looks like a standard informational clause describing basic roles, identities, or general scope without obvious hidden traps.',
    whatIsUnclear: hasMoneyOrDate
      ? 'Check whether the stated figures are all-inclusive and whether any exceptions apply in later sections.'
      : 'Confirm that names, dates, and descriptions match what was discussed verbally.',
    affectsIncomeOrWallet: hasMoneyOrDate
      ? 'Yes — double-check every rupee/dollar figure and due date mentioned here.'
      : 'Low direct financial impact on its own.',
    deductionsRisk: hasMoneyOrDate ? 'Verify no separate penalty or fee schedule modifies these numbers.' : 'No hidden deductions detected in this passage.',
    whyYouShouldCheck: 'Always verify exact numbers and written commitments match what you were promised.',
    askBeforeAgreeing: [
      'Are all fees, dates, and expectations connected to this clause completely written here with no hidden addenda?'
    ],
    detectedTerms
  };
}
