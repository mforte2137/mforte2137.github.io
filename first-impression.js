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
const industrySelect   = document.getElementById('industry');
const findPhotosBtn    = document.getElementById('find-photos-btn');
const photoPicker      = document.getElementById('photo-picker');
const photoGrid        = document.getElementById('photo-grid');
const morePhotosBtn    = document.getElementById('more-photos-btn');
const photoLoading     = document.getElementById('photo-loading');
const photoCredit      = document.getElementById('photo-credit');
let   selectedPhotoUrl = '';
let   photoPage        = 1;
const repNameInput   = document.getElementById('rep-name');
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
}

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
    });
    photoGrid.appendChild(tile);
  });
}

findPhotosBtn.addEventListener('click', () => { photoPage = 1; fetchPhotos(); });
morePhotosBtn.addEventListener('click', () => { photoPage++; fetchPhotos(); });
industrySelect.addEventListener('change', () => { photoPicker.hidden = true; selectedPhotoUrl = ''; photoPage = 1; });

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
  logoPreviewImg.src = url;
  logoPreviewImg.onerror = () => {
    logoPreviewArea.hidden = true;
    showFormError('Could not load logo from that URL. Check the address or upload a file instead.');
  };
  logoPreviewImg.onload = () => { logoPreviewArea.hidden = false; logoFileUploaded = false; };
});

logoClearBtn.addEventListener('click', () => {
  logoPreviewArea.hidden = true;
  logoUrlInput.value     = '';
  logoFileUploaded       = false;
  logoUploadName.hidden  = true;
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
  pushBtn.classList.remove('is-done');
  pushBtn.disabled        = false;
  pushBtn.textContent     = 'Save to Salesbuildr →';
  clearFormError();
  showView('form');
});

// ── Boot ──────────────────────────────────────────────────
init();
updateTemplatePreview(colorPicker.value);
