(() => {
  'use strict';

  const CONTRIBUTORS = [
    { key: 'victor',  name: 'Victor',  role: 'Prospects & Lite CRM', emoji: '🎯', prefix: 'Prospects — ',  password: 'victor2026'  },
    { key: 'michael', name: 'Michael', role: 'CGOS / 360 View',      emoji: '🔄', prefix: 'CGOS — ',       password: 'michael2026' },
    { key: 'bram',    name: 'Bram',    role: 'Storefront',           emoji: '🛍️', prefix: 'Storefront — ', password: 'bram2026'    }
  ];

  const STATUS_CONFIG = {
    discovery:  { label: '🔍 Exploring', className: 'badge-discovery',  dot: '#92400E' },
    inprogress: { label: '⚡ In Flight',  className: 'badge-inprogress', dot: '#065F46' },
    building:   { label: '🛠 Building',   className: 'badge-building',   dot: '#1E40AF' },
    review:     { label: '👀 Review',     className: 'badge-review',     dot: '#5B21B6' },
    shipped:    { label: '✅ Shipped',    className: 'badge-shipped',    dot: '#14532D' },
    stuck:      { label: '🚨 Stuck!',     className: 'badge-stuck',      dot: '#991B1B' }
  };

  let state = { victor: [], michael: [], bram: [] };
  let openForm = null; // currently-open post form element, if any
  let loomObserver = null;

  // ---------- Init ----------

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    buildZones();
    wireGlobalControls();
    await loadData();
  }

  function buildZones() {
    const grid = document.getElementById('zonesGrid');
    const zoneTpl = document.getElementById('zoneTemplate');

    CONTRIBUTORS.forEach(c => {
      const node = zoneTpl.content.cloneNode(true);
      const zoneEl = node.querySelector('.zone');
      zoneEl.dataset.contributor = c.key;
      zoneEl.querySelector('.zone-emoji').textContent = c.emoji;
      zoneEl.querySelector('.zone-name').textContent = c.name;
      zoneEl.querySelector('.zone-role').textContent = c.role.toUpperCase();
      zoneEl.querySelector('.zone-cards').id = `cards-${c.key}`;

      const toggleBtn = zoneEl.querySelector('.post-toggle');
      const form = zoneEl.querySelector('.post-form');
      form.dataset.contributor = c.key;
      form.querySelector('.f-name').value = c.prefix;

      toggleBtn.addEventListener('click', () => togglePostForm(form));
      form.querySelector('.f-cancel').addEventListener('click', () => closePostForm(form));
      form.addEventListener('submit', (e) => handlePostSubmit(e, c, form));

      grid.appendChild(node);
    });
  }

  function wireGlobalControls() {
    document.getElementById('aiSummaryBtn').addEventListener('click', openAiSummary);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('modalBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'modalBackdrop') closeModal();
    });
  }

  // ---------- Data loading ----------

  async function loadData() {
    try {
      const res = await fetch('/api/showcase-data');
      const data = await res.json();
      if (data.ok) {
        state = { victor: data.victor || [], michael: data.michael || [], bram: data.bram || [] };
      }
    } catch (err) {
      console.error('Failed to load updates:', err);
    }
    renderAll();
    document.getElementById('loadingOverlay').hidden = true;
    document.getElementById('zonesGrid').hidden = false;
  }

  function renderAll() {
    CONTRIBUTORS.forEach(c => renderZoneCards(c.key));
    renderStatusBar();
    setupLoomObserver();
  }

  // ---------- Rendering cards ----------

  function renderZoneCards(contributorKey) {
    const container = document.getElementById(`cards-${contributorKey}`);
    container.innerHTML = '';
    const updates = [...state[contributorKey]].sort(
      (a, b) => new Date(b.postedAt) - new Date(a.postedAt)
    );
    updates.forEach(update => container.appendChild(buildCard(contributorKey, update)));
  }

  function buildCard(contributorKey, update) {
    const tpl = document.getElementById('cardTemplate');
    const node = tpl.content.cloneNode(true);
    const card = node.querySelector('.update-card');
    card.dataset.id = update.id;
    card.dataset.contributor = contributorKey;

    card.querySelector('.card-feature').textContent = update.featureName;

    const statusInfo = STATUS_CONFIG[update.status] || STATUS_CONFIG.discovery;
    const badge = card.querySelector('.card-badge');
    badge.textContent = statusInfo.label;
    badge.classList.add(statusInfo.className);

    card.querySelector('.card-mood').textContent = update.mood || '';
    card.querySelector('.card-description').textContent = update.description || '';

    const dateEl = card.querySelector('.card-date');
    dateEl.textContent = formatDate(update.postedAt);

    const loomBox = card.querySelector('.card-loom');
    const embedUrl = getLoomEmbed(update.loomUrl);
    if (embedUrl) {
      loomBox.hidden = false;
      loomBox.dataset.embedUrl = embedUrl;
    }

    // Feedback
    const feedbackLink = card.querySelector('.feedback-link');
    const feedbackForm = card.querySelector('.feedback-form');
    feedbackLink.addEventListener('click', (e) => {
      e.preventDefault();
      feedbackForm.hidden = !feedbackForm.hidden;
    });
    feedbackForm.querySelector('.fb-cancel').addEventListener('click', () => {
      feedbackForm.hidden = true;
    });
    feedbackForm.addEventListener('submit', (e) =>
      handleFeedbackSubmit(e, contributorKey, update, feedbackForm)
    );

    // Stuck helper
    const stuckBox = card.querySelector('.card-stuck-helper');
    if (update.status === 'stuck') {
      stuckBox.hidden = false;
      const link = stuckBox.querySelector('.stuck-ai-link');
      link.addEventListener('click', (e) => {
        e.preventDefault();
        handleStuckHelper(update, stuckBox);
      });
    }

    return node;
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ---------- Loom embeds ----------

  function getLoomEmbed(url) {
    if (!url) return null;
    const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (!match) return null;
    return `https://www.loom.com/embed/${match[1]}`;
  }

  function setupLoomObserver() {
    if (loomObserver) loomObserver.disconnect();
    loomObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const box = entry.target;
          if (box.dataset.embedUrl && !box.querySelector('iframe')) {
            const iframe = document.createElement('iframe');
            iframe.src = box.dataset.embedUrl;
            iframe.allow = 'autoplay; fullscreen';
            iframe.allowFullscreen = true;
            box.appendChild(iframe);
          }
          loomObserver.unobserve(box);
        }
      });
    }, { rootMargin: '150px' });

    document.querySelectorAll('.card-loom[data-embed-url]').forEach(box => {
      loomObserver.observe(box);
    });
  }

  // ---------- Posting an update ----------

  function togglePostForm(form) {
    if (openForm && openForm !== form) {
      closePostForm(openForm);
    }
    if (form.hidden) {
      form.hidden = false;
      openForm = form;
    } else {
      closePostForm(form);
    }
  }

  function closePostForm(form) {
    form.hidden = true;
    form.querySelector('.f-error').hidden = true;
    if (openForm === form) openForm = null;
  }

  async function handlePostSubmit(e, contributor, form) {
    e.preventDefault();
    const errorEl = form.querySelector('.f-error');
    errorEl.hidden = true;

    const password = form.querySelector('.f-password').value;
    if (password !== contributor.password) {
      errorEl.textContent = 'Incorrect password for this zone.';
      errorEl.hidden = false;
      return;
    }

    const update = {
      id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
      featureName: form.querySelector('.f-name').value.trim(),
      status: form.querySelector('.f-status').value,
      mood: form.querySelector('.f-mood').value,
      description: form.querySelector('.f-description').value.trim(),
      loomUrl: form.querySelector('.f-loom').value.trim(),
      postedAt: new Date().toISOString()
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      const res = await fetch('/api/showcase-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contributor: contributor.key, update })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed to post update.');

      state[contributor.key] = [update, ...state[contributor.key]];
      renderZoneCards(contributor.key);
      renderStatusBar();
      setupLoomObserver();

      form.reset();
      form.querySelector('.f-name').value = contributor.prefix;
      closePostForm(form);
    } catch (err) {
      errorEl.textContent = 'Something went wrong posting your update. Please try again.';
      errorEl.hidden = false;
      console.error(err);
    } finally {
      submitBtn.disabled = false;
    }
  }

  // ---------- Feedback ----------

  async function handleFeedbackSubmit(e, contributorKey, update, form) {
    e.preventDefault();
    const statusEl = form.querySelector('.fb-status');
    const comment = form.querySelector('.fb-comment').value.trim();
    const name = form.querySelector('.fb-name').value.trim();
    const submitBtn = form.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    statusEl.hidden = true;
    statusEl.classList.remove('success');

    try {
      const res = await fetch('/api/showcase-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contributor: contributorKey,
          featureName: update.featureName,
          comment,
          name
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error('Failed to send feedback.');

      statusEl.textContent = 'Sent ✓';
      statusEl.classList.add('success');
      statusEl.hidden = false;
      form.reset();
      setTimeout(() => { form.hidden = true; statusEl.hidden = true; }, 1500);
    } catch (err) {
      statusEl.textContent = 'Could not send feedback — please try again.';
      statusEl.hidden = false;
      console.error(err);
    } finally {
      submitBtn.disabled = false;
    }
  }

  // ---------- Stuck helper ----------

  async function handleStuckHelper(update, stuckBox) {
    const existing = stuckBox.querySelector('.stuck-suggestions');
    if (existing) { existing.remove(); return; }

    const link = stuckBox.querySelector('.stuck-ai-link');
    const originalText = link.textContent;
    link.textContent = 'Thinking…';

    try {
      const res = await fetch('/api/showcase-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'stuck',
          featureName: update.featureName,
          description: update.description
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error('AI request failed.');

      const box = document.createElement('div');
      box.className = 'stuck-suggestions';
      const list = (data.suggestions || []).map(s => `<li>${escapeHtml(s)}</li>`).join('');
      box.innerHTML = `<ol>${list}</ol><span class="dismiss-link">Dismiss</span>`;
      box.querySelector('.dismiss-link').addEventListener('click', () => box.remove());
      stuckBox.appendChild(box);
    } catch (err) {
      console.error(err);
      const box = document.createElement('div');
      box.className = 'stuck-suggestions';
      box.textContent = 'Could not get suggestions right now — try again in a bit.';
      stuckBox.appendChild(box);
    } finally {
      link.textContent = originalText;
    }
  }

  // ---------- AI weekly summary ----------

  async function openAiSummary() {
    const backdrop = document.getElementById('modalBackdrop');
    const body = document.getElementById('modalBody');
    backdrop.hidden = false;
    body.textContent = 'Generating summary…';

    const allUpdates = CONTRIBUTORS.map(c => ({
      contributor: c.name,
      updates: state[c.key].map(u => ({
        featureName: u.featureName,
        status: u.status,
        description: u.description
      }))
    }));

    try {
      const res = await fetch('/api/showcase-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'summary', updates: allUpdates })
      });
      const data = await res.json();
      if (!data.ok) throw new Error('AI request failed.');
      body.textContent = data.summary;
    } catch (err) {
      body.textContent = 'Could not generate the summary right now — try again in a bit.';
      console.error(err);
    }
  }

  function closeModal() {
    document.getElementById('modalBackdrop').hidden = true;
  }

  // ---------- Status bar ----------

  function renderStatusBar() {
    const all = [...state.victor, ...state.michael, ...state.bram];
    const counts = all.reduce((acc, u) => {
      acc[u.status] = (acc[u.status] || 0) + 1;
      return acc;
    }, {});

    const bar = document.getElementById('statusBar');
    bar.innerHTML = '';

    const order = ['discovery', 'inprogress', 'building', 'review', 'shipped', 'stuck'];
    order.forEach(key => {
      if (!counts[key]) return;
      const info = STATUS_CONFIG[key];
      const item = document.createElement('span');
      item.className = 'status-bar-item';
      item.innerHTML = `<span class="status-dot" style="background:${info.dot}"></span>${counts[key]} ${info.label.replace(/^\S+\s/, '')}`;
      bar.appendChild(item);
    });

    if (!bar.children.length) {
      bar.textContent = 'No updates posted yet.';
    }
  }

  // ---------- Utils ----------

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

})();
