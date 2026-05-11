/* =========================================================
   First Impression — first-impression.js
   ========================================================= */

const LS_API_KEY  = 'sb_api_key';
const LS_INT_KEY  = 'sb_int_key';
const LS_REP_NAME = 'fi_rep_name';

// ── State ─────────────────────────────────────────────────
let generatedImageUrl = '';
let selectedTemplate  = 'chevron';
let logoDataUrl       = '';   // base64 if file uploaded
let logoFileUploaded  = false;

// ── DOM ───────────────────────────────────────────────────
const formView    = document.getElementById('form-view');
const workingView = document.getElementById('working-view');
const resultView  = document.getElementById('result-view');
const workTitle   = document.getElementById('working-title');
const workSub     = document.getElementById('working-sub');

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
const logoUpload     = document.getElementById('logo-upload');
const logoUploadName = document.getElementById('logo-upload-name');
const debgStrip      = document.getElementById('debg-strip');
const debgBefore     = document.getElementById('debg-before');
const debgAfter      = document.getElementById('debg-after');
const debgCanvas     = document.getElementById('debg-canvas');
const debgUseBtn     = document.getElementById('debg-use-btn');
const debgSkipBtn    = document.getElementById('debg-skip-btn');
let   debgCleanDataUrl = '';   // cleaned logo data URL, set after processing
const industrySelect   = document.getElementById('industry');
const findPhotosBtn    = document.getElementById('find-photos-btn');
const photoPicker      = document.getElementById('photo-picker');
const photoGrid        = document.getElementById('photo-grid');
const morePhotosBtn    = document.getElementById('more-photos-btn');
const photoLoading     = document.getElementById('photo-loading');
const photoCredit      = document.getElementById('photo-credit');
let   selectedPhotoUrl = '';
let   photoPage        = 1;
let   photoFocalPoint  = 0.5;   // 0.0 = top, 1.0 = bottom, 0.5 = centre
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
  // Restore localStorage values
  const savedApi  = localStorage.getItem(LS_API_KEY);
  const savedInt  = localStorage.getItem(LS_INT_KEY);
  const savedRep  = localStorage.getItem(LS_REP_NAME);
  if (savedApi) sbApiKey.value = savedApi;
  if (savedInt) sbIntKey.value = savedInt;
  if (savedRep) repNameInput.value = savedRep;
  if (savedApi && savedInt) sbRemember.checked = true;
}

// ── View switching ────────────────────────────────────────
function showView(name) {
  formView.hidden    = name !== 'form';
  workingView.hidden = name !== 'working';
  resultView.hidden  = name !== 'result';
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

function updateTemplatePreview(color) {
  // Live-update the template tile preview with the chosen colour
  document.querySelectorAll('.tp-chevron').forEach(el => el.style.borderLeftColor = color);
  document.querySelectorAll('.tp-bar').forEach(el => el.style.background = color);
  document.querySelectorAll('.tp-half-circle').forEach(el => el.style.background = color);
}

// ── Focal point slider ────────────────────────────────────
// Updates the live crop preview thumbnail to show exactly what
// portion of the photo will appear in the portrait cover canvas.
function updateFocalPreview(sliderVal) {
  const vpW = focalViewport.offsetWidth  || 80;
  const vpH = focalViewport.offsetHeight || 110;
  const imgNW = focalPreviewImg.naturalWidth  || 1;
  const imgNH = focalPreviewImg.naturalHeight || 1;

  // Scale image so its width fills the viewport (same as cover page behaviour)
  const scale      = vpW / imgNW;
  const scaledH    = imgNH * scale;
  const renderedH  = Math.max(scaledH, vpH);

  // Focal point: 0 = top of image flush top, 1 = bottom flush bottom
  const maxOffset  = renderedH - vpH;
  const topOffset  = -(maxOffset * (sliderVal / 100));

  focalPreviewImg.style.width  = vpW + 'px';
  focalPreviewImg.style.height = renderedH + 'px';
  focalPreviewImg.style.top    = topOffset + 'px';
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

// ── Logo background removal ───────────────────────────────

// Returns true if a pixel (r,g,b) is near-white (within tolerance)
function isNearWhite(r, g, b, tolerance) {
  return r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance;
}

// Flood-fill from all four corners to find and erase the white background.
// Uses a stack-based BFS so it won't hit call-stack limits on large images.
function removeWhiteBackground(imageEl, tolerance = 30) {
  return new Promise((resolve, reject) => {
    const src = imageEl.src || imageEl;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      debgCanvas.width  = W;
      debgCanvas.height = H;
      const ctx = debgCanvas.getContext('2d');
      // Clear first to avoid stale data from previous draws
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0);

      let imageData;
      try {
        imageData = ctx.getImageData(0, 0, W, H);
      } catch (e) {
        reject(new Error('cors'));
        return;
      }

      const data    = imageData.data;
      const visited = new Uint8Array(W * H);

      function flood(startX, startY) {
        const stack = [[startX, startY]];
        while (stack.length) {
          const [x, y] = stack.pop();
          if (x < 0 || x >= W || y < 0 || y >= H) continue;
          const pos = y * W + x;
          if (visited[pos]) continue;
          visited[pos] = 1;
          const i = pos * 4;
          if (!isNearWhite(data[i], data[i+1], data[i+2], tolerance)) continue;
          data[i+3] = 0;
          stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
        }
      }

      flood(0,   0);
      flood(W-1, 0);
      flood(0,   H-1);
      flood(W-1, H-1);

      ctx.putImageData(imageData, 0, 0);
      resolve(debgCanvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('load'));
    // Append cache-bust so browser makes a fresh CORS request
    // (avoids getting a cached non-CORS response that taints the canvas)
    const bust = src.includes('?') ? '&_cb=' + Date.now() : '?_cb=' + Date.now();
    img.src = src + bust;
  });
}

// Checks corners via a fresh CORS-enabled image load
function hasWhiteBackground(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const W = img.naturalWidth;
        const H = img.naturalHeight;
        if (!W || !H) { resolve(false); return; }
        debgCanvas.width  = W;
        debgCanvas.height = H;
        const ctx = debgCanvas.getContext('2d');
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(img, 0, 0);
        const corners = [
          ctx.getImageData(0,   0,   1, 1).data,
          ctx.getImageData(W-1, 0,   1, 1).data,
          ctx.getImageData(0,   H-1, 1, 1).data,
          ctx.getImageData(W-1, H-1, 1, 1).data
        ];
        resolve(corners.every(c => isNearWhite(c[0], c[1], c[2], 30) && c[3] > 200));
      } catch (e) {
        resolve(false);
      }
    };
    img.onerror = () => resolve(false);
    const bust = src.includes('?') ? '&_cb=' + Date.now() : '?_cb=' + Date.now();
    img.src = src + bust;
  });
}

async function runDebackground(imageEl, originalSrc) {
  debgStrip.hidden    = true;
  debgCleanDataUrl    = '';

  const hasBg = await hasWhiteBackground(originalSrc);
  if (!hasBg) return;

  debgBefore.src = originalSrc;

  try {
    const cleanUrl   = await removeWhiteBackground(imageEl, 30);
    debgCleanDataUrl = cleanUrl;
    debgAfter.src    = cleanUrl;
    debgStrip.hidden = false;
  } catch (e) {
    // CORS or load failure — silently skip
  }
}

debgUseBtn.addEventListener('click', () => {
  if (!debgCleanDataUrl) return;
  logoDataUrl      = debgCleanDataUrl;
  logoFileUploaded = true;   // treat as uploaded data so it goes via Placid file upload
  debgUseBtn.textContent = '✓ Cleaned version in use';
  debgUseBtn.disabled    = true;
  debgSkipBtn.disabled   = true;
  // Update the visible preview to the cleaned version
  logoPreviewImg.src = debgCleanDataUrl;
});

debgSkipBtn.addEventListener('click', () => {
  debgStrip.hidden = true;
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
previewLogoBtn.addEventListener('click', () => {
  const url = logoUrlInput.value.trim();
  if (!url) { logoUrlInput.focus(); return; }
  // Load with crossOrigin so canvas can read pixel data (works if server allows it)
  logoPreviewImg.crossOrigin = 'anonymous';
  logoPreviewImg.src = url;
  logoPreviewImg.onerror = () => {
    logoPreviewArea.hidden = true;
    showFormError('Could not load logo from that URL. Check the address or upload a file instead.');
  };
  logoPreviewImg.onload = () => {
    logoPreviewArea.hidden = false;
    logoFileUploaded = false;
    debgStrip.hidden = true;
    debgUseBtn.disabled  = false;
    debgSkipBtn.disabled = false;
    debgUseBtn.textContent = 'Use cleaned version ✓';
    runDebackground(logoPreviewImg, url);
  };
});

logoClearBtn.addEventListener('click', () => {
  logoPreviewArea.hidden = true;
  logoUrlInput.value     = '';
  logoFileUploaded       = false;
  logoUploadName.hidden  = true;
  debgStrip.hidden       = true;
  debgCleanDataUrl       = '';
});

// ── Logo file upload ──────────────────────────────────────
logoUpload.addEventListener('change', () => {
  const file = logoUpload.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    logoDataUrl      = e.target.result;
    logoFileUploaded = true;
    logoUploadName.textContent = `✓ ${file.name}`;
    logoUploadName.hidden      = false;
    logoPreviewArea.hidden     = true;
    debgStrip.hidden           = true;
    debgUseBtn.disabled        = false;
    debgSkipBtn.disabled       = false;
    debgUseBtn.textContent     = 'Use cleaned version ✓';
    debgCleanDataUrl           = '';

    // Run debackground check on uploaded file via a temp Image element
    const tmpImg = new Image();
    tmpImg.onload = () => {
      debgBefore.src = logoDataUrl;
      runDebackground(tmpImg, logoDataUrl);
    };
    tmpImg.src = logoDataUrl;
  };
  reader.readAsDataURL(file);
});

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
  if (!logoFileUploaded && !logoUrlInput.value.trim()) {
    showFormError('Please provide the prospect\'s logo — either a URL or an uploaded file.');
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

  const companyName = companyInput.value.trim();
  const brandColor  = colorHex.value.trim().startsWith('#') ? colorHex.value.trim() : '#' + colorHex.value.trim();
  const industry    = industrySelect.value;
  const logoUrl     = logoFileUploaded ? logoDataUrl : logoUrlInput.value.trim();

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
        focalPoint: photoFocalPoint,
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
  logoDataUrl       = '';
  logoFileUploaded  = false;
  logoPreviewArea.hidden  = true;
  logoUploadName.hidden   = true;
  pushResult.hidden       = true;
  focalControl.hidden     = true;
  focalSlider.value       = 50;
  photoFocalPoint         = 0.5;
  debgStrip.hidden        = true;
  debgCleanDataUrl        = '';
  debgUseBtn.disabled     = false;
  debgSkipBtn.disabled    = false;
  debgUseBtn.textContent  = 'Use cleaned version ✓';
  pushBtn.classList.remove('is-done');
  pushBtn.disabled        = false;
  pushBtn.textContent     = 'Save to Salesbuildr →';
  clearFormError();
  showView('form');
});

// ── Boot ──────────────────────────────────────────────────
init();
updateTemplatePreview(colorPicker.value);
