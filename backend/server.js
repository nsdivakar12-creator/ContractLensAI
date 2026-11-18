// ContractLens AI — Unified Ecosystem Backend Server
// Powers: Web Platform, Interactive PDF Reader, Chrome Extension, Partner Widget SDK,
// Legal Terms Translator, Comparison AI, Deadline Reminders (.ics), Ask My Contract & Defense Simulators

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SAMPLE_CONTRACTS } from '../sample_contracts/samples.js';
import { parseUploadedDocument } from '../documents/documentParser.js';
import { analyzeContractHybrid } from '../ai/llmProvider.js';
import { getTranslatedTerms, translateSingleTerm } from '../ai/legalTranslator.js';
import { explainSelectedPassage } from '../ai/explainer.js';
import { compareContracts } from './comparisonEngine.js';
import { extractContractReminders, generateIcsCalendar } from './reminderEngine.js';
import { answerContractQuestion } from '../ai/chatEngine.js';
import {
  JURISDICTIONS,
  evaluateJurisdictionLegality,
  buildWhatIfScenarios,
  generateAutoRedline,
  simulateNegotiationTurn,
  getLocalizedBriefing
} from '../ai/specialFeatures.js';
import {
  saveAnalysis,
  listAnalyses,
  getAnalysisById,
  deleteAnalysisById,
  saveReminder,
  listReminders,
  deleteReminderById,
  getAllAnalysesFull,
  clearAllData,
  getStats
} from './database.js';
import {
  USER_ROLES,
  VOICE_LANGUAGES,
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
const PUBLIC_DIR = path.join(__dirname, '..', 'frontend');
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || (process.env.PORT ? '0.0.0.0' : '127.0.0.1');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(body);
}

function readJsonBody(req, maxBytes = 12 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('Request exceeds 12MB limit.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON payload.'));
      }
    });
    req.on('error', reject);
  });
}

function buildNegotiationEmail({
  title = 'Contract',
  domainType = 'rental',
  selectedFindings = [],
  tone = 'collaborative',
  recipientName = '',
  senderName = '[Your Name]'
}) {
  const defaultTo =
    domainType === 'rental'
      ? 'Landlord / Property Management'
      : domainType === 'loan'
      ? 'Loan Underwriting Team'
      : 'Partner Operations / HR Team';
  const toName = recipientName.trim() || defaultTo;
  const fromName = senderName.trim() || '[Your Name]';

  if (!selectedFindings.length) {
    return `Subject: Quick Confirmation Before Signing — ${title}\n\nHi ${toName},\n\nThank you for sharing the ${title}. Could you kindly confirm in writing that there are no hidden charges or separate fee schedules outside this document? Once confirmed, I am ready to proceed.\n\nBest regards,\n${fromName}`;
  }

  const redlines = selectedFindings
    .map((f, i) => `${i + 1}. ${f.title}\n   • Requested adjustment: ${f.fairRedline}`)
    .join('\n\n');
  const questions = selectedFindings.map((f, i) => `${i + 1}. ${f.question}`).join('\n');

  if (tone === 'firm') {
    return `Subject: Required Contract Revisions Before Acceptance — ${title}\n\nDear ${toName},\n\nAfter reviewing the ${title}, I cannot sign the draft as written due to ${selectedFindings.length} high-risk or non-standard provisions.\n\nPlease revise the following clauses in writing before execution:\n\n${redlines}\n\nOnce an updated draft reflecting these protections is shared, I will gladly review and sign.\n\nRegards,\n${fromName}`;
  }
  if (tone === 'professional') {
    return `Subject: Proposed Redlines — ${title}\n\nDear ${toName},\n\nThank you for sending the ${title}. I am ready to move forward once we align on these standard revisions:\n\n${redlines}\n\nThese adjustments reflect standard market benchmarks and fair protection for both sides.\n\nSincerely,\n${fromName}`;
  }
  return `Subject: Quick Questions & Small Adjustments — ${title}\n\nHi ${toName},\n\nThank you for sending over the ${title}! I'm excited to move forward and wanted to clarify a few clauses before signing so we are completely aligned:\n\n${questions}\n\nSpecifically, would you be open to updating these ${selectedFindings.length} items?\n\n${redlines}\n\nHappy to hop on a quick call or review an updated draft whenever convenient!\n\nBest regards,\n${fromName}`;
}

function serveStaticFile(reqPath, res) {
  const cleanUrl = reqPath === '/' ? '/index.html' : reqPath.split('?')[0];
  const safePath = path.normalize(cleanUrl).replace(/^(\.\.[/\\])+/, '');
  const fullPath = path.join(PUBLIC_DIR, safePath);

  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, fallback) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(fallback);
        });
        return;
      }
      res.writeHead(500);
      res.end('Server error');
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });
    res.end(content);
  });
}

export function createAppServer() {
  return http.createServer(async (req, res) => {
    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = urlObj.pathname;
    const method = req.method || 'GET';

    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return;
    }

    try {
      // GET /api/health
      if (method === 'GET' && pathname === '/api/health') {
        return sendJson(res, 200, {
          ok: true,
          service: 'ContractLens AI Unified Ecosystem',
          version: '2.3.0',
          engine: 'ContractLens Deep Legal NLP v3.0',
          stats: getStats()
        });
      }

      // GET /api/samples
      if (method === 'GET' && pathname === '/api/samples') {
        return sendJson(res, 200, { samples: SAMPLE_CONTRACTS });
      }

      // POST /api/analyze (Idea 1 + Idea 7 + Idea 8 + Edge modules)
      if (method === 'POST' && pathname === '/api/analyze') {
        const body = await readJsonBody(req);
        const parsed = parseUploadedDocument({
          fileName: body.fileName || 'contract.txt',
          contentBase64: body.contentBase64,
          text: body.text
        });

        const derivedTitle =
          (body.title && body.title.trim()) ||
          (body.fileName ? body.fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') : '') ||
          parsed.text.split(/\r?\n/)[0].slice(0, 68).trim() ||
          'Uploaded Contract';

        const analysis = await analyzeContractHybrid({
          text: parsed.text,
          title: derivedTitle,
          requestedType: body.contractType || 'auto',
          fileName: body.fileName || null,
          llmConfig: body.llmConfig || {}
        });

        const defaultJurisdiction = body.jurisdiction || (analysis.currency === '₹' ? 'india' : 'us_general');
        analysis.findings = attachFourLevelExplanations(analysis.findings, analysis.currency);
        analysis.jurisdictions = JURISDICTIONS;
        analysis.userRoles = USER_ROLES;
        analysis.voiceLanguages = VOICE_LANGUAGES;
        analysis.jurisdictionAudit = evaluateJurisdictionLegality(analysis, defaultJurisdiction);
        analysis.whatIfScenarios = buildWhatIfScenarios(analysis);
        analysis.extractedReminders = extractContractReminders(analysis);
        analysis.riskDNA = computeContractRiskDNA(analysis);
        analysis.combinedClauseRisks = detectCombinedClauseRisks(analysis);
        analysis.missingInformation = detectMissingInformation(analysis);
        analysis.clauseRelationshipMap = buildClauseRelationshipMap(analysis);
        analysis.beforeYouSign = buildBeforeYouSign(analysis, body.userRole || 'auto');

        const saved = saveAnalysis(analysis);
        return sendJson(res, 200, { analysis: saved, stats: getStats() });
      }

      // POST /api/explain (Ideas 2, 3, 4 — Floating PDF Reader, Chrome Extension, Partner Widget)
      if (method === 'POST' && pathname === '/api/explain') {
        const body = await readJsonBody(req);
        const explanation = explainSelectedPassage({
          text: body.text,
          contextMode: body.contextMode || 'reader'
        });
        return sendJson(res, 200, { explanation });
      }

      // POST /api/glossary (Idea 9 COMPULSORY — Legal Terms Translator)
      if (method === 'POST' && pathname === '/api/glossary') {
        const body = await readJsonBody(req);
        const contractText = body.contractText || (body.analysisId ? getAnalysisById(body.analysisId)?.originalText || '' : '');
        if (body.term) {
          return sendJson(res, 200, { translation: translateSingleTerm(body.term, contractText) });
        }
        return sendJson(res, 200, { terms: getTranslatedTerms(contractText, body.query || '') });
      }

      // GET /api/glossary (quick lookup)
      if (method === 'GET' && pathname === '/api/glossary') {
        const q = urlObj.searchParams.get('q') || '';
        return sendJson(res, 200, { terms: getTranslatedTerms('', q) });
      }

      // POST /api/compare/extract — extract text from an uploaded comparison document.
      if (method === 'POST' && pathname === '/api/compare/extract') {
        const body = await readJsonBody(req);
        const fileName = String(body.fileName || 'contract.txt');
        const extension = path.extname(fileName).toLowerCase();
        const supportedExtensions = new Set(['.pdf', '.docx', '.txt', '.md', '.rtf']);
        if (!supportedExtensions.has(extension)) {
          return sendJson(res, 400, { error: 'Unsupported file type. Upload a PDF, DOCX, TXT, MD, or RTF contract.' });
        }
        if (!body.contentBase64) {
          return sendJson(res, 400, { error: 'The uploaded file is empty or could not be read.' });
        }
        const encoded = String(body.contentBase64).includes(',')
          ? String(body.contentBase64).split(',').pop()
          : String(body.contentBase64);
        const fileBytes = Buffer.from(encoded, 'base64').length;
        if (fileBytes > 8 * 1024 * 1024) {
          return sendJson(res, 413, { error: 'Files must be 8 MB or smaller.' });
        }
        const parsed = parseUploadedDocument({ fileName, contentBase64: body.contentBase64 });
        if (!parsed.text || !parsed.text.trim()) {
          return sendJson(res, 422, { error: 'No readable text was found in this file. Try a searchable PDF, DOCX, or paste the contract text instead.' });
        }
        return sendJson(res, 200, {
          extracted: {
            fileName,
            format: parsed.format,
            text: parsed.text,
            characterCount: parsed.text.length,
            wordCount: parsed.text.split(/\s+/).filter(Boolean).length
          }
        });
      }

      // POST /api/compare (Idea 6 — Structured ₹/$ Comparison Table + Risk Delta)
      if (method === 'POST' && pathname === '/api/compare') {
        const body = await readJsonBody(req);
        if (!body?.contractA?.text || !body?.contractB?.text) {
          return sendJson(res, 400, { error: 'Please provide both Contract A and Contract B to compare.' });
        }
        const comparison = compareContracts({ contractA: body.contractA, contractB: body.contractB });
        return sendJson(res, 200, { comparison });
      }

      // POST /api/chat (Idea 5 — Ask My Contract)
      if (method === 'POST' && pathname === '/api/chat') {
        const body = await readJsonBody(req);
        const analysis = body.analysis || (body.analysisId ? getAnalysisById(body.analysisId) : null);
        if (!analysis) return sendJson(res, 400, { error: 'Please analyze or load a contract first.' });
        const reply = await answerContractQuestion({
          question: body.question,
          analysis,
          llmConfig: body.llmConfig || {}
        });
        return sendJson(res, 200, reply);
      }

      // Idea 8 — Reminders CRUD + .ics Calendar Export
      if (method === 'GET' && pathname === '/api/reminders') {
        return sendJson(res, 200, { reminders: listReminders() });
      }
      if (method === 'POST' && pathname === '/api/reminders') {
        const body = await readJsonBody(req);
        const saved = saveReminder(body);
        return sendJson(res, 200, { reminder: saved, stats: getStats() });
      }
      if (method === 'DELETE' && pathname.startsWith('/api/reminders/')) {
        const id = decodeURIComponent(pathname.slice('/api/reminders/'.length));
        deleteReminderById(id);
        return sendJson(res, 200, { ok: true, stats: getStats() });
      }
      if (method === 'POST' && pathname === '/api/reminders/ics') {
        const body = await readJsonBody(req);
        const ics = generateIcsCalendar(body);
        res.writeHead(200, {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'attachment; filename="contractlens-deadline.ics"',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(ics);
        return;
      }

      // POST /api/negotiate-email
      if (method === 'POST' && pathname === '/api/negotiate-email') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, { email: buildNegotiationEmail(body) });
      }

      // Edge Features: Jurisdiction, What-If, Auto-Redline, Sparring Arena, Multi-Language Briefing
      if (method === 'POST' && pathname === '/api/jurisdiction') {
        const body = await readJsonBody(req);
        const analysis = body.analysis || (body.analysisId ? getAnalysisById(body.analysisId) : null);
        if (!analysis) return sendJson(res, 400, { error: 'No contract analysis provided.' });
        return sendJson(res, 200, { jurisdictionAudit: evaluateJurisdictionLegality(analysis, body.jurisdiction || 'india') });
      }

      if (method === 'POST' && pathname === '/api/what-if') {
        const body = await readJsonBody(req);
        const analysis = body.analysis || (body.analysisId ? getAnalysisById(body.analysisId) : null);
        if (!analysis) return sendJson(res, 400, { error: 'No contract analysis provided.' });
        return sendJson(res, 200, { scenarios: buildWhatIfScenarios(analysis) });
      }

      if (method === 'POST' && pathname === '/api/auto-redline') {
        const body = await readJsonBody(req);
        const analysis = body.analysis || (body.analysisId ? getAnalysisById(body.analysisId) : null);
        if (!analysis) return sendJson(res, 400, { error: 'No contract analysis provided.' });
        return sendJson(res, 200, { redline: generateAutoRedline(analysis, body.fixFindingIds || []) });
      }

      if (method === 'POST' && pathname === '/api/sparring') {
        const body = await readJsonBody(req);
        const analysis = body.analysis || (body.analysisId ? getAnalysisById(body.analysisId) : null);
        if (!analysis) return sendJson(res, 400, { error: 'No contract analysis provided.' });
        return sendJson(res, 200, {
          sparring: simulateNegotiationTurn({
            analysis,
            clauseId: body.clauseId,
            difficulty: body.difficulty || 'tough',
            userMessage: body.userMessage || '',
            turnNumber: Number(body.turnNumber) || 1,
            currentLeverage: Number(body.currentLeverage) || 35
          })
        });
      }

      if (method === 'POST' && pathname === '/api/briefing') {
        const body = await readJsonBody(req);
        const analysis = body.analysis || (body.analysisId ? getAnalysisById(body.analysisId) : null);
        if (!analysis) return sendJson(res, 400, { error: 'No contract analysis provided.' });
        return sendJson(res, 200, {
          briefing: buildMultilingualVoiceScript({
            analysis,
            lang: body.lang || 'en',
            customTopic: body.topic || 'briefing'
          })
        });
      }

      // POST /api/scenario — Custom "What Can Go Wrong?" Hypothetical Flow (#7)
      if (method === 'POST' && pathname === '/api/scenario') {
        const body = await readJsonBody(req);
        const analysis = body.analysis || (body.analysisId ? getAnalysisById(body.analysisId) : null);
        if (!analysis) return sendJson(res, 400, { error: 'No contract analysis provided.' });
        return sendJson(res, 200, {
          scenario: simulateHypotheticalScenario({ analysis, question: body.question })
        });
      }

      // POST /api/role-perspective — "Who Am I in This Contract?" (#8 & #9)
      if (method === 'POST' && pathname === '/api/role-perspective') {
        const body = await readJsonBody(req);
        const analysis = body.analysis || (body.analysisId ? getAnalysisById(body.analysisId) : null);
        if (!analysis) return sendJson(res, 400, { error: 'No contract analysis provided.' });
        return sendJson(res, 200, {
          beforeYouSign: buildBeforeYouSign(analysis, body.userRole || 'auto')
        });
      }

      // POST /api/memory — Personal Contract Memory across all saved Vault contracts (#22)
      if (method === 'POST' && pathname === '/api/memory') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, {
          memory: queryContractMemory(getAllAnalysesFull(), body.question || '')
        });
      }

      // POST /api/versions — Multi-Version History Tracker v1 -> v2 -> v3 (#13)
      if (method === 'POST' && pathname === '/api/versions') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, {
          history: analyzeVersionHistory(body.versions || [])
        });
      }

      // POST /api/privacy/clear — Clear Session & Vault (#23)
      if (method === 'POST' && pathname === '/api/privacy/clear') {
        clearAllData();
        return sendJson(res, 200, { ok: true, stats: getStats() });
      }

      // History CRUD
      if (method === 'GET' && pathname === '/api/history') {
        return sendJson(res, 200, { history: listAnalyses(), reminders: listReminders(), stats: getStats() });
      }
      if (method === 'GET' && pathname.startsWith('/api/history/')) {
        const id = decodeURIComponent(pathname.slice('/api/history/'.length));
        const found = getAnalysisById(id);
        if (!found) return sendJson(res, 404, { error: 'Audit not found.' });
        return sendJson(res, 200, { analysis: found });
      }
      if (method === 'DELETE' && pathname.startsWith('/api/history/')) {
        const id = decodeURIComponent(pathname.slice('/api/history/'.length));
        deleteAnalysisById(id);
        return sendJson(res, 200, { ok: true, stats: getStats() });
      }

      if (pathname.startsWith('/api/')) {
        return sendJson(res, 404, { error: `Unknown endpoint: ${method} ${pathname}` });
      }

      serveStaticFile(pathname, res);
    } catch (err) {
      sendJson(res, 400, { error: err.message || 'Request failed.' });
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createAppServer();
  server.listen(PORT, HOST, () => {
    console.log(`ContractLens AI Unified Ecosystem running at http://${HOST}:${PORT}`);
  });
}
