/* ============================================================
   CYBER INSURANCE READINESS WIDGET — cyber-insurance.js
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

  const STATUS_LABEL = { inPlace: 'In place', partial: 'Partial', notInPlace: 'Not in place', unknown: 'Unknown' };
  const STATUS_ORDER  = ['inPlace', 'partial', 'notInPlace', 'unknown'];
  const SESSION_KEY   = 'cyber_insurance_session';

  // ── STATE ────────────────────────────────────────────────────
  let state = {
    client:  { name: '', industry: '' },
    controls: CONTROLS_DEF.map(c => ({ id: c.id, status: 'unknown', notes: '' })),
    theme:   { color: '#2e74dc' },
    widget3: false,
    widgets: {}
  };
  let lastGaps = [];

  // ── DOM REFS ─────────────────────────────────────────────────
  const stepBtns   = document.querySelectorAll('.step-btn');
  const stepPanels = document.querySelectorAll('.step-panel');

  const clientNameEl     = $('clientName');
  const clientIndustryEl = $('clientIndustry');
  const checklistRows    = $('checklistRows');
  const completionCount  = $('completionCount');

  const scoreNumber    = $('scoreNumber');
  const scoreLabel     = $('scoreLabel');
  const scoreMarker    = $('scoreMarker');
  const scoreBreakdown = $('scoreBreakdown');
  const gapCritical    = $('gapCritical');
  const gapRecommended = $('gapRecommended');
  const gapUnknown     = $('gapUnknown');

  const step1Next = $('step1Next');
  const step2Back = $('step2Back');
  const step3Back = $('step3Back');

  const downloadTechBtn = $('downloadTechBtn');
  const importTechBtn   = $('importTechBtn');
  const importXlsxFile  = $('importXlsxFile');

  const colourSwatches = $('colourSwatches');
  const customHex      = $('customHex');
  const hexPreview     = $('hexPreview');
  const themePreviewHeader = $('themePreviewHeader');
  const themePreviewName   = $('themePreviewName');
  const widget3Toggle  = $('widget3Toggle');

  const generateBtn    = $('generateBtn');
  const formError      = $('formError');
  const loadingOverlay = $('loadingOverlay');
  const loadingMsg     = $('loadingMsg');
  const widgetsOutput  = $('widgetsOutput');
  const deliveryTitle  = $('deliveryTitle');

  const regenAllBtn       = $('regenAllBtn');
  const copyAllBtn        = $('copyAllBtn');
  const pushIndividualBtn = $('pushIndividualBtn');
  const pushPackBtn       = $('pushPackBtn');
  const pushStatus        = $('pushStatus');
  const credsInline       = $('credsInline');
  const pushApiKey        = $('pushApiKey');
  const pushTenantUrl     = $('pushTenantUrl');
  const saveAndPushBtn    = $('saveAndPushBtn');

  const saveSessionBtn   = $('saveSessionBtn');
  const loadSessionBtn   = $('loadSessionBtn');
  const newSessionBtn    = $('newSessionBtn');
  const importSessionFile = $('importSessionFile');
  const sessionIndicator = $('sessionIndicator');

  const toast = $('toast');

  const WIDGET_IDS = [1, 2, 3];

  // ── STEP NAV ─────────────────────────────────────────────────
  function goToStep(n) {
    stepBtns.forEach(b => b.classList.toggle('active', Number(b.dataset.step) === n));
    stepPanels.forEach(p => p.classList.toggle('active', p.id === `panel-${n}`));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  stepBtns.forEach(b => b.addEventListener('click', () => goToStep(Number(b.dataset.step))));
  step1Next.addEventListener('click', () => goToStep(2));
  step2Back.addEventListener('click', () => goToStep(1));
  step3Back.addEventListener('click', () => goToStep(2));

  // ── CHECKLIST RENDER ─────────────────────────────────────────
  function renderChecklist() {
    checklistRows.innerHTML = '';
    CONTROLS_DEF.forEach(def => {
      const c = state.controls.find(x => x.id === def.id);
      const row = document.createElement('div');
      row.className = 'checklist-row';
      row.innerHTML = `
        <div class="checklist-row-info">
          <div class="checklist-row-name">${def.name}</div>
          <div class="checklist-row-desc">${esc(def.desc)}</div>
          <textarea class="checklist-row-notes" data-id="${def.id}" placeholder="Optional notes&hellip;">${esc(c.notes)}</textarea>
        </div>
        <div class="segmented" data-id="${def.id}">
          <button data-val="inPlace"    class="${c.status === 'inPlace'    ? 'selected' : ''}">In place</button>
          <button data-val="partial"    class="${c.status === 'partial'    ? 'selected' : ''}">Partial</button>
          <button data-val="notInPlace" class="${c.status === 'notInPlace' ? 'selected' : ''}">Not in place</button>
          <button data-val="unknown"    class="${c.status === 'unknown'    ? 'selected' : ''}">Unknown</button>
        </div>
      `;
      checklistRows.appendChild(row);
    });

    checklistRows.querySelectorAll('.segmented button').forEach(btn => {
      btn.addEventListener('click', () => {
        const id  = Number(btn.parentElement.dataset.id);
        const val = btn.dataset.val;
        const c   = state.controls.find(x => x.id === id);
        c.status  = val;
        btn.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('selected', b === btn));
        refresh();
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

    scoreBreakdown.innerHTML = state.controls.map(c => {
      const def = CONTROLS_DEF.find(d => d.id === c.id);
      return `<div class="score-breakdown-row"><span>${esc(def.name)}</span><strong>${STATUS_LABEL[c.status]}</strong></div>`;
    }).join('');

    const answered = state.controls.filter(c => c.status !== 'unknown' || false).length;
    // "assessed" = anything the rep has actively set away from default unknown is still counted per spec as unknown counts too;
    // count controls that have an explicit non-empty status (all do) — show total marked (not unknown) for signal
    const assessedCount = state.controls.filter(c => c.status !== 'unknown').length;
    completionCount.textContent = assessedCount;
  }

  // ── GAP CLASSIFICATION ───────────────────────────────────────
  const CRITICAL_KEYS = ['mfa', 'edr', 'backup', 'email', 'irplan'];

  function classifyGaps() {
    const gaps = [];
    state.controls.forEach(c => {
      if (c.status === 'inPlace') return;
      const def = CONTROLS_DEF.find(d => d.id === c.id);
      let severity;
      if (c.status === 'unknown') {
        severity = 'unknown';
      } else if (c.status === 'notInPlace' && CRITICAL_KEYS.includes(def.key)) {
        severity = 'critical';
      } else {
        severity = 'recommended';
      }
      gaps.push({ id: def.id, key: def.key, control: def.name, status: c.status, severity, notes: c.notes });
    });
    const order = { critical: 0, recommended: 1, unknown: 2 };
    gaps.sort((a, b) => order[a.severity] - order[b.severity]);
    return gaps;
  }

  function updateGapSummary() {
    const gaps = classifyGaps();
    lastGaps = gaps;
    gapCritical.textContent    = gaps.filter(g => g.severity === 'critical').length;
    gapRecommended.textContent = gaps.filter(g => g.severity === 'recommended').length;
    gapUnknown.textContent     = gaps.filter(g => g.severity === 'unknown').length;
  }

  function refresh() {
    updateScore();
    updateGapSummary();
  }

  // ── THEME ────────────────────────────────────────────────────
  function applyThemePreview() {
    themePreviewHeader.style.background = `linear-gradient(120deg, #0f172a, ${state.theme.color})`;
    themePreviewName.textContent = state.client.name || 'Client Name';
  }

  colourSwatches.querySelectorAll('.swatch').forEach(s => {
    s.addEventListener('click', () => {
      colourSwatches.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
      s.classList.add('active');
      state.theme.color = s.dataset.hex;
      customHex.value = '';
      hexPreview.style.background = 'transparent';
      applyThemePreview();
      autoSave();
    });
  });
  customHex.addEventListener('input', () => {
    const v = customHex.value.trim();
    if (/^[0-9A-Fa-f]{6}$/.test(v)) {
      state.theme.color = '#' + v;
      hexPreview.style.background = state.theme.color;
      colourSwatches.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
      applyThemePreview();
      autoSave();
    }
  });
  widget3Toggle.addEventListener('change', () => {
    state.widget3 = widget3Toggle.checked;
    autoSave();
  });

  clientNameEl.addEventListener('input', () => { state.client.name = clientNameEl.value; applyThemePreview(); autoSave(); });
  clientIndustryEl.addEventListener('change', () => { state.client.industry = clientIndustryEl.value; autoSave(); });

  // ── EXCEL EXPORT (security.js pattern) ──────────────────────
  downloadTechBtn.addEventListener('click', () => {
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
      ['2. For each control, select the CURRENT STATUS from the dropdown:'],
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
    assessSheet['!dataValidation'] = assessSheet['!dataValidation'] || [];
    assessSheet['!dataValidation'].push({
      type: 'list',
      sqref: `E2:E${CONTROLS_DEF.length + 1}`,
      formula1: '"In Place,Partial,Not In Place,Unknown"',
      showDropDown: false,
      showErrorMessage: true,
      errorTitle: 'Invalid value',
      error: 'Please select: In Place, Partial, Not In Place, or Unknown'
    });
    XLSX.utils.book_append_sheet(wb, assessSheet, 'Assessment');

    const defaultName = `${state.client.name || 'Client'} — Cyber Insurance Assessment`;
    const userLabel = window.prompt('Name this spreadsheet file:', defaultName);
    if (userLabel === null) return;
    const safeName = (userLabel.trim() || defaultName).replace(/[^a-z0-9 _\-–—]/gi, '').trim().replace(/\s+/g, '-');
    XLSX.writeFile(wb, `${safeName}.xlsx`);
    showToast('Spreadsheet downloaded — send to tech or client contact for completion.');
  });

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

  // ── EXCEL IMPORT (security.js pattern) ──────────────────────
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
        dataRows.slice(0, CONTROLS_DEF.length).forEach((row, idx) => {
          if (!String(row[4] || '').trim()) blanks.push(idx + 1);
        });
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
        autoSave();
        showToast(`✓ Imported ${updated} controls from spreadsheet.`);
        goToStep(1);
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

  // ── SESSION SAVE / LOAD (localStorage) ──────────────────────
  function autoSave() {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(state));
      flashSaved();
    } catch (e) { console.warn('Session save failed:', e); }
  }

  function flashSaved() {
    sessionIndicator.hidden = false;
    sessionIndicator.textContent = `Session saved · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  function loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      restoreState(saved);
      return true;
    } catch (e) { return false; }
  }

  function restoreState(saved) {
    state.client   = saved.client   || { name: '', industry: '' };
    state.controls = saved.controls || CONTROLS_DEF.map(c => ({ id: c.id, status: 'unknown', notes: '' }));
    state.theme    = saved.theme    || { color: '#2e74dc' };
    state.widget3  = !!saved.widget3;
    state.widgets  = saved.widgets  || {};

    clientNameEl.value = state.client.name || '';
    clientIndustryEl.value = state.client.industry || '';
    renderChecklist();
    refresh();

    colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.toggle('active', s.dataset.hex === state.theme.color));
    const matched = [...colourSwatches.querySelectorAll('.swatch')].some(s => s.dataset.hex === state.theme.color);
    if (!matched) { customHex.value = state.theme.color.replace('#', ''); hexPreview.style.background = state.theme.color; }
    applyThemePreview();

    widget3Toggle.checked = state.widget3;
    $('widgetBlock-3').hidden = !state.widget3;

    if (Object.keys(state.widgets).length) {
      WIDGET_IDS.forEach(i => {
        if (state.widgets[i]) { $(`widget${i}Editor`).value = state.widgets[i]; renderPreview(i); }
      });
      deliveryTitle.textContent = `${state.client.name || ''} — Cyber Insurance Widgets`;
    }
  }

  saveSessionBtn.addEventListener('click', () => { autoSave(); showToast('Session saved.'); });
  loadSessionBtn.addEventListener('click', () => {
    if (loadFromLocalStorage()) showToast('Session loaded.');
    else showToast('No saved session found on this device.');
  });
  newSessionBtn.addEventListener('click', () => {
    if (!confirm('Start a new assessment? Unsaved changes will be lost.')) return;
    state = {
      client: { name: '', industry: '' },
      controls: CONTROLS_DEF.map(c => ({ id: c.id, status: 'unknown', notes: '' })),
      theme: { color: '#2e74dc' },
      widget3: false,
      widgets: {}
    };
    clientNameEl.value = ''; clientIndustryEl.value = '';
    renderChecklist(); refresh();
    colourSwatches.querySelectorAll('.swatch').forEach((s, i) => s.classList.toggle('active', i === 0));
    customHex.value = ''; hexPreview.style.background = 'transparent';
    applyThemePreview();
    widget3Toggle.checked = false;
    $('widgetBlock-3').hidden = true;
    WIDGET_IDS.forEach(i => { $(`widget${i}Editor`).value = ''; $(`preview${i}`).innerHTML = ''; });
    sessionIndicator.hidden = true;
    goToStep(1);
  });

  // Export/import full session as JSON (backup/restore across devices)
  const exportJsonBtn = document.createElement('button');
  // (kept simple: bundled into save button behaviour via prompt is out of scope here;
  //  JSON export/import wired through hidden file input for symmetry with security.js pattern)
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
        autoSave();
        showToast(`Session loaded: ${s.client.name || 'Untitled'}`);
        goToStep(1);
      } catch (err) {
        showToast('Could not read session file — is it a valid JSON export?');
      }
    };
    reader.readAsText(file);
  });

  // ── GENERATE WIDGETS ─────────────────────────────────────────
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
    lastGaps = gaps;

    goToStep(3);
    loadingOverlay.hidden = false;
    widgetsOutput.style.display = 'none';
    generateBtn.disabled = true;

    try {
      let aiCopy = { gapExplanations: [], pathToReadiness: { items: [], closing: '' } };
      if (gaps.length > 0) {
        loadingMsg.textContent = 'Generating your readiness widgets…';
        const res = await fetch('/api/cyber-insurance-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: state.client.name,
            industry: state.client.industry,
            gaps: gaps.map(g => ({ control: g.control, status: g.status, severity: g.severity })),
            includePathToReadiness: state.widget3
          })
        });
        const data = await res.json();
        if (data && data.ok) aiCopy = data;
      }

      state.widgets[1] = buildScoreWidget();
      state.widgets[2] = gaps.length ? buildGapWidget(gaps, aiCopy.gapExplanations || []) : '';
      $('widgetBlock-2').hidden = gaps.length === 0;

      $('widgetBlock-3').hidden = !state.widget3;
      if (state.widget3) {
        state.widgets[3] = buildPathWidget(gaps, aiCopy.pathToReadiness || { items: [], closing: '' });
      }

      WIDGET_IDS.forEach(i => {
        if (i === 3 && !state.widget3) return;
        if (i === 2 && !gaps.length) return;
        $(`widget${i}Editor`).value = state.widgets[i];
        renderPreview(i);
      });

      deliveryTitle.textContent = `${state.client.name} — Cyber Insurance Widgets`;
      autoSave();
    } catch (e) {
      formError.textContent = 'Something went wrong generating widgets: ' + e.message;
      formError.hidden = false;
    } finally {
      loadingOverlay.hidden = true;
      widgetsOutput.style.display = 'block';
      generateBtn.disabled = false;
    }
  }

  // ── WIDGET BUILDERS (TinyMCE-safe inline HTML) ──────────────
  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  const HEX = {
    accent: '#2e74dc', dark: '#1e5bb8', gradStart: '#0f172a',
    text: '#0b1220', secondary: '#586273', muted: '#9ca3af',
    bg: '#fbfcfe', panel: '#ffffff', soft: '#f4f7fb', border: '#e3e7ee',
    successBg: '#dcfce7', successText: '#15a05a',
    warnBg: '#fef3c7', warnText: '#b3760a',
    dangerBg: '#fee2e2', dangerText: '#d8402e',
    unkBg: '#f4f7fb', unkText: '#9ca3af'
  };

  function statusPill(status) {
    const conf = {
      inPlace:    { bg: HEX.successBg, text: HEX.successText, label: 'In Place' },
      partial:    { bg: HEX.warnBg,    text: HEX.warnText,    label: 'Partial' },
      notInPlace: { bg: HEX.dangerBg,  text: HEX.dangerText,  label: 'Not in Place' },
      unknown:    { bg: HEX.unkBg,     text: HEX.unkText,     label: 'Unknown' }
    }[status];
    return `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${conf.bg};color:${conf.text};font-family:Source Sans Pro,Arial,sans-serif;font-size:12px;font-weight:600;">${conf.label}</span>`;
  }

  function buildScoreWidget() {
    const score = calculateScore(state.controls);
    const band  = scoreBand(score);
    const theme = state.theme.color;
    const period = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const cells = CONTROLS_DEF.map(def => {
      const c = state.controls.find(x => x.id === def.id);
      return `<td width="50%" style="padding:12px 14px;border:1px solid ${HEX.border};background:${HEX.panel};">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-family:Source Sans Pro,Arial,sans-serif;font-size:13px;color:${HEX.text};font-weight:600;">${esc(def.name)}</td>
          <td align="right">${statusPill(c.status)}</td>
        </tr></table>
      </td>`;
    });
    let rows = '';
    for (let i = 0; i < cells.length; i += 2) {
      rows += `<tr>${cells[i]}${cells[i + 1] || `<td width="50%" style="background:${HEX.panel};border:1px solid ${HEX.border};"></td>`}</tr>`;
    }

    return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${HEX.panel};border:1px solid ${HEX.border};border-radius:10px;overflow:hidden;">
  <tr><td style="background:linear-gradient(120deg, ${HEX.gradStart}, ${theme});padding:26px 28px;">
    <h6 style="margin:0 0 6px 0;font-family:Source Sans Pro,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.06em;color:rgba(255,255,255,0.8);text-transform:uppercase;">Cyber Insurance Readiness</h6>
    <h5 style="margin:0 0 4px 0;font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:700;color:#ffffff;">${esc(state.client.name)}</h5>
    <div style="font-family:Source Sans Pro,Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.75);">Assessment &middot; ${period}</div>
  </td></tr>
  <tr><td style="padding:24px 28px 10px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="30%" style="vertical-align:middle;">
        <span style="font-family:Montserrat,Arial,sans-serif;font-size:40px;font-weight:800;color:${band.color};">${score.toFixed(1)}</span><span style="font-family:Source Sans Pro,Arial,sans-serif;font-size:16px;color:${HEX.muted};">/10</span>
      </td>
      <td width="70%" style="vertical-align:middle;">
        <div style="font-family:Source Sans Pro,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.04em;color:${HEX.muted};text-transform:uppercase;margin-bottom:6px;">Readiness Level</div>
        <div style="height:8px;border-radius:999px;background:linear-gradient(90deg,#15a05a,#b3760a,#ea580c,#d8402e);"></div>
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-family:Source Sans Pro,Arial,sans-serif;font-size:11px;color:#15a05a;">Low risk</td>
          <td align="center" style="font-family:Source Sans Pro,Arial,sans-serif;font-size:11px;color:${HEX.muted};">Medium</td>
          <td align="right" style="font-family:Source Sans Pro,Arial,sans-serif;font-size:11px;color:#d8402e;">High risk</td>
        </tr></table>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:6px 28px 26px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${rows}
    </table>
  </td></tr>
</table>`;
  }

  function buildGapWidget(gaps, explanations) {
    const explMap = {};
    (explanations || []).forEach(e => { explMap[e.control] = e.explanation; });

    const severityConf = {
      critical:    { icon: '⚠️', label: 'CRITICAL — MAY AFFECT COVERAGE',   color: HEX.dangerText, bg: HEX.dangerBg },
      recommended: { icon: '⚡', label: 'RECOMMENDED — MAY AFFECT PREMIUM', color: HEX.warnText,   bg: HEX.warnBg },
      unknown:     { icon: '❓', label: 'UNKNOWN — VERIFY BEFORE RENEWAL',  color: HEX.unkText,    bg: HEX.unkBg }
    };

    const rows = gaps.map(g => {
      const conf = severityConf[g.severity];
      const text = g.severity === 'unknown'
        ? "We haven't confirmed this yet — we recommend verifying before renewal."
        : (explMap[g.control] || defaultExplanation(g.key));
      const gapLabel = g.severity === 'unknown' ? `${g.control} status unknown`
        : g.status === 'partial' ? `${g.control} not fully deployed`
        : `No ${g.control}`;
      return `<tr><td style="padding:16px 20px;border-bottom:1px solid ${HEX.border};">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="36" style="vertical-align:top;">
            <span style="display:inline-block;width:26px;height:26px;line-height:26px;text-align:center;border-radius:6px;background:${conf.bg};font-size:13px;">${conf.icon}</span>
          </td>
          <td style="vertical-align:top;padding-left:12px;">
            <div style="font-family:Source Sans Pro,Arial,sans-serif;font-size:14px;font-weight:700;color:${HEX.text};margin-bottom:3px;">${esc(gapLabel)}</div>
            <div style="font-family:Source Sans Pro,Arial,sans-serif;font-size:13px;color:${HEX.secondary};line-height:1.5;margin-bottom:6px;">${esc(text)}</div>
            <div style="font-family:Source Sans Pro,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.03em;color:${conf.color};">${conf.label}</div>
          </td>
        </tr></table>
      </td></tr>`;
    }).join('');

    return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${HEX.panel};border:1px solid ${HEX.border};border-top:3px solid ${HEX.dangerText};border-radius:10px;overflow:hidden;">
  <tr><td style="padding:22px 20px 14px 20px;">
    <h6 style="margin:0 0 6px 0;font-family:Source Sans Pro,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.06em;color:${HEX.dangerText};text-transform:uppercase;">Critical gaps identified</h6>
    <h5 style="margin:0;font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:700;color:${HEX.text};">What needs to be addressed before renewal</h5>
  </td></tr>
  ${rows}
  <tr><td style="padding:14px 20px;background:${HEX.soft};">
    <div style="font-family:Source Sans Pro,Arial,sans-serif;font-size:12px;font-style:italic;color:${HEX.muted};">This assessment is based on information provided and does not constitute a formal insurance audit.</div>
  </td></tr>
</table>`;
  }

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

  function buildPathWidget(gaps, pathData) {
    const items = pathData.items || [];
    const itemMap = {};
    items.forEach(i => { itemMap[i.control] = i.description; });

    const rows = gaps.map(g => {
      const desc = itemMap[g.control] || defaultPathDescription(g.key);
      return `<tr><td style="padding:14px 20px;border-bottom:1px solid ${HEX.border};">
        <div style="font-family:Source Sans Pro,Arial,sans-serif;font-size:14px;font-weight:700;color:${HEX.text};margin-bottom:3px;">${esc(g.control)}</div>
        <div style="font-family:Source Sans Pro,Arial,sans-serif;font-size:13px;color:${HEX.secondary};line-height:1.5;">${esc(desc)}</div>
      </td></tr>`;
    }).join('');

    const closing = pathData.closing || 'Once these controls are in place, your environment will meet the requirements of most major cyber insurance underwriters.';

    return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${HEX.panel};border:1px solid ${HEX.border};border-top:3px solid ${state.theme.color};border-radius:10px;overflow:hidden;">
  <tr><td style="padding:22px 20px 14px 20px;">
    <h5 style="margin:0;font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:700;color:${HEX.text};">How We Close These Gaps</h5>
  </td></tr>
  ${rows}
  <tr><td style="padding:16px 20px;background:${HEX.soft};">
    <div style="font-family:Source Sans Pro,Arial,sans-serif;font-size:13px;color:${HEX.secondary};line-height:1.5;">${esc(closing)}</div>
  </td></tr>
</table>`;
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

  // ── PREVIEW / EDIT / REGEN / COPY ───────────────────────────
  function renderPreview(i) {
    const el = $(`preview${i}`);
    if (el) el.innerHTML = state.widgets[i] || '';
  }

  WIDGET_IDS.forEach(i => {
    const ed = $(`widget${i}Editor`);
    ed.addEventListener('input', function () {
      state.widgets[i] = this.value;
      renderPreview(i);
      autoSave();
    });
    document.querySelector(`.widget-regen[data-widget="${i}"]`).addEventListener('click', () => onRegen(i));
    document.querySelector(`.widget-copy[data-widget="${i}"]`).addEventListener('click', () => onCopy(i));
    document.querySelector(`.show-html-btn[data-widget="${i}"]`).addEventListener('click', () => onToggleHtml(i));
  });

  async function onRegen(i) {
    const btn = document.querySelector(`.widget-regen[data-widget="${i}"]`);
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = '…';
    try {
      if (i === 1) {
        state.widgets[1] = buildScoreWidget();
      } else {
        const gaps = classifyGaps();
        let aiCopy = {};
        if (gaps.length) {
          const res = await fetch('/api/cyber-insurance-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientName: state.client.name,
              industry: state.client.industry,
              gaps: gaps.map(g => ({ control: g.control, status: g.status, severity: g.severity })),
              includePathToReadiness: i === 3
            })
          });
          const data = await res.json();
          if (data && data.ok) aiCopy = data;
        }
        if (i === 2) state.widgets[2] = buildGapWidget(gaps, aiCopy.gapExplanations || []);
        if (i === 3) state.widgets[3] = buildPathWidget(gaps, aiCopy.pathToReadiness || {});
      }
      $(`widget${i}Editor`).value = state.widgets[i];
      renderPreview(i);
      autoSave();
    } catch (e) {
      showToast('Regeneration failed: ' + e.message);
    } finally {
      btn.disabled = false; btn.textContent = label;
    }
  }

  function onCopy(i) {
    const btn = document.querySelector(`.widget-copy[data-widget="${i}"]`);
    navigator.clipboard.writeText(state.widgets[i] || '').then(() => {
      btn.textContent = 'Copied ✓';
      setTimeout(() => btn.textContent = 'Copy HTML', 2000);
    });
  }

  function onToggleHtml(i) {
    const ed  = $(`widget${i}Editor`);
    const btn = document.querySelector(`.show-html-btn[data-widget="${i}"]`);
    const shown = ed.style.display === 'block';
    ed.style.display = shown ? 'none' : 'block';
    btn.textContent = shown ? 'Show HTML' : 'Hide HTML';
  }

  regenAllBtn.addEventListener('click', async () => {
    await onRegen(1);
    if (!$('widgetBlock-2').hidden) await onRegen(2);
    if (!$('widgetBlock-3').hidden) await onRegen(3);
  });

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
    const labels = { 1: 'Readiness Score', 2: 'Gap Analysis', 3: 'Path to Readiness' };
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
      const res  = await fetch('/api/push-widgets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.ok || data.successCount > 0) {
        showPushStatus(`Pushed successfully${data.successCount ? ` (${data.successCount} widget${data.successCount > 1 ? 's' : ''})` : ''}.`, 'ok');
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

  // ── TOAST ─────────────────────────────────────────────────────
  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toast.hidden = true; }, 3200);
  }

  // ── INIT ─────────────────────────────────────────────────────
  function init() {
    const savedUrl = localStorage.getItem('sb_tenant_url');
    const savedKey = localStorage.getItem('sb_api_key');
    if (savedUrl) pushTenantUrl.value = savedUrl;
    if (savedKey) pushApiKey.value    = savedKey;

    if (!loadFromLocalStorage()) {
      renderChecklist();
      refresh();
      applyThemePreview();
    }
    goToStep(1);
  }

  init();
})();
