(() => {
  'use strict';

  const CONTRIBUTORS = [
    { key: 'victor',  name: 'Victor',  role: 'Prospects & Lite CRM', emoji: '🎯', prefix: 'Prospects — '  },
    { key: 'michael', name: 'Michael', role: 'CGOS / 360 View',      emoji: '🔄', prefix: 'CGOS — '       },
    { key: 'bram',    name: 'Bram',    role: 'Storefront',           emoji: '🛍️', prefix: 'Storefront — ' }
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
      form._screenshots = [];

      const screenshotInput = form.querySelector('.f-screenshots');
      const previewBox = form.querySelector('.f-screenshot-preview');
      screenshotInput.addEventListener('change', (e) => handleScreenshotSelect(e, form, previewBox));

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

    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    document.getElementById('lightboxBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'lightboxBackdrop') closeLightbox();
    });
    document.getElementById('lightboxPrev').addEventListener('click', showPrevScreenshot);
    document.getElementById('lightboxNext').addEventListener('click', showNextScreenshot);

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      closeLightbox();
      closeModal();
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

    const shotsBox = card.querySelector('.card-screenshots');
    if (Array.isArray(update.screenshots) && update.screenshots.length) {
      shotsBox.hidden = false;
      update.screenshots.forEach((src, idx) => {
        const thumb = document.createElement('img');
        thumb.src = src;
        thumb.className = 'card-screenshot-thumb';
        thumb.alt = `${update.featureName} screenshot ${idx + 1}`;
        thumb.addEventListener('click', () => openLightbox(update.screenshots, idx));
        shotsBox.appendChild(thumb);
      });
    }

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

    // Delete
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => handleDelete(contributorKey, update.id, card));

    return node;
  }

  async function handleDelete(contributorKey, id, cardEl) {
    const confirmed = window.confirm('Delete this update? This cannot be undone.');
    if (!confirmed) return;

    try {
      const res = await fetch('/api/showcase-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contributor: contributorKey, action: 'delete', id })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed to delete update.');

      state[contributorKey] = state[contributorKey].filter((u) => u.id !== id);
      cardEl.remove();
      renderStatusBar();
    } catch (err) {
      console.error(err);
      window.alert('Could not delete this update — please try again.');
    }
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

    const update = {
      id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
      featureName: form.querySelector('.f-name').value.trim(),
      status: form.querySelector('.f-status').value,
      mood: form.querySelector('.f-mood').value,
      description: form.querySelector('.f-description').value.trim(),
      loomUrl: form.querySelector('.f-loom').value.trim(),
      screenshots: [...form._screenshots],
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
      form._screenshots = [];
      form.querySelector('.f-screenshot-preview').innerHTML = '';
      closePostForm(form);
    } catch (err) {
      errorEl.textContent = 'Something went wrong posting your update. Please try again.';
      errorEl.hidden = false;
      console.error(err);
    } finally {
      submitBtn.disabled = false;
    }
  }

  // ---------- Screenshot handling ----------

  function handleScreenshotSelect(e, form, previewBox) {
    const files = Array.from(e.target.files || []);
    const remainingSlots = 2 - form._screenshots.length;
    const filesToAdd = files.slice(0, Math.max(remainingSlots, 0));

    Promise.all(filesToAdd.map(compressImage))
      .then((dataUrls) => {
        form._screenshots.push(...dataUrls);
        renderScreenshotPreview(form, previewBox);
      })
      .catch((err) => console.error('Failed to process screenshot:', err));

    e.target.value = ''; // allow re-selecting the same file later
  }

  function renderScreenshotPreview(form, previewBox) {
    previewBox.innerHTML = '';
    form._screenshots.forEach((dataUrl, idx) => {
      const item = document.createElement('div');
      item.className = 'f-screenshot-item';

      const img = document.createElement('img');
      img.src = dataUrl;
      item.appendChild(img);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'f-screenshot-remove';
      removeBtn.textContent = '×';
      removeBtn.setAttribute('aria-label', 'Remove screenshot');
      removeBtn.addEventListener('click', () => {
        form._screenshots.splice(idx, 1);
        renderScreenshotPreview(form, previewBox);
      });
      item.appendChild(removeBtn);

      previewBox.appendChild(item);
    });
  }

  function compressImage(file, maxWidth = 900, quality = 0.72) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ---------- Lightbox ----------

  let lightboxImages = [];
  let lightboxIndex = 0;

  function openLightbox(images, index) {
    lightboxImages = images;
    lightboxIndex = index;
    updateLightboxView();
    document.getElementById('lightboxBackdrop').hidden = false;
  }

  function closeLightbox() {
    document.getElementById('lightboxBackdrop').hidden = true;
  }

  function showPrevScreenshot() {
    lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
    updateLightboxView();
  }

  function showNextScreenshot() {
    lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
    updateLightboxView();
  }

  function updateLightboxView() {
    document.getElementById('lightboxImage').src = lightboxImages[lightboxIndex];
    const multiple = lightboxImages.length > 1;
    document.getElementById('lightboxPrev').hidden = !multiple;
    document.getElementById('lightboxNext').hidden = !multiple;
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
