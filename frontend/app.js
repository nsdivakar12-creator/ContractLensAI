// ContractLens AI — Unified Ecosystem Frontend Application
// Integrates all 9 Ideas + Hackathon Edge Simulators into ONE cohesive platform

const state = {
  samples: [],
  currentAnalysis: null,
  selectedFile: null,
  selectedDomain: 'auto',
  userRole: 'auto',
  jurisdiction: 'india',
  jurisdictionAudit: null,
  language: 'en',
  speechRate: 1,
  selectedVoiceUri: 'auto',
  isSpeaking: false,
  explanationDepth: 'simple',
  activeFilter: 'all',
  selectedFindingIds: new Set(),
  lastRedlineResult: null,
  whatIfActiveIds: new Set(),
  sparring: { clauseId: null, difficulty: 'tough', leverage: 35, turnNumber: 1, messages: [], wonClauseIds: new Set() },
  emailTone: 'collaborative',
  chatHistory: [],
  glossaryTerms: [],
  activeGlossaryId: 'indemnity',
  eli5Mode: false,
  selectedReaderText: '',
  mockSite: 'gig',
  llmConfig: {
    provider: sessionStorage.getItem('cl_llm_provider') || 'local',
    apiKey: sessionStorage.getItem('cl_llm_apikey') || ''
  }
};

const $ = (id) => document.getElementById(id);

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatSimpleMarkdown(text = '') {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^&gt;\s*(.+)$/gm, '<blockquote style="margin:6px 0;padding:5px 9px;border-left:3px solid var(--accent);background:var(--bg);border-radius:0 6px 6px 0;">$1</blockquote>');
}

function formatMoney(num = 0, currency = null) {
  const cur = currency || state.currentAnalysis?.currency || '₹';
  const rounded = Math.round(Number(num) || 0);
  return cur === '₹' ? '₹' + rounded.toLocaleString('en-IN') : '$' + rounded.toLocaleString('en-US');
}

function formatRelativeTime(iso) {
  if (!iso) return 'just now';
  const diff = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

let toastTimer = null;
function showToast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2800);
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ==================== NAVIGATION ====================
function switchView(viewName) {
  stopVoiceBriefing();
  hideSelectionPopover();
  document.querySelectorAll('.nav-pill').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  ['viewUpload', 'viewWorkspace', 'viewCompare', 'viewDeadlines', 'viewTranslator', 'viewEcosystem', 'viewHistory'].forEach((id) => {
    $(id).classList.add('hidden');
  });

  if (viewName === 'analyze') {
    $(state.currentAnalysis ? 'viewWorkspace' : 'viewUpload').classList.remove('hidden');
  } else if (viewName === 'compare') {
    $('viewCompare').classList.remove('hidden');
  } else if (viewName === 'deadlines') {
    $('viewDeadlines').classList.remove('hidden');
    loadDeadlinesView();
  } else if (viewName === 'translator') {
    $('viewTranslator').classList.remove('hidden');
    loadGlossaryView();
  } else if (viewName === 'ecosystem') {
    $('viewEcosystem').classList.remove('hidden');
    renderMockBrowserSite(state.mockSite);
  } else if (viewName === 'history') {
    $('viewHistory').classList.remove('hidden');
    loadHistoryView();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showUploadStudio() {
  state.currentAnalysis = null;
  switchView('analyze');
}

// ==================== PIPELINE LOADER ====================
async function runWithPipelineAnimation(asyncTask) {
  const overlay = $('analyzingOverlay');
  const steps = [...document.querySelectorAll('#pipelineSteps li')];
  const bar = $('scanProgressBar');
  const pct = $('scanPercentLabel');
  steps.forEach((li, i) => {
    li.classList.remove('active', 'done');
    if (i === 0) li.classList.add('active');
  });
  if (bar) bar.style.width = '18%';
  if (pct) pct.textContent = '18%';
  overlay.classList.remove('hidden');

  let step = 0;
  const pctStages = [18, 46, 74, 92];
  const timer = setInterval(() => {
    if (step < steps.length - 1) {
      steps[step].classList.remove('active');
      steps[step].classList.add('done');
      step++;
      steps[step].classList.add('active');
      if (bar) bar.style.width = `${pctStages[step]}%`;
      if (pct) pct.textContent = `${pctStages[step]}%`;
    }
  }, 200);

  try {
    const [result] = await Promise.all([asyncTask(), new Promise((r) => setTimeout(r, 760))]);
    steps.forEach((li) => {
      li.classList.remove('active');
      li.classList.add('done');
    });
    if (bar) bar.style.width = '100%';
    if (pct) pct.textContent = '100%';
    await new Promise((r) => setTimeout(r, 120));
    return result;
  } finally {
    clearInterval(timer);
    overlay.classList.add('hidden');
  }
}

// ==================== SAMPLES & UPLOAD STUDIO ====================
async function loadSamples() {
  try {
    const { samples } = await apiFetch('/api/samples');
    state.samples = samples || [];
    const container = $('sampleCardsContainer');
    container.innerHTML = state.samples
      .map(
        (s) => `
      <button type="button" class="sample-card" data-sample-id="${escapeHtml(s.id)}">
        <div class="sample-card-top">
          <span class="sample-badge ${escapeHtml(s.category)}">${escapeHtml(s.badge)}</span>
          <span class="sample-run-hint">Analyze →</span>
        </div>
        <strong>${escapeHtml(s.title)}</strong>
        <span class="sample-sub">${escapeHtml(s.subtitle)}</span>
      </button>`
      )
      .join('');

    container.querySelectorAll('.sample-card').forEach((card) => {
      card.addEventListener('click', () => {
        const s = state.samples.find((x) => x.id === card.dataset.sampleId);
        if (!s) return;
        const autoJur = s.currency === '₹' ? 'india' : 'california';
        $('uploadJurisdictionSelect').value = autoJur;
        analyzePayload({ title: s.title, text: s.text, contractType: s.category, jurisdiction: autoJur });
      });
    });
  } catch (err) {
    console.error(err);
  }
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('Could not read file.'));
    r.readAsDataURL(file);
  });
}

async function handleFileSelection(file) {
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    showUploadError('File exceeds 10MB limit.');
    return;
  }
  hideUploadError();
  const base64 = await readFileAsBase64(file);
  state.selectedFile = { fileName: file.name, contentBase64: base64 };
  $('selectedFileName').textContent = `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`;
  $('selectedFileChip').classList.remove('hidden');
  if (!$('contractTitleInput').value.trim()) {
    $('contractTitleInput').value = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  }
  if (/\.(txt|md)$/i.test(file.name)) {
    $('contractTextInput').value = await file.text();
    updateWordCounter();
  }
  showToast(`Loaded "${file.name}"`);
}

function clearSelectedFile() {
  state.selectedFile = null;
  $('fileInput').value = '';
  $('selectedFileChip').classList.add('hidden');
}

function showUploadError(msg) {
  const el = $('uploadError');
  el.textContent = msg;
  el.classList.remove('hidden');
}
function hideUploadError() {
  $('uploadError').classList.add('hidden');
}
function updateWordCounter() {
  const t = $('contractTextInput').value.trim();
  $('charCounter').textContent = `${(t ? t.split(/\s+/).length : 0).toLocaleString()} words`;
}

// ==================== CORE ANALYSIS ====================
async function analyzePayload({ title, text, fileName, contentBase64, contractType, jurisdiction }) {
  hideUploadError();
  state.jurisdiction = jurisdiction || $('uploadJurisdictionSelect').value || 'india';
  try {
    const data = await runWithPipelineAnimation(() =>
      apiFetch('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({
          title,
          text,
          fileName,
          contentBase64,
          contractType: contractType || state.selectedDomain,
          userRole: state.userRole,
          jurisdiction: state.jurisdiction,
          llmConfig: state.llmConfig
        })
      })
    );
    openAnalysisInWorkspace(data.analysis);
    updateNavBadges(data.stats);
    showToast(`Analyzed — 🔴 ${data.analysis.trafficLightCounts.red} Red · 🟡 ${data.analysis.trafficLightCounts.yellow} Yellow clauses`);
  } catch (err) {
    showUploadError(err.message);
  }
}

// ==================== WORKSPACE RENDER (IDEAS 1, 3, 5, 7) ====================
async function openAnalysisInWorkspace(analysis) {
  stopVoiceBriefing();
  state.currentAnalysis = analysis;
  state.activeFilter = 'all';
  state.emailTone = 'collaborative';
  state.language = 'en';
  $('wsLangSelect').value = 'en';
  $('localizedBriefBanner').classList.add('hidden');
  $('readerExplainDrawer').classList.add('hidden');

  state.selectedFindingIds = new Set(
    analysis.findings.filter((f) => f.trafficLight === 'red' || f.severity === 'critical').map((f) => f.id)
  );
  if (state.selectedFindingIds.size === 0 && analysis.findings.length > 0) {
    state.selectedFindingIds.add(analysis.findings[0].id);
  }

  $('wsTitle').textContent = analysis.title;
  $('wsDomainBadge').textContent = analysis.contractType.label;
  $('wsEngineBadge').textContent = analysis.engine;
  $('wsMetaLine').textContent = `${analysis.wordCount.toLocaleString()} words · ${analysis.estimatedPages} pages · Analyzed ${formatRelativeTime(analysis.analyzedAt)}`;
  $('wsPagesBadge').textContent = `${analysis.estimatedPages} pages · ${analysis.smartDashboard.clausesNeedingAttention} clauses need attention`;

  state.jurisdiction = analysis.jurisdictionAudit?.jurisdiction?.id || state.jurisdiction;
  $('wsJurisdictionSelect').value = state.jurisdiction;
  state.jurisdictionAudit = analysis.jurisdictionAudit;
  updateLegalityPill();

  const activeRoleId = analysis.beforeYouSign?.role?.id || 'tenant';
  state.userRole = activeRoleId;
  if ($('wsRoleSelect')) $('wsRoleSelect').value = activeRoleId;
  populateVoiceOptions();
  renderRiskDnaAndMapTab(analysis);

  // Score Gauge & Traffic Light Strip
  renderScoreGauge(analysis.safetyScore, analysis.grade, analysis.verdictTone);
  const verdictEl = $('wsVerdict');
  verdictEl.textContent = analysis.verdict;
  verdictEl.className = `verdict-title ${analysis.verdictTone}`;
  $('wsExecutiveSummary').textContent = analysis.executiveSummary;

  $('trafficLightStrip').innerHTML = `
    <span class="tl-pill red"><i class="tl-dot red"></i>${analysis.trafficLightCounts.red} Red High-Risk</span>
    <span class="tl-pill yellow"><i class="tl-dot yellow"></i>${analysis.trafficLightCounts.yellow} Yellow Attention</span>
    <span class="tl-pill green"><i class="tl-dot green"></i>${analysis.trafficLightCounts.green} Green Normal</span>
  `;

  // Idea 7: Smart Risk Dashboard Buckets
  const buckets = analysis.smartDashboard?.cards || [];
  $('smartDashboardBuckets').innerHTML =
    buckets
      .map(
        (b) => `
      <div class="bucket-card ${escapeHtml(b.tone)}">
        <div class="kpi-label">${escapeHtml(b.title)}</div>
        <div class="bucket-num">${b.count} <span class="tiny muted" style="font-weight:600;">clauses</span></div>
        <div class="tiny muted">${escapeHtml(b.subtitle)}</div>
      </div>`
      )
      .join('') +
    `
    <div class="bucket-card accent">
      <div class="kpi-label">Est. Financial Exposure</div>
      <div class="bucket-num">${escapeHtml(formatMoney(analysis.financialExposure?.totalAtRisk || 0, analysis.currency))}</div>
      <div class="tiny muted">Hidden fees &amp; penalty traps</div>
    </div>`;

  $('tabFindingsCount').textContent = analysis.counts.total;

  setDocMode('reader');
  renderPaginatedSmartReader(analysis);
  renderTrafficSections(analysis);
  renderFindingsList();
  renderQuestionsList(analysis);
  refreshNegotiationEmail();
  refreshAutoRedline();
  initWhatIfSimulator(analysis);
  initSparringArena(analysis);
  initChatForAnalysis(analysis);

  setActiveIntelTab('findings');
  switchView('analyze');
}

function renderScoreGauge(score, grade, tone) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = { critical: '#dc2626', warning: '#d97706', info: '#2563eb', safe: '#059669' }[tone] || '#4f46e5';
  $('scoreGaugeWrap').innerHTML = `
    <svg viewBox="0 0 88 88" width="88" height="88">
      <circle cx="44" cy="44" r="${r}" fill="none" stroke="var(--border)" stroke-width="8" />
      <circle cx="44" cy="44" r="${r}" fill="none" stroke="${color}" stroke-width="8"
        stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
        transform="rotate(-90 44 44)" style="transition:stroke-dashoffset 0.7s ease;" />
      <text x="44" y="42" text-anchor="middle" font-size="22" font-weight="800" fill="var(--ink)">${score}</text>
      <text x="44" y="58" text-anchor="middle" font-size="10.5" font-weight="800" fill="${color}">GRADE ${escapeHtml(grade)}</text>
    </svg>`;
}

// ==================== IDEA 3: INTERACTIVE SMART PDF READER + FLOATING EXPLAIN ====================
function buildHighlightedHtmlForSlice(fullText, sliceStart, sliceEnd, findings) {
  const relevant = findings
    .filter((f) => f.end > sliceStart && f.start < sliceEnd)
    .sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  let html = '';
  let cursor = sliceStart;
  for (const f of relevant) {
    const s = Math.max(f.start, cursor);
    const e = Math.min(f.end, sliceEnd);
    if (s >= e) continue;
    if (s > cursor) html += escapeHtml(fullText.slice(cursor, s));
    html += `<mark class="risk-mark tl-${escapeHtml(f.trafficLight)}" data-finding-id="${escapeHtml(f.id)}" title="${escapeHtml(f.title)}">${escapeHtml(
      fullText.slice(s, e)
    )}</mark>`;
    cursor = e;
  }
  if (cursor < sliceEnd) html += escapeHtml(fullText.slice(cursor, sliceEnd));
  return html;
}

function renderPaginatedSmartReader(analysis) {
  const sections = analysis.trafficLightSections || [];
  const pagesMap = new Map();
  for (const sec of sections) {
    const p = sec.page || 1;
    if (!pagesMap.has(p)) pagesMap.set(p, []);
    pagesMap.get(p).push(sec);
  }

  const totalPages = pagesMap.size || 1;
  const pagesHtml = [...pagesMap.entries()]
    .map(([pageNum, secs]) => {
      const pStart = secs[0].start;
      const pEnd = secs[secs.length - 1].end;
      const bodyHtml = buildHighlightedHtmlForSlice(analysis.originalText, pStart, pEnd, analysis.findings || []);
      return `
      <div class="pdf-page-sheet" data-page="${pageNum}">
        <div class="pdf-page-header">
          <span>📄 ${escapeHtml(analysis.title.slice(0, 48))}</span>
          <span>Page ${pageNum} of ${totalPages} · Select any text to Explain with AI</span>
        </div>
        <div>${bodyHtml}</div>
      </div>`;
    })
    .join('');

  const container = $('annotatedDocBody');
  container.innerHTML = pagesHtml;

  container.querySelectorAll('mark.risk-mark').forEach((m) => {
    m.addEventListener('click', () => focusFindingById(m.dataset.findingId, { scrollCard: true, scrollDoc: false }));
  });
}

function renderTrafficSections(analysis) {
  $('plainEnglishDocBody').innerHTML = (analysis.trafficLightSections || [])
    .map((sec) => {
      const label = sec.trafficLight === 'red' ? '🔴 Red · High Risk' : sec.trafficLight === 'yellow' ? '🟡 Yellow · Needs Attention' : '🟢 Green · Normal / Informational';
      return `
      <div class="plain-sec-card tl-${escapeHtml(sec.trafficLight)}">
        <div class="plain-sec-head">
          <strong>${escapeHtml(sec.title)} <span class="tiny muted">(Page ${sec.page})</span></strong>
          <span class="tl-pill ${escapeHtml(sec.trafficLight)}">${label}</span>
        </div>
        <p class="plain-sec-body"><strong>Simple explanation:</strong> ${escapeHtml(sec.plainSummary)}</p>
        <p class="tiny muted" style="margin-bottom:5px;"><strong>Why it matters:</strong> ${escapeHtml(sec.whyItMatters)}</p>
        <div class="plain-sec-hint">Ask: ${escapeHtml(sec.actionHint)}</div>
      </div>`;
    })
    .join('');
}

function hideSelectionPopover() {
  $('selectionPopover').classList.add('hidden');
}

async function explainTextInReader(text) {
  hideSelectionPopover();
  const drawer = $('readerExplainDrawer');
  const content = $('readerExplainContent');
  drawer.classList.remove('hidden');
  content.innerHTML = '<div class="tiny muted">Analyzing selected sentence with ContractLens AI...</div>';

  try {
    const { explanation } = await apiFetch('/api/explain', {
      method: 'POST',
      body: JSON.stringify({ text, contextMode: 'pdf_reader' })
    });

    const termsHtml = explanation.detectedTerms?.length
      ? `<div style="margin-top:7px;display:flex;flex-wrap:wrap;gap:5px;align-items:center;">
           <span class="tiny muted">Legal terms detected:</span>
           ${explanation.detectedTerms.map((t) => `<button type="button" class="cite-pill open-term-btn" data-term-id="${escapeHtml(t.id)}">📖 ${escapeHtml(t.term)}</button>`).join('')}
         </div>`
      : '';

    $('drawerExplainTitle').textContent = `✨ Explain with AI — ${explanation.label}`;
    content.innerHTML = `
      <div class="finding-quote" style="margin-bottom:8px;">"${escapeHtml(explanation.excerpt)}"</div>
      <div style="margin-bottom:5px;"><span class="tl-pill ${escapeHtml(explanation.trafficLight)}">${explanation.trafficLight.toUpperCase()} RISK</span></div>
      <p style="margin-bottom:5px;"><strong>Simple meaning:</strong> ${escapeHtml(explanation.simpleMeaning)}</p>
      <p style="margin-bottom:5px;"><strong>What is unclear:</strong> ${escapeHtml(explanation.whatIsUnclear)}</p>
      <p style="margin-bottom:4px;"><strong>Ask before signing:</strong> ${(explanation.askBeforeAgreeing || []).map((q) => `"${escapeHtml(q)}"`).join(' · ')}</p>
      ${termsHtml}
    `;

    content.querySelectorAll('.open-term-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeGlossaryId = btn.dataset.termId;
        switchView('translator');
      });
    });
  } catch (err) {
    content.innerHTML = `<div class="error-banner">${escapeHtml(err.message)}</div>`;
  }
}

function setDocMode(mode) {
  document.querySelectorAll('#docModeToggle .seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.docMode === mode));
  $('annotatedDocBody').classList.toggle('hidden', mode !== 'reader');
  $('readerHelperBar').classList.toggle('hidden', mode !== 'reader');
  $('plainEnglishDocBody').classList.toggle('hidden', mode !== 'traffic');
  $('autoRedlineBody').classList.toggle('hidden', mode !== 'redline');
  if (mode === 'redline') refreshAutoRedline();
}

function focusFindingById(findingId, { scrollCard = true, scrollDoc = true } = {}) {
  setDocMode('reader');
  document.querySelectorAll('mark.risk-mark').forEach((m) => m.classList.remove('active'));
  const mark = document.querySelector(`mark.risk-mark[data-finding-id="${CSS.escape(findingId)}"]`);
  if (mark) {
    mark.classList.add('active');
    if (scrollDoc) mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (scrollCard) {
    setActiveIntelTab('findings');
    if (state.activeFilter !== 'all') {
      state.activeFilter = 'all';
      renderFindingsList();
    }
  }
  document.querySelectorAll('.finding-card').forEach((c) => c.classList.remove('focused'));
  const card = document.querySelector(`.finding-card[data-finding-id="${CSS.escape(findingId)}"]`);
  if (card) {
    card.classList.add('focused');
    if (scrollCard) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// ==================== RIGHT PANE: CLAUSES, CHAT, WHAT-IF, SPARRING, PLAYBOOK ====================
function renderFindingsList() {
  const analysis = state.currentAnalysis;
  if (!analysis) return;
  const lawMap = new Map((state.jurisdictionAudit?.clauses || []).map((c) => [c.findingId, c]));

  document.querySelectorAll('#findingFilterBar .filter-chip').forEach((c) => {
    c.classList.toggle('active', c.dataset.filter === state.activeFilter);
  });

  const filtered = analysis.findings.filter((f) => {
    if (state.activeFilter === 'all') return true;
    if (state.activeFilter === 'red') return f.trafficLight === 'red';
    if (state.activeFilter === 'yellow') return f.trafficLight === 'yellow';
    if (state.activeFilter === 'fees') return f.dashboardGroup === 'fees';
    if (state.activeFilter === 'illegal') {
      const l = lawMap.get(f.id);
      return l && (l.status === 'likely_illegal' || l.status === 'restricted');
    }
    return true;
  });

  const listEl = $('findingsList');
  if (!filtered.length) {
    listEl.innerHTML = '<div class="empty-state">No clauses match this filter. Try switching to "All".</div>';
    return;
  }

  listEl.innerHTML = filtered
    .map((f) => {
      const checked = state.selectedFindingIds.has(f.id) ? 'checked' : '';
      const law = lawMap.get(f.id);
      const lawHtml = law
        ? `<div class="statute-box ${escapeHtml(law.status)}">
             <div class="statute-top"><span class="statute-badge">⚖️ ${escapeHtml(law.badge)}</span><span class="statute-cite">${escapeHtml(law.citation)}</span></div>
             <div>${escapeHtml(law.note)}</div>
           </div>`
        : '';

      const depthText = f.explanationLevels?.[state.explanationDepth] || f.plainEnglish;
      const depthLabelMap = {
        legal: 'Original Legal Text',
        simple: 'Simple Explanation',
        beginner: '🧒 Beginner (New to Contracts)',
        example: '💡 Real-World Example'
      };

      return `
      <article class="finding-card" data-finding-id="${escapeHtml(f.id)}">
        <div class="finding-badges">
          <span class="tl-pill ${escapeHtml(f.trafficLight)}"><i class="tl-dot ${escapeHtml(f.trafficLight)}"></i>${f.trafficLight === 'red' ? 'RED · High Risk' : 'YELLOW · Needs Attention'}</span>
          <span class="cat-tag">Page ${f.page}</span>
        </div>
        <div class="finding-title" data-jump-id="${escapeHtml(f.id)}">${escapeHtml(f.title)}</div>
        ${lawHtml}
        <p class="finding-plain"><strong>${depthLabelMap[state.explanationDepth] || 'Simple Explanation'}:</strong> ${escapeHtml(depthText)}</p>
        <div class="finding-meta-box"><strong>Why it matters:</strong> ${escapeHtml(f.whyItMatters)}<br/><strong>What’s unclear:</strong> ${escapeHtml(f.unclearWording)}</div>
        <div class="finding-quote">"${escapeHtml(f.excerpt)}"</div>
        <div class="redline-box">
          <div class="redline-head"><span>Suggested Negotiation / Fair Redline</span><button type="button" class="mini-copy-btn" data-copy-text="${escapeHtml(f.fairRedline)}">Copy</button></div>
          <div>${escapeHtml(f.fairRedline)}</div>
        </div>
        <div class="finding-footer">
          <label class="check-label"><input type="checkbox" class="clause-select-cb" data-finding-id="${escapeHtml(f.id)}" ${checked} /> Auto-Fix &amp; Add to Email</label>
          <div style="display:flex;gap:10px;">
            <button type="button" class="jump-link spar-clause-btn" data-spar-id="${escapeHtml(f.id)}">🎭 Spar</button>
            <button type="button" class="jump-link" data-jump-id="${escapeHtml(f.id)}">Locate Page ${f.page} →</button>
          </div>
        </div>
      </article>`;
    })
    .join('');

  listEl.querySelectorAll('[data-jump-id]').forEach((el) => el.addEventListener('click', () => focusFindingById(el.dataset.jumpId, { scrollCard: false, scrollDoc: true })));
  listEl.querySelectorAll('.spar-clause-btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      $('sparringClauseSelect').value = btn.dataset.sparId;
      setActiveIntelTab('sparring');
      startSparringRound();
    })
  );
  listEl.querySelectorAll('.mini-copy-btn').forEach((btn) =>
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await navigator.clipboard.writeText(btn.dataset.copyText || '');
      showToast('Redline wording copied!');
    })
  );
  listEl.querySelectorAll('.clause-select-cb').forEach((cb) =>
    cb.addEventListener('change', () => {
      if (cb.checked) state.selectedFindingIds.add(cb.dataset.findingId);
      else state.selectedFindingIds.delete(cb.dataset.findingId);
      refreshNegotiationEmail();
      refreshAutoRedline();
    })
  );
}

// Idea 5: "Ask My Contract" Conversational AI
function initChatForAnalysis(analysis) {
  state.chatHistory = [
    {
      role: 'assistant',
      text: `I've read **${analysis.title}** (${analysis.estimatedPages} pages). Ask me anything—I'll point straight to the exact section and tell you what to clarify before signing.`,
      relevantSection: null,
      clarify: null,
      citedFindings: []
    }
  ];

  const prompts = [
    'Is there anything that can reduce my payment?',
    'How much money can I lose if I cancel?',
    'What are the 3 most important things I should know?',
    'Which clauses should I ask them to change?'
  ];

  $('chatSuggestions').innerHTML = prompts.map((q) => `<button type="button" class="chat-chip" data-q="${escapeHtml(q)}">${escapeHtml(q)}</button>`).join('');
  $('chatSuggestions').querySelectorAll('.chat-chip').forEach((c) => c.addEventListener('click', () => sendChatMessage(c.dataset.q)));
  renderChatMessages();
}

function renderChatMessages() {
  const box = $('chatMessages');
  const fMap = new Map((state.currentAnalysis?.findings || []).map((f) => [f.id, f]));
  box.innerHTML = state.chatHistory
    .map((m) => {
      const cites = (m.citedFindings || [])
        .map((id) => fMap.get(id))
        .filter(Boolean)
        .map((f) => `<button type="button" class="cite-pill" data-cite-id="${escapeHtml(f.id)}">↗ ${escapeHtml(f.sectionTitle)} (Page ${f.page})</button>`)
        .join('');
      const metaHtml =
        m.relevantSection || m.clarify
          ? `<div class="chat-meta-strip">
               ${m.relevantSection ? `<div><strong>Relevant section:</strong> ${escapeHtml(m.relevantSection)}</div>` : ''}
               ${m.clarify ? `<div><strong>You should clarify:</strong> ${escapeHtml(m.clarify)}</div>` : ''}
             </div>`
          : '';
      return `<div class="chat-bubble ${escapeHtml(m.role)}"><div>${formatSimpleMarkdown(m.text)}</div>${metaHtml}${cites ? `<div class="chat-citations">${cites}</div>` : ''}</div>`;
    })
    .join('');

  box.querySelectorAll('.cite-pill').forEach((p) => p.addEventListener('click', () => focusFindingById(p.dataset.citeId, { scrollCard: false, scrollDoc: true })));
  box.scrollTop = box.scrollHeight;
}

async function sendChatMessage(qText) {
  const q = (qText || '').trim();
  if (!q || !state.currentAnalysis) return;
  state.chatHistory.push({ role: 'user', text: q, citedFindings: [] });
  renderChatMessages();
  $('chatInput').value = '';
  $('chatSendBtn').disabled = true;

  try {
    const reply = await apiFetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ analysis: state.currentAnalysis, question: q, llmConfig: state.llmConfig })
    });
    state.chatHistory.push({
      role: 'assistant',
      text: reply.answer,
      relevantSection: reply.relevantSection,
      clarify: reply.clarify,
      citedFindings: reply.citedFindings || []
    });
  } catch (err) {
    state.chatHistory.push({ role: 'assistant', text: `Error: ${err.message}`, citedFindings: [] });
  } finally {
    $('chatSendBtn').disabled = false;
    renderChatMessages();
  }
}

// Auto-Redline, What-If, Sparring, Jurisdiction, Voice Briefing
async function refreshJurisdictionAudit() {
  if (!state.currentAnalysis) return;
  const { jurisdictionAudit } = await apiFetch('/api/jurisdiction', {
    method: 'POST',
    body: JSON.stringify({ analysis: state.currentAnalysis, jurisdiction: state.jurisdiction })
  });
  state.jurisdictionAudit = jurisdictionAudit;
  updateLegalityPill();
  renderFindingsList();
}

function updateLegalityPill() {
  const audit = state.jurisdictionAudit;
  const pill = $('legalityAlertPill');
  if (!audit) return;
  if (audit.illegalCount > 0) {
    pill.textContent = `🚨 ${audit.illegalCount} Clause${audit.illegalCount > 1 ? 's' : ''} Likely Void / Illegal in ${audit.jurisdiction.label.split(' ')[0]}`;
    pill.className = 'legality-alert-pill';
  } else if (audit.restrictedCount > 0) {
    pill.textContent = `⚠️ ${audit.restrictedCount} Statutorily Restricted`;
    pill.className = 'legality-alert-pill';
  } else {
    pill.textContent = `✓ Checked (${audit.jurisdiction.label.split(' ')[0]})`;
    pill.className = 'legality-alert-pill safe';
  }
}

const SPEECH_LANG_MAP = {
  en: 'en-US', hi: 'hi-IN', kn: 'kn-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN', es: 'es-ES', fr: 'fr-FR'
};

function populateVoiceOptions() {
  const sel = $('wsVoiceSelect');
  if (!sel || !('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices() || [];
  const targetPrefix = state.language;
  const matching = voices.filter((v) => v.lang.toLowerCase().startsWith(targetPrefix));
  const others = voices.filter((v) => !v.lang.toLowerCase().startsWith(targetPrefix)).slice(0, 12);

  sel.innerHTML =
    `<option value="auto">Auto (${targetPrefix.toUpperCase()} Voice)</option>` +
    matching.map((v) => `<option value="${escapeHtml(v.voiceURI)}">★ ${escapeHtml(v.name)} (${escapeHtml(v.lang)})</option>`).join('') +
    (others.length ? `<optgroup label="Other Installed Voices">${others.map((v) => `<option value="${escapeHtml(v.voiceURI)}">${escapeHtml(v.name)} (${escapeHtml(v.lang)})</option>`).join('')}</optgroup>` : '');

  if (matching.length > 0 && state.selectedVoiceUri === 'auto') {
    sel.value = 'auto';
  }
}

function speakTextInSelectedLanguage(text, speechLangOverride = null) {
  if (!('speechSynthesis' in window)) {
    showToast('Speech synthesis not supported in this browser.');
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const targetLang = speechLangOverride || SPEECH_LANG_MAP[state.language] || 'en-US';
  u.lang = targetLang;
  u.rate = Number(state.speechRate) || 1;

  const voices = window.speechSynthesis.getVoices() || [];
  if (state.selectedVoiceUri && state.selectedVoiceUri !== 'auto') {
    const picked = voices.find((v) => v.voiceURI === state.selectedVoiceUri);
    if (picked) u.voice = picked;
  } else {
    const autoMatch = voices.find((v) => v.lang.toLowerCase().startsWith(state.language));
    if (autoMatch) u.voice = autoMatch;
  }

  u.onstart = () => {
    state.isSpeaking = true;
    $('voiceBriefBtn')?.classList.add('playing');
    if ($('voiceBriefLabel')) $('voiceBriefLabel').textContent = 'Stop Audio';
  };
  u.onend = () => stopVoiceBriefing();
  u.onerror = () => stopVoiceBriefing();
  window.speechSynthesis.speak(u);
}

async function loadLocalizedBriefing(lang, topic = 'briefing') {
  if (!state.currentAnalysis) return null;
  const { briefing } = await apiFetch('/api/briefing', {
    method: 'POST',
    body: JSON.stringify({ analysis: state.currentAnalysis, lang, topic })
  });
  $('localizedHeading').textContent = `${briefing.heading}`;
  $('localizedText').textContent = briefing.spokenBriefing;
  $('localizedBriefBanner').classList.remove('hidden');
  return briefing;
}

function stopVoiceBriefing() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  state.isSpeaking = false;
  $('voiceBriefBtn')?.classList.remove('playing');
  if ($('voiceBriefLabel')) $('voiceBriefLabel').textContent = '🎙️ Play Audio';
}

async function toggleVoiceBriefing() {
  if (state.isSpeaking) { stopVoiceBriefing(); return; }
  const b = await loadLocalizedBriefing(state.language, 'briefing');
  if (!b) return;
  speakTextInSelectedLanguage(b.spokenBriefing, b.speechLang);
}

async function triggerVoiceAskCommand() {
  if (!state.currentAnalysis) return;
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

  const runVoiceTopic = async (spokenQuery) => {
    setActiveIntelTab('chat');
    await sendChatMessage(spokenQuery);
    const topic = /cancel|exit|leave|terminat/i.test(spokenQuery) ? 'cancel' : 'briefing';
    const b = await loadLocalizedBriefing(state.language, topic);
    if (b) {
      speakTextInSelectedLanguage(b.spokenBriefing, b.speechLang);
      if (b.jumpToFindingId) focusFindingById(b.jumpToFindingId, { scrollCard: false, scrollDoc: true });
    }
  };

  if (SpeechRec) {
    try {
      const rec = new SpeechRec();
      rec.lang = SPEECH_LANG_MAP[state.language] || 'en-US';
      rec.interimResults = false;
      showToast(`🎤 Listening in ${$('wsLangSelect').options[$('wsLangSelect').selectedIndex].text}... Speak now!`);
      rec.onresult = (ev) => {
        const transcript = ev.results?.[0]?.[0]?.transcript || 'What happens if I cancel this agreement?';
        showToast(`Heard: "${transcript}"`);
        runVoiceTopic(transcript);
      };
      rec.onerror = () => runVoiceTopic('What happens if I cancel this agreement?');
      rec.start();
      return;
    } catch {
      // Fallback to instant voice command demo
    }
  }
  showToast('🎤 Voice Demo: "What happens if I cancel this agreement?"');
  await runVoiceTopic('What happens if I cancel this agreement?');
}

// ==================== RISK DNA, BEFORE YOU SIGN, COMBINED CLAUSES, MISSING INFO & MAP ====================
function renderRiskDnaAndMapTab(analysis) {
  if (!analysis) return;

  // Before You Sign Card (#8 & #9)
  const bys = analysis.beforeYouSign;
  if (bys) {
    $('beforeYouSignCard').innerHTML = `
      <div class="bys-top">
        <div>
          <span class="badge-accent">BEFORE YOU SIGN · ${escapeHtml(bys.role.icon)} ${escapeHtml(bys.role.label)} Perspective</span>
          <h3 style="margin-top:4px;">Contract Readiness Score</h3>
        </div>
        <div class="bys-score">${bys.readinessScore}/100</div>
      </div>
      <p class="tiny muted">${escapeHtml(bys.perspectiveNote)}</p>
      <div class="traffic-light-strip">
        <span class="tl-pill red">🔴 ${bys.redCount} things to clarify</span>
        <span class="tl-pill yellow">🟡 ${bys.yellowCount} need attention</span>
        <span class="tl-pill green">🟢 ${bys.greenCount} straightforward</span>
      </div>
      <div>
        <div class="kpi-label" style="margin-bottom:4px;">Top Questions to Ask Before Signing</div>
        <ol class="bys-questions">${bys.topQuestions.map((q) => `<li>${escapeHtml(q)}</li>`).join('')}</ol>
      </div>
      <div class="tiny muted" style="border-top:1px solid var(--border);padding-top:6px;">${escapeHtml(bys.disclaimer)}</div>
    `;
  }

  // Contract Risk DNA (#3)
  const dna = analysis.riskDNA;
  if (dna) {
    $('riskDnaOverallBadge').textContent = `${dna.overallRisk}/100 — ${dna.overallBand}`;
    $('riskDnaBars').innerHTML = dna.dimensions
      .map((d) => {
        const col = d.score >= 70 ? 'var(--critical)' : d.score >= 45 ? 'var(--medium)' : 'var(--safe)';
        return `
        <div class="dna-row">
          <div class="dna-head"><span>${escapeHtml(d.label)}</span><span style="color:${col};font-family:var(--font-mono);">${d.score}/100</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${d.score}%;background:${col};"></div></div>
        </div>`;
      })
      .join('');
  }

  // Combined Clause Risks (#5)
  const combos = analysis.combinedClauseRisks || [];
  $('combinedClausesList').innerHTML = combos.length
    ? combos
        .map(
          (c) => `
      <div class="combined-card">
        <strong>⚠️ COMBINED CLAUSE RISK: ${escapeHtml(c.title)}</strong>
        <div class="combined-pair">
          <button type="button" class="cite-pill jump-combo-btn" data-id="${escapeHtml(c.clauseA.id)}">Clause A: ${escapeHtml(c.clauseA.title)} (p.${c.clauseA.page})</button>
          <strong>+</strong>
          <button type="button" class="cite-pill jump-combo-btn" data-id="${escapeHtml(c.clauseB.id)}">Clause B: ${escapeHtml(c.clauseB.title)} (p.${c.clauseB.page})</button>
        </div>
        <p>${escapeHtml(c.relationship)}</p>
      </div>`
        )
        .join('')
    : '<div class="tiny muted">No compounding clause interactions detected.</div>';

  $('combinedClausesList').querySelectorAll('.jump-combo-btn').forEach((b) =>
    b.addEventListener('click', () => focusFindingById(b.dataset.id, { scrollCard: false, scrollDoc: true }))
  );

  // Missing Information Detector (#6)
  const missing = analysis.missingInformation || [];
  $('missingInfoList').innerHTML = missing.length
    ? missing
        .map(
          (m) => `
      <div class="missing-card">
        <strong>${escapeHtml(m.label)}</strong>
        <div class="tiny muted">${escapeHtml(m.issue)}</div>
        <div class="tiny" style="color:var(--accent);font-weight:600;">Ask: "${escapeHtml(m.ask)}"</div>
      </div>`
        )
        .join('')
    : '<div class="tiny muted">No major missing definitions flagged.</div>';

  // Interactive Legal Clause Relationship Map (#14)
  const mapData = analysis.clauseRelationshipMap;
  if (mapData?.nodes?.length) {
    const chainEl = $('relationshipMapNodes');
    chainEl.innerHTML = mapData.nodes
      .map(
        (n, idx) =>
          `<button type="button" class="rel-node-btn ${escapeHtml(n.riskTone)} ${idx === 0 ? 'active' : ''}" data-node-id="${escapeHtml(n.id)}">${escapeHtml(n.icon)} ${escapeHtml(n.label)} (${n.count})</button>` +
          (idx < mapData.nodes.length - 1 ? '<span class="rel-arrow">↕</span>' : '')
      )
      .join('');

    const showNode = (nodeId) => {
      chainEl.querySelectorAll('.rel-node-btn').forEach((b) => b.classList.toggle('active', b.dataset.nodeId === nodeId));
      const node = mapData.nodes.find((x) => x.id === nodeId) || mapData.nodes[0];
      const detail = $('relationshipNodeDetail');
      detail.innerHTML = node.clauses.length
        ? `<strong>${escapeHtml(node.icon)} ${escapeHtml(node.label)} — ${node.clauses.length} Linked Clause(s)</strong>` +
          node.clauses
            .map(
              (c) => `<div><button type="button" class="cite-pill jump-map-btn" data-id="${escapeHtml(c.id)}">Page ${c.page}: ${escapeHtml(c.title)}</button><div class="tiny muted" style="margin-top:2px;">${escapeHtml(c.plainEnglish)}</div></div>`
            )
            .join('')
        : `<strong>${escapeHtml(node.icon)} ${escapeHtml(node.label)}</strong><div class="tiny muted">No risk traps linked directly to this node.</div>`;

      detail.querySelectorAll('.jump-map-btn').forEach((b) =>
        b.addEventListener('click', () => focusFindingById(b.dataset.id, { scrollCard: false, scrollDoc: true }))
      );
    };

    chainEl.querySelectorAll('.rel-node-btn').forEach((b) => b.addEventListener('click', () => showNode(b.dataset.nodeId)));
    const firstRisky = mapData.nodes.find((n) => n.count > 0) || mapData.nodes[0];
    showNode(firstRisky.id);
  }
}

async function refreshRolePerspective(newRole) {
  if (!state.currentAnalysis) return;
  state.userRole = newRole;
  const { beforeYouSign } = await apiFetch('/api/role-perspective', {
    method: 'POST',
    body: JSON.stringify({ analysis: state.currentAnalysis, userRole: newRole })
  });
  state.currentAnalysis.beforeYouSign = beforeYouSign;
  renderRiskDnaAndMapTab(state.currentAnalysis);
  showToast(`Perspective updated: ${beforeYouSign.role.icon} ${beforeYouSign.role.label}`);
}

async function runHypotheticalScenario(questionText) {
  if (!state.currentAnalysis || !questionText.trim()) return;
  const out = $('scenarioFlowOutput');
  out.classList.remove('hidden');
  out.innerHTML = '<div class="tiny muted">Simulating contract scenario flow...</div>';
  try {
    const { scenario } = await apiFetch('/api/scenario', {
      method: 'POST',
      body: JSON.stringify({ analysis: state.currentAnalysis, question: questionText })
    });
    out.innerHTML = scenario.steps
      .map(
        (st, i) =>
          `<div class="flow-step ${escapeHtml(st.tone)}"><strong>${escapeHtml(st.stage)}:</strong> ${escapeHtml(st.detail)}</div>` +
          (i < scenario.steps.length - 1 ? '<div class="flow-arrow">↓</div>' : '')
      )
      .join('');
  } catch (err) {
    out.innerHTML = `<div class="error-banner">${escapeHtml(err.message)}</div>`;
  }
}

async function runVersionHistoryDemo() {
  const out = $('versionHistoryOutput');
  out.innerHTML = '<div class="tiny muted">Comparing Version 1 → Version 2 → Version 3...</div>';
  const versions = [
    {
      label: 'Version 1 (Initial Offer)',
      text: 'Monthly Rent is ₹10,000. Security deposit of ₹20,000 refunded within 21 days. Notice period is 1 month written notice. Late fee is ₹500. Renewal is Manual.'
    },
    {
      label: 'Version 2 (Landlord Revision)',
      text: 'Monthly Rent is ₹12,000. Security deposit of ₹30,000 retained subject to adjustment for wear and tear and other obligations, returned within 90 days after vacating. Notice period is 3 months. Late fee is ₹1,000 plus ₹200 per delayed day.'
    },
    {
      label: 'Version 3 (Final Aggressive Draft)',
      text: 'Monthly Rent is ₹12,000 plus ₹2,500 mandatory monthly amenity fee. Security deposit of ₹30,000 retained for wear and tear and other obligations, returned within 90 days after vacating. Unless Tenant gives 90 days notice via registered post, this Agreement shall automatically renew for 12 months with a 15% increase. Early termination results in automatic forfeiture of the entire security deposit.'
    }
  ];

  const { history } = await apiFetch('/api/versions', {
    method: 'POST',
    body: JSON.stringify({ versions })
  });

  out.innerHTML = history.versions
    .map((v, i) => {
      const tr = i > 0 ? history.transitions[i - 1] : null;
      return `
      <div class="version-step-card">
        <div class="section-row-between">
          <strong>${escapeHtml(v.title)}</strong>
          <span class="tl-pill ${v.safetyScore < 50 ? 'red' : v.safetyScore < 75 ? 'yellow' : 'green'}">${v.safetyScore}/100 (${escapeHtml(v.grade)})</span>
        </div>
        <div class="tiny muted">🔴 ${v.redCount} Red · 🟡 ${v.yellowCount} Yellow · Exposure: ${escapeHtml(v.exposure)}</div>
        ${
          tr
            ? `<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border);font-size:12px;">
                 <strong>Important changes from ${escapeHtml(tr.from)}:</strong>
                 <div style="color:${tr.scoreDelta < 0 ? 'var(--critical)' : 'var(--safe)'};font-weight:700;">Score ${tr.scoreDelta >= 0 ? '+' : ''}${tr.scoreDelta} pts</div>
                 ${tr.addedRisks.length ? `<div>⚠️ Added: ${tr.addedRisks.map(escapeHtml).join(', ')}</div>` : ''}
                 ${tr.removedRisks.length ? `<div>✓ Removed: ${tr.removedRisks.map(escapeHtml).join(', ')}</div>` : ''}
               </div>`
            : '<div class="tiny muted">Baseline version</div>'
        }
      </div>`;
    })
    .join('');
}

async function runMemoryQuery(qText) {
  const q = (qText || '').trim();
  if (!q) return;
  const box = $('memoryResultBox');
  box.classList.remove('hidden');
  box.innerHTML = '<div class="tiny muted">Searching across all saved contracts in your Vault...</div>';
  const { memory } = await apiFetch('/api/memory', {
    method: 'POST',
    body: JSON.stringify({ question: q })
  });
  const pills = (memory.matchedContracts || [])
    .map((c) => `<button type="button" class="cite-pill open-mem-btn" data-id="${escapeHtml(c.id)}">📄 ${escapeHtml(c.title)} (${c.score}/100)</button>`)
    .join('');
  box.innerHTML = `<div>${formatSimpleMarkdown(memory.answer)}</div>${pills ? `<div class="chat-citations">${pills}</div>` : ''}`;
  box.querySelectorAll('.open-mem-btn').forEach((b) =>
    b.addEventListener('click', async () => {
      const { analysis } = await apiFetch(`/api/history/${encodeURIComponent(b.dataset.id)}`);
      openAnalysisInWorkspace(analysis);
    })
  );
}

async function refreshAutoRedline() {
  if (!state.currentAnalysis) return;
  const { redline } = await apiFetch('/api/auto-redline', {
    method: 'POST',
    body: JSON.stringify({ analysis: state.currentAnalysis, fixFindingIds: [...state.selectedFindingIds] })
  });
  state.lastRedlineResult = redline;
  $('redlineBeforeScore').textContent = `${redline.originalScore} (${redline.originalGrade})`;
  $('redlineAfterScore').textContent = `${redline.projectedScore} (${redline.projectedGrade})`;
  $('redlineDeltaPill').textContent = `+${redline.scoreGain} pts (${redline.fixedCount} fixed)`;
  $('redlineDiffCanvas').innerHTML = redline.segments
    .map((s) => (s.type === 'unchanged' ? escapeHtml(s.text) : `<span class="diff-del">${escapeHtml(s.removed)}</span><span class="diff-ins">${escapeHtml(s.inserted)}</span>`))
    .join('');
}

function initWhatIfSimulator(analysis) {
  const sc = analysis.whatIfScenarios || [];
  state.whatIfActiveIds = new Set(sc.filter((s) => s.activeByDefault).map((s) => s.id));
  renderWhatIfSimulator();
}

function renderWhatIfSimulator() {
  const scenarios = state.currentAnalysis?.whatIfScenarios || [];
  const cur = state.currentAnalysis?.currency || '₹';
  let pred = 0;
  let fair = 0;
  for (const s of scenarios) {
    if (state.whatIfActiveIds.has(s.id)) { pred += s.predatoryCost; fair += s.fairCost; }
  }
  const savings = Math.max(0, pred - fair);
  const maxVal = Math.max(1000, pred, fair);
  $('simPredatoryTotal').textContent = formatMoney(pred, cur);
  $('simFairTotal').textContent = formatMoney(fair, cur);
  $('simSavingsTotal').textContent = formatMoney(savings, cur);
  $('simBarPredatory').style.width = `${Math.min(100, Math.round((pred / maxVal) * 100))}%`;
  $('simBarFair').style.width = `${Math.min(100, Math.round((fair / maxVal) * 100))}%`;

  const list = $('whatIfScenariosList');
  list.innerHTML = scenarios
    .map((s) => {
      const on = state.whatIfActiveIds.has(s.id);
      const diff = Math.max(0, s.predatoryCost - s.fairCost);
      return `
      <div class="sim-scenario-card ${on ? 'active' : ''}" data-sim-id="${escapeHtml(s.id)}">
        <div class="sim-sc-top">
          <div class="sim-sc-title"><span>${escapeHtml(s.icon)}</span><span>${escapeHtml(s.title)}</span></div>
          <div style="display:flex;align-items:center;gap:7px;">
            <span class="sim-sc-cost ${diff === 0 ? 'zero' : ''}">${diff > 0 ? `+${formatMoney(diff, cur)}` : formatMoney(0, cur)}</span>
            <span class="sim-toggle-pill">${on ? 'ON' : 'TRY'}</span>
          </div>
        </div>
        <div class="tiny muted">${escapeHtml(s.explanation)}</div>
      </div>`;
    })
    .join('');

  list.querySelectorAll('.sim-scenario-card').forEach((c) =>
    c.addEventListener('click', () => {
      const id = c.dataset.simId;
      if (state.whatIfActiveIds.has(id)) state.whatIfActiveIds.delete(id);
      else state.whatIfActiveIds.add(id);
      renderWhatIfSimulator();
    })
  );
}

function initSparringArena(analysis) {
  const sel = $('sparringClauseSelect');
  state.sparring.wonClauseIds = new Set();
  $('concessionsWonBadge').textContent = '🏆 0 Clauses Won';
  const findings = analysis.findings || [];
  if (!findings.length) { sel.innerHTML = '<option>No risky clauses</option>'; return; }
  sel.innerHTML = findings.map((f) => `<option value="${escapeHtml(f.id)}">[${f.trafficLight.toUpperCase()}] ${escapeHtml(f.title)}</option>`).join('');
  startSparringRound();
}

async function startSparringRound() {
  if (!state.currentAnalysis) return;
  state.sparring.clauseId = $('sparringClauseSelect').value;
  state.sparring.difficulty = $('sparringDifficultySelect').value;
  state.sparring.leverage = 35;
  state.sparring.turnNumber = 1;
  state.sparring.messages = [];
  const { sparring } = await apiFetch('/api/sparring', {
    method: 'POST',
    body: JSON.stringify({ analysis: state.currentAnalysis, clauseId: state.sparring.clauseId, difficulty: state.sparring.difficulty, userMessage: '' })
  });
  state.sparring.messages.push({ role: 'assistant', sender: `${sparring.persona.avatar} ${sparring.persona.role}`, text: sparring.opponentReply });
  renderSparringUi(sparring);
}

async function sendSparringMove(text) {
  const msg = (text || '').trim();
  if (!msg || !state.currentAnalysis) return;
  state.sparring.messages.push({ role: 'user', sender: 'You', text: msg });
  $('sparringInput').value = '';
  const { sparring } = await apiFetch('/api/sparring', {
    method: 'POST',
    body: JSON.stringify({
      analysis: state.currentAnalysis,
      clauseId: state.sparring.clauseId,
      difficulty: state.sparring.difficulty,
      userMessage: msg,
      turnNumber: state.sparring.turnNumber,
      currentLeverage: state.sparring.leverage
    })
  });
  state.sparring.leverage = sparring.leverageScore;
  state.sparring.turnNumber = sparring.turnNumber;
  state.sparring.messages.push({ role: 'assistant', sender: `${sparring.persona.avatar} ${sparring.persona.role}`, text: sparring.opponentReply });
  if (sparring.concessionStatus === 'conceded') {
    state.sparring.wonClauseIds.add(state.sparring.clauseId);
    $('concessionsWonBadge').textContent = `🏆 ${state.sparring.wonClauseIds.size} Clause${state.sparring.wonClauseIds.size === 1 ? '' : 's'} Won`;
    showToast('🏆 Concession won!');
  }
  renderSparringUi(sparring);
}

function renderSparringUi(sparring) {
  $('leverageScoreLabel').textContent = `${sparring.leverageScore} / 100`;
  const bar = $('leverageBarFill');
  bar.style.width = `${sparring.leverageScore}%`;
  bar.style.background = sparring.leverageScore >= 80 ? 'var(--safe)' : sparring.leverageScore >= 55 ? 'var(--accent)' : 'var(--high)';
  $('coachTipBox').innerHTML = `<strong>🎯 Live Coach:</strong> ${escapeHtml(sparring.coachTip)}`;

  const box = $('sparringMessages');
  box.innerHTML = state.sparring.messages
    .map((m) => `<div class="chat-bubble ${escapeHtml(m.role)}"><div style="font-size:10.5px;font-weight:700;opacity:0.8;margin-bottom:2px;">${escapeHtml(m.sender)}</div><div>${escapeHtml(m.text)}</div></div>`)
    .join('');
  box.scrollTop = box.scrollHeight;

  const moves = $('sparringSuggestedMoves');
  moves.innerHTML = (sparring.suggestedMoves || [])
    .map((m) => `<button type="button" class="pro-move-btn" data-move="${escapeHtml(m)}">💡 <strong>Pro Move:</strong> ${escapeHtml(m)}</button>`)
    .join('');
  moves.querySelectorAll('.pro-move-btn').forEach((b) => b.addEventListener('click', () => sendSparringMove(b.dataset.move)));
}

function renderQuestionsList(analysis) {
  $('questionsList').innerHTML = (analysis.questionsToAsk || [])
    .map(
      (q) => `
    <div class="question-card">
      <div class="question-card-q">${q.priority}. "${escapeHtml(q.question)}"</div>
      <div class="tiny muted">${escapeHtml(q.whyItMatters)}</div>
      <div class="question-card-bench">Market Benchmark: ${escapeHtml(q.benchmark)}</div>
    </div>`
    )
    .join('');
}

async function refreshNegotiationEmail() {
  const analysis = state.currentAnalysis;
  if (!analysis) return;
  const selected = analysis.findings.filter((f) => state.selectedFindingIds.has(f.id));
  $('selectedClausesCount').textContent = `${selected.length} clauses selected`;
  document.querySelectorAll('#emailToneSelector .seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.tone === state.emailTone));
  const { email } = await apiFetch('/api/negotiate-email', {
    method: 'POST',
    body: JSON.stringify({
      title: analysis.title,
      domainType: analysis.contractType.type,
      selectedFindings: selected,
      tone: state.emailTone,
      recipientName: $('emailRecipientInput').value,
      senderName: $('emailSenderInput').value
    })
  });
  $('negotiationEmailBox').value = email;
}

function setActiveIntelTab(tab) {
  document.querySelectorAll('#intelTabs .intel-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.intel-pane .tab-panel').forEach((p) => p.classList.remove('active'));
  const map = { findings: 'panelFindings', dna: 'panelDna', chat: 'panelChat', whatif: 'panelWhatIf', sparring: 'panelSparring', playbook: 'panelPlaybook' };
  $(map[tab] || 'panelFindings').classList.add('active');
}

// ==================== IDEA 6: STRUCTURED COMPARISON TABLE ====================
function loadIndianRentalCompareDemo() {
  $('compareTitleA').value = 'Contract A — Old Rental Agreement';
  $('compareTextA').value = `RESIDENTIAL RENTAL AGREEMENT (OLD)
Monthly Rent is ₹10,000 due on the 1st of every month with a 5-day grace period.
Security deposit of ₹20,000 shall be refunded within 21 days excluding normal wear and tear.
Notice period is 1 month written notice by email for either party.
Late fee is ₹500 after the grace period.
Renewal is Manual / Mutual Written Consent upon expiration.`;

  $('compareTitleB').value = 'Contract B — New Rental Agreement';
  $('compareTextB').value = `RESIDENTIAL RENTAL AGREEMENT (NEW)
Monthly Rent is ₹12,000 due on the 1st of every month.
Security deposit of ₹30,000 shall be retained subject to adjustment for wear and tear, repainting, and other obligations, returned within 90 days after vacating.
Notice period is 3 months written notice via registered post.
Late fee is ₹1,000 plus ₹200 per delayed day.
Unless Tenant sends notice 90 days prior, this Agreement shall automatically renew for an additional 12 months at a 15% increase.`;

  showToast('Loaded ₹10,000 vs ₹12,000 comparison demo — click Compare!');
}

function loadNegotiatedCompareDemo() {
  const rental = state.samples.find((s) => s.category === 'rental');
  if (!rental) return;
  $('compareTitleA').value = 'Original Predatory Lease v1';
  $('compareTextA').value = rental.text;
  $('compareTitleB').value = 'Negotiated Fair Lease v2';
  $('compareTextB').value = `RESIDENTIAL RENTAL AGREEMENT — PRESTIGE GREENS (REVISED)
Monthly Rent is ₹28,000 due on the 1st of every month with a 5-day grace period and no hidden society or amenity fees.
Security deposit of ₹56,000 (2 months rent) shall be refunded within 21 days excluding normal wear and tear.
Notice period is 30 days written notice by email.
Renewal is Manual / Mutual Written Consent with maximum 5% annual escalation.
Landlord remains responsible for structural, plumbing, electrical, and AC repairs, and shall give 24 hours written notice before entry.`;
  showToast('Loaded Before vs. After Redline demo — click Compare!');
}

function setCompareUploadStatus(side, message, status = 'success') {
  const el = $(`compareFileStatus${side}`);
  el.textContent = message;
  el.dataset.status = status;
  el.classList.remove('hidden');
}

async function handleCompareFileSelection(side, file) {
  if (!file) return;
  const supported = /\.(pdf|docx|txt|md|rtf)$/i.test(file.name);
  if (!supported) {
    setCompareUploadStatus(side, 'Unsupported format. Choose PDF, DOCX, TXT, MD, or RTF.', 'error');
    $(`compareFile${side}`).value = '';
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    setCompareUploadStatus(side, 'This file is larger than 8 MB. Choose a smaller document.', 'error');
    $(`compareFile${side}`).value = '';
    return;
  }

  setCompareUploadStatus(side, `Reading ${file.name}…`, 'loading');
  try {
    const contentBase64 = await readFileAsBase64(file);
    const { extracted } = await apiFetch('/api/compare/extract', {
      method: 'POST',
      body: JSON.stringify({ fileName: file.name, contentBase64 })
    });
    $(`compareTitle${side}`).value = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
    $(`compareText${side}`).value = extracted.text;
    setCompareUploadStatus(side, `✓ ${file.name} · ${extracted.wordCount.toLocaleString()} words extracted`, 'success');
    showToast(`Contract ${side} uploaded and text extracted`);
  } catch (error) {
    setCompareUploadStatus(side, error.message || 'Could not read this file. Try another document.', 'error');
  }
}

function bindCompareUpload(side) {
  const input = $(`compareFile${side}`);
  const zone = $(`compareDropzone${side}`);
  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    if (input.files?.[0]) handleCompareFileSelection(side, input.files[0]);
  });
  zone.addEventListener('dragover', (event) => {
    event.preventDefault();
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragleave', (event) => {
    if (!zone.contains(event.relatedTarget)) zone.classList.remove('dragover');
  });
  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('dragover');
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      try { input.files = event.dataTransfer.files; } catch { /* Browser may disallow assigning the dropped FileList. */ }
      handleCompareFileSelection(side, file);
    }
  });
}

async function runComparison() {
  const textA = $('compareTextA').value.trim();
  const textB = $('compareTextB').value.trim();
  $('compareError').classList.add('hidden');
  if (!textA || !textB) {
    $('compareError').textContent = 'Please paste both Contract A and Contract B.';
    $('compareError').classList.remove('hidden');
    return;
  }

  const { comparison } = await runWithPipelineAnimation(() =>
    apiFetch('/api/compare', {
      method: 'POST',
      body: JSON.stringify({
        contractA: { title: $('compareTitleA').value.trim() || 'Contract A', text: textA },
        contractB: { title: $('compareTitleB').value.trim() || 'Contract B', text: textB }
      })
    })
  );

  const cur = comparison.currency || '₹';
  const rowsHtml = (comparison.tableRows || [])
    .map((r) => {
      const clsB = r.verdict === 'worse_b' ? 'cell-worse' : r.verdict === 'better_b' ? 'cell-better' : '';
      const badge = r.verdict === 'worse_b' ? '⚠️ Worse in B' : r.verdict === 'better_b' ? '✓ Better in B' : r.verdict === 'same' ? 'Same' : 'Changed';
      return `<tr><td><strong>${escapeHtml(r.category)}</strong></td><td>${escapeHtml(r.valueA)}</td><td class="${clsB}">${escapeHtml(r.valueB)}</td><td>${badge}</td></tr>`;
    })
    .join('');

  const deltaSign = comparison.scoreDelta >= 0 ? '+' : '';
  const deltaColor = comparison.scoreDelta > 0 ? 'var(--safe)' : comparison.scoreDelta < 0 ? 'var(--critical)' : 'var(--muted)';

  const out = $('compareResultContainer');
  out.classList.remove('hidden');
  out.innerHTML = `
    <div class="ai-narrative-box"><strong>✨ AI Comparison Verdict:</strong> ${escapeHtml(comparison.aiNarrative)}</div>

    <div class="card compare-table-card">
      <h3 style="margin-bottom:10px;">Side-by-Side Key Terms Table</h3>
      <table class="compare-table">
        <thead><tr><th>Category</th><th>${escapeHtml(comparison.contractA.title)}</th><th>${escapeHtml(comparison.contractB.title)}</th><th>Impact</th></tr></thead>
        <tbody>${rowsHtml || '<tr><td colspan="4" class="muted">No numeric rent/deposit/notice fields extracted; see Risk Delta below.</td></tr>'}</tbody>
      </table>
    </div>

    <div class="compare-summary-grid">
      <div class="card"><div class="kpi-label">${escapeHtml(comparison.contractA.title)}</div><div class="kpi-big-num">${comparison.contractA.safetyScore}/100 (${escapeHtml(comparison.contractA.grade)})</div><div class="tiny muted">${comparison.contractA.counts.total} risks · ${formatMoney(comparison.contractA.financialExposure.totalAtRisk, cur)} exposure</div></div>
      <div class="card" style="text-align:center;border-color:${deltaColor};"><div class="kpi-label">Safety Score Change</div><div class="kpi-big-num" style="color:${deltaColor};">${deltaSign}${comparison.scoreDelta} pts</div><div class="tiny muted">${comparison.winner === 'A' ? 'Contract A is safer' : comparison.winner === 'B' ? 'Contract B is safer' : 'Equal score'}</div></div>
      <div class="card"><div class="kpi-label">${escapeHtml(comparison.contractB.title)}</div><div class="kpi-big-num">${comparison.contractB.safetyScore}/100 (${escapeHtml(comparison.contractB.grade)})</div><div class="tiny muted">${comparison.contractB.counts.total} risks · ${formatMoney(comparison.contractB.financialExposure.totalAtRisk, cur)} exposure</div></div>
    </div>

    <div class="compare-diff-grid">
      <div class="card"><h3 style="color:var(--safe);">✓ Resolved in B (${comparison.resolvedRisks.length})</h3><div class="diff-list">${comparison.resolvedRisks.length ? comparison.resolvedRisks.map((r) => `<div class="diff-item resolved"><strong>${escapeHtml(r.title)}</strong></div>`).join('') : '<div class="tiny muted">None</div>'}</div></div>
      <div class="card"><h3 style="color:var(--critical);">⚠ New Traps in B (${comparison.newRisks.length})</h3><div class="diff-list">${comparison.newRisks.length ? comparison.newRisks.map((r) => `<div class="diff-item newrisk"><strong>${escapeHtml(r.title)}</strong><div class="tiny muted">${escapeHtml(r.plainEnglish)}</div></div>`).join('') : '<div class="tiny muted">Zero new traps</div>'}</div></div>
      <div class="card"><h3 style="color:var(--medium);">• Still in Both (${comparison.remainingRisks.length})</h3><div class="diff-list">${comparison.remainingRisks.length ? comparison.remainingRisks.map((r) => `<div class="diff-item remaining"><strong>${escapeHtml(r.title)}</strong></div>`).join('') : '<div class="tiny muted">None</div>'}</div></div>
    </div>`;
  out.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==================== IDEA 8: AUTOMATIC DEADLINES & REMINDERS ====================
async function loadDeadlinesView() {
  const active = state.currentAnalysis;
  const extractedEl = $('extractedRemindersList');

  if (!active) {
    $('deadlinesActiveContractLabel').textContent = 'Analyze any contract (or pick a 1-click demo) to extract its renewal & cancellation dates.';
    extractedEl.innerHTML = '<div class="empty-state">No contract currently loaded. Open Analyzer &amp; Reader and run a demo lease to see automatic renewal reminders!</div>';
  } else {
    $('deadlinesActiveContractLabel').textContent = `Auto-extracted from: ${active.title}`;
    const items = active.extractedReminders || [];
    extractedEl.innerHTML = items
      .map(
        (r) => `
      <div class="reminder-card ${escapeHtml(r.urgency)}">
        <div class="reminder-card-top">
          <strong>${escapeHtml(r.title)}</strong>
          <span class="reminder-date-pill">📅 ${escapeHtml(r.displayDate)}</span>
        </div>
        <p style="font-size:13px;">${escapeHtml(r.alertMessage)}</p>
        <p class="tiny muted"><strong>What happens if ignored:</strong> ${escapeHtml(r.consequence)}</p>
        <div class="reminder-actions">
          <button type="button" class="btn-primary sm-btn save-rem-btn" data-rem='${escapeHtml(JSON.stringify({ ...r, contractTitle: active.title }))}'>🔔 Save Reminder</button>
          <button type="button" class="btn-outline sm-btn ics-rem-btn" data-rem='${escapeHtml(JSON.stringify({ ...r, contractTitle: active.title }))}'>📆 Add to Calendar (.ics)</button>
        </div>
      </div>`
      )
      .join('');

    extractedEl.querySelectorAll('.save-rem-btn').forEach((btn) =>
      btn.addEventListener('click', async () => {
        const payload = JSON.parse(btn.dataset.rem);
        const { stats } = await apiFetch('/api/reminders', { method: 'POST', body: JSON.stringify(payload) });
        updateNavBadges(stats);
        showToast(`Reminder saved for ${payload.displayDate}!`);
        renderSavedReminders();
      })
    );

    extractedEl.querySelectorAll('.ics-rem-btn').forEach((btn) =>
      btn.addEventListener('click', async () => {
        const payload = JSON.parse(btn.dataset.rem);
        const res = await fetch('/api/reminders/ics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `contractlens-${payload.type}.ics`;
        a.click();
        URL.revokeObjectURL(a.href);
        showToast('Downloaded .ics calendar reminder!');
      })
    );
  }

  await renderSavedReminders();
}

async function renderSavedReminders() {
  const { reminders } = await apiFetch('/api/reminders');
  $('remindersCountBadge').textContent = reminders.length;
  const el = $('savedRemindersList');
  if (!reminders.length) {
    el.innerHTML = '<div class="empty-state">No saved reminders yet. Click "🔔 Save Reminder" on any extracted deadline!</div>';
    return;
  }
  el.innerHTML = reminders
    .map(
      (r) => `
    <div class="reminder-card ${escapeHtml(r.urgency || 'yellow')}">
      <div class="reminder-card-top">
        <strong>${escapeHtml(r.title)}</strong>
        <span class="reminder-date-pill">📅 ${escapeHtml(r.displayDate)}</span>
      </div>
      <div class="tiny muted">${escapeHtml(r.contractTitle || '')}</div>
      <p style="font-size:12.6px;">${escapeHtml(r.alertMessage)}</p>
      <div class="reminder-actions">
        <button type="button" class="btn-ghost sm-btn del-rem-btn" data-id="${escapeHtml(r.id)}" style="color:var(--critical);">Remove</button>
      </div>
    </div>`
    )
    .join('');

  el.querySelectorAll('.del-rem-btn').forEach((b) =>
    b.addEventListener('click', async () => {
      const { stats } = await apiFetch(`/api/reminders/${encodeURIComponent(b.dataset.id)}`, { method: 'DELETE' });
      updateNavBadges(stats);
      renderSavedReminders();
    })
  );
}

function triggerDemoDeadlineAlert() {
  const rem = state.currentAnalysis?.extractedReminders?.[0] || {
    title: 'Renewal deadline approaching',
    alertMessage: 'Your agreement may renew automatically on 30 December 2026. Check your cancellation or renewal conditions before the deadline.',
    consequence: 'If you do not take action before the specified date, the contract may continue under its automatic renewal conditions.'
  };
  $('heroAlertTitle').textContent = rem.title;
  $('heroAlertBody').textContent = rem.alertMessage;
  $('heroAlertConsequence').textContent = rem.consequence;
  $('liveDeadlineAlertBanner').classList.remove('hidden');
  showToast('🔔 Contract Deadline Alert triggered!');
}

// ==================== IDEA 9 (COMPULSORY): LEGAL TERMS TRANSLATOR ====================
async function loadGlossaryView(query = '') {
  const { terms } = await apiFetch('/api/glossary', {
    method: 'POST',
    body: JSON.stringify({
      contractText: state.currentAnalysis?.originalText || '',
      query
    })
  });
  state.glossaryTerms = terms;

  const coreQuick = ['Indemnity', 'Liability', 'Arbitration', 'Termination', 'Breach', 'Jurisdiction', 'Exclusivity', 'Waiver', 'Liquidated Damages'];
  $('glossaryQuickPills').innerHTML = coreQuick
    .map((t) => `<button type="button" class="filter-chip" data-quick-term="${escapeHtml(t)}">${escapeHtml(t)}</button>`)
    .join('');
  $('glossaryQuickPills').querySelectorAll('[data-quick-term]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const found = state.glossaryTerms.find((x) => x.term.toLowerCase().includes(btn.dataset.quickTerm.toLowerCase()));
      if (found) {
        state.activeGlossaryId = found.id;
        renderGlossaryGrid();
        renderGlossaryDetail(found);
      }
    })
  );

  if (!terms.find((t) => t.id === state.activeGlossaryId) && terms.length > 0) {
    state.activeGlossaryId = terms[0].id;
  }
  renderGlossaryGrid();
  const activeTerm = terms.find((t) => t.id === state.activeGlossaryId) || terms[0];
  if (activeTerm) renderGlossaryDetail(activeTerm);
}

function renderGlossaryGrid() {
  const grid = $('glossaryCardsGrid');
  grid.innerHTML = state.glossaryTerms
    .map(
      (t) => `
    <button type="button" class="glossary-card ${t.id === state.activeGlossaryId ? 'active' : ''} ${t.inThisContract?.found ? 'in-doc' : ''}" data-term-id="${escapeHtml(t.id)}">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
        <span class="tl-pill ${escapeHtml(t.riskLevel)}">${t.riskLevel === 'red' ? 'High Risk' : t.riskLevel === 'yellow' ? 'Watch' : 'Standard'}</span>
        ${t.inThisContract?.found ? '<span class="badge-soft">In Your Contract</span>' : ''}
      </div>
      <strong style="font-size:14.2px;">${escapeHtml(t.term)}</strong>
      <span class="tiny muted">${escapeHtml(t.category)}</span>
    </button>`
    )
    .join('');

  grid.querySelectorAll('.glossary-card').forEach((card) =>
    card.addEventListener('click', () => {
      state.activeGlossaryId = card.dataset.termId;
      renderGlossaryGrid();
      const term = state.glossaryTerms.find((x) => x.id === state.activeGlossaryId);
      if (term) renderGlossaryDetail(term);
    })
  );
}

function renderGlossaryDetail(t) {
  const meaning = state.eli5Mode ? t.eli5 : t.simpleMeaning;
  const modeLabel = state.eli5Mode ? '🧒 Explained Like You’re New to Contracts' : 'Simple Meaning';
  const inDoc = t.inThisContract;

  const pane = $('glossaryDetailPane');
  pane.innerHTML = `
    <div class="translator-detail-content">
      <div class="translator-detail-topline">
        <span class="badge-accent">${escapeHtml(t.category)}</span>
        <span class="tl-pill ${escapeHtml(t.riskLevel)}">${t.riskLevel.toUpperCase()} ATTENTION</span>
      </div>
      <h2 class="translator-term-title">${escapeHtml(t.term)}</h2>
      <section class="translator-explanation-block">
        <div class="kpi-label">${modeLabel}</div>
        <p class="translator-reading-copy">${escapeHtml(meaning)}</p>
      </section>
      <section class="in-contract-box">
        <div class="kpi-label contract-context-label">📄 In This Contract ${state.currentAnalysis ? `(${escapeHtml(state.currentAnalysis.title.slice(0, 32))}...)` : ''}</div>
        ${inDoc?.found && inDoc.quote ? `<div class="finding-quote" style="margin:6px 0;">“${escapeHtml(inDoc.quote)}”</div>` : ''}
        <p>${escapeHtml(inDoc?.contractImpact || 'Load a contract in Analyzer & Reader to see exact clause matches here.')}</p>
      </section>
      <section class="translator-explanation-block">
        <div class="kpi-label">What to Watch Out For</div>
        <p class="tiny muted translator-reading-copy">${escapeHtml(t.watchOut)}</p>
      </section>
      <section class="redline-box translator-question-box">
        <div class="redline-head"><span>Ask Before Signing</span></div>
        <p>“${escapeHtml(t.questionToAsk)}”</p>
      </section>
    </div>`;
}

// ==================== IDEAS 2 & 4: LIVE ECOSYSTEM LAB (EXTENSION + PARTNER WIDGET) ====================
const MOCK_WEBSITES = {
  gig: {
    url: 'https://partners.quickdash.in/onboarding/delivery-agreement',
    heading: 'QuickDash Delivery Partner Agreement — Live Web Portal',
    clauses: [
      {
        title: 'Payment & Deductions',
        text: 'The platform reserves the right to adjust incentives, deduct applicable charges, or modify compensation policies at its discretion without prior notice.'
      },
      {
        title: 'Exclusivity & Mandatory Peak Hours',
        text: 'Partner is an independent contractor waiving overtime and health benefits, yet agrees to strict exclusivity and may not perform work for any other delivery app (Blinkit, Rapido, Swiggy) during mandatory peak hours.'
      },
      {
        title: 'Account Deactivation & Indemnity',
        text: 'Platform may permanently deactivate Partner immediately without notice or payment for pending incentives. Partner agrees to indemnify Platform without any cap on liability.'
      }
    ]
  },
  rental: {
    url: 'https://nestfinder.in/bengaluru/indiranagar-2bhk-lease-terms',
    heading: 'NestFinder Rental Portal — Digital Lease Checkout',
    clauses: [
      {
        title: 'Security Deposit Adjustment',
        text: 'The security deposit shall be retained subject to adjustment for damages, unpaid dues, wear and tear, repainting, and other obligations at Landlord’s sole discretion, returned within 90 days.'
      },
      {
        title: 'Automatic Renewal & Escalation',
        text: 'Unless Tenant delivers notice via registered post 90 days prior to expiration, this Agreement shall automatically renew for 12 months with a 15% rent increase.'
      }
    ]
  },
  loan: {
    url: 'https://fastrupee.in/personal-loan/sanction-terms',
    heading: 'FastRupee FinTech — Online Loan Sanction Terms',
    clauses: [
      {
        title: 'Origination Fee & Daily Compounding APR',
        text: 'An upfront 9% Origination Fee shall be deducted directly from loan proceeds before disbursement while 38.5% APR compounded daily applies on the full principal.'
      },
      {
        title: 'Cross-Default & Prepayment Penalty',
        text: 'Prepayment prior to 24 installments incurs a 6% foreclosure penalty plus 6 months unearned interest. Default on any unrelated credit card triggers Cross-Default acceleration.'
      }
    ]
  }
};

function renderMockBrowserSite(siteKey) {
  state.mockSite = siteKey;
  const site = MOCK_WEBSITES[siteKey] || MOCK_WEBSITES.gig;
  $('mockBrowserUrl').textContent = site.url;
  document.querySelectorAll('.browser-page-switcher .seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.mockSite === siteKey));

  const container = $('mockWebpageContent');
  container.innerHTML = `
    <div>
      <span class="badge-soft">Simulated External Webpage</span>
      <h3 style="margin-top:6px;">${escapeHtml(site.heading)}</h3>
      <p class="tiny muted">Click <strong>Explain this</strong> or <strong>Check risks</strong> below to trigger the ContractLens Browser Assistant beside the page.</p>
    </div>
    ${site.clauses
      .map(
        (c, i) => `
      <div class="mock-clause-block">
        <strong>${escapeHtml(c.title)}</strong>
        <p style="margin-top:5px;font-size:13.2px;color:var(--ink-secondary);" id="mockClauseTxt-${i}">"${escapeHtml(c.text)}"</p>
        <div class="mock-clause-actions">
          <button type="button" class="btn-primary sm-btn ext-explain-clause-btn" data-idx="${i}">✨ Explain this</button>
          <button type="button" class="btn-outline sm-btn ext-risk-clause-btn" data-idx="${i}">Check risks</button>
        </div>
      </div>`
      )
      .join('')}`;

  const runClauseExplain = async (idx) => {
    const clause = site.clauses[idx];
    const out = $('extAssistantOutput');
    out.innerHTML = '<div class="ext-result-card">Analyzing selected paragraph with ContractLens AI...</div>';
    const { explanation } = await apiFetch('/api/explain', {
      method: 'POST',
      body: JSON.stringify({ text: clause.text, contextMode: 'browser_extension' })
    });
    out.innerHTML = `
      <div class="ext-result-card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span class="tl-pill ${escapeHtml(explanation.trafficLight)}">${explanation.trafficLight.toUpperCase()} RISK</span>
          <span class="tiny muted">${escapeHtml(clause.title)}</span>
        </div>
        <p><strong>AI Explanation:</strong> ${escapeHtml(explanation.simpleMeaning)}</p>
        <p><strong>Why you should check:</strong> ${escapeHtml(explanation.whyYouShouldCheck)}</p>
        <p><strong>What is unclear:</strong> ${escapeHtml(explanation.whatIsUnclear)}</p>
        <div style="background:var(--bg);padding:9px;border-radius:8px;">
          <strong>Ask before agreeing:</strong>
          <ul style="margin:4px 0 0 16px;padding:0;">${(explanation.askBeforeAgreeing || []).map((q) => `<li>${escapeHtml(q)}</li>`).join('')}</ul>
        </div>
      </div>`;
  };

  container.querySelectorAll('.ext-explain-clause-btn, .ext-risk-clause-btn').forEach((btn) =>
    btn.addEventListener('click', () => runClauseExplain(Number(btn.dataset.idx)))
  );
}

async function scanMockFullPage() {
  const site = MOCK_WEBSITES[state.mockSite] || MOCK_WEBSITES.gig;
  const fullText = site.clauses.map((c) => `${c.title}\n${c.text}`).join('\n\n');
  const out = $('extAssistantOutput');
  out.innerHTML = '<div class="ext-result-card">Scanning entire webpage for hidden fees &amp; contract traps...</div>';
  const { analysis } = await apiFetch('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ title: site.heading, text: fullText, jurisdiction: 'india' })
  });
  out.innerHTML = `
    <div class="ext-result-card">
      <strong>Full Webpage Scan Complete</strong>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <span class="tl-pill red">Score: ${analysis.safetyScore}/100 (${escapeHtml(analysis.grade)})</span>
        <span class="tl-pill red">🔴 ${analysis.trafficLightCounts.red} Red</span>
        <span class="tl-pill yellow">🟡 ${analysis.trafficLightCounts.yellow} Yellow</span>
      </div>
      <p class="tiny">${escapeHtml(analysis.executiveSummary)}</p>
      <button type="button" class="btn-primary sm-btn" id="openScannedInMainBtn">Open Full Report in ContractLens →</button>
    </div>`;
  $('openScannedInMainBtn').addEventListener('click', () => openAnalysisInWorkspace(analysis));
}

async function runPartnerWidgetDemo(targetKey) {
  const clauseText = targetKey === 'gig' ? $('partnerGigClauseText').textContent : $('partnerLoanClauseText').textContent;
  const slot = targetKey === 'gig' ? $('widgetResultGig') : $('widgetResultLoan');
  slot.classList.remove('hidden');
  slot.innerHTML = '<div class="tiny muted">ContractLens Widget analyzing terms...</div>';

  const { explanation } = await apiFetch('/api/explain', {
    method: 'POST',
    body: JSON.stringify({ text: clauseText, contextMode: 'partner_widget' })
  });

  slot.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <strong style="color:var(--accent);">✨ ContractLens Embedded Insight</strong>
      <span class="tl-pill ${escapeHtml(explanation.trafficLight)}">${explanation.trafficLight.toUpperCase()} RISK</span>
    </div>
    <div><strong>What does this mean?</strong> ${escapeHtml(explanation.simpleMeaning)}</div>
    <div><strong>Can this affect my income / wallet?</strong> ${escapeHtml(explanation.affectsIncomeOrWallet)}</div>
    <div><strong>Are there any deductions?</strong> ${escapeHtml(explanation.deductionsRisk)}</div>
    <div><strong>What should I clarify before accepting?</strong> ${(explanation.askBeforeAgreeing || [])[0] || ''}</div>`;
}

// ==================== HISTORY VAULT ====================
function updateNavBadges(stats) {
  if (!stats) return;
  if (typeof stats.totalAudits === 'number') $('historyCountBadge').textContent = stats.totalAudits;
  if (typeof stats.totalReminders === 'number') $('remindersCountBadge').textContent = stats.totalReminders;
}

async function loadHistoryView() {
  const { history, stats } = await apiFetch('/api/history');
  updateNavBadges(stats);

  $('historyStatsGrid').innerHTML = `
    <div class="card"><div class="kpi-label">Contracts Audited</div><div class="kpi-big-num">${stats.totalAudits}</div></div>
    <div class="card"><div class="kpi-label">Risks Caught</div><div class="kpi-big-num danger-num">${stats.totalRisksFlagged}</div></div>
    <div class="card"><div class="kpi-label">Saved Reminders</div><div class="kpi-big-num accent-num">${stats.totalReminders}</div></div>
    <div class="card"><div class="kpi-label">Avg. Safety Score</div><div class="kpi-big-num">${stats.avgSafetyScore !== null ? `${stats.avgSafetyScore}/100` : '—'}</div></div>
  `;

  const list = $('historyListContainer');
  if (!history.length) {
    list.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">No saved contracts yet. Analyze any contract to build your vault.</div>';
    return;
  }

  list.innerHTML = history
    .map(
      (item) => `
    <div class="card history-card">
      <div class="history-card-top">
        <div>
          <span class="domain-pill">${escapeHtml(item.contractType?.label || 'Contract')}</span>
          <h3 style="font-size:15px;margin-top:6px;">${escapeHtml(item.title)}</h3>
          <p class="tiny muted">${escapeHtml(item.verdict)} · ${formatRelativeTime(item.analyzedAt)}</p>
        </div>
        <div class="grade-box ${escapeHtml(item.verdictTone || 'info')}">${escapeHtml(item.grade)}</div>
      </div>
      <div class="traffic-light-strip">
        <span class="tl-pill red">🔴 ${item.trafficLightCounts?.red || 0}</span>
        <span class="tl-pill yellow">🟡 ${item.trafficLightCounts?.yellow || 0}</span>
        <span class="cat-tag">${formatMoney(item.financialExposure, item.currency)} at risk</span>
      </div>
      <div class="history-actions">
        <button type="button" class="btn-primary sm-btn open-audit-btn" data-id="${escapeHtml(item.id)}">Open in Reader</button>
        <button type="button" class="btn-ghost sm-btn del-audit-btn" data-id="${escapeHtml(item.id)}" style="color:var(--critical);">Delete</button>
      </div>
    </div>`
    )
    .join('');

  list.querySelectorAll('.open-audit-btn').forEach((b) =>
    b.addEventListener('click', async () => {
      const { analysis } = await apiFetch(`/api/history/${encodeURIComponent(b.dataset.id)}`);
      openAnalysisInWorkspace(analysis);
    })
  );
  list.querySelectorAll('.del-audit-btn').forEach((b) =>
    b.addEventListener('click', async () => {
      await apiFetch(`/api/history/${encodeURIComponent(b.dataset.id)}`, { method: 'DELETE' });
      showToast('Removed from Vault');
      loadHistoryView();
    })
  );
}

// ==================== THEME, SETTINGS & EVENTS ====================
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('cl_theme', t);
  $('themeIconSun').classList.toggle('hidden', t !== 'dark');
  $('themeIconMoon').classList.toggle('hidden', t === 'dark');
}

function updateEnginePill() {
  const labels = { local: 'ContractLens NLP', gemini: 'Hybrid + Gemini', openai: 'Hybrid + OpenAI' };
  $('engineBadgeText').textContent = labels[state.llmConfig.provider] || 'ContractLens NLP';
}

function bindEvents() {
  $('brandHomeBtn').addEventListener('click', showUploadStudio);
  document.querySelectorAll('.nav-pill').forEach((p) => p.addEventListener('click', () => switchView(p.dataset.view)));
  document.querySelectorAll('[data-jump-view]').forEach((b) =>
    b.addEventListener('click', () => {
      switchView(b.dataset.jumpView);
      if (b.dataset.jumpView === 'compare') loadIndianRentalCompareDemo();
    })
  );

  $('backToUploadBtn').addEventListener('click', showUploadStudio);
  $('historyNewScanBtn').addEventListener('click', showUploadStudio);
  $('jumpToDeadlinesBtn').addEventListener('click', () => switchView('deadlines'));
  $('themeToggleBtn').addEventListener('click', () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

  document.querySelectorAll('#domainSelector .seg-btn').forEach((b) =>
    b.addEventListener('click', () => {
      state.selectedDomain = b.dataset.domain;
      document.querySelectorAll('#domainSelector .seg-btn').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
    })
  );

  // Dropzone
  const dz = $('dropzone');
  const fi = $('fileInput');
  dz.addEventListener('click', (e) => { if (e.target.id !== 'clearFileBtn') fi.click(); });
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('dragover'); if (e.dataTransfer?.files?.[0]) handleFileSelection(e.dataTransfer.files[0]); });
  fi.addEventListener('change', () => { if (fi.files?.[0]) handleFileSelection(fi.files[0]); });
  $('clearFileBtn').addEventListener('click', (e) => { e.stopPropagation(); clearSelectedFile(); });
  $('contractTextInput').addEventListener('input', updateWordCounter);

  $('analyzeBtn').addEventListener('click', () => {
    const pasted = $('contractTextInput').value.trim();
    if (!pasted && !state.selectedFile) { showUploadError('Upload a contract file, paste text, or click a 1-click demo on the right.'); return; }
    analyzePayload({
      title: $('contractTitleInput').value.trim(),
      text: pasted || undefined,
      fileName: state.selectedFile?.fileName,
      contentBase64: !pasted ? state.selectedFile?.contentBase64 : undefined,
      contractType: state.selectedDomain,
      jurisdiction: $('uploadJurisdictionSelect').value
    });
  });

  // Idea 3: Mouse Text Selection Popover inside Smart PDF Reader!
  $('annotatedDocBody').addEventListener('mouseup', (e) => {
    const sel = window.getSelection()?.toString().trim() || '';
    if (sel.length < 10) { hideSelectionPopover(); return; }
    state.selectedReaderText = sel;
    const pop = $('selectionPopover');
    pop.style.top = `${Math.max(70, e.clientY - 48)}px`;
    pop.style.left = `${Math.max(16, Math.min(window.innerWidth - 270, e.clientX - 90))}px`;
    pop.classList.remove('hidden');
  });
  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('#selectionPopover') && !e.target.closest('#annotatedDocBody')) hideSelectionPopover();
  });
  $('popExplainBtn').addEventListener('click', () => explainTextInReader(state.selectedReaderText));
  $('popDefineBtn').addEventListener('click', async () => {
    hideSelectionPopover();
    const { translation } = await apiFetch('/api/glossary', {
      method: 'POST',
      body: JSON.stringify({ term: state.selectedReaderText.slice(0, 40), contractText: state.currentAnalysis?.originalText || '' })
    });
    state.activeGlossaryId = translation.id;
    switchView('translator');
    setTimeout(() => renderGlossaryDetail(translation), 80);
  });
  $('closeExplainDrawerBtn').addEventListener('click', () => $('readerExplainDrawer').classList.add('hidden'));
  $('demoSelectSentenceBtn').addEventListener('click', () => {
    const sampleExcerpt =
      state.currentAnalysis?.findings?.[0]?.excerpt ||
      'The security deposit shall be retained subject to adjustment for damages, unpaid dues, and other obligations.';
    explainTextInReader(sampleExcerpt);
  });

  // Command strip: Role + Jurisdiction + 8-Language Flexible Voice Assistant
  document.querySelectorAll('#uploadRoleSelector .role-pill').forEach((b) =>
    b.addEventListener('click', () => {
      state.userRole = b.dataset.role;
      document.querySelectorAll('#uploadRoleSelector .role-pill').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
    })
  );
  $('wsRoleSelect')?.addEventListener('change', (e) => refreshRolePerspective(e.target.value));
  $('wsJurisdictionSelect').addEventListener('change', (e) => { state.jurisdiction = e.target.value; refreshJurisdictionAudit(); });
  $('wsLangSelect').addEventListener('change', async (e) => {
    stopVoiceBriefing();
    state.language = e.target.value;
    state.selectedVoiceUri = 'auto';
    populateVoiceOptions();
    await loadLocalizedBriefing(state.language);
    showToast(`Audio & briefing switched to ${e.target.options[e.target.selectedIndex].text}`);
  });
  $('wsVoiceSelect')?.addEventListener('change', (e) => { state.selectedVoiceUri = e.target.value; });
  $('wsSpeechRateSelect')?.addEventListener('change', (e) => { state.speechRate = Number(e.target.value) || 1; });
  $('voiceBriefBtn').addEventListener('click', toggleVoiceBriefing);
  $('voiceAskMicBtn')?.addEventListener('click', triggerVoiceAskCommand);
  $('closeLocalizedBtn').addEventListener('click', () => $('localizedBriefBanner').classList.add('hidden'));

  // 4-Level AI Explanation Depth Switcher (#24)
  document.querySelectorAll('#explanationDepthSelector .seg-btn').forEach((b) =>
    b.addEventListener('click', () => {
      state.explanationDepth = b.dataset.depth;
      document.querySelectorAll('#explanationDepthSelector .seg-btn').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      renderFindingsList();
    })
  );

  // Custom "What Can Go Wrong?" Scenario Flow (#7)
  document.querySelectorAll('#scenarioQuickPills .chat-chip').forEach((c) =>
    c.addEventListener('click', () => {
      $('scenarioInput').value = c.dataset.scen;
      runHypotheticalScenario(c.dataset.scen);
    })
  );
  $('scenarioForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    runHypotheticalScenario($('scenarioInput').value);
  });

  // Version History (#13), Contract Memory (#22), Privacy Clear (#23)
  $('runVersionHistoryDemoBtn')?.addEventListener('click', runVersionHistoryDemo);
  document.querySelectorAll('#memoryQuickPills .chat-chip').forEach((c) =>
    c.addEventListener('click', () => {
      $('memoryInput').value = c.dataset.mem;
      runMemoryQuery(c.dataset.mem);
    })
  );
  $('memoryForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    runMemoryQuery($('memoryInput').value);
  });
  $('clearAllPrivacyBtn')?.addEventListener('click', async () => {
    const { stats } = await apiFetch('/api/privacy/clear', { method: 'POST' });
    state.currentAnalysis = null;
    updateNavBadges(stats);
    loadHistoryView();
    $('memoryResultBox')?.classList.add('hidden');
    showToast('🔒 All saved contracts, reminders & session data cleared.');
  });

  // Reader modes & Auto-Redline
  document.querySelectorAll('#docModeToggle .seg-btn').forEach((b) => b.addEventListener('click', () => setDocMode(b.dataset.docMode)));
  $('fixAllClausesBtn').addEventListener('click', () => {
    if (!state.currentAnalysis) return;
    state.selectedFindingIds = new Set(state.currentAnalysis.findings.map((f) => f.id));
    renderFindingsList();
    refreshNegotiationEmail();
    refreshAutoRedline();
    showToast('✨ All risks auto-rewritten to fair wording!');
  });
  $('copyCleanContractBtn').addEventListener('click', async () => {
    if (state.lastRedlineResult) { await navigator.clipboard.writeText(state.lastRedlineResult.cleanContractText); showToast('Clean rewritten contract copied!'); }
  });
  $('downloadCleanContractBtn').addEventListener('click', () => {
    if (!state.lastRedlineResult) return;
    const blob = new Blob([state.lastRedlineResult.cleanContractText], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'contractlens-clean-redline.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // Right pane tabs & filters
  document.querySelectorAll('#intelTabs .intel-tab').forEach((t) => t.addEventListener('click', () => setActiveIntelTab(t.dataset.tab)));
  document.querySelectorAll('#findingFilterBar .filter-chip').forEach((c) => c.addEventListener('click', () => { state.activeFilter = c.dataset.filter; renderFindingsList(); }));

  // Chat & Sparring & Playbook
  $('chatForm').addEventListener('submit', (e) => { e.preventDefault(); sendChatMessage($('chatInput').value); });
  $('sparringClauseSelect').addEventListener('change', startSparringRound);
  $('sparringDifficultySelect').addEventListener('change', startSparringRound);
  $('sparringForm').addEventListener('submit', (e) => { e.preventDefault(); sendSparringMove($('sparringInput').value); });

  document.querySelectorAll('#emailToneSelector .seg-btn').forEach((b) => b.addEventListener('click', () => { state.emailTone = b.dataset.tone; refreshNegotiationEmail(); }));
  $('emailRecipientInput').addEventListener('input', refreshNegotiationEmail);
  $('emailSenderInput').addEventListener('input', refreshNegotiationEmail);
  $('copyEmailBtn').addEventListener('click', async () => { await navigator.clipboard.writeText($('negotiationEmailBox').value); showToast('Email copied!'); });
  $('downloadEmailBtn').addEventListener('click', () => {
    const blob = new Blob([$('negotiationEmailBox').value], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'contractlens-negotiation.txt'; a.click(); URL.revokeObjectURL(a.href);
  });

  $('exportReportBtn').addEventListener('click', () => window.print());
  $('sendToCompareBtn').addEventListener('click', () => {
    if (state.currentAnalysis) { $('compareTitleA').value = state.currentAnalysis.title; $('compareTextA').value = state.currentAnalysis.originalText; }
    switchView('compare');
  });

  // Compare view — upload and extract Contract A / Contract B files.
  bindCompareUpload('A');
  bindCompareUpload('B');
  $('loadIndianCompareDemoBtn').addEventListener('click', loadIndianRentalCompareDemo);
  $('loadNegotiatedCompareDemoBtn').addEventListener('click', loadNegotiatedCompareDemo);
  $('runCompareBtn').addEventListener('click', runComparison);

  // Deadlines view
  $('testAlertBtn').addEventListener('click', triggerDemoDeadlineAlert);
  $('closeHeroAlertBtn').addEventListener('click', () => $('liveDeadlineAlertBanner').classList.add('hidden'));

  // Legal Translator (Idea 9)
  $('eli5Toggle').addEventListener('change', (e) => {
    state.eli5Mode = e.target.checked;
    const active = state.glossaryTerms.find((x) => x.id === state.activeGlossaryId);
    if (active) renderGlossaryDetail(active);
    showToast(state.eli5Mode ? '🧒 Beginner (ELI5) Mode ON' : 'Standard Plain-English Mode ON');
  });
  $('glossarySearchInput').addEventListener('input', (e) => loadGlossaryView(e.target.value));

  // Ecosystem Lab (Ideas 2 & 4)
  document.querySelectorAll('#ecosystemSubTabs .seg-btn').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelectorAll('#ecosystemSubTabs .seg-btn').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      $('ecoExtensionView').classList.toggle('hidden', b.dataset.eco !== 'extension');
      $('ecoWidgetView').classList.toggle('hidden', b.dataset.eco !== 'widget');
    })
  );
  document.querySelectorAll('.browser-page-switcher .seg-btn').forEach((b) => b.addEventListener('click', () => renderMockBrowserSite(b.dataset.mockSite)));
  $('extScanFullPageBtn').addEventListener('click', scanMockFullPage);
  document.querySelectorAll('.understand-ai-btn').forEach((b) => b.addEventListener('click', () => runPartnerWidgetDemo(b.dataset.widgetTarget)));
  $('copySdkBtn').addEventListener('click', async () => { await navigator.clipboard.writeText($('sdkCodeSnippet').textContent); showToast('1-Line Partner SDK copied!'); });

  // Settings Modal
  const toggleKey = () => $('apiKeyGroup').classList.toggle('hidden', $('llmProviderSelect').value === 'local');
  $('openSettingsBtn').addEventListener('click', () => { $('llmProviderSelect').value = state.llmConfig.provider; $('llmApiKeyInput').value = state.llmConfig.apiKey; toggleKey(); $('settingsModal').classList.remove('hidden'); });
  $('llmProviderSelect').addEventListener('change', toggleKey);
  const closeMod = () => $('settingsModal').classList.add('hidden');
  $('closeSettingsBtn').addEventListener('click', closeMod);
  $('cancelSettingsBtn').addEventListener('click', closeMod);
  $('saveSettingsBtn').addEventListener('click', () => {
    state.llmConfig.provider = $('llmProviderSelect').value;
    state.llmConfig.apiKey = $('llmApiKeyInput').value.trim();
    sessionStorage.setItem('cl_llm_provider', state.llmConfig.provider);
    sessionStorage.setItem('cl_llm_apikey', state.llmConfig.apiKey);
    updateEnginePill();
    closeMod();
    showToast('Engine settings saved');
  });
}

async function init() {
  applyTheme(localStorage.getItem('cl_theme') || 'light');
  updateEnginePill();
  if ($('sdkCodeSnippet')) {
    $('sdkCodeSnippet').textContent = `<div data-contractlens-clause>Your agreement terms here...</div>\n<script src="${window.location.origin}/widget.js"></script>`;
  }
  bindEvents();
  if ('speechSynthesis' in window) {
    populateVoiceOptions();
    window.speechSynthesis.onvoiceschanged = populateVoiceOptions;
  }
  await loadSamples();
  try {
    const { stats } = await apiFetch('/api/health');
    updateNavBadges(stats);
  } catch {
    // ignore
  }
}

init();
