/* =========================================================
   ROI Builder — roi-builder.js
   All calculations run client-side. No data is sent anywhere
   except when the MSP clicks "Save to Salesbuildr".
   ========================================================= */

const LS_API_KEY = 'sb_api_key';
const LS_INT_KEY = 'sb_int_key';

// ── Industry benchmarks ───────────────────────────────────
// Sources: IBM Cost of a Data Breach 2023, Ponemon Institute,
// Verizon DBIR 2023 — conservative estimates used throughout.
const BENCHMARKS = {
  generic:    { label: 'SMB',          breachCost: 108000, breachProb: 0.15, complianceFine: 0 },
  healthcare: { label: 'Healthcare',   breachCost: 350000, breachProb: 0.25, complianceFine: 100000 },
  legal:      { label: 'Legal',        breachCost: 150000, breachProb: 0.18, complianceFine:  50000 },
  finance:    { label: 'Finance',      breachCost: 200000, breachProb: 0.22, complianceFine:  75000 },
  retail:     { label: 'Retail',       breachCost: 100000, breachProb: 0.16, complianceFine: 0 },
  education:  { label: 'Education',    breachCost:  80000, breachProb: 0.18, complianceFine:  20000 },
};

// ── Helpers ───────────────────────────────────────────────
const $ = id => document.getElementById(id);
function fmt(n)  { return '$' + Math.round(n).toLocaleString('en-US'); }
function fmtK(n) { return n >= 1000 ? '$' + (n / 1000).toFixed(0) + 'k' : fmt(n); }
function num(id) { return parseFloat($(id)?.value) || 0; }
function str(id) { return ($(id)?.value || '').trim(); }
function esc(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function selectedServices() {
  return ['security','backup','helpdesk','compliance']
    .filter(s => $('svc-' + s)?.checked);
}
function isValidHex(v) { return /^#[0-9a-fA-F]{6}$/.test(v); }

// ── Colour picker sync ────────────────────────────────────
$('brandColorPicker').addEventListener('input', () => {
  const v = $('brandColorPicker').value;
  $('brandColorHex').value   = v.toUpperCase();
  $('colorPreview').style.background = v;
  updatePresets(v);
});
$('brandColorHex').addEventListener('input', () => {
  const raw = $('brandColorHex').value.trim();
  const v   = raw.startsWith('#') ? raw : '#' + raw;
  if (isValidHex(v)) { $('brandColorPicker').value = v; $('colorPreview').style.background = v; updatePresets(v); }
});
document.querySelectorAll('.color-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    const c = btn.dataset.color;
    $('brandColorPicker').value = c;
    $('brandColorHex').value    = c.toUpperCase();
    $('colorPreview').style.background = c;
    updatePresets(c);
  });
});
function updatePresets(color) {
  document.querySelectorAll('.color-preset').forEach(b => {
    b.classList.toggle('active', b.dataset.color === color);
  });
}
updatePresets('#2563eb');

// ── Investment summary live update ────────────────────────
['monthlyRecurring','oneTime'].forEach(id => {
  $(id).addEventListener('input', updateInvestmentSummary);
});
function updateInvestmentSummary() {
  const monthly  = num('monthlyRecurring');
  const oneTime  = num('oneTime');
  const annual   = monthly * 12;
  const summary  = $('investmentSummary');
  if (monthly <= 0) { summary.classList.add('hidden'); return; }
  summary.classList.remove('hidden');
  summary.innerHTML = `
    <div class="inv-item"><small>Monthly</small><br><strong>${fmt(monthly)}/mo</strong></div>
    <div class="inv-item"><small>Annual recurring</small><br><strong>${fmt(annual)}/yr</strong></div>
    ${oneTime > 0 ? `<div class="inv-item"><small>One-time</small><br><strong>${fmt(oneTime)}</strong></div>` : ''}
    <div class="inv-item"><small>Year 1 total</small><br><strong>${fmt(annual + oneTime)}</strong></div>`;
}

// ── ROI Calculation ───────────────────────────────────────
function calculate() {
  const monthly  = num('monthlyRecurring');
  const oneTime  = num('oneTime');
  const staff    = num('staffCount');
  const rate     = num('hourlyRate');
  const intppm   = num('interruptionsPerMonth');
  const hrsPer   = num('hoursPerInterruption');
  const curIT    = num('currentITSpend');
  const industry = str('industry') || 'generic';
  const services = selectedServices();
  const bench    = BENCHMARKS[industry] || BENCHMARKS.generic;

  const annualRecurring = monthly * 12;
  const annualInvestment = annualRecurring + oneTime; // Year 1 full cost

  const categories = [];

  // 1. Productivity Recovery — always included if data provided
  if (staff > 0 && intppm > 0 && hrsPer > 0 && rate > 0) {
    const reductionFactor = services.includes('helpdesk') ? 0.70 : 0.45;
    const hoursLostPerYear  = staff * intppm * hrsPer * 12;
    const hoursRecovered    = hoursLostPerYear * reductionFactor;
    const value             = hoursRecovered * rate;
    categories.push({
      key:   'productivity',
      icon:  '⏱',
      label: 'Staff Productivity Recovery',
      value,
      detail: `Your ${staff} staff lose an estimated ${Math.round(hoursLostPerYear).toLocaleString()} hours per year to IT interruptions. ${services.includes('helpdesk') ? 'Managed helpdesk and proactive monitoring reduce this by 70%' : 'Proactive IT management reduces this by 45%'}, recovering ${Math.round(hoursRecovered).toLocaleString()} hours of productive time annually.`
    });
  }

  // 2. Security Risk Reduction
  if (services.includes('security')) {
    const riskReduction = 0.60;
    const value = bench.breachProb * bench.breachCost * riskReduction;
    categories.push({
      key:   'security',
      icon:  '🛡',
      label: 'Security Risk Reduction',
      value,
      detail: `In the ${bench.label} sector, the average cost of a data breach is ${fmt(bench.breachCost)}, with an estimated ${Math.round(bench.breachProb * 100)}% annual probability for businesses your size. Managed security reduces breach risk by approximately 60%, representing a risk-adjusted annual value of ${fmt(value)}.`
    });
  }

  // 3. Downtime Avoidance
  if (services.includes('backup') && staff > 0 && rate > 0) {
    const outagesAvoided = 1;
    const outageHours    = 4;
    const value = outagesAvoided * outageHours * staff * rate;
    categories.push({
      key:   'downtime',
      icon:  '⚡',
      label: 'Downtime Avoidance',
      value,
      detail: `Managed backup and disaster recovery prevents an estimated ${outagesAvoided} significant outage per year. A single ${outageHours}-hour outage for your team of ${staff} represents ${fmt(value)} in lost productivity — before accounting for recovery costs, client impact, or reputational damage.`
    });
  }

  // 4. IT Support Cost Savings
  if (curIT > 0 && monthly > 0) {
    const annualCurrent = curIT * 12;
    const savings = annualCurrent - annualRecurring;
    if (savings > 0) {
      categories.push({
        key:   'itsupport',
        icon:  '💰',
        label: 'IT Support Cost Reduction',
        value: savings,
        detail: `Your current IT support spend of ${fmt(curIT)}/month (${fmt(annualCurrent)}/year) is replaced by managed services at ${fmt(monthly)}/month — a direct saving of ${fmt(savings)}/year while significantly expanding coverage, response times, and proactive capability.`
      });
    }
  }

  // 5. Compliance Risk (industry-specific)
  if (services.includes('compliance') && ['healthcare','legal','finance','education'].includes(industry) && bench.complianceFine > 0) {
    const value = bench.complianceFine * bench.breachProb * 0.70;
    categories.push({
      key:   'compliance',
      icon:  '📋',
      label: 'Regulatory Risk Reduction',
      value,
      detail: `In your industry, data protection non-compliance can result in penalties averaging ${fmt(bench.complianceFine)}. With your sector's ${Math.round(bench.breachProb * 100)}% annual incident probability, managed compliance support provides a risk-adjusted value of ${fmt(value)}/year.`
    });
  }

  const totalAnnualValue  = categories.reduce((s, c) => s + c.value, 0);
  const netAnnualValue    = totalAnnualValue - annualInvestment;
  const roiPct            = annualInvestment > 0 ? (netAnnualValue / annualInvestment) * 100 : 0;
  const breakEvenMonths   = totalAnnualValue > 0 ? Math.ceil((annualInvestment / totalAnnualValue) * 12) : 0;
  const threeYearNet      = (totalAnnualValue * 3) - (annualRecurring * 3) - oneTime;

  return {
    categories, totalAnnualValue, annualInvestment, annualRecurring, oneTime,
    netAnnualValue, roiPct, breakEvenMonths, threeYearNet
  };
}

// ── Widget HTML Generator ─────────────────────────────────
function buildWidget(result, inputs) {
  const { categories, totalAnnualValue, annualRecurring, oneTime, roiPct, breakEvenMonths, threeYearNet } = result;
  const { company, brandColor } = inputs;
  const companyLabel = company || '{{company.name}}';
  const textColor    = getContrastColor(brandColor);

  const categoryRows = categories.map(c => `
  <div style="border-left:4px solid ${esc(brandColor)};padding:0 0 0 18px;margin:0 0 22px 0;">
    <h3 style="font-size:15px;font-weight:700;color:${esc(brandColor)};margin:0 0 8px 0;font-family:'Segoe UI',Arial,sans-serif;">${c.icon} ${esc(c.label)}</h3>
    <div style="font-size:20px;font-weight:800;color:#0f1b2d;margin:0 0 8px 0;font-family:'Segoe UI',Arial,sans-serif;">${fmt(c.value)}<span style="font-size:13px;font-weight:400;color:#6b6758;"> / year</span></div>
    <p style="font-size:13px;color:#334155;line-height:1.65;margin:0;font-family:'Segoe UI',Arial,sans-serif;">${esc(c.detail)}</p>
  </div>`).join('\n');

  return `<div style="width:100%;padding:28px 32px 32px;background-color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">

  <h2 style="font-size:22px;font-weight:700;color:#0f1b2d;margin:0 0 6px 0;line-height:1.2;font-family:'Segoe UI',Arial,sans-serif;">The Business Case for Managed IT</h2>
  <p style="font-size:14px;color:#6b6758;margin:0 0 26px 0;font-family:'Segoe UI',Arial,sans-serif;">Prepared for ${esc(companyLabel)} · Based on your organization profile and industry benchmarks</p>

  <div style="background-color:#f8fafc;border:1px solid #e2e8f0;padding:16px 20px;margin:0 0 28px 0;display:inline-flex;gap:32px;flex-wrap:wrap;">
    <div><div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6b6758;font-family:'Segoe UI',Arial,sans-serif;">Annual Investment</div><div style="font-size:20px;font-weight:800;color:#0f1b2d;margin-top:4px;font-family:'Segoe UI',Arial,sans-serif;">${fmt(annualRecurring)}/yr${oneTime > 0 ? `<span style="font-size:13px;font-weight:400;color:#6b6758;"> + ${fmt(oneTime)} setup</span>` : ''}</div></div>
    <div><div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6b6758;font-family:'Segoe UI',Arial,sans-serif;">Total Annual Value</div><div style="font-size:20px;font-weight:800;color:#059669;margin-top:4px;font-family:'Segoe UI',Arial,sans-serif;">${fmt(totalAnnualValue)}/yr</div></div>
  </div>

  <h3 style="font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#6b6758;margin:0 0 20px 0;font-family:'Segoe UI',Arial,sans-serif;">Where You Recover Value</h3>

  ${categoryRows}

  <div style="background-color:${esc(brandColor)};padding:24px 28px;margin:28px 0 0 0;">
    <div style="display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:space-between;">
      <div style="text-align:center;min-width:80px;">
        <div style="font-size:36px;font-weight:900;color:${esc(textColor)};line-height:1;font-family:'Segoe UI',Arial,sans-serif;">${Math.round(roiPct)}%</div>
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${esc(textColor)};opacity:.85;margin-top:4px;font-family:'Segoe UI',Arial,sans-serif;">Annual ROI</div>
      </div>
      <div style="text-align:center;min-width:80px;">
        <div style="font-size:28px;font-weight:800;color:${esc(textColor)};line-height:1;font-family:'Segoe UI',Arial,sans-serif;">${breakEvenMonths} mo</div>
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${esc(textColor)};opacity:.85;margin-top:4px;font-family:'Segoe UI',Arial,sans-serif;">Break-Even</div>
      </div>
      <div style="text-align:center;min-width:80px;">
        <div style="font-size:28px;font-weight:800;color:${esc(textColor)};line-height:1;font-family:'Segoe UI',Arial,sans-serif;">${fmtK(threeYearNet)}</div>
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${esc(textColor)};opacity:.85;margin-top:4px;font-family:'Segoe UI',Arial,sans-serif;">3-Year Net Value</div>
      </div>
    </div>
  </div>

  <p style="margin:16px 0 0 0;font-size:11px;color:#94a3b8;line-height:1.5;font-family:'Segoe UI',Arial,sans-serif;">* ROI figures are estimates based on industry benchmarks (IBM Cost of a Data Breach 2023, Ponemon Institute, Verizon DBIR) and the information provided. Actual results will vary. These figures are intended as a guide to inform business decisions and are not a guarantee of outcome.</p>

</div>`.trim();
}

// Pick white or dark text based on background luminance
function getContrastColor(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#0f1b2d' : '#ffffff';
}

// ── Generate button ───────────────────────────────────────
$('generateBtn').addEventListener('click', () => {
  $('formError').classList.add('hidden');

  const monthly = num('monthlyRecurring');
  const staff   = num('staffCount');
  const rate    = num('hourlyRate');

  if (monthly <= 0) { showError('Please enter a monthly recurring investment.'); return; }
  if (staff <= 0)   { showError('Please enter the number of staff.'); return; }
  if (rate <= 0)    { showError('Please enter an average hourly rate.'); return; }

  const result = calculate();

  if (result.categories.length === 0) {
    showError('No value categories could be calculated. Try adding interruption data or selecting more services.');
    return;
  }

  // Warn on negative ROI — don't block but make it very clear
  if (result.roiPct < 0) {
    showError(`⚠️ These figures produce a negative ROI (${Math.round(result.roiPct)}%). This widget is not ready to share with a customer. Try increasing the interruption frequency (typical unmanaged SMB: 3–4/month), the hourly rate, or reducing the investment figure — until the numbers tell a credible positive story.`);
    // Still generate so they can see where the gap is, but return after showing error
    // Continue to generate so they can diagnose the gap
  }

  const company    = str('companyName');
  const brandColor = isValidHex($('brandColorHex').value.trim())
    ? $('brandColorHex').value.trim()
    : '#2563eb';

  const html = buildWidget(result, { company, brandColor });

  // Update output view
  const title = company || 'ROI Analysis';
  $('outputTitle').textContent = title;

  // ROI tiles
  renderTiles(result);

  // Preview
  $('previewFrame').srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:#fff;}</style></head><body>${html}</body></html>`;
  $('htmlCode').value = html;

  // Tabs
  $('previewFrame').style.display = 'block';
  $('htmlCode').style.display     = 'none';
  document.querySelectorAll('.out-tab').forEach(t => t.classList.remove('is-active'));
  document.querySelector('[data-pane="preview"]').classList.add('is-active');

  // Show output, scroll to it
  $('form-view').hidden   = true;
  $('output-view').hidden = false;
  $('output-view').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Block push if ROI is negative — not ready to share
  const roiNegative = result.roiPct < 0;
  $('sbPushBtn').disabled = roiNegative || !($('sbApiKey').value.trim() && $('sbIntKey').value.trim());
  if (roiNegative) {
    $('sbBody').hidden = false;
    $('sbArrow').classList.add('open');
    $('sbResult').textContent = '⚠️ ROI is negative — adjust your inputs before saving to Salesbuildr.';
    $('sbResult').className   = 'sb-result error';
    $('sbResult').classList.remove('hidden');
  } else if (localStorage.getItem(LS_API_KEY) && localStorage.getItem(LS_INT_KEY)) {
    $('sbBody').hidden = false;
    $('sbArrow').classList.add('open');
    updatePushBtn();
  }
});

function renderTiles(result) {
  const { roiPct, breakEvenMonths, totalAnnualValue, threeYearNet } = result;
  $('roiTiles').innerHTML = `
    <div class="roi-tile highlight">
      <div class="roi-tile-label">Annual ROI</div>
      <div class="roi-tile-value">${Math.round(roiPct)}%</div>
      <div class="roi-tile-sub">on managed IT investment</div>
    </div>
    <div class="roi-tile">
      <div class="roi-tile-label">Break-Even</div>
      <div class="roi-tile-value">${breakEvenMonths} mo</div>
      <div class="roi-tile-sub">to recover full investment</div>
    </div>
    <div class="roi-tile">
      <div class="roi-tile-label">Annual Value</div>
      <div class="roi-tile-value">${fmtK(totalAnnualValue)}</div>
      <div class="roi-tile-sub">total estimated savings</div>
    </div>
    <div class="roi-tile">
      <div class="roi-tile-label">3-Year Net</div>
      <div class="roi-tile-value">${fmtK(threeYearNet)}</div>
      <div class="roi-tile-sub">value after investment</div>
    </div>`;
}

function showError(msg) {
  const el = $('formError');
  el.textContent = msg;
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

// ── Tab switching ─────────────────────────────────────────
document.querySelectorAll('.out-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.out-tab').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const pane = btn.dataset.pane;
    $('previewFrame').style.display = pane === 'preview' ? 'block' : 'none';
    $('htmlCode').style.display     = pane === 'code'    ? 'block' : 'none';
  });
});

// ── Copy ──────────────────────────────────────────────────
$('copyBtn').addEventListener('click', async () => {
  const html = $('htmlCode').value;
  try { await navigator.clipboard.writeText(html); }
  catch { const ta=document.createElement('textarea'); ta.value=html; ta.style.cssText='position:fixed;opacity:0;'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
  const orig = $('copyBtn').textContent;
  $('copyBtn').textContent = '✓ Copied!';
  setTimeout(() => $('copyBtn').textContent = orig, 2000);
});

// ── Restart ───────────────────────────────────────────────
$('restartBtn').addEventListener('click', () => {
  $('form-view').hidden   = false;
  $('output-view').hidden = true;
  $('sbResult').classList.add('hidden');
  $('sbPushBtn').textContent = 'Save to Salesbuildr →';
  $('sbPushBtn').classList.remove('is-done');
  window.scrollTo({ top:0, behavior:'smooth' });
});

// ── Salesbuildr connect ───────────────────────────────────
function initSbCredentials() {
  const a = localStorage.getItem(LS_API_KEY);
  const i = localStorage.getItem(LS_INT_KEY);
  if (a) $('sbApiKey').value = a;
  if (i) $('sbIntKey').value = i;
  if (a && i) $('sbRemember').checked = true;
  updatePushBtn();
}
function updatePushBtn() {
  $('sbPushBtn').disabled = !($('sbApiKey').value.trim() && $('sbIntKey').value.trim());
}
$('sbToggle').addEventListener('click', () => {
  const open = !$('sbBody').hidden;
  $('sbBody').hidden = open;
  $('sbArrow').classList.toggle('open', !open);
});
$('sbApiKey').addEventListener('input', updatePushBtn);
$('sbIntKey').addEventListener('input', updatePushBtn);

$('sbPushBtn').addEventListener('click', async () => {
  const apiKey = $('sbApiKey').value.trim();
  const intKey = $('sbIntKey').value.trim();
  if (!apiKey || !intKey) return;

  if ($('sbRemember').checked) { localStorage.setItem(LS_API_KEY, apiKey); localStorage.setItem(LS_INT_KEY, intKey); }
  else { localStorage.removeItem(LS_API_KEY); localStorage.removeItem(LS_INT_KEY); }

  $('sbPushBtn').disabled    = true;
  $('sbPushBtn').textContent = 'Saving…';
  $('sbResult').classList.add('hidden');

  const company = str('companyName') || 'ROI Analysis';
  const prefix  = $('sbPrefix').value.trim();
  const html    = $('htmlCode').value;
  const title   = company + ' — ROI Case';

  try {
    const res  = await fetch('/api/push-widgets', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ widgets:[{ id:'roi', title, html }], prefix, apiKey, integrationKey:intKey })
    });
    const data = await res.json();
    if (data.successCount > 0) {
      $('sbResult').textContent   = `✓ ROI widget saved to your Salesbuildr library — ready to drag into any quote.`;
      $('sbResult').className     = 'sb-result ok';
      $('sbPushBtn').textContent  = '✓ Saved';
      $('sbPushBtn').classList.add('is-done');
    } else {
      throw new Error(data.results?.[0]?.error || data.error || 'Unknown error');
    }
  } catch (e) {
    $('sbResult').textContent = `✕ ${e.message}`;
    $('sbResult').className   = 'sb-result error';
    $('sbPushBtn').disabled    = false;
    $('sbPushBtn').textContent = 'Save to Salesbuildr →';
  }
  $('sbResult').classList.remove('hidden');
});

// ── URL context (from Sales Guide) ───────────────────────
function applyUrlContext() {
  const params = new URLSearchParams(window.location.search);
  const from   = params.get('from');
  if (from !== 'guide') return; // only apply when launched from Sales Guide

  // Industry — match param value to closest <select> option
  const industryParam = (params.get('industry') || '').toLowerCase();
  if (industryParam) {
    const industryMap = {
      healthcare: 'healthcare',
      medical: 'healthcare',
      legal: 'legal',
      law: 'legal',
      finance: 'finance',
      financial: 'finance',
      accounting: 'finance',
      retail: 'retail',
      education: 'education',
      school: 'education',
    };
    const mapped = industryMap[industryParam];
    if (mapped && $('industry')) {
      $('industry').value = mapped;
    }
  }

  // Staff count
  const staffParam = params.get('staff');
  if (staffParam && $('staffCount')) {
    const n = parseInt(staffParam, 10);
    if (!isNaN(n) && n > 0) $('staffCount').value = n;
  }

  // Services — comma-separated list e.g. security,backup,helpdesk,compliance
  const servicesParam = params.get('services');
  if (servicesParam) {
    const incoming = servicesParam.split(',').map(s => s.trim().toLowerCase());
    // Map common variants to our checkbox IDs
    const svcMap = {
      security: 'security',
      'managed security': 'security',
      backup: 'backup',
      'backup & dr': 'backup',
      'backup and disaster recovery': 'backup',
      helpdesk: 'helpdesk',
      'managed helpdesk': 'helpdesk',
      'help desk': 'helpdesk',
      compliance: 'compliance',
    };
    ['security','backup','helpdesk','compliance'].forEach(svc => {
      const el = $('svc-' + svc);
      if (!el) return;
      // Check if any incoming token maps to this service
      const matched = incoming.some(tok => {
        const mapped = svcMap[tok];
        return mapped === svc || tok === svc || tok.includes(svc);
      });
      if (matched) el.checked = true;
    });
  }

  // Show a subtle banner so the rep knows context was applied
  if (industryParam || staffParam || servicesParam) {
    const banner = document.createElement('div');
    banner.className = 'guide-context-banner';
    banner.innerHTML = '↩ Context pre-filled from Sales Guide — review and adjust before calculating.';
    const firstSection = document.querySelector('.section');
    if (firstSection) firstSection.insertAdjacentElement('beforebegin', banner);

    // Re-trigger investment summary in case monthly was pre-filled
    updateInvestmentSummary();
  }
}

// ── Init ──────────────────────────────────────────────────
initSbCredentials();
applyUrlContext();
