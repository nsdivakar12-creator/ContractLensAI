// Route-level smoke test for the local HTTP API. Original local vault data is
// restored in finally so running the test never changes a user's saved records.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createAppServer } from '../backend/server.js';
import { SAMPLE_CONTRACTS } from '../sample_contracts/samples.js';

const dbPath = path.join(process.cwd(), 'documents', 'contractlens-db.json');
const originalDb = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : null;
const server = createAppServer();

async function request(base, route, body, method = body === undefined ? 'GET' : 'POST') {
  const response = await fetch(base + route, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  const data = contentType.includes('application/json') && text ? JSON.parse(text) : text;
  return { response, data };
}

try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const index = await fetch(base + '/');
  assert.equal(index.status, 200);
  assert.match(await index.text(), /Legal Terms Translator/);
  console.log('✓ Static app delivery');

  const { data: health } = await request(base, '/api/health');
  assert.equal(health.ok, true);
  assert.equal(health.version, '2.3.0');
  const { data: samples } = await request(base, '/api/samples');
  assert.equal(samples.samples.length, 4);
  console.log('✓ Health and sample library');

  const sample = SAMPLE_CONTRACTS[0];
  const analyze = await request(base, '/api/analyze', { title: 'API Smoke Lease', text: sample.text, contractType: sample.category, jurisdiction: 'india' });
  assert.equal(analyze.response.status, 200);
  const analysis = analyze.data.analysis;
  assert.ok(analysis.id && analysis.originalText && analysis.findings.length);
  console.log('✓ Contract upload/analysis and saved record');

  const explain = await request(base, '/api/explain', { text: 'The tenant waives all rights to recover the full security deposit.' });
  assert.equal(explain.response.status, 200);
  assert.ok(explain.data.explanation.simpleMeaning);
  const glossary = await request(base, '/api/glossary', { contractText: sample.text });
  assert.ok(glossary.data.terms.length >= 15);
  const term = await request(base, '/api/glossary', { term: 'Indemnity', contractText: sample.text });
  assert.ok(term.data.translation.eli5.length > 20);
  const lookup = await request(base, '/api/glossary?q=arbitration');
  assert.ok(lookup.data.terms.length >= 1);
  console.log('✓ Clause explanation and Legal Translator list, single-term, and quick lookup');

  const encoded = Buffer.from('Lease comparison test. Monthly rent is INR 15,000. Notice is 30 days.').toString('base64');
  const extract = await request(base, '/api/compare/extract', { fileName: 'lease.txt', contentBase64: encoded });
  assert.equal(extract.response.status, 200);
  assert.match(extract.data.extracted.text, /Monthly rent/);
  const compare = await request(base, '/api/compare', {
    contractA: { title: 'A', text: 'Monthly Rent is ₹10,000. Security deposit of ₹20,000. Notice period is 1 month. Late fee is ₹500. Renewal is Manual.' },
    contractB: { title: 'B', text: 'Monthly Rent is ₹12,000. Security deposit of ₹30,000. Notice period is 3 months. Late fee is ₹1,000. Automatically renew for 12 months.' }
  });
  assert.ok(compare.data.comparison.tableRows.length >= 5);
  console.log('✓ Compare upload extraction and side-by-side engine');

  const chat = await request(base, '/api/chat', { question: 'Can the landlord keep my deposit?', analysis });
  assert.ok(chat.data.relevantSection || chat.data.answer || chat.data.reply);
  const reminders = await request(base, '/api/reminders');
  assert.ok(Array.isArray(reminders.data.reminders));
  const ics = await request(base, '/api/reminders/ics', {
    title: 'Renewal date', alertMessage: 'Review the agreement', consequence: 'Automatic renewal', isoDate: '2027-01-15', contractTitle: 'Smoke Lease'
  });
  assert.match(ics.data, /BEGIN:VCALENDAR/);
  const email = await request(base, '/api/negotiate-email', { title: 'Smoke Lease', domainType: 'rental' });
  assert.match(email.data.email, /Subject:/);
  console.log('✓ Ask My Contract, reminder retrieval/calendar export, and negotiation email');

  const [jurisdiction, whatIf, redline, sparring, briefing, scenario, role, memory, versions] = await Promise.all([
    request(base, '/api/jurisdiction', { analysis, jurisdiction: 'india' }),
    request(base, '/api/what-if', { analysis }),
    request(base, '/api/auto-redline', { analysis, fixFindingIds: analysis.findings.slice(0, 1).map((f) => f.id) }),
    request(base, '/api/sparring', { analysis, clauseId: analysis.findings[0]?.id, userMessage: 'Please make the clause mutual and reasonable.' }),
    request(base, '/api/briefing', { analysis, lang: 'en' }),
    request(base, '/api/scenario', { analysis, question: 'What if I leave early?' }),
    request(base, '/api/role-perspective', { analysis, userRole: 'tenant' }),
    request(base, '/api/memory', { question: 'Which contracts have renewal rules?' }),
    request(base, '/api/versions', { versions: [
      { label: 'v1', text: 'Rent is ₹10,000. Deposit is ₹20,000.' },
      { label: 'v2', text: 'Rent is ₹12,000. Deposit is ₹30,000.' }
    ] })
  ]);
  assert.ok(jurisdiction.data.jurisdictionAudit);
  assert.ok(whatIf.data.scenarios.length);
  assert.ok(redline.data.redline);
  assert.ok(sparring.data.sparring);
  assert.ok(briefing.data.briefing.spokenBriefing);
  assert.ok(scenario.data.scenario.steps.length);
  assert.ok(role.data.beforeYouSign);
  assert.ok(memory.data.memory);
  assert.equal(versions.data.history.transitions.length, 1);
  console.log('✓ Jurisdiction shield, what-if, redline, negotiation, voice, scenario, role, memory, and version history APIs');

  const history = await request(base, '/api/history');
  assert.ok(history.data.history.some((item) => item.id === analysis.id));
  const detail = await request(base, `/api/history/${encodeURIComponent(analysis.id)}`);
  assert.equal(detail.data.analysis.id, analysis.id);
  console.log('✓ Contract Vault list and detail');

  console.log('\nAPI SMOKE TESTS PASSED.');
} finally {
  try { server.close(); } catch {}
  if (originalDb !== null) fs.writeFileSync(dbPath, originalDb);
  else if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
}
