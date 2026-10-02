/* =============================================
   Template Builder — Frontend JS
   template-builder.js
   ============================================= */
(function () {
  'use strict';

  // ── Config ────────────────────────────────────
  // TODO: point this at the repo that hosts the engagement images.
  const IMAGE_BASE = 'https://raw.githubusercontent.com/YOUR-ORG/YOUR-REPO/main/images/';

  const STATE_KEY = 'tb_state';
  const MODE_KEY  = 'tb_delivery_mode';
  const CONCURRENCY = 3;

  const ENGAGEMENTS = [
    { key: 'managed-it',      name: 'Managed IT Services — New Client',    image: 'engagement-managed-it.jpg',       desc: 'Taking over day-to-day IT: helpdesk, monitoring, patching and planning.' },
    { key: 'm365',            name: 'Microsoft 365 Licensing & Migration', image: 'engagement-m365.jpg',             desc: 'Moving mail and files to Microsoft 365 and rightsizing licences.' },
    { key: 'copilot-ai',      name: 'Microsoft Copilot / AI Rollout',      image: 'engagement-copilot-ai.jpg',       desc: 'Getting data, permissions and people ready for Copilot.' },
    { key: 'network',         name: 'Network Refresh',                     image: 'engagement-network.jpg',          desc: 'Replacing ageing switches, firewalls and Wi-Fi.' },
    { key: 'security',        name: 'Security Package',                    image: 'engagement-security.jpg',         desc: 'Layered protection: endpoint, email, MFA, training, monitoring.' },
    { key: 'backup-dr',       name: 'Backup & Disaster Recovery',          image: 'engagement-backup-dr.jpg',        desc: 'Tested backups and a recovery plan the business can rely on.' },
    { key: 'cyber-insurance', name: 'Cyber Insurance Readiness',           image: 'engagement-cyber-insurance.jpg',  desc: 'Meeting insurer security requirements to get or renew cover.' },
    { key: 'cloud',           name: 'Cloud Migration (Azure / Hybrid)',    image: 'engagement-cloud.jpg',            desc: 'Moving servers and workloads to Azure with minimal disruption.' },
    { key: 'hardware',        name: 'Hardware Refresh',                    image: 'engagement-hardware.jpg',         desc: 'Replacing end-of-life devices on a planned lifecycle.' },
    { key: 'voip',            name: 'VoIP / Phone System',                 image: 'engagement-voip.jpg',             desc: 'A modern cloud phone system with a smooth number port.' },
    { key: 'compliance',      name: 'Compliance Engagement',               image: 'engagement-compliance.jpg',       desc: 'Meeting a regulatory standard with documented controls.' }
  ];
  const CUSTOM_IMAGE = 'engagement-custom.jpg';

  // Order = order in the template
  const WIDGETS = [
    { key: 'banner',           code: '',   name: 'Banner Image',      ai: false, desc: 'Engagement hero image with your name and the engagement title.' },
    { key: 'coverLetter',      code: '',   name: 'Cover Letter',      ai: true,  desc: 'Personal opening letter, addressed to the client contact.' },
    { key: 'executiveSummary', code: '',   name: 'Executive Summary', ai: true,  desc: 'One-page snapshot with three outcomes for decision-makers.' },
    { key: 'w1',               code: 'W1', name: 'Their Situation',   ai: true,  desc: 'Shows you’ve listened — mirrors their reality back.' },
    { key: 'w2',               code: 'W2', name: 'Why Now',           ai: true,  desc: 'Creates urgency by framing the cost of inaction.' },
    { key: 'w3',               code: 'W3', name: 'What We Do',        ai: true,  desc: 'Positions you as the expert — outcomes, not features.' },
    { key: 'w4',               code: 'W4', name: 'Why Us',            ai: true,  desc: 'Differentiates on trust and track record, not price.' },
    { key: 'w5',               code: 'W5', name: 'Next Steps',        ai: true,  desc: 'Removes the last objection with a clear, easy next step.' }
  ];
  const WMAP = Object.fromEntries(WIDGETS.map(w => [w.key, w]));
  const HINTS = {
    w2: 'Check the statistic and its source before you send this.',
    w4: 'Add your real certifications, years in business and client results here.'
  };

  // ── State ─────────────────────────────────────
  const S = {
    mode: localStorage.getItem(MODE_KEY) || 'api',
    engagementKey: null,
    customName: '',
    customDescription: '',
    color: '#2E74DC',
    language: 'UK',
    mspName: '',
    selected: new Set(WIDGETS.map(w => w.key)),
    data: {},        // AI JSON per widget
    html: {},        // current (edited) HTML per widget
    status: {},      // idle | loading | ready | error
    errors: {},
    products: [],
    copied: new Set(),
    generatedLanguage: null,
    generating: false
  };

  // ── DOM ───────────────────────────────────────
  const $ = id => document.getElementById(id);
  const screenSelect = $('screenSelect');
  const screenBuild  = $('screenBuild');
  const previewList  = $('previewList');

  // ── Utils ─────────────────────────────────────
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
  function normHex(v) {
    let s = String(v || '').trim();
    if (!s.startsWith('#')) s = '#' + s;
    return /^#[0-9a-fA-F]{6}$/.test(s) ? s.toUpperCase() : null;
  }
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
  function lighten(hex, amt) {
    const [r, g, b] = hexToRgb(hex).map(c => Math.round(c + (255 - c) * amt));
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
  }
  function label(key) { const w = WMAP[key]; return w.code ? `${w.code} — ${w.name}` : w.name; }
  function currentEng() {
    if (S.engagementKey === 'custom') {
      return { key: 'custom', name: S.customName.trim() || 'Custom Engagement', image: CUSTOM_IMAGE, desc: S.customDescription };
    }
    return ENGAGEMENTS.find(e => e.key === S.engagementKey) || null;
  }
  function imageUrl(file) { return IMAGE_BASE + file; }
  function templateName() {
    const eng = currentEng();
    const msp = S.mspName.trim();
    return eng ? (msp ? `${eng.name} — ${msp}` : eng.name) : '';
  }
  function hasGenerated() { return Object.keys(S.html).length > 0; }
  function anyLoading() { return Object.values(S.status).includes('loading'); }
  function readyKeys() { return WIDGETS.map(w => w.key).filter(k => S.selected.has(k) && S.html[k]); }

  // ══ Widget HTML builders (TinyMCE-safe, inline styles, h5/h6 only) ══
  const FONT = 'Arial,Helvetica,sans-serif';

  function gradBg(hex) {
    return `radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px) 0 0 / 14px 14px, linear-gradient(135deg, #1a3a6e 0%, ${hex} 100%)`;
  }
  function shell(hex, inner) {
    return `<div data-accent-border="top" style="width:100%;max-width:100%;background:#ffffff;border:1px solid #e3e7ee;border-top:3px solid ${hex};border-radius:8px;overflow:hidden;font-family:${FONT};color:#0b1220;">${inner}</div>`;
  }
  function header(hex, kicker, title) {
    return `<div data-gradient-header style="background:${gradBg(hex)};padding:22px 24px 20px;">
<p style="margin:0 0 6px 0;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.72);">${kicker}</p>
<h5 style="margin:0;font-size:19px;font-weight:700;color:#ffffff;line-height:1.3;">${esc(title)}</h5>
</div>`;
  }
  function para(text, mb = 14) {
    return `<p style="margin:0 0 ${mb}px 0;font-size:14px;line-height:1.65;color:#586273;">${esc(text)}</p>`;
  }
  function sectionLabel(hex, text) {
    return `<h6 data-accent style="margin:0 0 10px 0;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${hex};">${text}</h6>`;
  }
  function accentRow(hex, title, detail) {
    return `<table width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 10px 0;"><tr><td data-accent-border="left" style="border-left:3px solid ${hex};background:#f4f7fb;padding:12px 16px;">
<p style="margin:0 0 3px 0;font-size:14px;font-weight:700;color:#0b1220;">${esc(title)}</p>
<p style="margin:0;font-size:13px;line-height:1.6;color:#586273;">${esc(detail)}</p>
</td></tr></table>`;
  }
  function numberedRow(hex, n, title, detail) {
    return `<table width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;"><tr>
<td width="48" valign="top" style="width:48px;padding:0 0 16px 0;vertical-align:top;"><div data-number-cell style="width:32px;height:32px;line-height:32px;border-radius:50%;background:${hex};color:#ffffff;text-align:center;font-size:14px;font-weight:700;">${n}</div></td>
<td valign="top" style="padding:5px 0 16px 0;vertical-align:top;">
<p style="margin:0 0 3px 0;font-size:14px;font-weight:700;color:#0b1220;">${esc(title)}</p>
<p style="margin:0;font-size:13px;line-height:1.6;color:#586273;">${esc(detail)}</p>
</td></tr></table>`;
  }
  function callout(hex, text) {
    return `<table width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;"><tr><td data-accent-bg data-accent-border="left" style="background:${rgba(hex, 0.08)};border-left:3px solid ${hex};padding:14px 18px;">
<p style="margin:0;font-size:14px;line-height:1.6;font-weight:700;color:#0b1220;">${esc(text)}</p>
</td></tr></table>`;
  }
  function footer(left, right) {
    return `<table width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#f4f7fb;border-top:1px solid #e3e7ee;"><tr>
<td style="padding:10px 24px;font-size:11px;color:#9ca3af;">${left}</td>
<td style="padding:10px 24px;font-size:11px;color:#9ca3af;text-align:right;">${right || ''}</td>
</tr></table>`;
  }
  const body = inner => `<div style="padding:22px 24px 10px;">${inner}</div>`;
  const arr = (a, n) => (Array.isArray(a) ? a : []).slice(0, n);

  const BUILD = {
    banner(_d, hex) {
      const eng = currentEng();
      const img = eng ? imageUrl(eng.image) : '';
      return `<div style="width:100%;max-width:100%;font-family:${FONT};">
<table width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0;padding:0;">
<tr><td style="padding:0;background-color:#0b1a33;background-image:url('${img}');background-size:cover;background-position:center;">
<table width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;"><tr>
<td style="padding:64px 40px 56px;background:linear-gradient(90deg, rgba(5,10,20,0.88) 0%, rgba(5,10,20,0.5) 60%, rgba(5,10,20,0.12) 100%);">
<div data-banner-bar style="width:48px;height:4px;background:${lighten(hex, 0.3)};margin:0 0 18px 0;font-size:0;line-height:0;">&nbsp;</div>
<p data-banner-accent style="margin:0 0 8px 0;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${lighten(hex, 0.45)};">{{servicingBranch.name}}</p>
<h5 style="margin:0 0 10px 0;font-size:30px;font-weight:800;color:#ffffff;line-height:1.15;letter-spacing:-0.01em;">${esc(eng ? eng.name : '')}</h5>
<p style="margin:0;font-size:14px;color:rgba(255,255,255,0.75);">Prepared for {{company.name}}</p>
</td></tr></table>
</td></tr>
</table>
</div>`;
    },

    coverLetter(d, hex) {
      const signOff = S.language === 'US' ? 'Best regards,' : 'Kind regards,';
      const paras = arr(d.paragraphs, 5).map(p => para(p, 14)).join('\n');
      return shell(hex, `<div style="padding:32px 36px 28px;">
<p data-accent style="margin:0 0 20px 0;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${hex};">A letter from {{servicingBranch.name}}</p>
<p style="margin:0 0 16px 0;font-size:15px;color:#0b1220;">Dear {{contact.firstName}},</p>
${paras}
<p style="margin:22px 0 4px 0;font-size:14px;color:#586273;">${signOff}</p>
<p style="margin:0;font-size:15px;font-weight:700;color:#0b1220;">{{creator.fullName}}</p>
<p style="margin:2px 0 0 0;font-size:13px;color:#586273;">{{servicingBranch.name}}</p>
<p style="margin:2px 0 0 0;font-size:13px;color:#9ca3af;">{{creator.email}}</p>
</div>`);
    },

    executiveSummary(d, hex) {
      const outs = arr(d.outcomes, 3);
      const cells = outs.map((o, i) => `<td width="${Math.floor(100 / outs.length)}%" valign="top" style="padding:16px 16px;vertical-align:top;${i < outs.length - 1 ? 'border-right:1px solid #e3e7ee;' : ''}">
<p data-accent style="margin:0 0 4px 0;font-size:15px;font-weight:700;color:${hex};line-height:1.3;">${esc(o.title)}</p>
<p style="margin:0;font-size:13px;line-height:1.55;color:#586273;">${esc(o.detail)}</p></td>`).join('');
      return shell(hex, header(hex, 'Executive summary', d.headline) + body(
        para(d.intro, 16) +
        sectionLabel(hex, 'What you can expect') +
        `<table width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #e3e7ee;border-radius:6px;margin:0 0 16px 0;"><tr>${cells}</tr></table>` +
        sectionLabel(hex, 'Your investment') + para(d.investment, 8)
      ) + footer('Prepared by {{servicingBranch.name}} for {{company.name}}'));
    },

    w1(d, hex) {
      return shell(hex, header(hex, 'Your situation', d.headline) + body(
        para(d.intro, 16) +
        arr(d.painPoints, 3).map(p => accentRow(hex, p.title, p.detail)).join('') +
        (d.closing ? `<p style="margin:14px 0 6px 0;font-size:14px;line-height:1.65;color:#0b1220;font-weight:600;">${esc(d.closing)}</p>` : '')
      ));
    },

    w2(d, hex) {
      const st = d.stat || {};
      return shell(hex, header(hex, 'Why now', d.headline) + body(
        `<table width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 18px 0;"><tr>
<td data-accent-bg width="34%" valign="middle" style="width:34%;background:${rgba(hex, 0.08)};padding:18px 16px;text-align:center;vertical-align:middle;">
<p data-accent style="margin:0;font-size:34px;font-weight:800;line-height:1;color:${hex};">${esc(st.value)}</p></td>
<td valign="middle" style="padding:14px 18px;vertical-align:middle;border:1px solid #e3e7ee;border-left:none;">
<p style="margin:0 0 4px 0;font-size:14px;font-weight:700;line-height:1.45;color:#0b1220;">${esc(st.label)}</p>
<p style="margin:0;font-size:11px;color:#9ca3af;">Source: ${esc(st.source)}</p></td>
</tr></table>` +
        para(d.intro, 16) +
        arr(d.risks, 3).map(r => accentRow(hex, r.title, r.detail)).join('') +
        `<div style="height:8px;font-size:0;line-height:0;">&nbsp;</div>` +
        callout(hex, d.implication) +
        `<div style="height:12px;font-size:0;line-height:0;">&nbsp;</div>`
      ));
    },

    w3(d, hex) {
      return shell(hex, header(hex, 'What we’ll do', d.headline) + body(
        para(d.intro, 18) +
        sectionLabel(hex, 'How the engagement runs') +
        arr(d.phases, 4).map((p, i) => numberedRow(hex, i + 1, p.name, p.detail)).join('') +
        (d.experience ? sectionLabel(hex, 'Working with us') + para(d.experience, 8) : '')
      ));
    },

    w4(d, hex) {
      const sig = arr(d.signals, 4);
      const cell = s => s ? `<td width="50%" valign="top" style="width:50%;padding:14px 16px;vertical-align:top;border:1px solid #e3e7ee;">
<span data-badge style="display:inline-block;width:24px;height:24px;line-height:24px;border-radius:50%;text-align:center;font-size:13px;font-weight:700;background:${rgba(hex, 0.12)};color:${hex};margin:0 0 8px 0;">✓</span>
<p style="margin:0 0 3px 0;font-size:14px;font-weight:700;color:#0b1220;">${esc(s.title)}</p>
<p style="margin:0;font-size:13px;line-height:1.55;color:#586273;">${esc(s.detail)}</p></td>` : '<td width="50%" style="width:50%;"></td>';
      let rows = '';
      for (let i = 0; i < sig.length; i += 2) rows += `<tr>${cell(sig[i])}${cell(sig[i + 1])}</tr>`;
      return shell(hex, header(hex, 'Why {{servicingBranch.name}}', d.headline) + body(
        para(d.intro, 16) +
        `<table width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 16px 0;">${rows}</table>` +
        (d.closing ? para(d.closing, 8) : '')
      ));
    },

    w5(d, hex) {
      return shell(hex, header(hex, 'Next steps', d.headline) + body(
        (d.intro ? para(d.intro, 18) : '') +
        arr(d.steps, 3).map((s, i) => numberedRow(hex, i + 1, s.title, s.detail)).join('') +
        (d.closing ? `<p style="margin:6px 0 10px 0;font-size:14px;line-height:1.65;color:#0b1220;">${esc(d.closing)}</p>` : '')
      ) + footer('{{creator.fullName}} · {{servicingBranch.name}} · {{creator.email}}', 'Valid until {{date quote.expiresAt}}'));
    }
  };

  // ── Real-time brand colour (data-* targeting, preserves edits) ──
  function applyBrandColor(hex) {
    document.documentElement.style.setProperty('--brand', hex);
    const sides = { top: 'borderTopColor', left: 'borderLeftColor', right: 'borderRightColor', bottom: 'borderBottomColor' };
    document.querySelectorAll('.wcard-body').forEach(root => {
      root.querySelectorAll('[data-gradient-header]').forEach(el => { el.style.background = gradBg(hex); });
      root.querySelectorAll('[data-accent]').forEach(el => { el.style.color = hex; });
      root.querySelectorAll('[data-accent-bg]').forEach(el => { el.style.background = rgba(hex, 0.08); });
      root.querySelectorAll('[data-accent-border]').forEach(el => {
        const prop = sides[el.getAttribute('data-accent-border')] || 'borderTopColor';
        el.style[prop] = hex;
      });
      root.querySelectorAll('[data-badge]').forEach(el => { el.style.background = rgba(hex, 0.12); el.style.color = hex; });
      root.querySelectorAll('[data-number-cell]').forEach(el => { el.style.background = hex; });
      root.querySelectorAll('[data-banner-accent]').forEach(el => { el.style.color = lighten(hex, 0.45); });
      root.querySelectorAll('[data-banner-bar]').forEach(el => { el.style.background = lighten(hex, 0.3); });
    });
    // Capture recoloured HTML (with edits) back into state
    WIDGETS.forEach(w => { if (S.html[w.key]) S.html[w.key] = exportHtml(w.key); });
  }

  function setColor(hex, source) {
    const h = normHex(hex);
    if (!h) return;
    S.color = h;
    $('colorPicker').value = h.toLowerCase();
    if (source !== 'hex') { $('hexInput').value = h; $('hexInput').classList.remove('invalid'); }
    document.querySelectorAll('#swatchRow .swatch').forEach(s => {
      const match = source === 'swatch' || source === 'init' ? normHex(s.dataset.hex) === h : false;
      s.classList.toggle('active', match);
    });
    applyBrandColor(h);
    saveSoon();
  }

  // ══ Screen 1 ═══════════════════════════════════
  function buildEngagementGrid() {
    const grid = $('engGrid');
    grid.innerHTML = ENGAGEMENTS.map((e, i) => `
      <button type="button" class="eng-card" data-key="${e.key}">
        <div class="eng-thumb" style="background-image:url('${imageUrl(e.image)}'), linear-gradient(135deg, #0b1a33 0%, #1a3a6e 100%);">
          <span class="eng-thumb-num">${String(i + 1).padStart(2, '0')}</span>
        </div>
        <div class="eng-text"><h3>${esc(e.name)}</h3><p>${esc(e.desc)}</p></div>
      </button>`).join('') + `
      <button type="button" class="eng-card eng-card-custom" data-key="custom">
        <div class="eng-thumb" style="background-image:url('${imageUrl(CUSTOM_IMAGE)}'), linear-gradient(135deg, #0b1a33 0%, #1a3a6e 100%);">
          <span class="eng-thumb-num">12</span>
        </div>
        <div class="eng-text"><h3>Custom Engagement</h3><p>Describe your own engagement and the AI writes every widget.</p></div>
      </button>`;
    grid.querySelectorAll('.eng-card').forEach(c => c.addEventListener('click', () => {
      if (c.dataset.key === 'custom') { openCustomForm(); return; }
      chooseEngagement(c.dataset.key);
    }));
  }

  function openCustomForm() {
    const f = $('engCustom');
    f.hidden = false;
    document.querySelectorAll('.eng-card').forEach(c => c.classList.toggle('active', c.dataset.key === 'custom'));
    f.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => $('customName').focus({ preventScroll: true }), 300);
  }

  function chooseEngagement(key) {
    if (S.engagementKey && S.engagementKey !== key && hasGenerated()) {
      if (!confirm('Switch engagement? The widgets you generated for the current engagement will be cleared.')) return;
      resetGenerated();
    }
    S.engagementKey = key;
    showBuild();
    save();
  }

  function onCustomContinue() {
    const name = $('customName').value.trim();
    const desc = $('customDescription').value.trim();
    if (S.engagementKey === 'custom' && hasGenerated() && (name !== S.customName || desc !== S.customDescription)) {
      if (!confirm('You changed the custom engagement. Clear the widgets generated for the previous description?')) return;
      resetGenerated();
    }
    S.customName = name;
    S.customDescription = desc;
    if (!S.customName) { $('customName').focus(); alert('Give your engagement a name — it becomes the banner title and template name.'); return; }
    if (S.customDescription.length < 20) { $('customDescription').focus(); alert('Describe the engagement in a sentence or two so the AI has something to work with.'); return; }
    chooseEngagement('custom');
  }

  // Delivery mode
  function setMode(mode) {
    S.mode = mode === 'copy' ? 'copy' : 'api';
    localStorage.setItem(MODE_KEY, S.mode);
    $('modeApiBtn').classList.toggle('active', S.mode === 'api');
    $('modeCopyBtn').classList.toggle('active', S.mode === 'copy');
    $('modeApiBtn').setAttribute('aria-checked', S.mode === 'api');
    $('modeCopyBtn').setAttribute('aria-checked', S.mode === 'copy');
    $('connApi').hidden = S.mode !== 'api';
    $('connCopy').hidden = S.mode !== 'copy';
    updateConnChip();
    updateDelivery();
  }

  function getCreds() {
    const apiKey = localStorage.getItem('sb_api_key');
    const tenantUrl = localStorage.getItem('sb_tenant_url');
    return apiKey && tenantUrl ? { apiKey, tenantUrl } : null;
  }
  function normTenant(url) {
    let u = String(url || '').trim().replace(/\/+$/, '');
    if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
    return u;
  }
  function updateConnChip() {
    const chip = $('connChip');
    chip.hidden = false;
    chip.classList.remove('good');
    if (S.mode === 'copy') { chip.textContent = 'Copy & paste mode'; return; }
    const c = getCreds();
    if (c) {
      let host = c.tenantUrl; try { host = new URL(c.tenantUrl).host; } catch {}
      chip.textContent = 'API · ' + host;
      chip.classList.add('good');
    } else chip.textContent = 'API not connected';
  }

  async function onTestConnection() {
    const tenantUrl = normTenant($('tenantUrl').value);
    const apiKey = $('apiKey').value.trim();
    const status = $('connStatus');
    status.hidden = false; status.className = 'conn-status';
    if (!tenantUrl || !apiKey) { status.textContent = 'Enter both your tenant URL and API key.'; status.classList.add('err'); return; }
    localStorage.setItem('sb_tenant_url', tenantUrl);
    localStorage.setItem('sb_api_key', apiKey);
    $('tenantUrl').value = tenantUrl;
    const btn = $('testConnBtn');
    btn.disabled = true; btn.textContent = 'Testing…';
    const r = await api('listTemplates', { apiKey, tenantUrl });
    btn.disabled = false; btn.textContent = 'Save and test';
    if (r.ok) {
      status.textContent = `Connected — ${r.templates.length} quote template${r.templates.length === 1 ? '' : 's'} found in this account.`;
      status.classList.add('ok');
    } else {
      status.textContent = (r.error || 'Connection failed.') + ' No Public API? Switch to “Copy and paste”.';
      status.classList.add('err');
    }
    updateConnChip();
  }

  // ══ Screen 2 ═══════════════════════════════════
  function showSelect() {
    screenBuild.hidden = true;
    screenSelect.hidden = false;
    document.querySelectorAll('.eng-card').forEach(c => c.classList.toggle('active', c.dataset.key === S.engagementKey));
    $('customName').value = S.customName;
    $('customDescription').value = S.customDescription;
    $('engCustom').hidden = S.engagementKey !== 'custom';
    window.scrollTo({ top: 0 });
  }

  function showBuild() {
    const eng = currentEng();
    if (!eng) return showSelect();
    screenSelect.hidden = true;
    screenBuild.hidden = false;
    $('engName').textContent = eng.name;
    $('engThumb').style.backgroundImage = `url('${imageUrl(eng.image)}'), linear-gradient(135deg, #0b1a33, #1a3a6e)`;
    renderAllCards();
    updateOutputVisibility();
    updateDelivery();
    updateLangNotice();
    window.scrollTo({ top: 0 });
  }

  function buildWidgetChecks() {
    const mini = {
      banner: '<div class="mini mini-banner"><div class="mini-bar"></div><div class="mini-line"></div></div>',
      coverLetter: '<div class="mini mini-letter"><div class="mini-line"></div><div class="mini-line"></div><div class="mini-line short"></div></div>',
      executiveSummary: '<div class="mini"><div class="mini-head"></div><div class="mini-dots"><span></span><span></span><span></span></div><div class="mini-line short"></div></div>'
    };
    const std = '<div class="mini"><div class="mini-head"></div><div class="mini-line"></div><div class="mini-line short"></div></div>';
    $('widgetChecks').innerHTML = WIDGETS.map(w => `
      <label class="wcheck" data-key="${w.key}">
        <input type="checkbox" value="${w.key}" checked />
        ${mini[w.key] || std}
        <span>
          <span class="wcheck-name">${w.code ? `<span class="wcheck-code">${w.code}</span>` : ''}${esc(w.name)}</span>
          <span class="wcheck-desc">${esc(w.desc)}</span>
        </span>
      </label>`).join('');
    $('widgetChecks').querySelectorAll('input').forEach(cb => cb.addEventListener('change', () => onToggleWidget(cb)));
  }

  function syncWidgetChecks() {
    $('widgetChecks').querySelectorAll('input').forEach(cb => {
      cb.checked = S.selected.has(cb.value);
      cb.closest('.wcheck').classList.toggle('off', !cb.checked);
    });
  }

  function onToggleWidget(cb) {
    $('formError').hidden = true;
    if (!cb.checked && S.selected.size === 1) {
      cb.checked = true;
      showFormError('Keep at least one widget selected.');
      return;
    }
    cb.checked ? S.selected.add(cb.value) : S.selected.delete(cb.value);
    cb.closest('.wcheck').classList.toggle('off', !cb.checked);
    renderCard(cb.value);
    updateDelivery();
    save();
  }

  function showFormError(msg) { const e = $('formError'); e.textContent = msg; e.hidden = false; }

  function setLanguage(lang) {
    S.language = lang === 'US' ? 'US' : 'UK';
    document.querySelectorAll('.lang-btn').forEach(b => {
      const on = b.dataset.lang === S.language;
      b.classList.toggle('active', on);
      b.setAttribute('aria-checked', on);
    });
    updateLangNotice();
    save();
  }

  function updateLangNotice() {
    const show = hasGenerated() && S.generatedLanguage && S.generatedLanguage !== S.language;
    $('langNotice').hidden = !show;
    if (show) {
      const name = l => (l === 'US' ? 'US English' : 'UK English');
      $('langNoticeText').textContent = `These widgets were written in ${name(S.generatedLanguage)}. Regenerate to switch them to ${name(S.language)}.`;
    }
  }

  // ── Preview cards ───────────────────────────────
  function buildCards() {
    previewList.innerHTML = WIDGETS.map(w => `
      <article class="wcard" id="card-${w.key}" data-key="${w.key}" hidden>
        <div class="wcard-head">
          <div class="wcard-title">${w.code ? `<span class="wcard-code">${w.code}</span>` : ''}${esc(w.name)}
            <span class="wcard-copied" hidden>Copied ✓</span></div>
          <div class="wcard-actions">
            <button type="button" class="btn-secondary wc-regen">${w.ai ? 'Regenerate' : 'Reset'}</button>
            <button type="button" class="btn-secondary wc-copy">Copy HTML</button>
          </div>
        </div>
        <p class="wcard-hint" hidden></p>
        <div class="wcard-body" spellcheck="true"></div>
        <div class="wcard-state" hidden></div>
      </article>`).join('');

    WIDGETS.forEach(w => {
      const card = $(`card-${w.key}`);
      const bodyEl = card.querySelector('.wcard-body');
      card.querySelector('.wc-regen').addEventListener('click', () => onRegenWidget(w.key));
      card.querySelector('.wc-copy').addEventListener('click', e => onCopyOne(w.key, e.currentTarget));
      const capture = debounce(() => { if (S.html[w.key]) { S.html[w.key] = exportHtml(w.key); save(); } }, 400);
      bodyEl.addEventListener('input', capture);
      // Paste as plain text so rich formatting from elsewhere can't break the widget
      bodyEl.addEventListener('paste', e => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
      });
    });
  }

  function renderAllCards() { WIDGETS.forEach(w => renderCard(w.key)); }

  function renderCard(key) {
    const card = $(`card-${key}`);
    if (!card) return;
    const w = WMAP[key];
    const bodyEl = card.querySelector('.wcard-body');
    const stateEl = card.querySelector('.wcard-state');
    const hint = card.querySelector('.wcard-hint');
    const status = S.status[key];
    const started = hasGenerated() || anyLoading();

    card.hidden = !S.selected.has(key) || !started;
    card.querySelector('.wcard-copied').hidden = !S.copied.has(key);

    const regen = card.querySelector('.wc-regen');
    const copy = card.querySelector('.wc-copy');

    if (status === 'loading') {
      bodyEl.hidden = true; stateEl.hidden = false;
      stateEl.className = 'wcard-state loading';
      stateEl.textContent = `Writing ${w.name}…`;
      hint.hidden = true; regen.disabled = true; copy.disabled = true;
      return;
    }
    if (status === 'error') {
      bodyEl.hidden = true; stateEl.hidden = false;
      stateEl.className = 'wcard-state error';
      stateEl.innerHTML = `<span>${esc(S.errors[key] || 'Generation failed.')}</span><button type="button" class="btn-secondary small">Try again</button>`;
      stateEl.querySelector('button').addEventListener('click', () => generateOne(key).then(afterBatch));
      hint.hidden = true; regen.disabled = false; copy.disabled = true;
      return;
    }
    if (S.html[key]) {
      stateEl.hidden = true; bodyEl.hidden = false;
      if (bodyEl.dataset.rendered !== '1' || bodyEl.innerHTML === '') {
        bodyEl.innerHTML = S.html[key];
        bodyEl.dataset.rendered = '1';
      }
      bodyEl.setAttribute('contenteditable', 'true');
      hint.hidden = !HINTS[key]; hint.textContent = HINTS[key] || '';
      regen.disabled = false; copy.disabled = false;
      return;
    }
    // Selected but never generated
    bodyEl.hidden = true; stateEl.hidden = false;
    stateEl.className = 'wcard-state';
    stateEl.innerHTML = `<span>${esc(w.name)} hasn’t been generated yet.</span><button type="button" class="btn-secondary small">Generate</button>`;
    stateEl.querySelector('button').addEventListener('click', () => {
      if (!w.ai) { buildBanner(); afterBatch(); return; }
      generateOne(key).then(afterBatch);
    });
    hint.hidden = true; regen.disabled = true; copy.disabled = true;
  }

  // Force a fresh render of the body (after generation / reset)
  function rerenderBody(key) {
    const bodyEl = $(`card-${key}`).querySelector('.wcard-body');
    bodyEl.dataset.rendered = '0';
    renderCard(key);
  }

  function exportHtml(key) {
    const bodyEl = $(`card-${key}`) && $(`card-${key}`).querySelector('.wcard-body');
    if (!bodyEl || bodyEl.dataset.rendered !== '1') return S.html[key] || '';
    const clone = bodyEl.cloneNode(true);
    clone.querySelectorAll('[contenteditable],[spellcheck]').forEach(el => { el.removeAttribute('contenteditable'); el.removeAttribute('spellcheck'); });
    return clone.innerHTML.trim();
  }

  function updateOutputVisibility() {
    const started = hasGenerated() || anyLoading();
    $('output').hidden = !started;
    $('emptyState').hidden = started;
    $('generateBtn').textContent = S.generating ? 'Generating…' : (hasGenerated() ? 'Regenerate all' : 'Generate template');
  }

  // ── Generation ──────────────────────────────────
  function enginePayload() {
    const eng = currentEng();
    return {
      engagement: S.engagementKey === 'custom' ? 'Custom Engagement' : eng.name,
      engagementDesc: eng.desc,
      customDescription: S.engagementKey === 'custom' ? `${S.customName}: ${S.customDescription}` : '',
      language: S.language
    };
  }

  async function api(action, payload) {
    try {
      const res = await fetch('/api/template-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      });
      try { return await res.json(); }
      catch { return { ok: false, error: `Server returned HTTP ${res.status}. If this keeps happening, the request may have timed out — try again.` }; }
    } catch (e) {
      return { ok: false, error: 'Network error: ' + e.message };
    }
  }

  function buildBanner() {
    S.html.banner = BUILD.banner(null, S.color);
    S.status.banner = 'ready';
    S.copied.delete('banner');
    rerenderBody('banner');
  }

  async function onGenerate() {
    $('formError').hidden = true;
    if (S.generating) return;
    if (!S.selected.size) return showFormError('Select at least one widget.');
    const eng = currentEng();
    if (!eng) return showSelect();

    if (hasGenerated() && !confirm('Regenerate all selected widgets? Any edits you’ve made will be replaced.')) return;

    S.generating = true;
    S.copied.clear();
    S.generatedLanguage = S.language;
    $('afterPush').hidden = true;
    hidePushStatus();
    updateLangNotice();

    const keys = WIDGETS.map(w => w.key).filter(k => S.selected.has(k));
    const jobs = keys.filter(k => WMAP[k].ai).concat('products');

    // Clear previous results for the widgets being regenerated
    keys.forEach(k => { delete S.html[k]; delete S.data[k]; S.status[k] = WMAP[k].ai ? 'queued' : 'ready'; });
    S.status.products = 'queued';
    S.products = [];
    $('productsPanel').hidden = true;

    renderProgress(keys.concat('products'), eng.name);
    $('generateBtn').disabled = true;
    $('generateBtn').textContent = 'Generating…';

    if (S.selected.has('banner')) buildBanner();
    jobs.forEach(k => { if (k !== 'products') S.status[k] = 'loading'; });
    S.status.products = 'loading';
    updateOutputVisibility();
    renderAllCards();
    renderProgress(keys.concat('products'), eng.name);
    $('progress').scrollIntoView({ behavior: 'smooth', block: 'start' });

    await runPool(jobs, CONCURRENCY, k => generateOne(k, true));

    S.generating = false;
    $('generateBtn').disabled = false;
    afterBatch();
  }

  async function runPool(items, n, fn) {
    let i = 0;
    const worker = async () => { while (i < items.length) { const it = items[i++]; await fn(it); } };
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  }

  async function generateOne(key, inBatch) {
    S.status[key] = 'loading';
    delete S.errors[key];
    if (key !== 'products') renderCard(key);
    updateProgressItem(key);
    if (!inBatch) updateOutputVisibility();

    const r = await api('generate', { widget: key, ...enginePayload() });
    if (r.ok) {
      if (key === 'products') {
        S.products = Array.isArray(r.content.products) ? r.content.products : [];
      } else {
        S.data[key] = r.content;
        S.html[key] = BUILD[key](r.content, S.color);
        S.copied.delete(key);
      }
      S.status[key] = 'ready';
    } else {
      S.status[key] = 'error';
      S.errors[key] = r.error || 'Generation failed.';
    }
    if (key === 'products') renderProducts();
    else rerenderBody(key);
    updateProgressItem(key);
    updateDelivery();
    save();
  }

  function afterBatch() {
    if (!S.generatedLanguage) S.generatedLanguage = S.language;
    finishProgress();
    renderProducts();
    updateOutputVisibility();
    updateDelivery();
    updateLangNotice();
    save();
  }

  async function onRegenWidget(key) {
    if (!WMAP[key].ai) {
      if (!confirm('Reset the banner? Any edits to it will be replaced.')) return;
      buildBanner(); updateDelivery(); save();
      return;
    }
    await generateOne(key);
    afterBatch();
  }

  // ── Progress ────────────────────────────────────
  let progressKeys = [];
  function renderProgress(keys, engName) {
    progressKeys = keys;
    const p = $('progress');
    p.classList.remove('done');
    const n = keys.filter(k => k !== 'products').length;
    $('progressTitle').textContent = `Generating ${n} widget${n === 1 ? '' : 's'} for “${engName}”…`;
    $('progressList').innerHTML = keys.map(k => `<li data-key="${k}"><span class="pi"></span><span>${k === 'products' ? 'Suggested products' : esc(label(k))}</span><span class="ps"></span></li>`).join('');
    keys.forEach(updateProgressItem);
  }
  function updateProgressItem(key) {
    const li = $('progressList').querySelector(`li[data-key="${key}"]`);
    if (!li) return;
    const st = S.status[key] || 'queued';
    li.className = st;
    li.querySelector('.pi').textContent = { ready: '✓', loading: '■', error: '!', queued: '□' }[st] || '□';
    li.querySelector('.ps').textContent = { loading: 'generating…', error: 'failed', ready: '', queued: '' }[st] || '';
  }
  function finishProgress() {
    const eng = currentEng();
    const keys = progressKeys.length ? progressKeys : readyKeys();
    const widgets = keys.filter(k => k !== 'products');
    const ready = widgets.filter(k => S.status[k] === 'ready' || S.html[k]).length;
    const failed = widgets.filter(k => S.status[k] === 'error').length;
    if (anyLoading()) return;
    const p = $('progress');
    $('progressTitle').textContent = failed
      ? `${ready} of ${widgets.length} widgets ready for “${eng ? eng.name : ''}” — ${failed} failed. Use “Try again” on the widget below.`
      : `${ready} widget${ready === 1 ? '' : 's'} ready for “${eng ? eng.name : ''}”. Click any text to edit it.`;
    p.classList.toggle('done', !failed);
  }

  // ── Products ────────────────────────────────────
  function renderProducts() {
    const has = S.products && S.products.length;
    $('productsPanel').hidden = !has;
    if (!has) return;
    const eng = currentEng();
    $('productsIntro').textContent = `For a ${eng ? eng.name : 'this'} engagement, MSPs typically include:`;
    $('productsList').innerHTML = S.products.map(p => `<li>${esc(p)}</li>`).join('');
  }

  // ══ Copy ═══════════════════════════════════════
  async function copyRich(html) {
    try {
      if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([html], { type: 'text/plain' })
        })]);
        return true;
      }
    } catch (e) { /* fall through */ }
    try { await navigator.clipboard.writeText(html); return true; }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = html; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch {}
      ta.remove();
      return ok;
    }
  }

  function flash(btn, text, restore) {
    const original = restore || btn.textContent;
    btn.textContent = text;
    setTimeout(() => { btn.textContent = original; updateDelivery(); }, 2000);
  }

  async function onCopyOne(key, btn) {
    const html = exportHtml(key);
    if (!html) return;
    if (await copyRich(html)) {
      S.copied.add(key);
      renderCard(key);
      flash(btn, 'Copied ✓', 'Copy HTML');
      updateDelivery(); save();
    } else alert('Could not copy to the clipboard. Try again.');
  }

  async function onCopyAll() {
    const keys = readyKeys();
    if (!keys.length) return;
    const html = keys.map(exportHtml).join('\n\n');
    if (await copyRich(html)) {
      keys.forEach(k => S.copied.add(k));
      renderAllCards();
      flash($('copyAllBtn'), 'Copied ✓');
      save();
    } else alert('Could not copy to the clipboard. Try again.');
  }

  async function onCopyNext() {
    const keys = readyKeys();
    const next = keys.find(k => !S.copied.has(k));
    if (!next) { // all done — start over
      S.copied.clear(); renderAllCards(); updateDelivery(); save();
      return;
    }
    if (await copyRich(exportHtml(next))) {
      S.copied.add(next);
      renderCard(next);
      const pos = keys.indexOf(next) + 1;
      flash($('copyNextBtn'), `Copied ${label(next)} ✓ (${pos} of ${keys.length}) — paste it now`);
      $(`card-${next}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
      save();
    } else alert('Could not copy to the clipboard. Try again.');
  }

  // ══ Delivery bar ═══════════════════════════════
  function updateDelivery() {
    if (!$('delivery')) return;
    const keys = readyKeys();
    const started = hasGenerated() || anyLoading();
    $('delivery').hidden = !started;
    $('pasteHelp').hidden = !started;
    if (!started) return;

    const isApi = S.mode === 'api';
    $('pushGroup').hidden = !isApi;

    const copyAll = $('copyAllBtn'), copyNext = $('copyNextBtn');
    copyAll.className = isApi ? 'btn-secondary' : 'btn-accent';
    copyNext.className = isApi ? 'btn-secondary' : 'btn-primary';
    if (!copyAll.textContent.includes('✓')) copyAll.textContent = `Copy all ${keys.length}`;
    copyAll.disabled = !keys.length || anyLoading();

    const next = keys.find(k => !S.copied.has(k));
    if (!copyNext.textContent.includes('✓')) {
      if (!keys.length) copyNext.textContent = 'Copy next';
      else if (next) copyNext.textContent = `Copy next: ${label(next)} (${keys.indexOf(next) + 1} of ${keys.length})`;
      else copyNext.textContent = `All ${keys.length} copied — start again`;
    }
    copyNext.disabled = !keys.length || anyLoading();

    ['pushTemplateBtn', 'pushWidgetsBtn', 'pushBothBtn'].forEach(id => { $(id).disabled = !keys.length || anyLoading(); });

    const sw = $('deliverySwitch');
    sw.innerHTML = isApi
      ? 'No Public API? <button type="button" class="btn-link" data-mode="copy">Switch to copy and paste</button>'
      : 'Have the Public API? <button type="button" class="btn-link" data-mode="api">Connect to push directly</button>';
    sw.querySelector('button').addEventListener('click', e => {
      setMode(e.currentTarget.dataset.mode);
      if (S.mode === 'api' && !getCreds()) openCredsInline();
    });

    const help = $('pasteHelp');
    if (!isApi && !help.dataset.touched) help.open = true;
    if (isApi && !help.dataset.touched) help.open = false;
    $('pasteHelpName').textContent = templateName() || 'Security Package — Acme IT';
  }

  // ══ Push ═══════════════════════════════════════
  let pendingPush = null;

  function openCredsInline() {
    const c = { apiKey: localStorage.getItem('sb_api_key') || '', tenantUrl: localStorage.getItem('sb_tenant_url') || '' };
    $('credsApiKey').value = c.apiKey;
    $('credsTenantUrl').value = c.tenantUrl;
    $('credsInline').hidden = false;
    $('credsInline').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showPushStatus(type, msg) {
    const el = $('pushStatus');
    el.hidden = false; el.className = 'push-status ' + type; el.textContent = msg;
  }
  function hidePushStatus() { $('pushStatus').hidden = true; }

  function setPushBusy(on) {
    ['pushTemplateBtn', 'pushWidgetsBtn', 'pushBothBtn'].forEach(id => { $(id).disabled = on; });
  }

  async function onPush(kind) {
    hidePushStatus();
    $('conflictPanel').hidden = true;
    const creds = getCreds();
    if (!creds) { pendingPush = kind; openCredsInline(); return; }

    if (anyLoading()) return showPushStatus('err', 'Wait for all widgets to finish generating.');
    const keys = readyKeys();
    if (!keys.length) return showPushStatus('err', 'Nothing to push yet — generate the template first.');
    if (kind !== 'widgets' && !S.mspName.trim()) {
      $('mspName').focus();
      return showPushStatus('err', 'Add your company name in the left panel — it’s used to name the template.');
    }

    setPushBusy(true);
    const done = [];
    try {
      if (kind !== 'widgets') {
        const msg = await pushQuoteTemplate(creds, keys);
        if (msg === null) { showPushStatus('info', 'Push cancelled.'); return; }
        done.push(msg);
      }
      if (kind !== 'template') done.push(await pushWidgetTemplates(creds, keys));
      showPushStatus('ok', '✓ ' + done.join(' ') + ' Open Salesbuildr → Templates to use it.');
      $('afterPush').hidden = false;
      $('afterPush').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {
      showPushStatus('err', (done.length ? done.join(' ') + ' But: ' : '') + e.message);
    } finally {
      setPushBusy(false);
      updateDelivery();
    }
  }

  function askConflict(name) {
    return new Promise(resolve => {
      $('conflictText').textContent = `A quote template named “${name}” already exists in Salesbuildr. Update it, or create a new copy?`;
      $('conflictPanel').hidden = false;
      $('conflictPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const finish = choice => {
        $('conflictPanel').hidden = true;
        ['conflictUpdateBtn', 'conflictNewBtn', 'conflictCancelBtn'].forEach(id => { $(id).onclick = null; });
        resolve(choice);
      };
      $('conflictUpdateBtn').onclick = () => finish('update');
      $('conflictNewBtn').onclick = () => finish('new');
      $('conflictCancelBtn').onclick = () => finish('cancel');
    });
  }

  function uniqueName(name, templates) {
    const taken = new Set(templates.map(t => (t.name || '').trim().toLowerCase()));
    let n = 2;
    while (taken.has(`${name} (${n})`.toLowerCase())) n++;
    return `${name} (${n})`;
  }

  async function pushQuoteTemplate(creds, keys) {
    const name = templateName();
    showPushStatus('info', 'Checking Salesbuildr for an existing template…');
    const list = await api('listTemplates', creds);
    if (!list.ok) throw new Error(list.error || 'Could not read your quote templates.');

    let existingId = null, finalName = name;
    const match = list.templates.find(t => (t.name || '').trim().toLowerCase() === name.toLowerCase());
    if (match) {
      hidePushStatus();
      const choice = await askConflict(name);
      if (choice === 'cancel') return null;
      if (choice === 'update') existingId = match.id;
      else finalName = uniqueName(name, list.templates);
    }

    showPushStatus('info', existingId ? 'Validating and updating the quote template…' : 'Validating and creating the quote template…');
    const r = await api('createTemplate', {
      ...creds,
      name: finalName,
      existingId,
      widgets: keys.map(k => ({ key: k, html: exportHtml(k) }))
    });
    if (!r.ok) throw new Error(r.error || 'Could not create the quote template.');
    return `${r.updated ? 'Updated' : 'Created'} quote template “${r.name}” with ${keys.length} widget${keys.length === 1 ? '' : 's'}.` + (r.warning ? ' ' + r.warning : '');
  }

  async function pushWidgetTemplates(creds, keys) {
    const eng = currentEng().name;
    const widgets = keys.map(k => ({ key: k, title: WMAP[k].name, html: exportHtml(k) }));

    showPushStatus('info', 'Validating widget templates…');
    const v = await api('validateWidgetTemplates', {
      ...creds,
      widgets: widgets.map(w => ({ name: `${eng} – ${w.title}`, html: w.html }))
    });
    if (!v.ok) throw new Error(v.error || 'Salesbuildr rejected the widget templates during validation.');

    showPushStatus('info', `Creating ${widgets.length} widget templates…`);
    const res = await fetch('/api/push-widgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // `html` is what push-widgets.js reads; `content` matches the documented frontend contract.
        widgets: widgets.map(w => ({ id: w.key, type: 'html', title: w.title, html: w.html, content: w.html })),
        prefix: eng,
        apiKey: creds.apiKey,
        tenantUrl: creds.tenantUrl
      })
    });
    let data;
    try { data = await res.json(); } catch { throw new Error(`Widget push failed (HTTP ${res.status}).`); }
    if (!(data.ok || data.successCount > 0)) {
      const firstErr = data.results && data.results.find(r => !r.ok);
      throw new Error('Widget template push failed: ' + (data.error || (firstErr && firstErr.error) || 'unknown error'));
    }
    const failed = (data.total || widgets.length) - (data.successCount || 0);
    return `Created ${data.successCount} widget template${data.successCount === 1 ? '' : 's'}${failed ? ` (${failed} failed)` : ''}.`;
  }

  async function onCredsSave() {
    const tenantUrl = normTenant($('credsTenantUrl').value);
    const apiKey = $('credsApiKey').value.trim();
    if (!tenantUrl || !apiKey) { showPushStatus('err', 'Enter both your tenant URL and API key.'); return; }
    localStorage.setItem('sb_tenant_url', tenantUrl);
    localStorage.setItem('sb_api_key', apiKey);
    $('tenantUrl').value = tenantUrl; $('apiKey').value = apiKey;
    $('credsInline').hidden = true;
    updateConnChip();
    const kind = pendingPush || 'template';
    pendingPush = null;
    await onPush(kind);
  }

  // ══ Reset ══════════════════════════════════════
  function resetGenerated() {
    S.data = {}; S.html = {}; S.status = {}; S.errors = {};
    S.products = []; S.copied = new Set(); S.generatedLanguage = null;
    progressKeys = [];
    WIDGETS.forEach(w => { const b = $(`card-${w.key}`).querySelector('.wcard-body'); b.innerHTML = ''; b.dataset.rendered = '0'; });
    $('productsPanel').hidden = true;
    $('afterPush').hidden = true;
    $('conflictPanel').hidden = true;
    $('credsInline').hidden = true;
    hidePushStatus();
  }

  // Clear: resets engagement + widget selections, keeps credentials + branding
  function startOver(skipConfirm) {
    if (S.generating) return;
    if (!skipConfirm && hasGenerated() && !confirm('Clear this template and start over? Your branding and Salesbuildr details are kept.')) return;
    resetGenerated();
    S.engagementKey = null;
    S.customName = ''; S.customDescription = '';
    S.selected = new Set(WIDGETS.map(w => w.key));
    syncWidgetChecks();
    $('formError').hidden = true;
    renderAllCards();
    updateOutputVisibility();
    updateLangNotice();
    save();
    showSelect();
  }

  // ══ Reference panel ════════════════════════════
  function toggleRef(force) {
    const p = $('refPanel');
    p.hidden = typeof force === 'boolean' ? !force : !p.hidden;
  }

  // ══ Persistence ════════════════════════════════
  function save() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({
        engagementKey: S.engagementKey,
        customName: S.customName,
        customDescription: S.customDescription,
        color: S.color,
        language: S.language,
        mspName: S.mspName,
        selected: [...S.selected],
        data: S.data,
        html: S.html,
        products: S.products,
        copied: [...S.copied],
        generatedLanguage: S.generatedLanguage
      }));
    } catch (e) { /* storage full — non-fatal */ }
  }
  const saveSoon = debounce(save, 300);

  function restore() {
    let st = null;
    try { st = JSON.parse(localStorage.getItem(STATE_KEY) || 'null'); } catch {}
    if (!st) return false;
    S.engagementKey = st.engagementKey || null;
    S.customName = st.customName || '';
    S.customDescription = st.customDescription || '';
    S.color = normHex(st.color) || S.color;
    S.language = st.language === 'US' ? 'US' : 'UK';
    S.mspName = st.mspName || '';
    if (Array.isArray(st.selected) && st.selected.length) S.selected = new Set(st.selected.filter(k => WMAP[k]));
    S.data = st.data || {};
    S.html = st.html || {};
    Object.keys(S.html).forEach(k => { if (!WMAP[k]) delete S.html[k]; else S.status[k] = 'ready'; });
    S.products = st.products || [];
    S.copied = new Set(st.copied || []);
    S.generatedLanguage = st.generatedLanguage || null;
    return true;
  }

  // ══ Init ═══════════════════════════════════════
  function init() {
    buildEngagementGrid();
    buildWidgetChecks();
    buildCards();
    restore();

    // Connection
    $('tenantUrl').value = localStorage.getItem('sb_tenant_url') || '';
    $('apiKey').value = localStorage.getItem('sb_api_key') || '';
    $('modeApiBtn').addEventListener('click', () => setMode('api'));
    $('modeCopyBtn').addEventListener('click', () => setMode('copy'));
    $('testConnBtn').addEventListener('click', onTestConnection);
    setMode(S.mode);

    // Custom engagement
    $('customContinueBtn').addEventListener('click', onCustomContinue);

    // Branding
    document.querySelectorAll('#swatchRow .swatch').forEach(s => s.addEventListener('click', () => setColor(s.dataset.hex, 'swatch')));
    $('colorPicker').addEventListener('input', e => setColor(e.target.value, 'picker'));
    const onHex = debounce(() => {
      const h = normHex($('hexInput').value);
      $('hexInput').classList.toggle('invalid', !h && $('hexInput').value.trim().length > 0);
      if (h) setColor(h, 'hex');
    }, 100);
    $('hexInput').addEventListener('input', onHex);
    $('hexInput').addEventListener('blur', () => { $('hexInput').value = S.color; $('hexInput').classList.remove('invalid'); });

    document.querySelectorAll('.lang-btn').forEach(b => b.addEventListener('click', () => setLanguage(b.dataset.lang)));
    $('mspName').value = S.mspName;
    $('mspName').addEventListener('input', e => { S.mspName = e.target.value; updateDelivery(); saveSoon(); });

    // Actions
    $('changeEngBtn').addEventListener('click', showSelect);
    $('generateBtn').addEventListener('click', onGenerate);
    $('clearBtn').addEventListener('click', () => startOver(false));
    $('langRegenBtn').addEventListener('click', onGenerate);
    $('copyAllBtn').addEventListener('click', onCopyAll);
    $('copyNextBtn').addEventListener('click', onCopyNext);
    $('pushTemplateBtn').addEventListener('click', () => onPush('template'));
    $('pushWidgetsBtn').addEventListener('click', () => onPush('widgets'));
    $('pushBothBtn').addEventListener('click', () => onPush('both'));
    $('credsSaveBtn').addEventListener('click', onCredsSave);
    $('credsCancelBtn').addEventListener('click', () => { $('credsInline').hidden = true; pendingPush = null; });
    $('anotherBtn').addEventListener('click', () => startOver(true));
    $('pasteHelp').addEventListener('toggle', e => { e.currentTarget.dataset.touched = '1'; });

    // Reference panel
    $('helpBtnHeader').addEventListener('click', () => toggleRef());
    $('helpBtnWidgets').addEventListener('click', () => toggleRef(true));
    $('refCloseBtn').addEventListener('click', () => toggleRef(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleRef(false); });

    // Apply restored state
    syncWidgetChecks();
    setLanguage(S.language);
    setColor(S.color, 'init');

    if (S.engagementKey && currentEng()) {
      showBuild();
      if (hasGenerated()) {
        progressKeys = readyKeys();
        $('progressList').innerHTML = '';
        finishProgress();
        renderProducts();
      }
    } else {
      showSelect();
    }
  }

  init();
})();
