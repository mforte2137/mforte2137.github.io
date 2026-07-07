/* ============================================================
   CYBER INSURANCE READINESS WIDGET — cyber-insurance.js
   Single-page workspace: config (left) + live preview (right).
   Colour changes and checklist edits re-render instantly from
   cached data — no AI call unless the rep asks to regenerate copy.
   ============================================================ */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  // ── CONTROLS DATA ────────────────────────────────────────────
  const CONTROLS_DEF = [
    { id: 1,  key: 'mfa',        name: 'Multi-Factor Authentication (MFA)',   desc: 'Required on email, remote access, and admin accounts.',                critical: true  },
    { id: 2,  key: 'edr',        name: 'Endpoint Detection & Response (EDR)', desc: 'Active EDR on all endpoints — AV alone often insufficient.',            critical: true  },
    { id: 3,  key: 'backup',     name: 'Backup & Disaster Recovery',          desc: 'Immutable/offsite backup, tested restore process.',                     critical: true  },
    { id: 4,  key: 'patch',      name: 'Patch Management',                    desc: 'Regular patching of OS and applications.',                              critical: false },
    { id: 5,  key: 'email',      name: 'Email Security',                      desc: 'Anti-phishing, spam filtering, DMARC/DKIM.',                            critical: true  },
    { id: 6,  key: 'training',   name: 'Security Awareness Training',         desc: 'Annual documented training for all staff.',                             critical: false },
    { id: 7,  key: 'pam',        name: 'Privileged Access Management',        desc: 'Separate admin accounts, least-privilege principle.',                   critical: false },
    { id: 8,  key: 'irplan',     name: 'Incident Response Plan',              desc: 'Documented IR plan, contacts, escalation path.',                        critical: true  },
    { id: 9,  key: 'vulnscan',   name: 'Vulnerability Scanning',              desc: 'Regular scanning of network and endpoints.',                            critical: false },
    { id: 10, key: 'remote',     name: 'Remote Access Security',              desc: 'VPN or ZTNA for all remote access.',                                    critical: false },
    { id: 11, key: 'encryption', name: 'Data Encryption',                     desc: 'Encryption at rest and in transit for sensitive data.',                 critical: false },
    { id: 12, key: 'vendor',     name: 'Third-Party / Vendor Risk',           desc: 'Process for assessing vendor security.',                                critical: false },
  ];
  const CRITICAL_KEYS = ['mfa', 'edr', 'backup', 'email', 'irplan'];
  const SESSION_KEY   = 'cyber_insurance_session';
  const DEFAULT_DISCLAIMER = 'This assessment is based on information provided and does not constitute a formal insurance audit.';
  const DEFAULT_CLOSING    = 'Once these controls are in place, your environment will meet the requirements of most major cyber insurance underwriters.';

  const HEX = {
    accent: '#2e74dc', dark: '#1e5bb8', gradStart: '#0f172a',
    text: '#0b1220', secondary: '#586273', muted: '#9ca3af',
    bg: '#fbfcfe', panel: '#ffffff', soft: '#f4f7fb', border: '#e3e7ee',
    successBg: '#dcfce7', successText: '#15a05a',
    warnBg: '#fef3c7', warnText: '#b3760a',
    dangerBg: '#fee2e2', dangerText: '#d8402e',
    unkBg: '#f4f7fb', unkText: '#9ca3af'
  };

  // ── STATE ────────────────────────────────────────────────────
  let state = {
    client:  { name: '', industry: '' },
    controls: CONTROLS_DEF.map(c => ({ id: c.id, status: 'unknown', notes: '' })),
    theme:   { color: '#2e74dc' },
    widget3: false,
    aiCopy:  { coverLetter: { opening: '', summaryFraming: '', closing: '' }, gapExplanations: [], pathItems: [], pathClosing: '', disclaimer: DEFAULT_DISCLAIMER },
    widgets: {}
  };

  // ── DOM REFS ─────────────────────────────────────────────────
  const clientNameEl     = $('clientName');
  const clientIndustryEl = $('clientIndustry');
  const checklistRows    = $('checklistRows');
  const completionCount  = $('completionCount');

  const scoreNumber = $('scoreNumber'), scoreLabel = $('scoreLabel'), scoreMarker = $('scoreMarker');
  const gapCritical = $('gapCritical'), gapRecommended = $('gapRecommended'), gapUnknown = $('gapUnknown');

  const downloadTechBtn = $('downloadTechBtn');
  const importTechBtn   = $('importTechBtn');
  const importXlsxFile  = $('importXlsxFile');

  const colourSwatches = $('colourSwatches');
  const customHex      = $('customHex');
  const hexPreview     = $('hexPreview');
  const widget3Toggle  = $('widget3Toggle');

  const generateBtn   = $('generateBtn');
  const formError     = $('formError');
  const emptyState    = $('emptyState');
  const widgetsOutput = $('widgetsOutput');
  const deliveryTitle = $('deliveryTitle');

  const regenAllBtn       = $('regenAllBtn');
  const copyAllBtn        = $('copyAllBtn');
  const pushIndividualBtn = $('pushIndividualBtn');
  const pushPackBtn       = $('pushPackBtn');
  const pushStatus        = $('pushStatus');
  const credsInline       = $('credsInline');
  const pushApiKey        = $('pushApiKey');
  const pushTenantUrl     = $('pushTenantUrl');
  const saveAndPushBtn    = $('saveAndPushBtn');

  const newSessionBtn     = $('newSessionBtn');
  const importSessionFile = $('importSessionFile');
  const sessionIndicator  = $('sessionIndicator');

  const toast = $('toast');
  const WIDGET_IDS = [1, 2, 3, 4];

  // ── CHECKLIST RENDER ─────────────────────────────────────────
  function renderChecklist() {
    checklistRows.innerHTML = '';
    CONTROLS_DEF.forEach(def => {
      const c = state.controls.find(x => x.id === def.id);
      const row = document.createElement('div');
      row.className = 'checklist-row';
      row.innerHTML = `
        <div class="checklist-row-name">${esc(def.name)}</div>
        <div class="checklist-row-desc">${esc(def.desc)}</div>
        <div class="segmented" data-id="${def.id}">
          <button data-val="inPlace"    class="${c.status === 'inPlace'    ? 'selected' : ''}">In place</button>
          <button data-val="partial"    class="${c.status === 'partial'    ? 'selected' : ''}">Partial</button>
          <button data-val="notInPlace" class="${c.status === 'notInPlace' ? 'selected' : ''}">Not in place</button>
          <button data-val="unknown"    class="${c.status === 'unknown'    ? 'selected' : ''}">Unknown</button>
        </div>
        <textarea class="checklist-row-notes" data-id="${def.id}" placeholder="Optional notes&hellip;">${esc(c.notes)}</textarea>
      `;
      checklistRows.appendChild(row);
    });

    checklistRows.querySelectorAll('.segmented button').forEach(btn => {
      btn.addEventListener('click', () => {
        const id  = Number(btn.parentElement.dataset.id);
        const val = btn.dataset.val;
        state.controls.find(x => x.id === id).status = val;
        btn.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('selected', b === btn));
        refresh();
        liveRebuildIfGenerated();
        autoSave();
      });
    });

    checklistRows.querySelectorAll('.checklist-row-notes').forEach(ta => {
      ta.addEventListener('input', () => {
        const id = Number(ta.dataset.id);
        state.controls.find(x => x.id === id).notes = ta.value;
        autoSave();
      });
    });
  }

  // ── SCORE ────────────────────────────────────────────────────
  function calculateScore(controls) {
    const weights = { inPlace: 1.0, partial: 0.5, notInPlace: 0.0, unknown: 0.0 };
    const total = controls.reduce((sum, c) => sum + weights[c.status], 0);
    return Math.round((total / controls.length) * 100) / 10;
  }
  function scoreBand(score) {
    if (score >= 8.0) return { label: 'Low Risk — Renewal Ready',      color: '#15a05a' };
    if (score >= 6.0) return { label: 'Medium Risk — Some Gaps',       color: '#b3760a' };
    if (score >= 4.0) return { label: 'Elevated Risk — Action Needed', color: '#ea580c' };
    return               { label: 'High Risk — Coverage at Risk',      color: '#d8402e' };
  }
  function updateScore() {
    const score = calculateScore(state.controls);
    const band  = scoreBand(score);
    scoreNumber.innerHTML = `${score.toFixed(1)}<span class="score-denom">/10</span>`;
    scoreLabel.textContent = band.label;
    scoreLabel.style.color = band.color;
    scoreMarker.style.left = `${Math.min(100, Math.max(0, score * 10))}%`;
    completionCount.textContent = state.controls.filter(c => c.status !== 'unknown').length;
  }

  // ── GAP CLASSIFICATION ───────────────────────────────────────
  function classifyGaps() {
    const gaps = [];
    state.controls.forEach(c => {
      if (c.status === 'inPlace') return;
      const def = CONTROLS_DEF.find(d => d.id === c.id);
      let severity;
      if (c.status === 'unknown') severity = 'unknown';
      else if (c.status === 'notInPlace' && CRITICAL_KEYS.includes(def.key)) severity = 'critical';
      else severity = 'recommended';
      gaps.push({ id: def.id, key: def.key, control: def.name, status: c.status, severity, notes: c.notes });
    });
    const order = { critical: 0, recommended: 1, unknown: 2 };
    gaps.sort((a, b) => order[a.severity] - order[b.severity]);
    return gaps;
  }
  function updateGapSummary() {
    const gaps = classifyGaps();
    gapCritical.textContent    = gaps.filter(g => g.severity === 'critical').length;
    gapRecommended.textContent = gaps.filter(g => g.severity === 'recommended').length;
    gapUnknown.textContent     = gaps.filter(g => g.severity === 'unknown').length;
    return gaps;
  }
  function refresh() { updateScore(); updateGapSummary(); }

  // ── THEME ────────────────────────────────────────────────────
  colourSwatches.querySelectorAll('.swatch').forEach(s => {
    s.addEventListener('click', () => {
      colourSwatches.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
      s.classList.add('active');
      state.theme.color = s.dataset.hex;
      customHex.value = '';
      hexPreview.style.background = 'transparent';
      liveRebuildIfGenerated();
      autoSave();
    });
  });
  customHex.addEventListener('input', () => {
    const v = customHex.value.trim();
    if (/^[0-9A-Fa-f]{6}$/.test(v)) {
      state.theme.color = '#' + v;
      hexPreview.style.background = state.theme.color;
      colourSwatches.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
      liveRebuildIfGenerated();
      autoSave();
    }
  });
  widget3Toggle.addEventListener('change', () => {
    state.widget3 = widget3Toggle.checked;
    liveRebuildIfGenerated();
    autoSave();
  });
  clientNameEl.addEventListener('input', () => { state.client.name = clientNameEl.value; liveRebuildIfGenerated(); autoSave(); });
  clientIndustryEl.addEventListener('change', () => { state.client.industry = clientIndustryEl.value; autoSave(); });

  function tintColor(hex, amount) {
    const c = (hex || '#2e74dc').replace('#', '');
    const r = parseInt(c.substring(0, 2), 16) || 0, g = parseInt(c.substring(2, 4), 16) || 0, b = parseInt(c.substring(4, 6), 16) || 0;
    const nr = Math.round(r + (255 - r) * amount);
    const ng = Math.round(g + (255 - g) * amount);
    const nb = Math.round(b + (255 - b) * amount);
    return `rgb(${nr},${ng},${nb})`;
  }

  // ── EXCEL EXPORT — with a REAL dropdown ─────────────────────
  // SheetJS's free build (xlsx.full.min.js) can READ data validation
  // but does not persist it when writing. To get an actual working
  // dropdown in Excel/M365, we build the workbook normally, then open
  // the resulting .xlsx as a zip (it's OOXML) and inject the
  // <dataValidations> XML into the Assessment sheet directly.
  downloadTechBtn.addEventListener('click', async () => {
    if (typeof JSZip === 'undefined') {
      showToast('Could not build the dropdown file — JSZip failed to load. Check your connection and try again.');
      return;
    }

    const wb = XLSX.utils.book_new();

    const instrRows = [
      ['CYBER INSURANCE READINESS — TECH QUESTIONNAIRE'],
      [''],
      ['Client:', state.client.name || ''],
      ['Industry:', state.client.industry || ''],
      ['Date:', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
      [''],
      ['INSTRUCTIONS FOR TECH:'],
      ['1. Go to the "Assessment" sheet.'],
      ['2. For each control, click the Current Status cell and choose from the dropdown:'],
      ['   • In Place — fully implemented'],
      ['   • Partial — in place for some users/systems but not all'],
      ['   • Not In Place — not implemented'],
      ['   • Unknown — not yet verified'],
      ['3. All 12 controls must be completed.'],
      ['4. Add optional notes in the Notes column.'],
      ['5. Save the file and return it to the salesperson for import.'],
      [''],
      ['DO NOT change column headers, row order, or control numbers.'],
    ];
    const instrSheet = XLSX.utils.aoa_to_sheet(instrRows);
    instrSheet['!cols'] = [{ wch: 16 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, instrSheet, 'Instructions');

    const headerRow = ['Control #', 'Control Name', 'Description', 'Why It Matters', 'Current Status', 'Notes'];
    const dataRows = CONTROLS_DEF.map(def => {
      const c = state.controls.find(x => x.id === def.id);
      const statusLabel = c.status === 'inPlace' ? 'In Place'
                        : c.status === 'partial'  ? 'Partial'
                        : c.status === 'notInPlace' ? 'Not In Place'
                        : 'Unknown';
      return [def.id, def.name, def.desc, whyItMatters(def.key), statusLabel, c.notes || ''];
    });
    const assessSheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
    assessSheet['!cols'] = [{ wch: 8 }, { wch: 34 }, { wch: 46 }, { wch: 46 }, { wch: 16 }, { wch: 34 }];
    XLSX.utils.book_append_sheet(wb, assessSheet, 'Assessment');

    const defaultName = `${state.client.name || 'Client'} — Cyber Insurance Assessment`;
    const userLabel = window.prompt('Name this spreadsheet file:', defaultName);
    if (userLabel === null) return;
    const safeName = (userLabel.trim() || defaultName).replace(/[^a-z0-9 _\-–—]/gi, '').trim().replace(/\s+/g, '-');

    downloadTechBtn.disabled = true;
    const originalLabel = downloadTechBtn.textContent;
    downloadTechBtn.textContent = 'Building…';

    try {
      const wbArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const zip = await JSZip.loadAsync(wbArray);
      const sheetPath = await findSheetPathByName(zip, 'Assessment');
      const lastRow = CONTROLS_DEF.length + 1;
      const validationXml = `<dataValidations count="1"><dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="1" sqref="E2:E${lastRow}"><formula1>"In Place,Partial,Not In Place,Unknown"</formula1></dataValidation></dataValidations>`;

      if (sheetPath && zip.file(sheetPath)) {
        let xml = await zip.file(sheetPath).async('string');
        zip.file(sheetPath, insertDataValidations(xml, validationXml));
      }

      const outBlob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(outBlob);
      const a = document.createElement('a');
      a.href = url; a.download = `${safeName}.xlsx`; a.click();
      URL.revokeObjectURL(url);
      showToast('Spreadsheet downloaded — the Current Status column has a real dropdown in Excel/M365.');
    } catch (e) {
      console.error('Dropdown injection failed, falling back to plain export:', e);
      XLSX.writeFile(wb, `${safeName}.xlsx`);
      showToast('Spreadsheet downloaded (dropdown could not be embedded this time — type the status manually).');
    } finally {
      downloadTechBtn.disabled = false;
      downloadTechBtn.textContent = originalLabel;
    }
  });

  async function findSheetPathByName(zip, name) {
    const fallback = 'xl/worksheets/sheet2.xml';
    try {
      const wbXml = await zip.file('xl/workbook.xml').async('string');
      const sheetTagMatch = wbXml.match(new RegExp(`<sheet[^>]*name="${name}"[^>]*/?>`));
      if (!sheetTagMatch) return fallback;
      const ridMatch = sheetTagMatch[0].match(/r:id="([^"]+)"/);
      if (!ridMatch) return fallback;
      const relsXml = await zip.file('xl/_rels/workbook.xml.rels').async('string');
      const relMatch = relsXml.match(new RegExp(`<Relationship[^>]*Id="${ridMatch[1]}"[^>]*Target="([^"]+)"`));
      if (!relMatch) return fallback;
      let target = relMatch[1].replace(/^\//, '');
      return target.startsWith('xl/') ? target : `xl/${target}`;
    } catch (e) {
      return fallback;
    }
  }

  // OOXML requires strict element order inside <worksheet>. dataValidations must
  // come AFTER mergeCells/phoneticPr/conditionalFormatting (which, if present,
  // already appear earlier in the string — nothing special needed for those)
  // and BEFORE everything in this list. Inserting blindly before </worksheet>
  // or only before <pageMargins> breaks the schema whenever SheetJS emits e.g.
  // <ignoredErrors> with no <pageMargins> — Excel can flag such a file for repair.
  function insertDataValidations(xml, validationXml) {
    const afterTags = [
      'hyperlinks', 'printOptions', 'pageMargins', 'pageSetup', 'headerFooter',
      'rowBreaks', 'colBreaks', 'customProperties', 'cellWatches', 'ignoredErrors',
      'smartTags', 'drawing', 'legacyDrawing', 'oleObjects', 'controls',
      'webPublishItems', 'tableParts', 'extLst'
    ];
    let insertAt = -1;
    for (const tag of afterTags) {
      const idx = xml.indexOf(`<${tag}`);
      if (idx !== -1 && (insertAt === -1 || idx < insertAt)) insertAt = idx;
    }
    if (insertAt === -1) return xml.replace('</worksheet>', validationXml + '</worksheet>');
    return xml.slice(0, insertAt) + validationXml + xml.slice(insertAt);
  }

  function whyItMatters(key) {
    const map = {
      mfa: 'Most underwriters now require MFA on email, remote access, and admin accounts.',
      edr: 'AV alone is often considered insufficient — active EDR is a standard requirement.',
      backup: 'Immutable, tested backups are a key defense underwriters check for ransomware claims.',
      patch: 'Unpatched systems are a common entry point for the exploits underwriters ask about.',
      email: 'Phishing remains a leading cause of claims — filtering and authentication reduce that risk.',
      training: 'Documented annual training is increasingly required as a baseline control.',
      pam: 'Least-privilege access limits the blast radius of a compromised account.',
      irplan: 'A documented incident response plan speeds recovery and is often a coverage requirement.',
      vulnscan: 'Regular scanning demonstrates ongoing risk management to underwriters.',
      remote: 'Secure remote access (VPN/ZTNA) closes a common attack vector.',
      encryption: 'Encryption at rest and in transit protects data confidentiality in a breach.',
      vendor: 'Vendor risk processes address exposure introduced through third parties.'
    };
    return map[key] || '';
  }

  // ── EXCEL IMPORT ─────────────────────────────────────────────
  importTechBtn.addEventListener('click', () => { importXlsxFile.value = ''; importXlsxFile.click(); });
  importXlsxFile.addEventListener('change', () => {
    const file = importXlsxFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb   = XLSX.read(data, { type: 'array' });
        const sheetName = wb.SheetNames.includes('Assessment') ? 'Assessment' : wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
        const dataRows = rows.slice(1).filter(r => r[0] != null && r[0] !== '');

        if (dataRows.length < CONTROLS_DEF.length) {
          showToast(`Only ${dataRows.length} rows found — expected ${CONTROLS_DEF.length}. Check the file.`);
          return;
        }
        const blanks = [];
        dataRows.slice(0, CONTROLS_DEF.length).forEach((row, idx) => { if (!String(row[4] || '').trim()) blanks.push(idx + 1); });
        if (blanks.length > 0) {
          showToast(`${blanks.length} control${blanks.length > 1 ? 's' : ''} missing a Current Status. All ${CONTROLS_DEF.length} required.`);
          return;
        }

        let updated = 0;
        dataRows.slice(0, CONTROLS_DEF.length).forEach((row, idx) => {
          if (idx >= state.controls.length) return;
          state.controls[idx].status = normalizeStatus(row[4]);
          const notes = String(row[5] || '').trim();
          if (notes) state.controls[idx].notes = notes;
          updated++;
        });

        renderChecklist();
        refresh();
        liveRebuildIfGenerated();
        autoSave();
        showToast(`✓ Imported ${updated} controls from spreadsheet.`);
      } catch (err) {
        showToast('Could not read spreadsheet — is it the correct file?');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
  function normalizeStatus(raw) {
    const s = String(raw || '').trim().toLowerCase();
    if (s === 'in place') return 'inPlace';
    if (s === 'partial') return 'partial';
    if (s === 'not in place') return 'notInPlace';
    return 'unknown';
  }

  // ── SESSION SAVE / LOAD ──────────────────────────────────────
  // Matches the session pattern used across the MSP tools suite
  // (technology-roadmap.js): an array of session snapshots capped at 20,
  // an inline card strip (not a modal) showing the latest 5 + "show archived"
  // for the rest, click-a-card-to-resume, and auto-resume of the most
  // recent session on page load. Autosave is continuous; there is no
  // separate "Save" button — the card strip and the flash indicator are
  // the only feedback needed.
  const SESSION_KEY_LIST = 'cyber_insurance_sessions';
  const ARCHIVE_KEY      = 'cyber_insurance_sessions_archived';
  const SESSION_LIMIT    = 5;

  let currentSessionId = null;
  let autoSaveReady     = false; // guards against saving a blank state before restore runs on load
  let _showingArchived  = false;

  const sessionsBlock    = $('sessionsBlock');
  const sessionCards     = $('sessionCards');
  const showArchivedBtn  = $('showArchivedBtn');

  function buildSessionSnapshot(status) {
    const safeStatus = ['draft', 'generated', 'pushed'].includes(status) ? status : 'draft';
    return {
      id: currentSessionId,
      clientName: state.client.name || 'Untitled',
      savedAt: Date.now(),
      status: safeStatus,
      state: JSON.parse(JSON.stringify(state))
    };
  }

  function autoSave(status) {
    if (!autoSaveReady) return;
    if (!currentSessionId) currentSessionId = 'cyber_session_' + Date.now();
    let sessions = getSessions();
    const idx = sessions.findIndex(s => s.id === currentSessionId);
    const storedStatus = idx >= 0 ? sessions[idx].status : undefined;
    const safeStored = typeof storedStatus === 'string' ? storedStatus : 'draft';
    const snap = buildSessionSnapshot(status || safeStored);
    if (idx >= 0) sessions[idx] = snap; else sessions.unshift(snap);
    sessions = sessions.slice(0, 20);
    saveSessions(sessions);
    renderSessionCards(_showingArchived);
    flashSaved();
  }

  function flashSaved() {
    sessionIndicator.hidden = false;
    sessionIndicator.textContent = `Saved · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  function startNewSession() {
    currentSessionId = 'cyber_session_' + Date.now();
    state = {
      client: { name: '', industry: '' },
      controls: CONTROLS_DEF.map(c => ({ id: c.id, status: 'unknown', notes: '' })),
      theme: { color: '#2e74dc' },
      widget3: false,
      aiCopy: { coverLetter: { opening: '', summaryFraming: '', closing: '' }, gapExplanations: [], pathItems: [], pathClosing: '', disclaimer: DEFAULT_DISCLAIMER },
      widgets: {}
    };
    clientNameEl.value = ''; clientIndustryEl.value = '';
    renderChecklist(); refresh();
    colourSwatches.querySelectorAll('.swatch').forEach((s, i) => s.classList.toggle('active', i === 0));
    customHex.value = ''; hexPreview.style.background = 'transparent';
    widget3Toggle.checked = false;
    emptyState.hidden = false;
    widgetsOutput.hidden = true;
    deliveryTitle.textContent = 'Readiness Widgets';
    formError.hidden = true;
    autoSave('draft');
  }
  newSessionBtn.addEventListener('click', startNewSession);

  function resumeSession(sess) {
    currentSessionId = sess.id;
    restoreState(JSON.parse(JSON.stringify(sess.state)));
    renderSessionCards(_showingArchived);
  }

  function restoreState(saved) {
    state.client   = saved.client   || { name: '', industry: '' };
    state.controls = saved.controls || CONTROLS_DEF.map(c => ({ id: c.id, status: 'unknown', notes: '' }));
    state.theme    = saved.theme    || { color: '#2e74dc' };
    state.widget3  = !!saved.widget3;
    state.aiCopy   = saved.aiCopy   || { coverLetter: { opening: '', summaryFraming: '', closing: '' }, gapExplanations: [], pathItems: [], pathClosing: '', disclaimer: DEFAULT_DISCLAIMER };
    if (!state.aiCopy.coverLetter) state.aiCopy.coverLetter = { opening: '', summaryFraming: '', closing: '' };
    state.widgets  = saved.widgets  || {};

    // Migration: sessions saved before the cover letter existed used
    // 1=Score, 2=Gap Analysis, 3=Path to Readiness. Shift them into the
    // current 2/3/4 slots — widget 1 (cover letter) is left for
    // renderAllWidgets to fill in via its normal fallback-copy lookup.
    if (state.widgets['3'] && !state.widgets['4']) {
      state.widgets = { 2: state.widgets['1'], 3: state.widgets['2'], 4: state.widgets['3'] };
    }

    clientNameEl.value = state.client.name || '';
    clientIndustryEl.value = state.client.industry || '';
    renderChecklist();
    refresh();

    colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.toggle('active', s.dataset.hex === state.theme.color));
    const matched = [...colourSwatches.querySelectorAll('.swatch')].some(s => s.dataset.hex === state.theme.color);
    if (!matched) { customHex.value = state.theme.color.replace('#', ''); hexPreview.style.background = state.theme.color; }
    else { customHex.value = ''; hexPreview.style.background = 'transparent'; }

    widget3Toggle.checked = state.widget3;

    if (Object.keys(state.widgets).length && state.widgets[2]) {
      const gaps = classifyGaps();
      renderAllWidgets(gaps);
      emptyState.hidden = true;
      widgetsOutput.hidden = false;
      deliveryTitle.textContent = `${state.client.name || ''} — Cyber Insurance Widgets`;
    } else {
      emptyState.hidden = false;
      widgetsOutput.hidden = true;
      deliveryTitle.textContent = 'Readiness Widgets';
    }
  }

  function getSessions() { try { return JSON.parse(localStorage.getItem(SESSION_KEY_LIST) || '[]'); } catch (e) { return []; } }
  function saveSessions(s) {
    try {
      const json = JSON.stringify(s);
      // Widget HTML is the bulk of a session's size. If the whole list is
      // getting close to localStorage's ~5MB ceiling, strip cached widget
      // HTML from everything but the most recent session — it regenerates
      // instantly from aiCopy/controls anyway, nothing is actually lost.
      if (json.length > 3_000_000) {
        const trimmed = s.map((sess, i) => i === 0 ? sess : { ...sess, state: { ...sess.state, widgets: {} } });
        localStorage.setItem(SESSION_KEY_LIST, JSON.stringify(trimmed));
      } else {
        localStorage.setItem(SESSION_KEY_LIST, json);
      }
    } catch (e) { console.warn('Session save failed:', e); }
  }
  function getArchived()   { try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]'); } catch (e) { return []; } }
  function saveArchived(a) { try { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(a)); } catch (e) { /* noop */ } }

  showArchivedBtn.addEventListener('click', () => { _showingArchived = !_showingArchived; renderSessionCards(_showingArchived); });

  function renderSessionCards(showArchived) {
    const sessions = getSessions();
    const archived = showArchived ? getArchived() : [];
    const toShow   = showArchived ? [...sessions, ...archived] : sessions.slice(0, SESSION_LIMIT);

    if (!sessions.length) { sessionsBlock.hidden = true; return; }
    sessionsBlock.hidden = false;
    sessionCards.innerHTML = '';

    toShow.forEach(sess => {
      const card = document.createElement('div');
      card.className = 'session-card';
      const statusClass = { draft: 'status-draft', generated: 'status-generated', pushed: 'status-pushed' }[sess.status] || 'status-draft';
      const controls = (sess.state && sess.state.controls) || [];
      const score = controls.length ? calculateScore(controls) : 0;
      card.innerHTML = `
        <div class="session-card-info">
          <div class="session-card-company">${esc(sess.clientName || 'Untitled')}</div>
          <div class="session-card-meta">${fmtAge(sess.savedAt)} &middot; ${score.toFixed(1)}/10</div>
        </div>
        <div class="session-card-actions">
          <span class="session-card-status ${statusClass}">${(sess.status || 'draft').toUpperCase()}</span>
          <button class="session-discard" data-id="${esc(sess.id)}" title="Discard">&times;</button>
        </div>`;
      card.addEventListener('click', () => resumeSession(sess));
      card.querySelector('.session-discard').addEventListener('click', e => {
        e.stopPropagation();
        if (!confirm('Discard this saved session? This cannot be undone.')) return;
        discardSession(sess.id, showArchived);
      });
      sessionCards.appendChild(card);
    });

    const hasMore = !showArchived && sessions.length > SESSION_LIMIT;
    if (hasMore) {
      const more = document.createElement('div');
      more.className = 'session-more-note';
      more.textContent = `+ ${sessions.length - SESSION_LIMIT} more`;
      sessionCards.appendChild(more);
    }
    showArchivedBtn.textContent = showArchived ? 'Hide archived' : 'Show archived';
  }

  function discardSession(id, isArchived) {
    if (isArchived) saveArchived(getArchived().filter(s => s.id !== id));
    else            saveSessions(getSessions().filter(s => s.id !== id));
    renderSessionCards(isArchived);
  }

  function fmtAge(ts) {
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 2)  return 'just now';
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }

  // Cross-device backup/restore (separate from the local session list above —
  // this is for a rep who wants to hand a .json file to another device).
  importSessionFile.addEventListener('change', () => {
    const file = importSessionFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target.result);
        const s = payload.state || payload;
        if (!s.controls || !s.client) { showToast('Invalid session file.'); return; }
        restoreState(s);
        currentSessionId = 'cyber_session_' + Date.now(); // imported file becomes its own new session, not an overwrite
        autoSave(Object.keys(state.widgets).length ? 'generated' : 'draft');
        showToast(`Session loaded: ${s.client.name || 'Untitled'}`);
      } catch (err) {
        showToast('Could not read session file — is it a valid JSON export?');
      }
    };
    reader.readAsText(file);
  });


  // ── AI COPY (resilient — never throws, always returns usable copy) ──
  function defaultExplanation(key) {
    const map = {
      mfa: 'Most underwriters now require MFA on all email, remote access, and admin accounts.',
      edr: 'Most underwriters now require active EDR — antivirus alone is often considered insufficient.',
      backup: 'Claims related to ransomware may be denied without tested, immutable backups.',
      patch: 'Unpatched systems are a common way attackers gain initial access.',
      email: 'Phishing is a leading cause of claims — underwriters expect anti-phishing controls.',
      training: 'Underwriters increasingly require documented annual training for all staff.',
      pam: 'Least-privilege access limits damage if an account is compromised.',
      irplan: 'A documented incident response plan is required by many underwriters and speeds recovery.',
      vulnscan: 'Regular vulnerability scanning demonstrates ongoing risk management.',
      remote: 'Underwriters typically require secure remote access such as VPN or ZTNA.',
      encryption: 'Encryption at rest and in transit protects sensitive data in the event of a breach.',
      vendor: 'A vendor risk process addresses exposure introduced through third parties.'
    };
    return map[key] || 'This control is commonly required by cyber insurance underwriters.';
  }
  function defaultPathDescription(key) {
    const map = {
      mfa: 'Multi-factor authentication deployment across email, remote access, and admin accounts.',
      edr: 'Managed endpoint detection and response across all devices.',
      backup: 'Immutable, offsite backup with regular restore testing.',
      patch: 'Ongoing patch management for operating systems and applications.',
      email: 'Advanced email security with anti-phishing and authentication protocols.',
      training: 'Recurring, documented security awareness training for all staff.',
      pam: 'Privileged access management with least-privilege account structure.',
      irplan: 'Documented incident response planning with defined escalation paths.',
      vulnscan: 'Scheduled vulnerability scanning across the network and endpoints.',
      remote: 'Secure remote access via VPN or zero-trust network access.',
      encryption: 'Data encryption at rest and in transit for sensitive information.',
      vendor: 'A vendor risk assessment process for third-party relationships.'
    };
    return map[key] || 'A managed service addressing this control area.';
  }
  function defaultCoverLetterCopy(industry, bandLabel) {
    const industryPhrase = industry ? ` in the ${industry.toLowerCase()} sector` : '';
    let summaryFraming;
    if (bandLabel && bandLabel.indexOf('Low') === 0) {
      summaryFraming = 'Overall, your organization is well positioned heading into renewal, with a few refinements that will further strengthen your position.';
    } else if (bandLabel && bandLabel.indexOf('High') === 0) {
      summaryFraming = 'These findings represent meaningful exposure that could affect both your coverage and your premium if left unaddressed before renewal.';
    } else {
      summaryFraming = 'These findings represent a mix of strengths and gaps that are worth addressing ahead of your next renewal.';
    }
    return {
      opening: `Thank you for the opportunity to review your organization's current approach to cyber security and cyber insurance readiness${industryPhrase}. This assessment reflects our findings against the controls most commonly required by underwriters today.`,
      summaryFraming,
      closing: 'The following pages detail our specific findings and the recommended path to close any gaps identified. We welcome the opportunity to discuss these results and how we can support you going forward.'
    };
  }
  function buildFallbackCopy(gaps, includePath, industry, bandLabel) {
    return {
      coverLetter: defaultCoverLetterCopy(industry, bandLabel),
      gapExplanations: gaps.map(g => ({ control: g.control, explanation: defaultExplanation(g.key) })),
      pathItems: includePath ? gaps.map(g => ({ control: g.control, description: defaultPathDescription(g.key) })) : [],
      pathClosing: includePath ? DEFAULT_CLOSING : '',
      disclaimer: DEFAULT_DISCLAIMER
    };
  }
  // Never throws. Always returns a fully-populated, usable copy object —
  // AI text where available, deterministic fallback text everywhere else.
  // Always calls the AI (even with zero gaps) since the cover letter is
  // needed regardless of whether any gaps exist.
  async function safeFetchAiCopy(gaps, includePath, score, bandLabel) {
    const fallback = buildFallbackCopy(gaps, includePath, state.client.industry, bandLabel);
    try {
      const res = await fetch('/api/cyber-insurance-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: state.client.name,
          industry: state.client.industry,
          score,
          scoreBandLabel: bandLabel,
          gaps: gaps.map(g => ({ control: g.control, status: g.status, severity: g.severity })),
          includePathToReadiness: includePath
        })
      });
      let data;
      try { data = await res.json(); }
      catch (e) { console.warn('[cyber-insurance] AI response was not JSON — using local copy.', e); return fallback; }

      if (!res.ok || !data || !data.ok) {
        console.warn('[cyber-insurance] AI call failed — using local copy.', data && data.error);
        return fallback;
      }

      const coverLetter = {
        opening: (data.coverLetter && data.coverLetter.opening) || fallback.coverLetter.opening,
        summaryFraming: (data.coverLetter && data.coverLetter.summaryFraming) || fallback.coverLetter.summaryFraming,
        closing: (data.coverLetter && data.coverLetter.closing) || fallback.coverLetter.closing
      };

      const explanations = gaps.map(g => {
        const found = (data.gapExplanations || []).find(e => e.control === g.control && e.explanation);
        return found || fallback.gapExplanations.find(e => e.control === g.control);
      });

      let pathItems = fallback.pathItems, pathClosing = fallback.pathClosing;
      if (includePath) {
        const pd = data.pathToReadiness || {};
        pathItems = gaps.map(g => {
          const found = (pd.items || []).find(e => e.control === g.control && e.description);
          return found || fallback.pathItems.find(e => e.control === g.control);
        });
        pathClosing = pd.closing || fallback.pathClosing;
      }
      return { coverLetter, gapExplanations: explanations, pathItems, pathClosing, disclaimer: fallback.disclaimer };
    } catch (e) {
      console.warn('[cyber-insurance] AI call threw — using local copy.', e);
      return fallback;
    }
  }

  // ── GENERATE ─────────────────────────────────────────────────
  function validate() {
    if (!state.client.name.trim()) return 'Enter a client name before generating.';
    if (!state.client.industry) return 'Select an industry.';
    return null;
  }
  generateBtn.addEventListener('click', onGenerate);

  async function onGenerate() {
    formError.hidden = true;
    const err = validate();
    if (err) { formError.textContent = err; formError.hidden = false; return; }

    const gaps = classifyGaps();
    const score = calculateScore(state.controls);
    const band  = scoreBand(score);
    generateBtn.disabled = true;
    const originalLabel = generateBtn.textContent;
    generateBtn.textContent = 'Generating…';

    try {
      state.aiCopy = await safeFetchAiCopy(gaps, state.widget3, score, band.label);
      renderAllWidgets(gaps);
      emptyState.hidden = true;
      widgetsOutput.hidden = false;
      deliveryTitle.textContent = `${state.client.name} — Cyber Insurance Widgets`;
      autoSave('generated');
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = originalLabel;
    }
  }

  // Instant, local re-render — used for theme changes, checklist edits,
  // and the widget-3 toggle. No AI call. Uses cached aiCopy text and
  // falls back to default copy for any gap that doesn't have cached text yet.
  function liveRebuildIfGenerated() {
    if (widgetsOutput.hidden) return; // nothing generated yet
    renderAllWidgets(classifyGaps());
    autoSave();
  }

  // ── WIDGET BUILDERS (TinyMCE-safe inline HTML) ──────────────
  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function bannerHeader(kicker, title, sub) {
    return `<div style="background:linear-gradient(120deg, ${HEX.gradStart}, ${state.theme.color});padding:22px 26px;">
    <div style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;color:rgba(255,255,255,0.8);text-transform:uppercase;margin-bottom:6px;">${esc(kicker)}</div>
    <div style="font-family:Montserrat,Arial,sans-serif;font-size:19px;font-weight:700;color:#ffffff;">${esc(title)}</div>
    ${sub ? `<div style="margin-top:4px;font-family:'Source Sans Pro',Arial,sans-serif;font-size:12.5px;color:rgba(255,255,255,0.75);">${esc(sub)}</div>` : ''}
  </div>`;
  }

  function statusPill(status) {
    const conf = {
      inPlace:    { bg: HEX.successBg, text: HEX.successText, label: 'In Place' },
      partial:    { bg: HEX.warnBg,    text: HEX.warnText,    label: 'Partial' },
      notInPlace: { bg: HEX.dangerBg,  text: HEX.dangerText,  label: 'Not in Place' },
      unknown:    { bg: HEX.unkBg,     text: HEX.unkText,     label: 'Unknown' }
    }[status];
    return `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${conf.bg};color:${conf.text};font-family:'Source Sans Pro',Arial,sans-serif;font-size:12px;font-weight:600;">${conf.label}</span>`;
  }

  // No gradient banner, by design — this widget reads as a letter, not a
  // dashboard card. {{merge fields}} are left as literal text for
  // Salesbuildr to substitute at render time; only the surrounding prose
  // and the score/gap numbers (from our own data, not merge fields) are
  // filled in here.
  function buildCoverLetterWidget(gaps) {
    const score = calculateScore(state.controls);
    const band  = scoreBand(score);
    const copy  = state.aiCopy.coverLetter || {};
    const opening = copy.opening || defaultCoverLetterCopy(state.client.industry, band.label).opening;
    const framing = copy.summaryFraming || defaultCoverLetterCopy(state.client.industry, band.label).summaryFraming;
    const closing = copy.closing || defaultCoverLetterCopy(state.client.industry, band.label).closing;

    const critical    = gaps.filter(g => g.severity === 'critical').length;
    const recommended = gaps.filter(g => g.severity === 'recommended').length;
    const unknown      = gaps.filter(g => g.severity === 'unknown').length;

    let summaryLead;
    if (gaps.length === 0) {
      summaryLead = `{{company.name}}'s current cyber insurance readiness score is <strong>${score.toFixed(1)}/10</strong> — all 12 controls reviewed are fully in place.`;
    } else {
      const parts = [];
      if (critical > 0)    parts.push(`<strong>${critical} critical</strong>`);
      if (recommended > 0) parts.push(`<strong>${recommended} recommended</strong>`);
      if (unknown > 0)      parts.push(`<strong>${unknown} unverified</strong>`);
      const clause = parts.length > 1 ? parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1] : parts[0];
      summaryLead = `{{company.name}}'s current cyber insurance readiness score is <strong>${score.toFixed(1)}/10</strong>, with ${clause} item${gaps.length > 1 ? 's' : ''} identified across the 12 controls reviewed.`;
    }

    const tint = tintColor(state.theme.color, 0.9);

    return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${HEX.panel};border-top:3px solid ${state.theme.color};">
  <tr><td style="padding:30px 34px 4px 34px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:12px;color:${HEX.muted};">{{date quote.createdAt}}</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:18px 34px 0 34px;">
    <div style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:14px;color:${HEX.text};margin-bottom:16px;">Dear {{contact.firstName}},</div>
    <div data-edit="letterOpening" style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:13.5px;color:${HEX.secondary};line-height:1.7;margin-bottom:20px;">${esc(opening)}</div>
  </td></tr>
  <tr><td style="padding:0 34px 20px 34px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${tint};border-left:3px solid ${state.theme.color};">
      <tr><td style="padding:16px 20px;">
        <div style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:${state.theme.color};margin-bottom:8px;">Executive Summary</div>
        <div style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:13.5px;color:${HEX.text};line-height:1.65;">
          ${summaryLead} <span data-edit="letterSummary">${esc(framing)}</span>
        </div>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:0 34px 26px 34px;">
    <div data-edit="letterClosing" style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:13.5px;color:${HEX.secondary};line-height:1.7;">${esc(closing)}</div>
  </td></tr>
  <tr><td style="padding:18px 34px 32px 34px;border-top:1px solid ${HEX.border};">
    <div style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:13px;color:${HEX.secondary};margin-bottom:12px;">On behalf of {{servicingBranch.name}},</div>
    <div style="font-family:Montserrat,Arial,sans-serif;font-size:14px;font-weight:700;color:${HEX.text};">{{company.accountManager.fullName}}</div>
    <div style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:12px;color:${HEX.muted};">{{company.accountManager.role}}</div>
  </td></tr>
</table>`;
  }

  function buildScoreWidget() {
    const score = calculateScore(state.controls);
    const band  = scoreBand(score);
    const period = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const markerLeftPct = Math.min(97, Math.max(3, Math.round(score * 10)));

    const cells = CONTROLS_DEF.map(def => {
      const c = state.controls.find(x => x.id === def.id);
      return `<td width="50%" style="padding:12px 14px;border:1px solid ${HEX.border};background:${HEX.panel};">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:13px;color:${HEX.text};font-weight:600;">${esc(def.name)}</td>
          <td align="right">${statusPill(c.status)}</td>
        </tr></table>
      </td>`;
    });
    let rows = '';
    for (let i = 0; i < cells.length; i += 2) {
      rows += `<tr>${cells[i]}${cells[i + 1] || `<td width="50%" style="background:${HEX.panel};border:1px solid ${HEX.border};"></td>`}</tr>`;
    }

    return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${HEX.panel};">
  <tr><td>${bannerHeader('Cyber Insurance Readiness', state.client.name || 'Client Name', `Assessment · ${period}`)}</td></tr>
  <tr><td style="padding:24px 26px 10px 26px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="30%" style="vertical-align:middle;">
        <span style="font-family:Montserrat,Arial,sans-serif;font-size:40px;font-weight:800;color:${band.color};">${score.toFixed(1)}</span><span style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:16px;color:${HEX.muted};">/10</span>
      </td>
      <td width="70%" style="vertical-align:middle;">
        <div style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.04em;color:${HEX.muted};text-transform:uppercase;margin-bottom:8px;">Readiness Level</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr><td colspan="3" style="padding:0;">
            <div style="height:8px;border-radius:999px;background:linear-gradient(90deg,#15a05a,#b3760a,#ea580c,#d8402e);"></div>
          </td></tr>
          <tr>
            <td width="${markerLeftPct}%" style="font-size:0;line-height:0;">&nbsp;</td>
            <td style="width:1px;font-size:0;line-height:0;white-space:nowrap;">
              <div style="width:24px;height:24px;margin:-16px 0 0 -12px;border-radius:50%;background:#ffffff;border:4px solid ${band.color};box-shadow:0 1px 4px rgba(11,18,32,0.35);"></div>
            </td>
            <td style="font-size:0;line-height:0;">&nbsp;</td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:2px;"><tr>
          <td style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:11px;color:#15a05a;">Low risk</td>
          <td align="center" style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:11px;color:${HEX.muted};">Medium</td>
          <td align="right" style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:11px;color:#d8402e;">High risk</td>
        </tr></table>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:6px 26px 26px 26px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${rows}
    </table>
  </td></tr>
</table>`;
  }

  const SEVERITY_CONF = {
    critical:    { icon: '⚠️', label: 'CRITICAL — MAY AFFECT COVERAGE',   color: HEX.dangerText, bg: HEX.dangerBg },
    recommended: { icon: '⚡', label: 'RECOMMENDED — MAY AFFECT PREMIUM', color: HEX.warnText,   bg: HEX.warnBg },
    unknown:     { icon: '❓', label: 'UNKNOWN — VERIFY BEFORE RENEWAL',  color: HEX.unkText,    bg: HEX.unkBg }
  };

  function buildGapWidget(gaps) {
    const rows = gaps.map((g, idx) => {
      const conf = SEVERITY_CONF[g.severity];
      const found = state.aiCopy.gapExplanations.find(e => e.control === g.control);
      const expl = (found && found.explanation) || defaultExplanation(g.key);
      const gapLabel = g.severity === 'unknown' ? `${g.control} status unknown`
        : g.status === 'partial' ? `${g.control} not fully deployed`
        : `No ${g.control}`;
      const rowBg = idx % 2 === 1 ? tintColor(state.theme.color, 0.95) : '#ffffff';
      return `<tr><td style="padding:16px 22px;border-bottom:1px solid ${HEX.border};background:${rowBg};">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="36" style="vertical-align:top;">
            <span style="display:inline-block;width:26px;height:26px;line-height:26px;text-align:center;border-radius:6px;background:${conf.bg};font-size:13px;">${conf.icon}</span>
          </td>
          <td style="vertical-align:top;padding-left:12px;">
            <div style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:14px;font-weight:700;color:${HEX.text};margin-bottom:3px;">${esc(gapLabel)}</div>
            <div data-edit="gapExpl" data-control="${esc(g.control)}" style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:13px;color:${HEX.secondary};line-height:1.5;margin-bottom:6px;">${esc(expl)}</div>
            <div style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.03em;color:${conf.color};">${conf.label}</div>
          </td>
        </tr></table>
      </td></tr>`;
    }).join('');

    const subLine = state.client.name ? `Prepared for ${state.client.name}` : '';

    return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${HEX.panel};">
  <tr><td>${bannerHeader('Critical gaps identified', 'What needs to be addressed before renewal', subLine)}</td></tr>
  ${rows}
  <tr><td style="padding:14px 22px;background:${HEX.soft};">
    <div data-edit="disclaimer" style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:12px;font-style:italic;color:${HEX.muted};">${esc(state.aiCopy.disclaimer || DEFAULT_DISCLAIMER)}</div>
  </td></tr>
</table>`;
  }

  function buildPathWidget(gaps) {
    const rows = gaps.map((g, idx) => {
      const found = state.aiCopy.pathItems.find(e => e.control === g.control);
      const desc = (found && found.description) || defaultPathDescription(g.key);
      const rowBg = idx % 2 === 1 ? tintColor(state.theme.color, 0.94) : '#ffffff';
      return `<tr><td style="padding:15px 22px;border-bottom:1px solid ${HEX.border};background:${rowBg};">
        <div style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:14px;font-weight:700;color:${HEX.text};margin-bottom:3px;">${esc(g.control)}</div>
        <div data-edit="pathDesc" data-control="${esc(g.control)}" style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:13px;color:${HEX.secondary};line-height:1.5;">${esc(desc)}</div>
      </td></tr>`;
    }).join('');

    const closing = state.aiCopy.pathClosing || DEFAULT_CLOSING;
    const subLine = state.client.name ? `Prepared for ${state.client.name}` : '';

    return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${HEX.panel};">
  <tr><td>${bannerHeader('Path to readiness', 'How We Close These Gaps', subLine)}</td></tr>
  ${rows}
  <tr><td style="background:${state.theme.color};padding:16px 22px;">
    <div data-edit="closing" style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:13px;color:#ffffff;line-height:1.6;">${esc(closing)}</div>
  </td></tr>
</table>`;
  }

  // ── RENDER / EDIT WIRING ─────────────────────────────────────
  function renderPreview(i) {
    const el = $(`preview${i}`);
    if (el) el.innerHTML = state.widgets[i] || '';
  }

  function captureHtml(i) {
    const el = $(`preview${i}`);
    if (!el) return '';
    const clone = el.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach(n => { n.removeAttribute('contenteditable'); });
    return clone.innerHTML;
  }

  function makeEditable(i) {
    const el = $(`preview${i}`);
    if (!el) return;
    el.querySelectorAll('[data-edit]').forEach(node => {
      node.setAttribute('contenteditable', 'true');
      node.addEventListener('input', () => {
        const key     = node.dataset.edit;
        const control = node.dataset.control;
        const text    = node.textContent;
        if (key === 'letterOpening') {
          state.aiCopy.coverLetter.opening = text;
        } else if (key === 'letterSummary') {
          state.aiCopy.coverLetter.summaryFraming = text;
        } else if (key === 'letterClosing') {
          state.aiCopy.coverLetter.closing = text;
        } else if (key === 'gapExpl') {
          let entry = state.aiCopy.gapExplanations.find(g => g.control === control);
          if (entry) entry.explanation = text; else state.aiCopy.gapExplanations.push({ control, explanation: text });
        } else if (key === 'pathDesc') {
          let entry = state.aiCopy.pathItems.find(g => g.control === control);
          if (entry) entry.description = text; else state.aiCopy.pathItems.push({ control, description: text });
        } else if (key === 'disclaimer') {
          state.aiCopy.disclaimer = text;
        } else if (key === 'closing') {
          state.aiCopy.pathClosing = text;
        }
        state.widgets[i] = captureHtml(i);
        autoSave();
      });
    });
  }

  function renderAllWidgets(gaps) {
    state.widgets[1] = buildCoverLetterWidget(gaps);
    renderPreview(1);
    makeEditable(1);

    state.widgets[2] = buildScoreWidget();
    renderPreview(2);

    if (gaps.length) {
      state.widgets[3] = buildGapWidget(gaps);
      $('widgetBlock-3').hidden = false;
      renderPreview(3);
      makeEditable(3);
    } else {
      state.widgets[3] = '';
      $('widgetBlock-3').hidden = true;
    }

    if (state.widget3) {
      state.widgets[4] = buildPathWidget(gaps);
      $('widgetBlock-4').hidden = false;
      renderPreview(4);
      makeEditable(4);
    } else {
      $('widgetBlock-4').hidden = true;
    }
  }

  // ── REGENERATE (fetches fresh AI wording) ───────────────────
  WIDGET_IDS.forEach(i => {
    document.querySelector(`.widget-regen[data-widget="${i}"]`).addEventListener('click', () => onRegenOne(i));
    document.querySelector(`.widget-copy[data-widget="${i}"]`).addEventListener('click', () => onCopy(i));
  });

  async function onRegenOne(i) {
    const gaps = classifyGaps();
    const score = calculateScore(state.controls);
    const band  = scoreBand(score);

    if (i === 2) { state.widgets[2] = buildScoreWidget(); renderPreview(2); autoSave(); return; }

    const btn = document.querySelector(`.widget-regen[data-widget="${i}"]`);
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = '…';
    try {
      const copy = await safeFetchAiCopy(gaps, i === 4 ? true : state.widget3, score, band.label);
      if (i === 1) state.aiCopy.coverLetter = copy.coverLetter;
      if (i === 3) state.aiCopy.gapExplanations = copy.gapExplanations;
      if (i === 4) { state.aiCopy.pathItems = copy.pathItems; state.aiCopy.pathClosing = copy.pathClosing; }
      renderAllWidgets(gaps);
      autoSave();
      showToast('Regenerated.');
    } finally {
      btn.disabled = false; btn.textContent = label;
    }
  }

  regenAllBtn.addEventListener('click', async () => {
    const gaps = classifyGaps();
    const score = calculateScore(state.controls);
    const band  = scoreBand(score);
    const label = regenAllBtn.textContent;
    regenAllBtn.disabled = true; regenAllBtn.textContent = 'Regenerating…';
    try {
      const copy = await safeFetchAiCopy(gaps, state.widget3, score, band.label);
      state.aiCopy.coverLetter = copy.coverLetter;
      state.aiCopy.gapExplanations = copy.gapExplanations;
      if (state.widget3) { state.aiCopy.pathItems = copy.pathItems; state.aiCopy.pathClosing = copy.pathClosing; }
      renderAllWidgets(gaps);
      autoSave();
      showToast('Copy regenerated.');
    } finally {
      regenAllBtn.disabled = false; regenAllBtn.textContent = label;
    }
  });

  function onCopy(i) {
    const btn = document.querySelector(`.widget-copy[data-widget="${i}"]`);
    navigator.clipboard.writeText(state.widgets[i] || '').then(() => {
      btn.textContent = 'Copied ✓';
      setTimeout(() => btn.textContent = 'Copy HTML', 2000);
    });
  }

  copyAllBtn.addEventListener('click', () => {
    const active = WIDGET_IDS.filter(i => !$(`widgetBlock-${i}`).hidden);
    const all = active.map(i => state.widgets[i] || '').join('\n\n');
    navigator.clipboard.writeText(all).then(() => {
      copyAllBtn.textContent = 'Copied ✓';
      setTimeout(() => copyAllBtn.textContent = 'Copy all HTML', 2000);
    });
  });

  // ── PUSH TO SALESBUILDR ──────────────────────────────────────
  function activeWidgetList() {
    const labels = { 1: 'Cover Letter', 2: 'Readiness Score', 3: 'Gap Analysis', 4: 'Path to Readiness' };
    return WIDGET_IDS
      .filter(i => !$(`widgetBlock-${i}`).hidden && state.widgets[i])
      .map(i => ({ id: i, title: `${state.client.name} — Cyber Insurance — ${labels[i]}`, html: state.widgets[i] }));
  }
  async function onPush(type) {
    const apiKey    = localStorage.getItem('sb_api_key');
    const tenantUrl = localStorage.getItem('sb_tenant_url');
    if (!apiKey || !tenantUrl) {
      credsInline.hidden = false;
      credsInline.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    await executePush(type, apiKey, tenantUrl);
  }
  saveAndPushBtn.addEventListener('click', async () => {
    const apiKey    = pushApiKey.value.trim();
    const tenantUrl = pushTenantUrl.value.trim();
    if (!apiKey || !tenantUrl) { showPushStatus('Enter API key and tenant URL.', 'err'); return; }
    localStorage.setItem('sb_api_key', apiKey);
    localStorage.setItem('sb_tenant_url', tenantUrl);
    credsInline.hidden = true;
    await executePush('individual', apiKey, tenantUrl);
  });
  async function executePush(type, apiKey, tenantUrl) {
    const widgets = activeWidgetList();
    const prefix  = `${state.client.name} — Cyber Insurance`;
    const body = type === 'pack'
      ? { widgets: [{ id: 'pack', title: `${prefix} — Pack`, html: widgets.map(w => w.html).join('\n\n') }], prefix, apiKey, tenantUrl }
      : { widgets, prefix, apiKey, tenantUrl };

    const pLbl = pushPackBtn.textContent, iLbl = pushIndividualBtn.textContent;
    pushPackBtn.disabled = pushIndividualBtn.disabled = true;
    pushPackBtn.textContent = pushIndividualBtn.textContent = 'Pushing…';

    try {
      const res  = await fetch('/api/push-widgets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.ok || data.successCount > 0) {
        showPushStatus(`Pushed successfully${data.successCount ? ` (${data.successCount} widget${data.successCount > 1 ? 's' : ''})` : ''}.`, 'ok');
        autoSave('pushed');
      } else {
        showPushStatus('Push failed: ' + (data.error || 'Unknown error'), 'err');
      }
    } catch (e) {
      showPushStatus('Push failed: ' + e.message, 'err');
    } finally {
      pushPackBtn.disabled = pushIndividualBtn.disabled = false;
      pushPackBtn.textContent = pLbl; pushIndividualBtn.textContent = iLbl;
    }
  }
  function showPushStatus(msg, type) {
    pushStatus.textContent = msg;
    pushStatus.className = 'push-status ' + type;
    pushStatus.hidden = false;
    if (type === 'err') setTimeout(() => { pushStatus.hidden = true; }, 8000);
  }
  pushIndividualBtn.addEventListener('click', () => onPush('individual'));
  pushPackBtn.addEventListener('click', () => onPush('pack'));

  // ── TOAST ────────────────────────────────────────────────────
  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toast.hidden = true; }, 3200);
  }

  // ── INIT ─────────────────────────────────────────────────────
  // Migrates data from this tool's two earlier, now-retired storage formats
  // (a single-slot key, then a short-lived id-map + active-pointer design)
  // into the array-based format shared with the rest of the tool suite.
  // Runs once — if SESSION_KEY_LIST already has data, this is a no-op.
  function migrateLegacyIfNeeded() {
    if (getSessions().length) return;
    let migrated = [];

    try {
      const v2Map = JSON.parse(localStorage.getItem('cyber_insurance_sessions_v2') || '{}');
      const ids = Object.keys(v2Map);
      if (ids.length) {
        migrated = ids.map(id => {
          const rec = v2Map[id];
          const hasWidgets = rec.state && rec.state.widgets && Object.keys(rec.state.widgets).length;
          return {
            id: rec.id || id,
            clientName: rec.clientName || (rec.state && rec.state.client && rec.state.client.name) || 'Untitled',
            savedAt: rec.updatedAt || Date.now(),
            status: hasWidgets ? 'generated' : 'draft',
            state: rec.state
          };
        }).sort((a, b) => b.savedAt - a.savedAt).slice(0, 20);
      }
    } catch (e) { /* nothing usable to migrate from v2 */ }

    if (!migrated.length) {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
          const legacy = JSON.parse(raw);
          if (legacy && legacy.client) {
            const hasWidgets = legacy.widgets && Object.keys(legacy.widgets).length;
            migrated = [{
              id: 'cyber_session_' + Date.now(),
              clientName: legacy.client.name || 'Untitled',
              savedAt: Date.now(),
              status: hasWidgets ? 'generated' : 'draft',
              state: legacy
            }];
          }
        }
      } catch (e) { /* nothing usable to migrate from the original single-slot key */ }
    }

    if (migrated.length) saveSessions(migrated);
  }

  function init() {
    const savedUrl = localStorage.getItem('sb_tenant_url');
    const savedKey = localStorage.getItem('sb_api_key');
    if (savedUrl) pushTenantUrl.value = savedUrl;
    if (savedKey) pushApiKey.value    = savedKey;

    migrateLegacyIfNeeded();
    const sessions = getSessions();
    if (sessions.length) {
      resumeSession(sessions[0]); // most recently saved session, auto-resumed
    } else {
      renderChecklist();
      refresh();
    }
    renderSessionCards(false);
    autoSaveReady = true;
  }
  init();
})();
