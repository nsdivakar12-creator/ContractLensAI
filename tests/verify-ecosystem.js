// End-to-End Verification for ALL 9 ContractLens AI Ecosystem Ideas
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SAMPLE_CONTRACTS } from '../sample_contracts/samples.js';
import { analyzeContractLocal } from '../ai/analyzer.js';
import { getTranslatedTerms, translateSingleTerm } from '../ai/legalTranslator.js';
import { explainSelectedPassage } from '../ai/explainer.js';
import { compareContracts } from '../backend/comparisonEngine.js';
import { parseUploadedDocument } from '../documents/documentParser.js';
import { extractContractReminders, generateIcsCalendar } from '../backend/reminderEngine.js';
import { answerContractQuestion } from '../ai/chatEngine.js';
import { evaluateJurisdictionLegality, buildWhatIfScenarios, generateAutoRedline, simulateNegotiationTurn, getLocalizedBriefing } from '../ai/specialFeatures.js';
import {
  attachFourLevelExplanations,
  computeContractRiskDNA,
  detectCombinedClauseRisks,
  detectMissingInformation,
  buildClauseRelationshipMap,
  buildBeforeYouSign,
  simulateHypotheticalScenario,
  queryContractMemory,
  analyzeVersionHistory,
  buildMultilingualVoiceScript
} from '../ai/intelligenceExtensions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

async function run() {
  // Check Extension & Partner SDK files exist
  assert.ok(fs.existsSync(path.join(ROOT, 'extensions', 'manifest.json')));
  assert.ok(fs.existsSync(path.join(ROOT, 'extensions', 'content.js')));
  assert.ok(fs.existsSync(path.join(ROOT, 'frontend', 'widget.js')));
  console.log('✓ Idea 2 Chrome Extension (MV3) & Idea 4 Partner SDK (/widget.js) files verified');

  // Idea 1 & 7: Analyze all 4 sample contracts (INR ₹ & USD $)
  const results = {};
  for (const s of SAMPLE_CONTRACTS) {
    const a = analyzeContractLocal({ title: s.title, text: s.text });
    results[s.id] = a;
    assert.equal(a.currency, s.currency);
    assert.ok(a.trafficLightCounts.red >= 4, `Expected Red clauses in ${s.id}`);
    assert.ok(a.smartDashboard.cards.length === 3);
    console.log(`✓ Idea 1 & 7 [${s.id}]: Score ${a.safetyScore}/100 (${a.grade}) · 🔴${a.trafficLightCounts.red} 🟡${a.trafficLightCounts.yellow} 🟢${a.trafficLightCounts.green} · ${a.currency}${a.financialExposure.totalAtRisk.toLocaleString()}`);
  }

  // Idea 2, 3, 4: Real-time passage explainer
  const exp1 = explainSelectedPassage({ text: 'The security deposit shall be retained subject to adjustment for damages, unpaid dues, and other obligations.' });
  assert.equal(exp1.trafficLight, 'red');
  const exp2 = explainSelectedPassage({ text: 'The platform reserves the right to adjust incentives, deduct applicable charges, or modify compensation policies at its discretion.' });
  assert.equal(exp2.trafficLight, 'red');
  console.log('✓ Ideas 2, 3, 4 Real-Time Clause Explainer verified');

  // Idea 5: Ask My Contract
  const chat = await answerContractQuestion({ question: 'Is there anything that can reduce my payment?', analysis: results['sample-gig-delivery'] });
  assert.ok(chat.relevantSection && chat.clarify && chat.citedFindings.length >= 1);
  console.log('✓ Idea 5 Ask My Contract with Section/Page citations verified');

  // Idea 6: Comparison AI with ₹10,000 vs ₹12,000 table
  const cmp = compareContracts({
    contractA: { title: 'Old Lease', text: 'Monthly Rent is ₹10,000. Security deposit of ₹20,000. Notice period is 1 month. Late fee is ₹500. Renewal is Manual.' },
    contractB: { title: 'New Lease', text: 'Monthly Rent is ₹12,000. Security deposit of ₹30,000. Notice period is 3 months. Late fee is ₹1,000 plus ₹200 per delayed day. This Agreement shall automatically renew for 12 months.' }
  });
  assert.ok(cmp.tableRows.length >= 5, `Expected >=5 comparison rows, got ${cmp.tableRows.length}`);
  assert.equal(cmp.winner, 'A');
  console.log(`✓ Idea 6 Contract Comparison Table (${cmp.tableRows.length} structured ₹ rows) verified`);

  // Compare section file upload: extraction utility + frontend controls + API route.
  const compareUploadText = 'COMPARISON TEST CONTRACT\nMonthly rent is INR 15,000. Notice period is 30 days.';
  const compareUpload = parseUploadedDocument({
    fileName: 'comparison-contract.txt',
    contentBase64: Buffer.from(compareUploadText, 'utf8').toString('base64')
  });
  assert.equal(compareUpload.text, compareUploadText);
  const compareHtml = fs.readFileSync(path.join(ROOT, 'frontend', 'index.html'), 'utf8');
  const compareApp = fs.readFileSync(path.join(ROOT, 'frontend', 'app.js'), 'utf8');
  const compareServer = fs.readFileSync(path.join(ROOT, 'backend', 'server.js'), 'utf8');
  for (const id of ['compareFileA', 'compareFileB', 'compareDropzoneA', 'compareDropzoneB']) {
    assert.ok(compareHtml.includes(`id="${id}"`), `Missing Compare upload control: ${id}`);
  }
  assert.ok(compareApp.includes("bindCompareUpload('A')") && compareApp.includes("bindCompareUpload('B')"));
  assert.ok(compareServer.includes("pathname === '/api/compare/extract'"));
  console.log('✓ Compare section separate file uploads, parser, and extraction API verified');

  // Idea 8: Reminders + .ics Calendar
  const rems = extractContractReminders(results['sample-bengaluru-rental']);
  assert.ok(rems.length >= 2);
  const ics = generateIcsCalendar({ ...rems[0], contractTitle: results['sample-bengaluru-rental'].title });
  assert.ok(ics.includes('BEGIN:VCALENDAR') && ics.includes('BEGIN:VEVENT'));
  console.log(`✓ Idea 8 Deadline Reminders (${rems.length} dates) & .ics Calendar generator verified`);

  // Idea 9 (COMPULSORY): Legal Terms Translator
  const terms = getTranslatedTerms(results['sample-gig-delivery'].originalText);
  assert.ok(terms.length >= 15);
  assert.ok(terms.some((t) => t.id === 'indemnity' && t.inThisContract.found));
  const single = translateSingleTerm('Liquidated Damages', results['sample-gig-delivery'].originalText);
  assert.ok(single.eli5.length > 20);
  console.log(`✓ Idea 9 COMPULSORY Legal Terms Translator (${terms.length} terms + ELI5 + In-Contract context) verified`);

  // Edge modules
  const law = evaluateJurisdictionLegality(results['sample-gig-delivery'], 'india');
  assert.ok(law.illegalCount >= 1);
  const redline = generateAutoRedline(results['sample-bengaluru-rental'], results['sample-bengaluru-rental'].findings.map((f) => f.id));
  assert.ok(redline.projectedScore >= 95);
  const wf = buildWhatIfScenarios(results['sample-bengaluru-rental']);
  assert.ok(wf.length >= 4);
  const spar = simulateNegotiationTurn({ analysis: results['sample-gig-delivery'], clauseId: results['sample-gig-delivery'].findings[0].id, userMessage: 'Under Indian Contract Act Section 27 this is void and outside market benchmarks. Update in writing and I sign today.', currentLeverage: 35 });
  assert.ok(spar.leverageScore >= 80);
  const hi = getLocalizedBriefing(results['sample-bengaluru-rental'], 'hi');
  assert.ok(hi.spokenBriefing.includes('ContractLens'));
  console.log('✓ Edge Modules (India Shield, What-If ₹, Auto-Redline, Sparring Arena) verified');

  // Master Prompt Intelligence Extensions (#3, #5, #6, #7, #8, #9, #13, #14, #22, #24, #25)
  const rental = results['sample-bengaluru-rental'];
  rental.findings = attachFourLevelExplanations(rental.findings, rental.currency);
  assert.ok(rental.findings[0].explanationLevels.beginner && rental.findings[0].explanationLevels.example);

  const dna = computeContractRiskDNA(rental);
  assert.equal(dna.dimensions.length, 7);
  const combos = detectCombinedClauseRisks(rental);
  assert.ok(combos.length >= 1, 'Expected Combined Clause Risks');
  const missing = detectMissingInformation(rental);
  assert.ok(missing.length >= 2, 'Expected Missing Info items');
  const relMap = buildClauseRelationshipMap(rental);
  assert.equal(relMap.nodes.length, 6);
  const bys = buildBeforeYouSign(rental, 'tenant');
  assert.equal(bys.role.id, 'tenant');
  const scen = simulateHypotheticalScenario({ analysis: rental, question: 'What happens if I leave after 2 months?' });
  assert.ok(scen.steps.length >= 3);
  const ver = analyzeVersionHistory([
    { label: 'v1', text: 'Monthly Rent is ₹10,000. Deposit ₹20,000. Notice 1 month. Renewal Manual.' },
    { label: 'v2', text: 'Monthly Rent is ₹12,000. Deposit ₹30,000. Late fee ₹1,000 plus ₹200 per delayed day.' },
    { label: 'v3', text: 'Monthly Rent is ₹12,000. Automatically renew for 12 months with 15% increase. Early termination forfeits deposit.' }
  ]);
  assert.equal(ver.transitions.length, 2);
  const mem = queryContractMemory(Object.values(results), 'Which of my contracts have automatic renewal?');
  assert.ok(mem.matchedContracts.length >= 1);

  for (const lang of ['en', 'hi', 'kn', 'ta', 'te', 'mr', 'es', 'fr']) {
    const v = buildMultilingualVoiceScript({ analysis: rental, lang });
    assert.ok(v.spokenBriefing.length > 30 && v.speechLang);
  }
  console.log('✓ All Master Prompt Extensions verified (Risk DNA, Combined Clauses, Missing Info, Relationship Map, Before You Sign, Scenario Flow, Version History, Contract Memory, 4-Level Depth, 8-Language Voice!)');

  console.log('\nALL 9 IDEAS + ECOSYSTEM TESTS PASSED 100%!');
}

run().catch((err) => { console.error(err); process.exit(1); });
