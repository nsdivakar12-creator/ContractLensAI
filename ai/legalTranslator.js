// Idea 9 (COMPULSORY) — "Legal Terms Translator"
// Explains legal jargon with Simple Meaning, "Explain like I'm new to contracts" (ELI5),
// and dynamic "In This Contract" contextualization!

export const LEGAL_GLOSSARY = [
  {
    id: 'indemnity',
    term: 'Indemnity',
    aliases: ['indemnify', 'indemnification', 'hold harmless'],
    riskLevel: 'red',
    category: 'Liability & Risk',
    simpleMeaning:
      'A condition where one party promises to pay for losses, lawsuits, fines, or legal fees suffered by the other party.',
    eli5:
      'Think of it like becoming a free insurance company for the other side: if someone sues them over anything linked to your work or stay, YOU have to pay their lawyers and bills—even out of your own pocket!',
    watchOut:
      'Look for the words "without any cap" or one-sided indemnity. Always ask for mutual indemnity capped at the fees or rent you actually paid.',
    questionToAsk:
      'Can we make indemnity mutual and cap my maximum responsibility at the amount paid under this contract?'
  },
  {
    id: 'liability',
    term: 'Liability',
    aliases: ['liable', 'limitation of liability', 'not be liable'],
    riskLevel: 'red',
    category: 'Liability & Risk',
    simpleMeaning:
      'Legal and financial responsibility when something goes wrong, such as injury, damage, or financial loss.',
    eli5:
      'Liability simply means "who pays when something breaks or someone gets hurt." If a contract says the company has "zero liability," they are trying to dodge paying even when it was their own fault.',
    watchOut:
      'Never sign a clause that removes the other party’s liability for their own negligence (like a landlord ignoring mold or broken wiring).',
    questionToAsk:
      'Will you confirm you remain legally responsible for damage or injury caused by your own negligence?'
  },
  {
    id: 'arbitration',
    term: 'Arbitration',
    aliases: ['binding arbitration', 'arbitrator'],
    riskLevel: 'yellow',
    category: 'Disputes',
    simpleMeaning:
      'A private dispute process outside regular public courts where a hired arbitrator makes a final, binding decision.',
    eli5:
      'Instead of going to a normal judge in court, you agree to settle fights in a private room with a referee. The catch? If the company picks the referee and forces you to fly to their city, the game is tilted against you.',
    watchOut:
      'Watch out for "arbitrator selected solely by Company/Landlord" or forcing you to pay their legal fees even if you win.',
    questionToAsk:
      'Can we keep local small-claims court access and require a mutually agreed neutral arbitrator?'
  },
  {
    id: 'termination',
    term: 'Termination',
    aliases: ['terminate', 'deactivation', 'early termination'],
    riskLevel: 'yellow',
    category: 'Exit Rules',
    simpleMeaning:
      'The rules explaining how, when, and under what penalties either side can end the contract early.',
    eli5:
      'It is the "break-up clause." Fair contracts let both people break up with the same notice (like 30 days). Unfair contracts let them dump you instantly while trapping you for 60–90 days or keeping your deposit.',
    watchOut:
      'Check if notice periods are symmetric and verify you still get paid for work already completed.',
    questionToAsk:
      'Can we make the termination notice period identical for both parties and confirm earned pay/deposits are not forfeited?'
  },
  {
    id: 'breach',
    term: 'Breach',
    aliases: ['event of default', 'default'],
    riskLevel: 'yellow',
    category: 'Obligations',
    simpleMeaning:
      'Breaking or failing to follow any promise or deadline written inside the contract.',
    eli5:
      'A breach means breaking a rule in the agreement—like paying rent 2 days late or missing a deadline. Fair contracts give you a short warning ("cure period") to fix a small mistake before punishing you.',
    watchOut:
      'Check whether tiny delays instantly trigger "default" without giving you 7–15 days written notice to fix it.',
    questionToAsk:
      'If a minor issue or payment delay happens, do I get written notice and a grace period to fix it before penalties apply?'
  },
  {
    id: 'jurisdiction',
    term: 'Jurisdiction',
    aliases: ['governing law', 'venue', 'exclusive courts'],
    riskLevel: 'green',
    category: 'Disputes',
    simpleMeaning:
      'Which city, state, or country’s laws apply to the contract and where any legal case must be filed.',
    eli5:
      'It decides the "home stadium" for any legal dispute. If you live in Bengaluru or Mumbai, you don’t want a contract forcing you to hire lawyers in another state or country just to recover a small deposit.',
    watchOut:
      'Ensure the governing city/state is where you actually live or work, not a distant headquarters.',
    questionToAsk:
      'Can we set the jurisdiction to the local city where I live and perform the agreement?'
  },
  {
    id: 'exclusivity',
    term: 'Exclusivity',
    aliases: ['exclusive', 'may not perform work for any other', 'competing'],
    riskLevel: 'red',
    category: 'Work Freedom',
    simpleMeaning:
      'A restriction preventing you from working with, delivering for, or taking clients from any other company or app.',
    eli5:
      'It means "you can ONLY work for us." That makes sense if they pay you a guaranteed full-time salary and benefits—NOT if you are a freelancer or gig worker paid per task with zero guaranteed income!',
    watchOut:
      'Gig workers and independent contractors should push back hard against exclusivity unless minimum guaranteed pay is provided.',
    questionToAsk:
      'Since there is no guaranteed full-time salary, can we remove exclusivity so I can work on other platforms during off-hours?'
  },
  {
    id: 'waiver',
    term: 'Waiver',
    aliases: ['waives', 'waiving', 'relinquish'],
    riskLevel: 'red',
    category: 'Rights',
    simpleMeaning:
      'Voluntarily giving up a legal right, claim, or protection that the law normally gives you.',
    eli5:
      'Signing a waiver is like handing over your shield before entering a fight. Whenever you see the word "waives," pause immediately and check WHAT right they are asking you to throw away.',
    watchOut:
      'Red-flag waivers include waiving habitability, overtime/minimum wage, court hearings, or jury/class-action rights.',
    questionToAsk:
      'Why am I being asked to waive this statutory protection, and can we strike this waiver?'
  },
  {
    id: 'liquidated-damages',
    term: 'Liquidated Damages',
    aliases: ['liquidated damages', 'penalty per post', 'forfeiture'],
    riskLevel: 'red',
    category: 'Penalties',
    simpleMeaning:
      'A pre-set fixed dollar/rupee fine you automatically owe if you break a rule—without them proving real financial harm.',
    eli5:
      'Instead of proving how much money they actually lost, they slap a scary pre-printed price tag (like ₹2,50,000 or $50,000) on breaking a rule to scare you into staying quiet or never leaving.',
    watchOut:
      'Under Indian Contract Act §74 and US penalty doctrine, excessive fixed fines are often unenforceable—ask to limit remedies to actual proven losses.',
    questionToAsk:
      'Can we remove the fixed liquidated damages fine and limit any claim strictly to actual, documented losses?'
  },
  {
    id: 'auto-renewal',
    term: 'Automatic Renewal (Evergreen)',
    aliases: ['automatically renew', 'auto-renewal', 'auto renew'],
    riskLevel: 'red',
    category: 'Renewals',
    simpleMeaning:
      'A rule that automatically locks you into another full contract cycle unless you cancel far in advance.',
    eli5:
      'Just like a sneaky gym subscription that charges you for another whole year if you forget to mail a letter 90 days early—except with your apartment rent or job contract!',
    watchOut:
      'Watch out for 60–90 day cancellation windows paired with automatic 10%–15% rent hikes.',
    questionToAsk:
      'Can we convert to month-to-month after the first term instead of auto-renewing for another year?'
  },
  {
    id: 'non-compete',
    term: 'Non-Compete',
    aliases: ['non-compete', 'not work for or provide services to any competing', 'anywhere in the world'],
    riskLevel: 'red',
    category: 'Work Freedom',
    simpleMeaning:
      'A ban stopping you from working for competitors or in the same industry for months or years after leaving.',
    eli5:
      'It says: "Even after we stop paying you, you aren’t allowed to use your own skills at another company in this field." In India (§27) and California (§16600), post-exit non-competes are generally legally VOID!',
    watchOut:
      'Never accept a broad multi-year non-compete—offer a simple confidentiality NDA instead.',
    questionToAsk:
      'Can we remove the post-termination non-compete and rely on a standard NDA to protect confidential info?'
  },
  {
    id: 'cross-default',
    term: 'Cross-Default',
    aliases: ['cross-default', 'unrelated credit card'],
    riskLevel: 'red',
    category: 'Loans & Credit',
    simpleMeaning:
      'A loan trap where missing a payment on an unrelated bill or credit card puts THIS loan into immediate default too.',
    eli5:
      'Even if you pay THIS lender perfectly every single month, having a dispute with a completely different credit card lets them panic and demand your entire loan back right now.',
    watchOut:
      'Personal loans should NEVER contain cross-default clauses—demand immediate deletion.',
    questionToAsk:
      'Will you remove the cross-default trigger so this loan only defaults if I miss payments on THIS agreement?'
  },
  {
    id: 'confession-of-judgment',
    term: 'Confession of Judgment',
    aliases: ['confession of judgment'],
    riskLevel: 'red',
    category: 'Loans & Credit',
    simpleMeaning:
      'Signing away your right to defend yourself in court by pre-authorizing a legal judgment against you.',
    eli5:
      'It is like signing a guilty plea before you even borrow the money—letting the lender freeze your bank account without giving you a fair hearing first.',
    watchOut:
      'Banned in consumer credit under FTC rules and void under Indian Contract Act §28. Treat as an instant dealbreaker.',
    questionToAsk:
      'Please remove the confession of judgment clause immediately—I will not waive my right to a court hearing.'
  },
  {
    id: 'ip-assignment',
    term: 'Intellectual Property (IP) Assignment',
    aliases: ['intellectual property', 'irrevocably assigns', 'trailer clause'],
    riskLevel: 'yellow',
    category: 'Ownership',
    simpleMeaning:
      'Transferring legal ownership of code, designs, content, or inventions you create over to the company.',
    eli5:
      'It says who owns the stuff you create. Fair version: they own what they paid you to build. Scary version: they also claim ownership of apps or projects you build on weekends on your own laptop!',
    watchOut:
      'Always carve out off-hours personal projects, prior open-source work, and delete post-exit "trailer clauses".',
    questionToAsk:
      'Can we limit IP assignment strictly to paid deliverables and carve out my unrelated personal side projects?'
  },
  {
    id: 'habitability',
    term: 'Implied Warranty of Habitability',
    aliases: ['habitability', 'as-is'],
    riskLevel: 'red',
    category: 'Rental Rights',
    simpleMeaning:
      'The landlord’s basic legal duty to provide a safe, livable home with working plumbing, electricity, and structure.',
    eli5:
      'By law, a landlord must give you a safe, livable home—not a leaking apartment where you have to pay ₹25,000 to fix their broken pipes. Clauses saying "AS-IS / waives habitability" try to dodge that duty.',
    watchOut:
      'Never accept financial responsibility for structural, electrical, plumbing, or major appliance failures.',
    questionToAsk:
      'Can we strike the habitability waiver and confirm the landlord handles all structural, plumbing, and electrical repairs?'
  },
  {
    id: 'prepayment-penalty',
    term: 'Prepayment / Foreclosure Penalty',
    aliases: ['prepayment penalty', 'foreclosure'],
    riskLevel: 'yellow',
    category: 'Loans & Credit',
    simpleMeaning:
      'An extra charge levied by a lender if you pay off your loan earlier than the full schedule.',
    eli5:
      'Normally paying back borrowed money early is a good thing! A prepayment penalty punishes you for getting out of debt early because the lender wants to keep collecting high interest from you.',
    watchOut:
      'RBI bars foreclosure charges on floating-rate individual loans, and fair personal loans charge ₹0/$0 prepayment fees.',
    questionToAsk:
      'Can you waive the foreclosure/prepayment penalty so I can close the loan early without extra fees?'
  }
];

/**
 * Finds exact sentence context for a legal term inside the currently loaded contract
 */
function findInContractContext(contractText, entry) {
  if (!contractText) return null;
  const searchTerms = [entry.term.toLowerCase(), ...(entry.aliases || []).map((a) => a.toLowerCase())];
  const sentences = contractText.split(/(?<=[.!?])\s+|\n+/).filter((s) => s.trim().length > 15);

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    const matchedWord = searchTerms.find((w) => lower.includes(w));
    if (matchedWord) {
      return {
        found: true,
        matchedPhrase: matchedWord,
        quote: sentence.trim().slice(0, 260),
        contractImpact: `Your contract uses "${matchedWord}" here. ${entry.watchOut}`
      };
    }
  }
  return {
    found: false,
    quote: null,
    contractImpact: 'Not explicitly found in your currently loaded contract—good news, though still check for synonyms or separate addenda.'
  };
}

export function getTranslatedTerms(contractText = '', query = '') {
  const q = (query || '').trim().toLowerCase();
  const filtered = LEGAL_GLOSSARY.filter((entry) => {
    if (!q) return true;
    return (
      entry.term.toLowerCase().includes(q) ||
      entry.simpleMeaning.toLowerCase().includes(q) ||
      entry.category.toLowerCase().includes(q) ||
      (entry.aliases || []).some((a) => a.toLowerCase().includes(q))
    );
  });

  const enriched = filtered.map((entry) => ({
    ...entry,
    inThisContract: findInContractContext(contractText, entry)
  }));

  // Sort terms found in current contract first!
  enriched.sort((a, b) => Number(b.inThisContract?.found || false) - Number(a.inThisContract?.found || false));
  return enriched;
}

export function translateSingleTerm(termOrPhrase, contractText = '') {
  const lower = (termOrPhrase || '').trim().toLowerCase();
  const match = LEGAL_GLOSSARY.find(
    (g) =>
      g.id === lower ||
      g.term.toLowerCase() === lower ||
      g.term.toLowerCase().includes(lower) ||
      (g.aliases || []).some((a) => lower.includes(a.toLowerCase()) || a.toLowerCase().includes(lower))
  );

  if (match) {
    return {
      ...match,
      inThisContract: findInContractContext(contractText, match)
    };
  }

  return {
    id: 'custom-term',
    term: termOrPhrase,
    riskLevel: 'yellow',
    category: 'Legal Phrase',
    simpleMeaning: `"${termOrPhrase}" is a formal legal phrase that defines an obligation, restriction, or remedy between the parties.`,
    eli5: `Whenever a contract uses dense legal phrasing like "${termOrPhrase}", ask the sender to explain in one plain sentence what it requires you to pay, do, or give up.`,
    watchOut: 'Never assume a legal phrase is "just standard boilerplate"—ask for written clarification if it affects your money, rights, or exit options.',
    questionToAsk: `Can you explain in plain language how "${termOrPhrase}" applies to me in practice?`,
    inThisContract: {
      found: Boolean(contractText && contractText.toLowerCase().includes(lower)),
      quote: null,
      contractImpact: 'Highlight the full sentence in the Smart Reader and click "Explain with AI" for a clause-specific breakdown.'
    }
  };
}
