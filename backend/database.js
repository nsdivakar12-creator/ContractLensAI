// Persistent JSON Database for ContractLens AI (Saved Audits + Saved Deadline Reminders)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'documents');
const DB_FILE = path.join(DATA_DIR, 'contractlens-db.json');

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ analyses: [], reminders: [] }, null, 2), 'utf8');
  }
}

function readDb() {
  ensureDb();
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return {
      analyses: Array.isArray(parsed.analyses) ? parsed.analyses : [],
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : []
    };
  } catch {
    return { analyses: [], reminders: [] };
  }
}

function writeDb(data) {
  ensureDb();
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, DB_FILE);
}

export function saveAnalysis(analysis) {
  const db = readDb();
  const id = analysis.id || `cl-${crypto.randomBytes(5).toString('hex')}`;
  const record = { ...analysis, id, savedAt: new Date().toISOString() };
  db.analyses = [record, ...db.analyses.filter((a) => a.id !== id)].slice(0, 40);
  writeDb(db);
  return record;
}

export function listAnalyses() {
  const db = readDb();
  return db.analyses.map((a) => ({
    id: a.id,
    title: a.title,
    currency: a.currency || '₹',
    contractType: a.contractType,
    safetyScore: a.safetyScore,
    grade: a.grade,
    verdict: a.verdict,
    verdictTone: a.verdictTone,
    trafficLightCounts: a.trafficLightCounts,
    counts: a.counts,
    financialExposure: a.financialExposure?.totalAtRisk || 0,
    analyzedAt: a.analyzedAt || a.savedAt
  }));
}

export function getAnalysisById(id) {
  return readDb().analyses.find((a) => a.id === id) || null;
}

export function deleteAnalysisById(id) {
  const db = readDb();
  const before = db.analyses.length;
  db.analyses = db.analyses.filter((a) => a.id !== id);
  if (db.analyses.length !== before) {
    writeDb(db);
    return true;
  }
  return false;
}

export function saveReminder(reminder) {
  const db = readDb();
  const id = reminder.id || `rem-${crypto.randomBytes(4).toString('hex')}`;
  const rec = { ...reminder, id, createdAt: new Date().toISOString() };
  db.reminders = [rec, ...db.reminders.filter((r) => r.id !== id)].slice(0, 50);
  writeDb(db);
  return rec;
}

export function listReminders() {
  return readDb().reminders;
}

export function deleteReminderById(id) {
  const db = readDb();
  const before = db.reminders.length;
  db.reminders = db.reminders.filter((r) => r.id !== id);
  if (db.reminders.length !== before) {
    writeDb(db);
    return true;
  }
  return false;
}

export function getAllAnalysesFull() {
  return readDb().analyses;
}

export function clearAllData() {
  writeDb({ analyses: [], reminders: [] });
  return true;
}

export function getStats() {
  const db = readDb();
  const totalAudits = db.analyses.length;
  return {
    totalAudits,
    totalRisksFlagged: db.analyses.reduce((s, a) => s + (a.counts?.total || 0), 0),
    totalReminders: db.reminders.length,
    avgSafetyScore: totalAudits
      ? Math.round(db.analyses.reduce((s, a) => s + (a.safetyScore || 0), 0) / totalAudits)
      : null
  };
}
