// ContractLens AI — Core Traffic-Light Analyzer (Idea 1) & Smart Risk Dashboard Engine (Idea 7)
// Supports both ₹ (INR lakh-grouped & standard) and $ (USD) across Rental, Loan, Employment & Gig-Work

const RISK_RULES = [
  // ==================== FEES & DEDUCTIONS ====================
  {
    id: 'mandatory-junk-fees',
    title: 'Mandatory Recurring Junk & Platform Fees',
    category: 'hidden_fee',
    dashboardGroup: 'fees',
    trafficLight: 'red',
    severity: 'high',
    weight: 12,
    patterns: [
      /(?:mandatory|non-optional|required)\s+(?:recurring\s+)?(?:monthly\s+)?(?:community\s+)?(?:amenity|package|smart[- ]?home|smart[- ]?gate|technology|platform\s+technology|administrative|billing|maintenance|service|facility|club)\s+(?:&\s+\w+\s+)?fee/i,
      /(?:amenity|smart[- ]?gate|smart[- ]?home|technology|administrative|account\s+maintenance|convenience|billing)\s+(?:&\s+\w+\s+)?fee\s+of\s+[₹$][\d,]+/i,
      /[₹$][\d,.]+\s+(?:monthly\s+)?(?:community\s+amenity|smart[- ]?gate|smart[- ]?home|monthly\s+administrative|account\s+maintenance|convenience|platform\s+technology)/i
    ],
    plainEnglish:
      'Beyond the advertised base price or payout, you are forced to pay recurring add-on fees every month or per payment—even if you never use those services.',
    whyItMatters:
      'Hidden recurring charges silently inflate your true annual cost or cut directly into your monthly take-home pay.',
    unclearWording:
      'Does not guarantee whether these monthly charges are capped or can be increased mid-term.',
    worstCase:
      'Adds thousands in unavoidable extra charges over the contract duration.',
    fairRedline:
      'All mandatory costs shall be included in the stated Base Rate. Optional amenities, tech packages, and standard UPI/ACH payments shall carry zero mandatory fees.',
    question:
      'Can you provide an all-in monthly cost breakdown and waive mandatory admin, amenity, platform tech, or payment convenience fees?',
    negotiationPoint:
      'Challenge junk fees as disguised price hikes; ask for fee-free UPI/ACH payments and strictly opt-in add-ons.',
    benchmark: 'Fair agreements include overhead in base pricing and offer fee-free standard payments.'
  },
  {
    id: 'non-refundable-upfront-fees',
    title: 'Non-Refundable Upfront Move-In / Painting / Cleaning Fees',
    category: 'hidden_fee',
    dashboardGroup: 'fees',
    trafficLight: 'yellow',
    severity: 'medium',
    weight: 8,
    patterns: [
      /non-refundable\s+(?:move-in|administrative|admin|mandatory\s+painting|deep[- ]?cleaning|cleaning|application|processing)\s+(?:&\s+\w+(?:-\w+)?\s+)?fee/i,
      /(?:move-in\s+administrative|mandatory\s+painting|mandatory\s+deep-cleaning|document\s+verification)\s+fee\s+of\s+[₹$][\d,]+/i
    ],
    plainEnglish:
      'You must pay steep upfront administrative, painting, or cleaning fees that you can never get back—even if you return the property spotless.',
    whyItMatters:
      'You lose this money on Day 1 on top of locking up a large security deposit.',
    unclearWording:
      'Does not specify itemized work or receipts justifying a non-refundable charge.',
    worstCase:
      'Immediate sunk cost before you even move in or receive the loan.',
    fairRedline:
      'Eliminate non-refundable move-in and mandatory painting fees; any move-out cleaning deductions shall require itemized bills only for actual damage beyond normal wear and tear.',
    question:
      'Why is there a non-refundable cleaning/painting fee in addition to a security deposit? Will you waive or reduce this?',
    negotiationPoint:
      'Request waiving non-refundable move-in fees or converting painting charges to actual documented move-out costs only.',
    benchmark: 'Reputable landlords rely on refundable security deposits rather than stacking non-refundable fees.'
  },
  {
    id: 'origination-fee-deduction',
    title: 'Upfront Origination Fee Skimmed from Loan Principal',
    category: 'hidden_fee',
    dashboardGroup: 'fees',
    trafficLight: 'red',
    severity: 'critical',
    weight: 16,
    patterns: [
      /origination\s+(?:&\s+(?:underwriting|processing)\s+)?fee\s+of\s+[\d.]+%/i,
      /deducted\s+directly\s+from\s+(?:the\s+)?loan\s+proceeds/i
    ],
    plainEnglish:
      'The lender cuts a hefty origination fee right out of your loan before transferring the money—yet charges you high interest on the FULL amount you never received.',
    whyItMatters:
      'You receive significantly less cash in your bank account while repaying interest on the phantom fee for years.',
    unclearWording:
      'Masks the true effective APR by separating upfront deductions from the headline interest rate.',
    worstCase:
      'Instant 9%–10% loss on disbursement day plus years of compounded interest on that deducted fee.',
    fairRedline:
      'Processing/origination fee shall be capped at 1%–2% max and interest shall accrue strictly on net principal disbursed.',
    question:
      'What is the exact net amount hitting my bank account, and what is the all-in effective APR including all upfront deductions?',
    negotiationPoint:
      'Demand a Key Fact Statement (KFS) showing net disbursed amount & true APR; compare against bank/credit union offers with 0%–1% processing.',
    benchmark: 'Standard bank personal loans charge 0%–2% processing; 8%–10% upfront deduction is predatory.'
  },
  {
    id: 'predatory-apr-compounding',
    title: 'Extreme High APR & Daily Compounding Interest',
    category: 'hidden_fee',
    dashboardGroup: 'fees',
    trafficLight: 'red',
    severity: 'critical',
    weight: 18,
    patterns: [
      /(?:apr|annual\s+percentage\s+rate)[^.\n]{0,35}(?:[2-9]\d|1\d\d)(?:\.\d+)?%/i,
      /compounded\s+daily/i,
      /default\s+(?:penalty\s+)?interest\s+rate\s+of\s+[\d.]+%/i
    ],
    plainEnglish:
      'This loan charges an extremely high interest rate compounded every single day, causing your debt to snowball rapidly.',
    whyItMatters:
      'Daily compounding at 35%–52% APR can easily double your total repayment amount.',
    unclearWording:
      'Does not prominently show total rupees/dollars of interest paid over the full tenure.',
    worstCase:
      'Even one missed EMI spikes the rate to 50%+ APR, trapping you in a debt spiral.',
    fairRedline:
      'Interest shall accrue on a reducing-balance simple basis at a fixed fair APR with penalty charges capped per regulatory guidelines (never compounded onto principal).',
    question:
      'What is the total amount of interest I will pay across the entire tenure, and is interest calculated on a monthly reducing balance?',
    negotiationPoint:
      'Walk away from >24% APR daily-compounded app loans; RBI penal-charge rules prohibit compounding penal interest.',
    benchmark: 'Fair bank personal loans use 10%–16% monthly reducing balance interest with no penal compounding.'
  },
  {
    id: 'excessive-late-fees',
    title: 'Punitive Late Fees & Zero/Tiny Grace Period',
    category: 'hidden_fee',
    dashboardGroup: 'fees',
    trafficLight: 'yellow',
    severity: 'high',
    weight: 10,
    patterns: [
      /late\s+(?:fee|charge)\s+of\s+(?:1[0-9]|[2-9]\d)%|late\s+(?:fee|charge)\s+of\s+[₹$][\d,]+\s+plus\s+[₹$][\d,]+\s+per\s+day/i,
      /plus\s+[₹$][\d,.]+\s+per\s+(?:day|delayed\s+day)/i,
      /unpaid\s+within\s+(?:one|two|three|[1-3])\s*\(?[1-3]?\)?\s*days?\s+of\s+(?:the\s+)?due\s+date/i
    ],
    plainEnglish:
      'You get barely 1–2 days of leeway—and a minor bank delay triggers an immediate hefty fine plus daily stacking penalties.',
    whyItMatters:
      'A weekend holiday or salary transfer delay can instantly cost you thousands of rupees or hundreds of dollars.',
    unclearWording:
      'Does not clarify whether payment date means transfer initiated or cleared by bank.',
    worstCase:
      'Daily late charges rapidly compound into an unaffordable penalty.',
    fairRedline:
      'Provide a minimum 5-calendar-day grace period before any late fee applies, capped at a single modest flat fee with no daily stacking.',
    question:
      'Will you add a standard 5-day grace period and remove daily compounding late charges?',
    negotiationPoint:
      'Standard leases and loans include a 5-day grace period with a modest one-time capped late fee.',
    benchmark: 'Standard grace period is 5 days; fair late fee is capped flat without daily accrual.'
  },
  {
    id: 'net-60-90-holdback',
    title: 'Long Payout Delays (Net-60/90) & Subjective Clawbacks',
    category: 'hidden_fee',
    dashboardGroup: 'fees',
    trafficLight: 'red',
    severity: 'critical',
    weight: 15,
    patterns: [
      /net[- ]?(?:60|90|120)\s+basis/i,
      /withhold\s+or\s+claw\s+back\s+up\s+to\s+100%/i,
      /deduct\s+[₹$][\d,]+\s+per\s+cancelled\s+slot/i
    ],
    plainEnglish:
      'You have to wait 60–90 days just to get paid—and the platform/company can withhold or deduct up to 100% of your earnings based on vague, subjective complaints.',
    whyItMatters:
      'Directly threatens your cash flow and allows unilateral deductions from work you already completed.',
    unclearWording:
      'Phrases like "subjective complaint" or "subjective quality metrics" give you zero objective standard to dispute unfair deductions.',
    worstCase:
      'You spend fuel, time, and weeks working only to have your entire payout frozen or deducted.',
    fairRedline:
      'Payouts shall be settled weekly (gig work) or Net-15/30 (contracting). Any deduction requires documented proof and a 7-day dispute/appeal window.',
    question:
      'Under what exact documented conditions can deductions be made, and can payout cycles be shortened to weekly or Net-15/30?',
    negotiationPoint:
      'Never accept subjective 100% clawbacks; require written proof and an appeal process before any earnings deduction.',
    benchmark: 'Gig platforms should pay weekly; contractors typically invoice Net-15 or Net-30.'
  },

  // ==================== RENEWALS & DEADLINES ====================
  {
    id: 'auto-renewal-rent-hike',
    title: 'Automatic Renewal Trap with Built-In Price Hike',
    category: 'auto_renewal',
    dashboardGroup: 'renewals',
    trafficLight: 'red',
    severity: 'critical',
    weight: 16,
    patterns: [
      /automatically\s+renews?\s+for\s+(?:an\s+additional\s+)?(?:twelve|12|one|six|6)/i,
      /unless\s+[^.\n]{0,80}(?:60|90|sixty|ninety)\s*\(?(?:60|90)?\)?\s*days\s+prior[^.\n]{0,90}automatically\s+renews?/i,
      /automatically\s+increased\s+by\s+[\d.]+%|with\s+a\s+(?:1[0-9]|[2-9]\d)%\s+increase/i
    ],
    plainEnglish:
      'If you miss a strict cancellation deadline months before your contract ends (requiring registered post!), it automatically locks you into another full year at a 12%–15% higher rent.',
    whyItMatters:
      'Traps you in another year-long commitment and a steep price hike you never actively agreed to.',
    unclearWording:
      'Requires formal registered post rather than simple email/WhatsApp notice, increasing the chance of technical default.',
    worstCase:
      'Forgetting one date 90 days early costs you an entire year of inflated rent.',
    fairRedline:
      'Upon expiration, this Agreement shall renew ONLY by mutual written consent (email acceptable) with 30 days notice and a maximum 5%–7% rent escalation cap.',
    question:
      'Can we remove automatic renewal so renewal requires mutual written consent, shorten notice to 30 days via email, and cap annual rent increases?',
    negotiationPoint:
      'Push for opt-in renewal with 30-day email notice and a fair 5%–7% escalation cap.',
    benchmark: 'Fair Indian & global leases use 30-day email notice and opt-in renewal.'
  },
  {
    id: 'prepayment-penalty',
    title: 'Foreclosure / Prepayment Penalty (Punishing Early Payoff)',
    category: 'auto_renewal',
    dashboardGroup: 'renewals',
    trafficLight: 'red',
    severity: 'high',
    weight: 14,
    patterns: [
      /prepayment\s+penalty/i,
      /foreclosure\s*\/\s*prepayment/i,
      /pay\s+off\s+the\s+loan\s+(?:in\s+full\s+)?(?:early|prior\s+to)[^.\n]{0,120}(?:penalty|unearned\s+interest)/i
    ],
    plainEnglish:
      'If you save up money and try to close your loan early, the lender charges you a heavy foreclosure fee plus 6 months of unearned interest.',
    whyItMatters:
      'Locks you into paying high interest even when you can afford to become debt-free or refinance cheaper.',
    unclearWording:
      'Charging "unearned interest" on principal you already returned is heavily tilted against borrowers.',
    worstCase:
      'Paying off early triggers thousands in penalty charges.',
    fairRedline:
      'Borrower may prepay part or all of the remaining principal at any time with zero foreclosure penalty and zero unearned interest.',
    question:
      'Can you waive the prepayment/foreclosure penalty so I can pay off extra principal without extra charges?',
    negotiationPoint:
      'Many banks and RBI floating-rate guidelines mandate 0% foreclosure charges—demand prepayment freedom.',
    benchmark: 'Fair consumer installment loans charge 0% prepayment penalty.'
  },

  // ==================== RESPONSIBILITIES, PENALTIES & UNFAIR CLAUSES ====================
  {
    id: 'unilateral-rate-modification',
    title: 'Unilateral Power to Cut Incentives, Pay, or Hike Rates',
    category: 'unfair_clause',
    dashboardGroup: 'fees',
    trafficLight: 'red',
    severity: 'critical',
    weight: 16,
    patterns: [
      /(?:reserves?\s+the\s+right|sole\s+discretion)[^.\n]{0,95}(?:increase\s+the\s+interest\s+rate|adjust\s+incentives|modify,?\s+reduce,?\s+or\s+recalculate|recalculate\s+compensation)/i,
      /unilaterally\s+(?:modify|reduce|change|increase|recalculate)/i,
      /adjust\s+incentives,\s+deduct\s+applicable\s+charges/i
    ],
    plainEnglish:
      'The platform or lender can change your incentives, cut your pay, add deductions, or raise your interest rate whenever they want—even retroactively without warning.',
    whyItMatters:
      'Your earnings or monthly EMI are never truly guaranteed; the deal can worsen overnight after you commit.',
    unclearWording:
      'Does not specify when changes can happen, maximum limits, or how much advance notice you will receive.',
    worstCase:
      'Incentives drop right after you invest in joining, or loan APR jumps to 49% on 15 days SMS notice.',
    fairRedline:
      'Compensation rates, incentives, and interest rates shall be fixed for the stated period and may only change prospectively upon 30 days written notice and mutual consent.',
    question:
      'Can incentives, pay rates, or interest rates be changed without prior written notice, and will you confirm changes never apply retroactively?',
    negotiationPoint:
      'Insist on written advance notice (at least 15–30 days) and a strict ban on retroactive cuts to completed work.',
    benchmark: 'Core financial rates must never change retroactively or without advance notice and opt-out rights.'
  },
  {
    id: 'deposit-vague-deductions',
    title: 'Security Deposit Trap (Vague "Other Obligations" & 90-Day Hold)',
    category: 'unfair_clause',
    dashboardGroup: 'penalties',
    trafficLight: 'red',
    severity: 'high',
    weight: 13,
    patterns: [
      /security\s+deposit\s+shall\s+be\s+retained\s+subject\s+to\s+adjustment/i,
      /wear\s+and\s+tear,\s+repainting,?\s+and\s+other\s+obligations/i,
      /returned\s+within\s+(?:sixty|ninety|60|90)\s*\(?(?:60|90)?\)?\s*days\s+after\s+vacating/i
    ],
    plainEnglish:
      'The landlord can hold your huge security deposit for 90 days and deduct money at their sole discretion for vague "other obligations," repainting, and normal everyday wear and tear.',
    whyItMatters:
      'With 6 months rent locked up, vague wording makes it very easy for landlords to withhold most of your deposit when you move out.',
    unclearWording:
      'The phrase "and other obligations at Landlord’s sole discretion" is dangerously open-ended and undefined.',
    worstCase:
      'You move out cleanly and still wait 3 months only to lose ₹50,000+ to arbitrary deductions.',
    fairRedline:
      'Landlord shall refund the security deposit within 15–21 days of key handover, deducting ONLY documented actual damages beyond normal wear and tear supported by itemized GST receipts.',
    question:
      'Can you provide a written list of exact permitted deposit deductions, exclude normal wear and tear, and shorten refund time to 15–21 days?',
    negotiationPoint:
      'Model Tenancy Act & state laws require prompt refund and forbid deducting for ordinary wear and tear. Do a joint photo/video checklist on move-in!',
    benchmark: 'Standard fair refund window is 14–30 days; normal wear and tear is landlord’s expense.'
  },
  {
    id: 'early-termination-forfeiture',
    title: 'Early Exit Forfeiture & Asymmetric Notice Penalty',
    category: 'termination',
    dashboardGroup: 'penalties',
    trafficLight: 'red',
    severity: 'high',
    weight: 13,
    patterns: [
      /early\s+termination[^.\n]{0,95}(?:automatic\s+forfeiture|forfeit|liquidated\s+damages)/i,
      /forfeits?\s+(?:the\s+entire\s+security\s+deposit|all\s+accrued\s+unpaid\s+compensation)/i,
      /permanently\s+deactivate[^.\n]{0,110}without\s+(?:notice|payment)/i,
      /terminate\s+immediately\s+without\s+notice\s+or\s+cause[^.\n]{0,110}without\s+payment/i
    ],
    plainEnglish:
      'They can terminate or deactivate you instantly without paying pending milestones/incentives—while if YOU leave early, they forfeit your entire deposit or earned unpaid wages.',
    whyItMatters:
      'Creates extreme power imbalance: you risk losing money you already earned or deposited if life circumstances change.',
    unclearWording:
      'Does not define objective "cause" for instant deactivation or any appeal procedure.',
    worstCase:
      'Sudden relocation or account deactivation wipes out months of savings or pending earnings.',
    fairRedline:
      'Notice periods shall be strictly mutual (30 days). All earned pay/incentives must be paid upon exit, and any lease break fee capped at 1 month rent.',
    question:
      'Can we make notice periods mutual for both parties and confirm earned compensation/deposits cannot be forfeited?',
    negotiationPoint:
      'Forfeiting earned wages is unlawful in most jurisdictions; demand mutual notice and pro-rata settlement.',
    benchmark: 'Balanced contracts feature symmetric notice periods and always pay for completed work.'
  },
  {
    id: 'repair-shifting-habitability',
    title: 'Shifting Major Repairs & Habitability Waiver ("AS-IS")',
    category: 'unfair_clause',
    dashboardGroup: 'penalties',
    trafficLight: 'red',
    severity: 'critical',
    weight: 15,
    patterns: [
      /waives?\s+(?:any\s+)?implied\s+warranty\s+of\s+habitability/i,
      /solely\s+responsible\s+for\s+all\s+interior\s+repairs\s+including\s+plumbing/i,
      /accepts?\s+the\s+premises\s+strictly\s+"?as-is"?/i
    ],
    plainEnglish:
      'The landlord pushes the cost of plumbing, electrical wiring, geyser, and AC repairs (up to ₹25,000 per issue!) onto YOU—even for pre-existing building defects.',
    whyItMatters:
      'You end up paying out-of-pocket to repair someone else’s property.',
    unclearWording:
      '"Regardless of pre-existing wear" makes you liable for old appliances already near failure.',
    worstCase:
      'An aging AC or concealed pipe leak hits you with a surprise ₹25,000 repair bill.',
    fairRedline:
      'Landlord remains responsible for structural, plumbing, electrical, seepage, and major appliance repairs; Tenant covers minor consumables (bulbs/fuses) only.',
    question:
      'Will you strike the habitability waiver and confirm structural, plumbing, wiring, and major appliance repairs are covered by the landlord?',
    negotiationPoint:
      'Under the Model Tenancy Act & Transfer of Property Act, structural and utility upkeep is strictly the landlord’s duty.',
    benchmark: 'Tenants cover minor day-to-day upkeep; landlords cover structural, plumbing, electrical & major fixtures.'
  },
  {
    id: 'gig-exclusivity-misclassification',
    title: 'Strict Exclusivity & Mandatory Shifts Without Employee Benefits',
    category: 'unfair_clause',
    dashboardGroup: 'penalties',
    trafficLight: 'red',
    severity: 'high',
    weight: 13,
    patterns: [
      /strict\s+exclusivity[^.\n]{0,120}may\s+not\s+perform\s+work\s+for\s+any\s+other/i,
      /independent\s+contractor[^.\n]{0,140}waives?\s+all\s+claims\s+to\s+overtime\s+pay/i,
      /mandatory\s+peak\s+hours/i
    ],
    plainEnglish:
      'They classify you as an "independent contractor" with zero salary, PF, insurance, or overtime—yet force 12-hour mandatory peak shifts and ban you from working on other apps like Blinkit or Rapido.',
    whyItMatters:
      'You carry 100% of fuel, vehicle, and downtime risk while losing the freedom to multi-app during slow hours.',
    unclearWording:
      'Gives no guaranteed minimum hourly earnings in return for locking you into mandatory peak hours.',
    worstCase:
      'Slow demand leaves you sitting idle earning near ₹0 while prohibited from taking orders elsewhere.',
    fairRedline:
      'Independent partners shall retain non-exclusive freedom to log in flexibly and work on other platforms—OR receive guaranteed minimum hourly pay and statutory social security benefits.',
    question:
      'If I am an independent contractor with no fixed salary, can we remove the exclusivity ban and mandatory shift requirement?',
    negotiationPoint:
      'Exclusivity without guaranteed minimum wages is a classic misclassification red flag.',
    benchmark: 'Independent gig workers must have multi-apping freedom and flexible schedules.'
  },
  {
    id: 'sweeping-ip-assignment',
    title: 'Sweeping Personal IP Grab & 12-Month Trailer Clause',
    category: 'unfair_clause',
    dashboardGroup: 'penalties',
    trafficLight: 'red',
    severity: 'critical',
    weight: 16,
    patterns: [
      /irrevocably\s+assigns?\s+to\s+company[^.\n]{0,160}(?:personal\s+time|personal\s+equipment|regardless\s+of\s+whether\s+related)/i,
      /trailer\s+clause|for\s+(?:twelve|12)\s*\(?(?:12)?\)?\s*months\s+following\s+termination/i
    ],
    plainEnglish:
      'The company claims ownership of EVERYTHING you build or invent—including weekend side projects on your own laptop and ideas created for a full year AFTER you leave!',
    whyItMatters:
      'Puts your personal portfolio, open-source code, and future startup ideas at direct legal risk.',
    unclearWording:
      '"Regardless of whether related to Company’s business" is far broader than legitimate work-for-hire.',
    worstCase:
      'Company claims ownership of a profitable side project you built on your own weekends.',
    fairRedline:
      'IP assignment applies ONLY to paid deliverables created within scope using Company resources. Unrelated off-hours personal work and post-exit creations belong 100% to Worker.',
    question:
      'Will you narrow IP assignment strictly to paid deliverables, exclude my personal side projects, and delete the 12-month post-exit trailer?',
    negotiationPoint:
      'Attach a Prior Inventions & Side Projects carve-out schedule before signing.',
    benchmark: 'Fair contracts only claim paid work-for-hire deliverables with zero post-exit trailer.'
  },
  {
    id: 'overbroad-non-compete',
    title: 'Overbroad 24-Month Non-Compete & Massive Fine',
    category: 'unfair_clause',
    dashboardGroup: 'penalties',
    trafficLight: 'red',
    severity: 'critical',
    weight: 17,
    patterns: [
      /(?:twenty-four|24|eighteen|18)\s*\(?(?:24|18)?\)?\s*months\s+following\s+termination[^.\n]{0,140}(?:not\s+work\s+for|competing|anywhere\s+in\s+(?:india|the\s+world))/i,
      /immediate\s+liquidated\s+damages\s+of\s+[₹$][\d,]+/i
    ],
    plainEnglish:
      'After leaving (even if they terminate you!), you are banned for 2 years from working in your own field across the entire country/world—with a massive ₹2.5L / $50k penalty fine.',
    whyItMatters:
      'Blocks your livelihood and threatens terrifying legal penalties if you take your next job or gig.',
    unclearWording:
      'Broadly sweeps in "any competing logistics/tech business" without defining specific trade secrets.',
    worstCase:
      'Legal threat letters intimidating your next employer or demanding five/six-figure fines.',
    fairRedline:
      'Delete the post-termination non-compete and fixed liquidated damages entirely; protect confidential business data via a standard NDA instead.',
    question:
      'Under Indian Contract Act §27 / CA §16600, post-exit non-competes are void—will you remove this clause and use a standard NDA?',
    negotiationPoint:
      'Cite statutory invalidity directly—most companies drop contractor non-competes once challenged.',
    benchmark: 'Post-exit non-competes for gig workers and contractors should be removed completely.'
  },
  {
    id: 'cross-default-wage-judgment',
    title: 'Cross-Default, Irrevocable Auto-Debit & Wage/Judgment Waiver',
    category: 'rights_liability',
    dashboardGroup: 'penalties',
    trafficLight: 'red',
    severity: 'critical',
    weight: 17,
    patterns: [
      /cross-default/i,
      /irrevocable\s+authorization\s+to\s+debit/i,
      /confession\s+of\s+judgment|wage\s+assignment/i
    ],
    plainEnglish:
      'Even if you pay THIS loan on time, missing an unrelated credit card bill lets them recall your whole loan + 25% collection fees, repeatedly hit your bank with bounce charges, garnish your salary, and skip court hearings!',
    whyItMatters:
      'Strips your financial autonomy and basic due-process rights in one sweep.',
    unclearWording:
      'Does not cap retry bounce attempts or require written cure notice before full acceleration.',
    worstCase:
      'Stacked bank bounce fees, sudden full balance recall, and bank account freeze without a fair hearing.',
    fairRedline:
      'Delete Cross-Default, Wage Assignment, and Confession of Judgment entirely. Auto-debit mandates must remain revocable with max 1 attempt per EMI cycle and a 15-day written cure notice.',
    question:
      'Will you strike cross-default, confession of judgment, and irrevocable auto-debit retries so my statutory borrower rights stay intact?',
    negotiationPoint:
      'Confession of judgment and irrevocable wage/ACH mandates violate RBI Fair Practices / FTC Credit Practices / EFTA rules.',
    benchmark: 'Consumer loans must never include cross-default, confession of judgment, or irrevocable debit retries.'
  },
  {
    id: 'unannounced-entry-liability-arbitration',
    title: 'Unannounced Entry, Negligence Waiver & One-Sided Arbitration',
    category: 'rights_liability',
    dashboardGroup: 'penalties',
    trafficLight: 'red',
    severity: 'high',
    weight: 13,
    patterns: [
      /enter\s+the\s+premises\s+at\s+any\s+time\s+without\s+prior\s+notice/i,
      /even\s+if\s+caused\s+by\s+(?:landlord|company)'?s\s+own\s+negligence/i,
      /arbitrator\s+(?:appointed|selected)\s+solely\s+by|at\s+worker'?s\s+sole\s+expense/i
    ],
    plainEnglish:
      'Allows unannounced entry into your home, excuses their own negligence if you get hurt, and forces disputes before an arbitrator THEY choose while YOU pay all legal bills—even if you win.',
    whyItMatters:
      'Takes away privacy, safety accountability, and a fair neutral venue if anything goes wrong.',
    unclearWording:
      'No restriction on nighttime visits or cap on legal fee reimbursement.',
    worstCase:
      'Makes it financially impossible to challenge an unfair deposit theft or injury.',
    fairRedline:
      'Require 24 hours advance written notice for entry; keep each party liable for its own negligence; require a mutually agreed neutral arbitrator or local court with prevailing-party legal fees.',
    question:
      'Can we add 24-hour entry notice, remove the negligence waiver, and make dispute resolution & legal fees fair and mutual?',
    negotiationPoint:
      'One-sided arbitrator appointment is invalid under Indian Arbitration Act (Perkins Eastman ruling) and US unconscionability law.',
    benchmark: '24h entry notice, mutual negligence accountability, and neutral dispute resolution.'
  },
  {
    id: 'uncapped-indemnity-gag',
    title: 'Unlimited Indemnity & Gag Clause Financial Penalty',
    category: 'rights_liability',
    dashboardGroup: 'penalties',
    trafficLight: 'yellow',
    severity: 'high',
    weight: 11,
    patterns: [
      /indemnify[^.\n]{0,120}without\s+any\s+cap/i,
      /permanently\s+prohibited\s+from\s+posting\s+negative/i,
      /penalty\s+per\s+post/i
    ],
    plainEnglish:
      'Makes you personally liable with NO dollar cap for third-party lawsuits or fines, and gags you from sharing honest public reviews with a ₹50,000/$10,000 fine per post.',
    whyItMatters:
      'Uncapped indemnity puts your personal savings at risk, and gag fines silence truthful feedback.',
    unclearWording:
      'Does not distinguish truthful reviews or company-caused accidents from malicious defamation.',
    worstCase:
      'A single accident or honest online review triggers catastrophic financial liability.',
    fairRedline:
      'Cap indemnity strictly to direct proven damages up to 3 months fees paid, make indemnity mutual, and remove per-post gag penalties.',
    question:
      'Will you cap my indemnity liability and remove the per-post fine for truthful reviews?',
    negotiationPoint:
      'No individual worker or tenant should accept uncapped personal indemnity.',
    benchmark: 'Liability should be capped at fees paid; truthful speech cannot be penalized.'
  }
];

const DOMAIN_KEYWORDS = {
  rental: ['landlord', 'tenant', 'lease', 'premises', 'security deposit', 'rent', 'habitability', 'apartment', 'flat', 'vacating', 'painting'],
  loan: ['lender', 'borrower', 'principal', 'apr', 'emi', 'installment', 'origination', 'prepayment', 'foreclosure', 'e-nach', 'default', 'loan'],
  employment: ['employee', 'employer', 'independent contractor', 'partner', 'worker', 'incentives', 'deliverables', 'non-compete', 'intellectual property', 'gig', 'deactivation', 'salary']
};

export function detectCurrency(text = '') {
  const inrCount = (text.match(/₹|\bINR\b|\bRs\.?\b/gi) || []).length;
  const usdCount = (text.match(/\$|\bUSD\b/gi) || []).length;
  return inrCount >= usdCount && inrCount > 0 ? '₹' : '$';
}

export function formatCurrencyAmount(amount, currency = '₹') {
  const rounded = Math.round(Number(amount) || 0);
  if (currency === '₹') {
    return '₹' + rounded.toLocaleString('en-IN');
  }
  return '$' + rounded.toLocaleString('en-US');
}

export function detectContractType(text, requestedType = 'auto') {
  if (requestedType && requestedType !== 'auto' && ['rental', 'loan', 'employment'].includes(requestedType)) {
    return { type: requestedType, label: formatDomainLabel(requestedType), confidence: 100, autoDetected: false };
  }
  const lower = text.toLowerCase();
  const scores = { rental: 0, loan: 0, employment: 0 };
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const kw of keywords) {
      const m = lower.match(new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'));
      if (m) scores[domain] += m.length * (kw.includes(' ') ? 2 : 1);
    }
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topDomain, topScore] = sorted[0];
  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const type = topScore === 0 ? 'employment' : topDomain;
  return {
    type,
    label: formatDomainLabel(type),
    confidence: topScore === 0 ? 60 : Math.min(99, Math.max(68, Math.round((topScore / total) * 100))),
    autoDetected: true
  };
}

function formatDomainLabel(type) {
  return (
    {
      rental: 'Rental / Lease Agreement',
      loan: 'Loan / Credit Agreement',
      employment: 'Employment / Gig-Work Contract'
    }[type] || 'General Contract'
  );
}

function parseSections(text) {
  const lines = text.split(/\r?\n/);
  const sections = [];
  let current = { title: 'Agreement Header & Overview', start: 0, end: 0, text: '', page: 1 };
  let cursor = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    const isHeading =
      /^(?:\d+\.|section\s+\d+|article\s+[ivx\d]+)\s+[A-Z0-9 ,&\-/()₹$]+$/i.test(trimmed) &&
      trimmed.length > 4 &&
      trimmed.length < 105;

    if (isHeading && current.text.trim().length > 0) {
      current.end = cursor;
      sections.push({ ...current, text: current.text.trim() });
      const pageNum = Math.max(1, Math.ceil((sections.length + 1) / 2));
      current = { title: trimmed, start: cursor, end: cursor + line.length, text: line + '\n', page: pageNum };
    } else {
      if (isHeading && current.text.trim().length === 0) {
        current.title = trimmed;
        current.start = cursor;
      }
      current.text += line + '\n';
    }
    cursor += line.length + 1;
  }

  if (current.text.trim().length > 0) {
    current.end = text.length;
    sections.push({ ...current, text: current.text.trim() });
  }
  return sections;
}

function expandToSentence(text, matchIndex, matchLength) {
  let start = matchIndex;
  while (start > 0 && !/[\n.!?]/.test(text[start - 1])) start--;
  while (start < text.length && /\s/.test(text[start])) start++;

  let end = matchIndex + matchLength;
  while (end < text.length && !/[\n.!?]/.test(text[end])) end++;
  if (end < text.length && /[.!?]/.test(text[end])) end++;

  if (end - start > 420) {
    start = Math.max(0, matchIndex - 60);
    end = Math.min(text.length, matchIndex + matchLength + 160);
  }
  return { start, end, excerpt: text.slice(start, end).trim() };
}

function parseMoneyValue(rawNum) {
  return parseFloat(String(rawNum).replace(/,/g, '')) || 0;
}

function extractFinancialExposure(text, findings, currency) {
  let estimatedExtraAnnualCost = 0;
  let maxPenaltyExposure = 0;
  const breakdown = [];
  const seen = new Set();

  for (const f of findings) {
    const moneyRegex = /[₹$]\s?(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/g;
    let m;
    while ((m = moneyRegex.exec(f.excerpt)) !== null) {
      const val = parseMoneyValue(m[1]);
      if (val <= 0) continue;
      const around = f.excerpt.slice(Math.max(0, m.index - 40), Math.min(f.excerpt.length, m.index + 55));
      if (/monthly\s+rent\s+is|principal\s+loan\s+amount|shall\s+pay\s+\$55|receives\s+[₹$]/i.test(around)) continue;

      let amountLabel = '';
      if (/monthly|per\s+month|every\s+(?:upi|online|debit)|amenity|smart-gate|technology|account\s+maintenance|convenience\s+fee/i.test(around)) {
        const ann = Math.round(val * 12);
        estimatedExtraAnnualCost += ann;
        amountLabel = `${formatCurrencyAmount(val, currency)}/mo (${formatCurrencyAmount(ann, currency)}/yr)`;
      } else if (/origination|move-in|painting|cleaning|verification|processing\s+fee/i.test(around)) {
        estimatedExtraAnnualCost += Math.round(val);
        amountLabel = `${formatCurrencyAmount(val, currency)} upfront`;
      } else {
        maxPenaltyExposure += Math.round(val);
        amountLabel = `${formatCurrencyAmount(val, currency)} penalty risk`;
      }

      const key = `${f.title}-${amountLabel}`;
      if (!seen.has(key)) {
        seen.add(key);
        breakdown.push({ label: f.title, amount: amountLabel });
      }
    }
  }

  return {
    currency,
    estimatedExtraAnnualCost,
    maxPenaltyExposure,
    totalAtRisk: estimatedExtraAnnualCost + maxPenaltyExposure,
    breakdown: breakdown.slice(0, 8)
  };
}

export function analyzeContractLocal({ text, title = 'Untitled Contract', requestedType = 'auto', fileName = null }) {
  const cleanText = (text || '').trim();
  if (cleanText.length < 30) {
    throw new Error('Contract text is too short to analyze. Please paste or upload at least a few sentences.');
  }

  const currency = detectCurrency(cleanText);
  const domainInfo = detectContractType(cleanText, requestedType);
  const sections = parseSections(cleanText);
  const findings = [];
  const usedSpans = [];

  for (const rule of RISK_RULES) {
    let bestMatch = null;
    for (const pattern of rule.patterns) {
      const m = pattern.exec(cleanText);
      if (m) {
        bestMatch = m;
        break;
      }
    }
    if (!bestMatch) continue;

    const expanded = expandToSentence(cleanText, bestMatch.index, bestMatch[0].length);
    const overlap = usedSpans.find(
      (s) => s.ruleId === rule.id || (Math.abs(s.start - expanded.start) < 20 && Math.abs(s.end - expanded.end) < 20)
    );
    const start = overlap ? bestMatch.index : expanded.start;
    const end = overlap ? bestMatch.index + bestMatch[0].length : expanded.end;
    usedSpans.push({ ruleId: rule.id, start, end });

    // Determine containing section & page
    const sec = sections.find((s) => start >= s.start - 5 && start <= s.end + 5) || sections[0];

    findings.push({
      id: `finding-${rule.id}`,
      ruleId: rule.id,
      title: rule.title,
      category: rule.category,
      dashboardGroup: rule.dashboardGroup,
      trafficLight: rule.trafficLight, // 'red' | 'yellow'
      severity: rule.severity,
      weight: rule.weight,
      sectionTitle: sec?.title || 'General Clauses',
      page: sec?.page || 1,
      excerpt: expanded.excerpt,
      matchedPhrase: bestMatch[0],
      start,
      end,
      plainEnglish: rule.plainEnglish,
      whyItMatters: rule.whyItMatters,
      unclearWording: rule.unclearWording,
      worstCase: rule.worstCase,
      fairRedline: rule.fairRedline,
      question: rule.question,
      negotiationPoint: rule.negotiationPoint,
      benchmark: rule.benchmark
    });
  }

  // Sort by severity then document position
  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  findings.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity] || a.start - b.start);

  // Build Traffic-Light Section Map (including GREEN normal/informational clauses!)
  const trafficLightSections = sections.map((sec) => {
    const secFindings = findings.filter((f) => f.start >= sec.start - 5 && f.start <= sec.end + 5);
    const hasRed = secFindings.some((f) => f.trafficLight === 'red' || f.severity === 'critical');
    const hasYellow = secFindings.some((f) => f.trafficLight === 'yellow' || f.severity === 'medium');
    const light = hasRed ? 'red' : hasYellow || secFindings.length > 0 ? 'yellow' : 'green';

    return {
      title: sec.title,
      page: sec.page,
      start: sec.start,
      end: sec.end,
      rawText: sec.text,
      trafficLight: light,
      findingCount: secFindings.length,
      plainSummary:
        secFindings.length > 0
          ? secFindings.map((f) => f.plainEnglish).join(' ')
          : 'Normal / informational clause. Identifies parties, basic scope, or standard operational details with no predatory traps detected.',
      whyItMatters:
        secFindings.length > 0
          ? secFindings[0].whyItMatters
          : 'Still double-check all names, dates, flat/account numbers, and base rates for accuracy.',
      actionHint:
        secFindings.length > 0
          ? secFindings[0].question
          : 'Verify names, dates, and stated figures match what was verbally agreed.'
    };
  });

  // Safety score (0-100)
  const totalPenalty = findings.reduce((sum, f) => sum + f.weight, 0);
  const safetyScore = Math.max(8, Math.min(98, Math.round(100 * Math.exp(-totalPenalty / 72))));
  let grade = 'A';
  let verdict = 'Generally Fair — Low Risk';
  let verdictTone = 'safe';
  if (safetyScore < 30) {
    grade = 'F';
    verdict = 'High Danger — Do Not Sign As-Is';
    verdictTone = 'critical';
  } else if (safetyScore < 50) {
    grade = 'D';
    verdict = 'Predatory Traps Found — Negotiate First';
    verdictTone = 'critical';
  } else if (safetyScore < 68) {
    grade = 'C';
    verdict = 'Needs Attention — Clarify Key Clauses';
    verdictTone = 'warning';
  } else if (safetyScore < 84) {
    grade = 'B';
    verdict = 'Mostly Reasonable — Minor Clarifications';
    verdictTone = 'info';
  }

  // Idea 7: Smart Risk Dashboard Buckets
  const feesCount = findings.filter((f) => f.dashboardGroup === 'fees').length;
  const renewalsCount = findings.filter((f) => f.dashboardGroup === 'renewals').length;
  const penaltiesCount = findings.filter((f) => f.dashboardGroup === 'penalties').length;
  const greenSectionsCount = trafficLightSections.filter((s) => s.trafficLight === 'green').length;
  const yellowCount = findings.filter((f) => f.trafficLight === 'yellow').length;
  const redCount = findings.filter((f) => f.trafficLight === 'red').length;

  // Risk Radar
  const categoryRisk = { hidden_fee: 0, unfair_clause: 0, auto_renewal: 0, termination: 0, rights_liability: 0 };
  for (const f of findings) {
    const bump = f.severity === 'critical' ? 38 : f.severity === 'high' ? 26 : 16;
    if (categoryRisk[f.category] !== undefined) {
      categoryRisk[f.category] = Math.min(100, categoryRisk[f.category] + bump);
    }
  }

  const financialExposure = extractFinancialExposure(cleanText, findings, currency);
  const words = cleanText.split(/\s+/).filter(Boolean);
  const estimatedPages = Math.max(1, trafficLightSections[trafficLightSections.length - 1]?.page || Math.ceil(words.length / 260));
  const avgWordLen = words.reduce((s, w) => s + w.replace(/[^a-z]/gi, '').length, 0) / Math.max(1, words.length);
  const legaleseGrade = Math.min(18, Math.max(10, Math.round(avgWordLen * 2.5)));

  const executiveSummary =
    findings.length === 0
      ? `Analyzed this ${domainInfo.label.toLowerCase()} (${words.length} words). No major predatory clauses were flagged—verify names, dates, and numbers before signing.`
      : `Safety Score ${safetyScore}/100 (Grade ${grade}) — ${redCount} Red high-risk and ${yellowCount} Yellow attention clauses detected across ${estimatedPages} pages, with ${formatCurrencyAmount(
          financialExposure.totalAtRisk,
          currency
        )} in estimated hidden fees or penalty exposure. Review the Smart Dashboard and ask the suggested questions before signing.`;

  const questionsToAsk = findings.map((f, i) => ({
    priority: i + 1,
    severity: f.severity,
    trafficLight: f.trafficLight,
    clauseTitle: f.title,
    sectionTitle: f.sectionTitle,
    page: f.page,
    question: f.question,
    whyItMatters: f.whyItMatters,
    benchmark: f.benchmark
  }));

  return {
    engine: 'ContractLens Deep Legal NLP v3.0',
    title,
    fileName,
    currency,
    analyzedAt: new Date().toISOString(),
    contractType: domainInfo,
    wordCount: words.length,
    estimatedPages,
    readingLevel: {
      originalGrade: legaleseGrade,
      simplifiedGrade: 7,
      estimatedReadMinutes: Math.max(1, Math.ceil(words.length / 220))
    },
    safetyScore,
    grade,
    verdict,
    verdictTone,
    executiveSummary,
    trafficLightCounts: {
      red: redCount,
      yellow: yellowCount,
      green: Math.max(1, greenSectionsCount)
    },
    counts: {
      total: findings.length,
      critical: findings.filter((f) => f.severity === 'critical').length,
      high: findings.filter((f) => f.severity === 'high').length,
      medium: findings.filter((f) => f.severity === 'medium').length
    },
    smartDashboard: {
      clausesNeedingAttention: findings.length,
      pages: estimatedPages,
      cards: [
        {
          id: 'fees',
          title: 'Fees & Deductions',
          count: feesCount,
          tone: feesCount > 0 ? 'red' : 'green',
          subtitle: feesCount > 0 ? 'Additional charges or deductions may apply' : 'No hidden fee traps detected'
        },
        {
          id: 'renewals',
          title: 'Renewal & Deadlines',
          count: renewalsCount,
          tone: renewalsCount > 0 ? 'yellow' : 'green',
          subtitle: renewalsCount > 0 ? 'Automatic renewal or lock-in condition found' : 'No auto-renewal trap detected'
        },
        {
          id: 'penalties',
          title: 'Responsibilities & Penalties',
          count: penaltiesCount,
          tone: penaltiesCount > 0 ? 'red' : 'green',
          subtitle: penaltiesCount > 0 ? 'Review obligations, waivers & penalties' : 'Balanced obligations'
        }
      ],
      unclearClauses: findings.slice(0, 4).map((f) => ({
        id: f.id,
        title: f.title,
        unclear: f.unclearWording
      }))
    },
    riskRadar: [
      { key: 'hidden_fee', label: 'Fees & Deductions', score: categoryRisk.hidden_fee },
      { key: 'unfair_clause', label: 'Unfair Terms', score: categoryRisk.unfair_clause },
      { key: 'auto_renewal', label: 'Renewals', score: categoryRisk.auto_renewal },
      { key: 'termination', label: 'Exit Penalties', score: categoryRisk.termination },
      { key: 'rights_liability', label: 'Rights & Waiver', score: categoryRisk.rights_liability }
    ],
    financialExposure,
    findings,
    trafficLightSections,
    questionsToAsk,
    originalText: cleanText
  };
}
