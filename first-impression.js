/* =========================================================
   First Impression — first-impression.js
   ========================================================= */

const LS_API_KEY  = 'sb_api_key';
const LS_INT_KEY  = 'sb_int_key';
const LS_REP_NAME = 'fi_rep_name';

// ── State ─────────────────────────────────────────────────
let generatedImageUrl  = '';
let selectedTemplate   = 'chevron';
let autoResults        = {};   // templateId → imageUrl
let autoSelectedId     = null; // currently selected template in auto result
let autoCompanyName    = '';
let autoBrandColor     = '#1a4da0';
let autoPhotoUrl       = '';
let autoPhoto2Url      = '';

// ── DOM — Views ───────────────────────────────────────────
const formView       = document.getElementById('form-view');
const workingView    = document.getElementById('working-view');
const resultAutoView = document.getElementById('result-auto-view');
const resultView     = document.getElementById('result-view');
const workTitle      = document.getElementById('working-title');
const workSub        = document.getElementById('working-sub');

// ── DOM — Auto mode ───────────────────────────────────────
const autoWebsiteInput   = document.getElementById('auto-website');
const autoRepInput       = document.getElementById('auto-rep');
const autoBtn            = document.getElementById('auto-btn');
const autoError          = document.getElementById('auto-error');
const resultAutoTitle    = document.getElementById('result-auto-title');
const coversGrid         = document.getElementById('covers-grid');
const selectedCoverActions = document.getElementById('selected-cover-actions');
const selectedCoverImg   = document.getElementById('selected-cover-img');
const autoDownloadBtn    = document.getElementById('auto-download-btn');
const autoPushBtn        = document.getElementById('auto-push-btn');
const autoPushResult     = document.getElementById('auto-push-result');
const autoMiniToggle     = document.getElementById('auto-mini-toggle');
const autoMiniArrow      = document.getElementById('auto-mini-arrow');
const autoMiniBody       = document.getElementById('auto-mini-body');
const autoSbApiKey       = document.getElementById('auto-sb-api-key');
const autoSbIntKey       = document.getElementById('auto-sb-int-key');
const autoSbRemember     = document.getElementById('auto-sb-remember');
const restartAutoBtn     = document.getElementById('restart-auto-btn');
const logoMissingBanner  = document.getElementById('logo-missing-banner');
const logoMissingInput   = document.getElementById('logo-missing-input');
const logoMissingBtn     = document.getElementById('logo-missing-btn');
const manualToggleBtn    = document.getElementById('manual-toggle-btn');
const manualSection      = document.getElementById('manual-section');


// ── DOM — Manual mode ─────────────────────────────────────
const companyInput   = document.getElementById('company-name');
const websiteInput   = document.getElementById('website-url');
const extractBtn     = document.getElementById('extract-btn');
const extractStatus  = document.getElementById('extract-status');
const colorPicker    = document.getElementById('brand-color-picker');
const colorHex       = document.getElementById('brand-color-hex');
const colorPreview   = document.getElementById('color-preview');
const logoUrlInput   = document.getElementById('logo-url');
const previewLogoBtn = document.getElementById('preview-logo-btn');
const logoPreviewArea= document.getElementById('logo-preview-area');
const logoPreviewImg = document.getElementById('logo-preview-img');
const logoClearBtn   = document.getElementById('logo-preview-clear');
const industrySelect   = document.getElementById('industry');
const findPhotosBtn    = document.getElementById('find-photos-btn');
const photoPicker      = document.getElementById('photo-picker');
const photoGrid        = document.getElementById('photo-grid');
const morePhotosBtn    = document.getElementById('more-photos-btn');
const photoLoading     = document.getElementById('photo-loading');
const photoCredit      = document.getElementById('photo-credit');
const websitePhotosBtn      = document.getElementById('website-photos-btn');
const websitePhotoPicker    = document.getElementById('website-photo-picker');
const websitePhotoGrid      = document.getElementById('website-photo-grid');
const websitePhotoLoading   = document.getElementById('website-photo-loading');
const websitePhotoEmpty     = document.getElementById('website-photo-empty');
const websitePhotosBackBtn  = document.getElementById('website-photos-back-btn');
let   selectedPhotoUrl = '';
let   photoPage        = 1;
let   photoFocalPoint  = 0.5;
const repNameInput   = document.getElementById('rep-name');
const focalControl    = document.getElementById('focal-control');
const focalSlider     = document.getElementById('focal-slider');
const focalValueLabel = document.getElementById('focal-value-label');
const focalPreviewImg = document.getElementById('focal-preview-img');
const focalViewport   = document.getElementById('focal-viewport');
const generateBtn    = document.getElementById('generate-btn');
const formError      = document.getElementById('form-error');
const restartBtn     = document.getElementById('restart-btn');

const coverPreview = document.getElementById('cover-preview');
const resultTitle  = document.getElementById('result-title');
const downloadBtn  = document.getElementById('download-btn');
const pushBtn      = document.getElementById('push-btn');
const pushResult   = document.getElementById('push-result');

const miniToggle = document.getElementById('mini-toggle');
const miniArrow  = document.getElementById('mini-arrow');
const miniBody   = document.getElementById('mini-body');
const sbApiKey   = document.getElementById('sb-api-key');
const sbIntKey   = document.getElementById('sb-int-key');
const sbRemember = document.getElementById('sb-remember');

// ── Init ──────────────────────────────────────────────────
function init() {
  const savedApi  = localStorage.getItem(LS_API_KEY);
  const savedInt  = localStorage.getItem(LS_INT_KEY);
  const savedRep  = localStorage.getItem(LS_REP_NAME);
  if (savedApi) { sbApiKey.value = savedApi; autoSbApiKey.value = savedApi; }
  if (savedInt) { sbIntKey.value = savedInt; autoSbIntKey.value = savedInt; }
  if (savedRep) { repNameInput.value = savedRep; autoRepInput.value = savedRep; }
  if (savedApi && savedInt) { sbRemember.checked = true; autoSbRemember.checked = true; }
}

// ── View switching ────────────────────────────────────────
function showView(name) {
  formView.hidden       = name !== 'form';
  workingView.hidden    = name !== 'working';
  resultAutoView.hidden = name !== 'result-auto';
  resultView.hidden     = name !== 'result';
}

// ── Colour picker sync ────────────────────────────────────
function isValidHex(v) { return /^#[0-9a-fA-F]{6}$/.test(v); }

colorPicker.addEventListener('input', () => {
  colorHex.value           = colorPicker.value.toUpperCase();
  colorPreview.style.background = colorPicker.value;
  updateTemplatePreview(colorPicker.value);
});
colorHex.addEventListener('input', () => {
  const v = colorHex.value.trim().startsWith('#') ? colorHex.value.trim() : '#' + colorHex.value.trim();
  if (isValidHex(v)) {
    colorPicker.value             = v;
    colorPreview.style.background = v;
    updateTemplatePreview(v);
  }
});

function updateTemplatePreview() {
  // Template thumbnails use a fixed neutral — they show layout shape, not brand colour
}

// ── Manual section toggle ─────────────────────────────────
manualToggleBtn.addEventListener('click', () => {
  const open = !manualSection.hidden;
  manualSection.hidden = open;
  manualToggleBtn.textContent = open ? '⚙ Customise manually ▼' : '⚙ Customise manually ▲';
});

// ── Auto mode ─────────────────────────────────────────────
function showAutoError(msg) {
  autoError.textContent = msg;
  autoError.hidden = false;
}
function clearAutoError() { autoError.hidden = true; }

const TEMPLATE_NAMES = {
  chevron:     'Chevron',
  half_circle: 'Half Circle',
  corporate:   'Corporate',
  modern:      'Modern'
};

autoBtn.addEventListener('click', async () => {
  clearAutoError();
  const url = autoWebsiteInput.value.trim();
  if (!url) {
    showAutoError('Please enter their website URL.');
    autoWebsiteInput.focus();
    return;
  }

  const repName = autoRepInput.value.trim();
  if (repName) localStorage.setItem(LS_REP_NAME, repName);

  autoBtn.disabled = true;
  showView('working');

  try {
    // Step 1 — analyse website
    workTitle.textContent = 'Scanning their website…';
    workSub.textContent   = 'Extracting brand colour, logo and photos';

    const analyseRes  = await fetch('/api/generate-cover', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'analyse', websiteUrl: url })
    });
    const analyseData = await analyseRes.json();
    if (!analyseRes.ok || !analyseData.ok) throw new Error(analyseData.error || 'Could not scan website.');

    const { brandColor, logoUrl: foundLogoUrl, photoUrl, photo2Url, photoByTemplate } = analyseData;
    autoBrandColor  = brandColor;
    autoPhotoUrl    = photoUrl;
    autoPhoto2Url   = photo2Url || photoUrl;
    let autoLogoUrl = foundLogoUrl || null;

    // Extract company name from URL for display
    try {
      autoCompanyName = new URL(url).hostname.replace(/^www\./, '').split('.')[0];
      autoCompanyName = autoCompanyName.charAt(0).toUpperCase() + autoCompanyName.slice(1);
    } catch (e) { autoCompanyName = url; }

    if (!photoUrl) throw new Error('Could not find a suitable photo. Try the manual mode instead.');

    // Step 2 — fire all 4 Placid renders
    workTitle.textContent = 'Rendering all four templates…';
    workSub.textContent   = 'Applying their branding to each design — usually 15–20 seconds';

    const startRes  = await fetch('/api/generate-cover', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'start-all', brandColor, logoUrl: autoLogoUrl, photoUrl, photo2Url, photoByTemplate })
    });
    const startData = await startRes.json();
    if (!startRes.ok || !startData.ok) throw new Error(startData.error || 'Could not start rendering.');

    const renders = startData.renders;

    // Step 3 — show result grid immediately, poll for each image
    resultAutoTitle.textContent = autoCompanyName;
    coversGrid.innerHTML = '';
    selectedCoverActions.hidden = true;
    autoResults = {};

    // Show logo missing banner if no logo was found
    if (!autoLogoUrl) {
      logoMissingBanner.hidden = false;
      logoMissingInput.value   = '';
      logoMissingBtn.disabled  = false;
      logoMissingBtn.textContent = 'Add Logo & Re-render →';
    } else {
      logoMissingBanner.hidden = true;
    }

    // Build tiles — show spinner until each image is ready
    renders.forEach(({ templateId, name, imageId, imageUrl }) => {
      const tile = document.createElement('div');
      tile.className = 'cover-tile';
      tile.dataset.templateId = templateId;
      tile.innerHTML = `
        <div class="cover-tile-spinner"><div class="spinner-sm"></div></div>
        <div class="cover-tile-label">${name}</div>
        <div class="cover-tile-check">✓</div>
      `;
      tile.addEventListener('click', () => selectCover(templateId));
      coversGrid.appendChild(tile);

      // If already done, populate immediately
      if (imageUrl) {
        setTileImage(tile, imageUrl);
        autoResults[templateId] = imageUrl;
      }
    });

    showView('result-auto');

    // Step 4 — poll for any not-yet-ready renders
    const pending = renders.filter(r => !r.imageUrl);
    if (pending.length > 0) {
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const pollRes  = await fetch('/api/generate-cover', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            action:   'poll-all',
            imageIds: pending
              .filter(r => !autoResults[r.templateId])
              .map(r => ({ templateId: r.templateId, imageId: r.imageId }))
          })
        });
        const pollData = await pollRes.json();
        if (pollData.ok) {
          pollData.renders.forEach(({ templateId, ready, imageUrl }) => {
            if (ready && imageUrl && !autoResults[templateId]) {
              autoResults[templateId] = imageUrl;
              const tile = coversGrid.querySelector(`[data-template-id="${templateId}"]`);
              if (tile) setTileImage(tile, imageUrl);
            }
          });
        }
        if (Object.keys(autoResults).length === renders.length) break;
      }
    }

  } catch (err) {
    showView('form');
    showAutoError(err.message || 'Something went wrong. Please try again.');
  } finally {
    autoBtn.disabled = false;
  }
});

function setTileImage(tile, imageUrl) {
  const spinner = tile.querySelector('.cover-tile-spinner');
  if (spinner) {
    const img = document.createElement('img');
    img.className = 'cover-tile-img';
    img.src = imageUrl;
    img.alt = '';
    spinner.replaceWith(img);
  }
}

function selectCover(templateId) {
  const imageUrl = autoResults[templateId];
  if (!imageUrl) return;

  // Update tile selection
  coversGrid.querySelectorAll('.cover-tile').forEach(t => t.classList.remove('is-selected'));
  const tile = coversGrid.querySelector(`[data-template-id="${templateId}"]`);
  if (tile) tile.classList.add('is-selected');

  autoSelectedId = templateId;

  // Show actions panel
  selectedCoverImg.src         = imageUrl;
  autoDownloadBtn.href         = imageUrl;
  autoDownloadBtn.download     = `${autoCompanyName}-${templateId}-cover.png`;
  autoDownloadBtn.textContent  = '⬇ Download Cover Page';
  autoPushResult.hidden        = true;
  autoPushBtn.disabled         = false;
  autoPushBtn.textContent      = 'Save to Salesbuildr →';
  autoPushBtn.classList.remove('is-done');
  selectedCoverActions.hidden  = false;
  selectedCoverActions.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Auto Salesbuildr connect toggle
autoMiniToggle.addEventListener('click', () => {
  const open = !autoMiniBody.hidden;
  autoMiniBody.hidden = open;
  autoMiniArrow.classList.toggle('is-open', !open);
});

// Auto push to Salesbuildr
autoPushBtn.addEventListener('click', async () => {
  const apiKey = autoSbApiKey.value.trim();
  const intKey = autoSbIntKey.value.trim();
  if (!apiKey || !intKey) {
    autoMiniBody.hidden = false;
    autoMiniArrow.classList.add('is-open');
    autoSbApiKey.focus();
    return;
  }
  if (autoSbRemember.checked) { localStorage.setItem(LS_API_KEY, apiKey); localStorage.setItem(LS_INT_KEY, intKey); }
  else { localStorage.removeItem(LS_API_KEY); localStorage.removeItem(LS_INT_KEY); }

  autoPushBtn.disabled    = true;
  autoPushBtn.textContent = 'Saving…';
  autoPushResult.hidden   = true;

  const imageUrl = autoResults[autoSelectedId];
  const name     = TEMPLATE_NAMES[autoSelectedId] || autoSelectedId;

  try {
    const res  = await fetch('/api/generate-cover', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        action: 'push', imageUrl,
        companyName: autoCompanyName,
        brandColor:  autoBrandColor,
        apiKey, integrationKey: intKey
      })
    });
    const data = await res.json();
    if (data.ok) {
      autoPushResult.textContent = `✓ Saved as "${data.name}" in your Salesbuildr widget library.`;
      autoPushResult.className   = 'push-result';
      autoPushResult.hidden      = false;
      autoPushBtn.textContent    = '✓ Saved to Salesbuildr';
      autoPushBtn.classList.add('is-done');
    } else throw new Error(data.error || 'Push failed.');
  } catch (err) {
    autoPushResult.textContent = `✕ ${err.message}`;
    autoPushResult.className   = 'push-result is-error';
    autoPushResult.hidden      = false;
    autoPushBtn.disabled       = false;
    autoPushBtn.textContent    = 'Save to Salesbuildr →';
  }
});

// Restart from auto result
restartAutoBtn.addEventListener('click', () => {
  autoResults     = {};
  autoSelectedId  = null;
  autoPhotoUrl    = '';
  autoPhoto2Url   = '';
  coversGrid.innerHTML = '';
  selectedCoverActions.hidden = true;
  autoPushResult.hidden       = true;
  logoMissingBanner.hidden    = true;
  showView('form');
});

// Logo missing — re-render all covers with the pasted logo URL
logoMissingBtn.addEventListener('click', async () => {
  const logoUrl = logoMissingInput.value.trim();
  if (!logoUrl) { logoMissingInput.focus(); return; }

  logoMissingBtn.disabled    = true;
  logoMissingBtn.textContent = 'Re-rendering…';

  // Get the photoUrls from the existing renders — reuse same photos
  // We need to re-fire start-all with the new logo
  // Pull photoUrl from the working view state isn't available, so store it
  try {
    const startRes = await fetch('/api/generate-cover', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        action:    'start-all',
        brandColor: autoBrandColor,
        logoUrl,
        photoUrl:   autoPhotoUrl,
        photo2Url:  autoPhoto2Url
      })
    });
    const startData = await startRes.json();
    if (!startRes.ok || !startData.ok) throw new Error(startData.error || 'Re-render failed.');

    // Reset grid spinners
    autoResults = {};
    selectedCoverActions.hidden = true;
    coversGrid.querySelectorAll('.cover-tile').forEach(tile => {
      const label = tile.querySelector('.cover-tile-label').textContent;
      tile.innerHTML = `
        <div class="cover-tile-spinner"><div class="spinner-sm"></div></div>
        <div class="cover-tile-label">${label}</div>
        <div class="cover-tile-check">✓</div>
      `;
      tile.classList.remove('is-selected');
      tile.addEventListener('click', () => selectCover(tile.dataset.templateId));
    });

    logoMissingBanner.hidden = true;

    // Poll for results
    const pending = startData.renders.filter(r => !r.imageUrl);
    startData.renders.forEach(r => {
      if (r.imageUrl) {
        autoResults[r.templateId] = r.imageUrl;
        const tile = coversGrid.querySelector(`[data-template-id="${r.templateId}"]`);
        if (tile) setTileImage(tile, r.imageUrl);
      }
    });

    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const stillPending = pending.filter(r => !autoResults[r.templateId]);
      if (!stillPending.length) break;
      const pollRes  = await fetch('/api/generate-cover', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'poll-all', imageIds: stillPending.map(r => ({ templateId: r.templateId, imageId: r.imageId })) })
      });
      const pollData = await pollRes.json();
      if (pollData.ok) {
        pollData.renders.forEach(({ templateId, ready, imageUrl }) => {
          if (ready && imageUrl && !autoResults[templateId]) {
            autoResults[templateId] = imageUrl;
            const tile = coversGrid.querySelector(`[data-template-id="${templateId}"]`);
            if (tile) setTileImage(tile, imageUrl);
          }
        });
      }
    }

  } catch (e) {
    logoMissingBtn.disabled    = false;
    logoMissingBtn.textContent = 'Add Logo & Re-render →';
    logoMissingBanner.querySelector('.logo-missing-body strong').textContent = `✕ ${e.message} —`;
  }
});

// ── Focal point slider ────────────────────────────────────
// Updates the live crop preview thumbnail to show exactly what
// portion of the photo will appear in the portrait cover canvas.
function updateFocalPreview(sliderVal) {
  const vpW = focalViewport.offsetWidth  || 80;
  const vpH = focalViewport.offsetHeight || 110;
  const imgNW = focalPreviewImg.naturalWidth  || 1;
  const imgNH = focalPreviewImg.naturalHeight || 1;

  // Strategy: scale so the image is tall enough to scroll meaningfully.
  // Scale by width first; if the result isn't taller than the viewport, scale by height instead.
  const scaleByW   = vpW / imgNW;
  const heightIfW  = imgNH * scaleByW;

  let renderW, renderH;
  if (heightIfW >= vpH * 1.3) {
    // Portrait-ish image — width-fill gives enough height to scroll
    renderW = vpW;
    renderH = heightIfW;
  } else {
    // Landscape image — scale so height is 2× the viewport so scrolling is obvious
    const scaleByH = (vpH * 2) / imgNH;
    renderW = imgNW * scaleByH;
    renderH = vpH * 2;
  }

  const maxOffset = renderH - vpH;
  const topOffset = -(maxOffset * (sliderVal / 100));

  focalPreviewImg.style.width  = renderW + 'px';
  focalPreviewImg.style.height = renderH + 'px';
  focalPreviewImg.style.top    = topOffset + 'px';
  // Centre horizontally if wider than viewport
  focalPreviewImg.style.left   = renderW > vpW ? ((vpW - renderW) / 2) + 'px' : '0px';
}

function focalLabel(v) {
  if (v <= 10) return 'Very Top';
  if (v <= 25) return 'Top';
  if (v <= 40) return 'Upper';
  if (v <= 60) return 'Centre';
  if (v <= 75) return 'Lower';
  if (v <= 90) return 'Bottom';
  return 'Very Bottom';
}

focalSlider.addEventListener('input', () => {
  const v         = parseInt(focalSlider.value);
  photoFocalPoint = v / 100;
  focalValueLabel.textContent = focalLabel(v);
  updateFocalPreview(v);
});


// ── Photo picker ──────────────────────────────────────────
async function fetchPhotos() {
  findPhotosBtn.disabled    = true;
  findPhotosBtn.textContent = 'Searching…';
  photoLoading.hidden       = false;
  photoPicker.hidden        = true;
  selectedPhotoUrl          = '';

  try {
    const res  = await fetch('/api/generate-cover', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'photos', industry: industrySelect.value, page: photoPage })
    });
    const data = await res.json();
    if (!data.ok || !data.photos.length) throw new Error('No photos found.');

    renderPhotos(data.photos);
    photoPicker.hidden = false;
  } catch (e) {
    showFormError('Could not load photos: ' + e.message);
  } finally {
    photoLoading.hidden       = true;
    findPhotosBtn.disabled    = false;
    findPhotosBtn.textContent = 'Find Photos →';
  }
}

function renderPhotos(photos) {
  photoGrid.innerHTML = '';
  selectedPhotoUrl    = '';
  photoCredit.textContent = '';
  photoLoading.hidden = true;  // belt-and-suspenders — always hide spinner when rendering

  photos.forEach(photo => {
    const tile = document.createElement('div');
    tile.className = 'photo-thumb';
    tile.innerHTML = `<img src="${photo.thumb}" alt="${photo.alt}" loading="lazy"><div class="photo-thumb-check">✓</div>`;

    tile.addEventListener('click', () => {
      document.querySelectorAll('.photo-thumb').forEach(t => t.classList.remove('is-selected'));
      tile.classList.add('is-selected');
      selectedPhotoUrl = photo.full;
      photoCredit.textContent = `Photo by ${photo.credit} on Unsplash`;
      // Show focal point control and reset to centre
      focalSlider.value   = 50;
      photoFocalPoint     = 0.5;
      focalValueLabel.textContent = 'Centre';
      // Load the thumb into the live preview (thumb is faster than full)
      focalPreviewImg.src = photo.thumb;
      focalPreviewImg.onload = () => updateFocalPreview(50);
      focalControl.hidden = false;
    });
    photoGrid.appendChild(tile);
  });
}

findPhotosBtn.addEventListener('click', () => { photoPage = 1; fetchPhotos(); });
morePhotosBtn.addEventListener('click', () => { photoPage++; fetchPhotos(); });
industrySelect.addEventListener('change', () => { photoPicker.hidden = true; selectedPhotoUrl = ''; photoPage = 1; focalControl.hidden = true; });

// ── Website photos (extract.pics) ─────────────────────────
websitePhotosBtn.addEventListener('click', async () => {
  const url = websiteInput.value.trim();
  if (!url) {
    showFormError('Please enter their website URL in Step 1 first.');
    websiteInput.focus();
    return;
  }

  // Hide Unsplash picker, show website picker
  photoPicker.hidden        = true;
  focalControl.hidden       = true;
  websitePhotoPicker.hidden = false;
  websitePhotoGrid.innerHTML = '';
  websitePhotoEmpty.hidden  = true;
  websitePhotoLoading.hidden = false;
  selectedPhotoUrl = '';

  try {
    const res  = await fetch('/api/generate-cover', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'website-photos', websiteUrl: url })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Could not extract photos.');

    websitePhotoLoading.hidden = true;

    if (!data.photos || data.photos.length === 0) {
      websitePhotoEmpty.hidden = false;
      return;
    }

    // Render into the website photo grid (reuse photo-thumb style)
    data.photos.forEach(photo => {
      const tile = document.createElement('button');
      tile.type      = 'button';
      tile.className = 'photo-thumb';
      tile.innerHTML = `<img src="${photo.thumb}" alt="${photo.alt}" loading="lazy">`;
      tile.addEventListener('click', () => {
        document.querySelectorAll('#website-photo-grid .photo-thumb').forEach(t => t.classList.remove('is-selected'));
        tile.classList.add('is-selected');
        selectedPhotoUrl = photo.url;
        photoCredit.textContent = '';
        // Show focal control
        focalSlider.value   = 50;
        photoFocalPoint     = 0.5;
        focalValueLabel.textContent = 'Centre';
        focalPreviewImg.src = photo.thumb;
        focalPreviewImg.onload = () => updateFocalPreview(50);
        focalControl.hidden = false;
      });
      websitePhotoGrid.appendChild(tile);
    });

  } catch (e) {
    websitePhotoLoading.hidden = true;
    websitePhotoEmpty.hidden   = false;
    websitePhotoEmpty.textContent = e.message || 'Could not load photos from their website.';
  }
});

websitePhotosBackBtn.addEventListener('click', () => {
  websitePhotoPicker.hidden = true;
  websitePhotoEmpty.hidden  = true;
  selectedPhotoUrl          = '';
  focalControl.hidden       = true;
});

// ── Template selection ────────────────────────────────────
document.querySelectorAll('.template-tile:not(.is-soon)').forEach(tile => {
  tile.addEventListener('click', () => {
    document.querySelectorAll('.template-tile').forEach(t => t.classList.remove('is-selected'));
    tile.classList.add('is-selected');
    selectedTemplate = tile.dataset.template;
  });
});

// ── Extract brand colour ──────────────────────────────────
extractBtn.addEventListener('click', async () => {
  const url = websiteInput.value.trim();
  if (!url) { websiteInput.focus(); return; }

  extractBtn.disabled      = true;
  extractBtn.textContent   = 'Extracting…';
  extractStatus.hidden     = true;

  try {
    const res  = await fetch('/api/generate-cover', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'extract-color', websiteUrl: url })
    });
    const data = await res.json();

    if (data.ok && data.color) {
      colorPicker.value             = data.color;
      colorHex.value                = data.color.toUpperCase();
      colorPreview.style.background = data.color;
      updateTemplatePreview(data.color);
      showExtractStatus(true, `Found: ${data.color.toUpperCase()}`);
    } else {
      showExtractStatus(false, 'Colour not found — pick one manually below.');
    }
  } catch (e) {
    showExtractStatus(false, 'Could not reach the website. Pick a colour manually.');
  } finally {
    extractBtn.disabled    = false;
    extractBtn.textContent = 'Extract colour →';
  }
});

function showExtractStatus(ok, msg) {
  extractStatus.textContent = ok ? '✓ ' + msg : '– ' + msg;
  extractStatus.className   = 'extract-status ' + (ok ? 'is-ok' : 'is-error');
  extractStatus.hidden      = false;
}

// ── Logo URL preview ──────────────────────────────────────
previewLogoBtn.addEventListener('click', async () => {
  const url = logoUrlInput.value.trim();
  if (!url) { logoUrlInput.focus(); return; }

  previewLogoBtn.disabled   = true;
  previewLogoBtn.textContent = 'Loading…';

  // Try direct load first
  const directOk = await new Promise((resolve) => {
    const tmp = new Image();
    tmp.onload  = () => resolve(true);
    tmp.onerror = () => resolve(false);
    tmp.src = url;
  });

  if (directOk) {
    logoPreviewImg.src     = url;
    logoPreviewArea.hidden = false;
  } else {
    // Fall back to server-side proxy (bypasses CORS)
    try {
      const res  = await fetch('/api/generate-cover', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'proxy-logo', logoUrl: url })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error);
      logoPreviewImg.src     = data.dataUrl;
      logoPreviewArea.hidden = false;
    } catch (e) {
      logoPreviewArea.hidden = true;
      showFormError('Could not load logo from that URL. Check the address and try again.');
    }
  }

  previewLogoBtn.disabled   = false;
  previewLogoBtn.textContent = 'Preview';
});

logoClearBtn.addEventListener('click', () => {
  logoPreviewArea.hidden = true;
  logoUrlInput.value     = '';
});

// ── Logo file upload ──────────────────────────────────────

// ── Connect section toggle ────────────────────────────────
miniToggle.addEventListener('click', () => {
  const open = !miniBody.hidden;
  miniBody.hidden = open;
  miniArrow.classList.toggle('is-open', !open);
});

// ── Form error ────────────────────────────────────────────
function showFormError(msg) {
  formError.textContent = msg;
  formError.hidden      = false;
  formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function clearFormError() { formError.hidden = true; }

// ── Validation ────────────────────────────────────────────
function validate() {
  clearFormError();
  if (!companyInput.value.trim()) {
    showFormError('Please enter the prospect\'s company name.');
    companyInput.focus(); return false;
  }
  const hex = colorHex.value.trim();
  if (!isValidHex(hex.startsWith('#') ? hex : '#' + hex)) {
    showFormError('Please enter a valid brand colour (e.g. #1a4da0).');
    colorHex.focus(); return false;
  }
  if (!logoUrlInput.value.trim()) {
    showFormError('Please provide the prospect\'s logo URL.');
    logoUrlInput.focus(); return false;
  }
  if (!selectedPhotoUrl) {
    showFormError('Please click "Find Photos" in Step 3 and select a background photo.');
    findPhotosBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return false;
  }
  return true;
}

// ── Generate ──────────────────────────────────────────────
generateBtn.addEventListener('click', async () => {
  if (!validate()) return;

  // Save rep name
  const repName = repNameInput.value.trim();
  if (repName) localStorage.setItem(LS_REP_NAME, repName);

  generateBtn.disabled = true;
  clearFormError();
  showView('working');

  const companyName    = companyInput.value.trim();
  const brandColor     = colorHex.value.trim().startsWith('#') ? colorHex.value.trim() : '#' + colorHex.value.trim();
  const industry       = industrySelect.value;
  const logoUrl        = logoUrlInput.value.trim();

  try {
    // Phase 1 — find photo + start Placid generation
    workTitle.textContent = 'Generating your cover page…';
    workSub.textContent   = 'Applying branding and compositing the image — usually 15 seconds';

    const startRes  = await fetch('/api/generate-cover', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        action:     'start',
        templateId: selectedTemplate,
        brandColor,
        logoUrl,
        photoUrl:   selectedPhotoUrl,
        industry,
        companyName
      })
    });
    const startData = await startRes.json();
    if (!startRes.ok || !startData.ok) throw new Error(startData.error || 'Could not start generation.');

    // If Placid already finished synchronously (rare but possible)
    if (startData.imageUrl) {
      generatedImageUrl = startData.imageUrl;
    } else {
      // Phase 2 — poll until Placid finishes (client-side loop, each call < 1s)
      workTitle.textContent = 'Rendering your cover page…';
      workSub.textContent   = 'Placid is applying your branding — usually 10–15 seconds';

      const imageId = startData.imageId;
      let ready = false;

      for (let i = 0; i < 20; i++) {          // max 40 seconds
        await new Promise(r => setTimeout(r, 2000));
        const pollRes  = await fetch('/api/generate-cover', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ action: 'poll', imageId })
        });
        const pollData = await pollRes.json();
        if (pollData.ok && pollData.ready) {
          generatedImageUrl = pollData.imageUrl;
          ready = true;
          break;
        }
      }
      if (!ready) throw new Error('Generation timed out — please try again.');
    }

    // Show result
    resultTitle.textContent   = companyName;
    coverPreview.src          = generatedImageUrl;
    coverPreview.alt          = `${companyName} cover page`;

    // Set up download
    downloadBtn.href     = generatedImageUrl;
    downloadBtn.download = `${companyName.replace(/\s+/g,'-')}-cover-page.png`;
    downloadBtn.textContent = '⬇ Download Cover Page';

    showView('result');

  } catch (err) {
    showFormError(err.message || 'Something went wrong. Please try again.');
    showView('form');
  } finally {
    generateBtn.disabled = false;
  }
});

// ── Push to Salesbuildr ───────────────────────────────────
pushBtn.addEventListener('click', async () => {
  const apiKey = sbApiKey.value.trim();
  const intKey = sbIntKey.value.trim();

  if (!apiKey || !intKey) {
    miniBody.hidden = false;
    miniArrow.classList.add('is-open');
    sbApiKey.focus();
    return;
  }

  if (sbRemember.checked) { localStorage.setItem(LS_API_KEY, apiKey); localStorage.setItem(LS_INT_KEY, intKey); }
  else { localStorage.removeItem(LS_API_KEY); localStorage.removeItem(LS_INT_KEY); }

  pushBtn.disabled    = true;
  pushBtn.textContent = 'Saving…';
  pushResult.hidden   = true;

  const brandColor  = colorHex.value.trim().startsWith('#') ? colorHex.value.trim() : '#' + colorHex.value.trim();
  const companyName = companyInput.value.trim();

  try {
    const res  = await fetch('/api/generate-cover', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        action:     'push',
        imageUrl:   generatedImageUrl,
        companyName,
        brandColor,
        apiKey,
        integrationKey: intKey
      })
    });
    const data = await res.json();

    if (data.ok) {
      pushResult.textContent = `✓ Saved as "${data.name}" in your Salesbuildr widget library — ready to drag into any quote.`;
      pushResult.className   = 'push-result';
      pushResult.hidden      = false;
      pushBtn.textContent    = '✓ Saved to Salesbuildr';
      pushBtn.classList.add('is-done');
    } else {
      throw new Error(data.error || 'Push failed.');
    }
  } catch (err) {
    pushResult.textContent = `✕ ${err.message}`;
    pushResult.className   = 'push-result is-error';
    pushResult.hidden      = false;
    pushBtn.disabled       = false;
    pushBtn.textContent    = 'Save to Salesbuildr →';
  }
});

// ── Restart ───────────────────────────────────────────────
restartBtn.addEventListener('click', () => {
  generatedImageUrl = '';
  logoPreviewArea.hidden  = true;
  pushResult.hidden       = true;
  focalControl.hidden       = true;
  focalSlider.value         = 50;
  photoFocalPoint           = 0.5;
  websitePhotoPicker.hidden = true;
  websitePhotoGrid.innerHTML = '';
  websitePhotoEmpty.hidden  = true;
  pushBtn.classList.remove('is-done');
  pushBtn.disabled        = false;
  pushBtn.textContent     = 'Save to Salesbuildr →';
  clearFormError();
  showView('form');
});

// ── Boot ──────────────────────────────────────────────────
init();
updateTemplatePreview(colorPicker.value);
