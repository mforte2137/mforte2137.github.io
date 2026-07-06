// ─────────────────────────────────────────────
//  Support KB  –  kb.js
// ─────────────────────────────────────────────

// ── Global State ──────────────────────────────
let knowledgeBase  = [];
let editingId      = null;
let activeStatusFilter = '';
let activePanelId  = null;  // ID of issue currently open in slide panel

// ── Init ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    loadLocalData();
    migrateData();
    setupFileUpload();
    updateStats();
    renderKB();
});

// ── Local Storage ─────────────────────────────
function loadLocalData() {
    const stored = localStorage.getItem('knowledgeBase');
    if (stored) knowledgeBase = JSON.parse(stored);
}

function saveLocalData() {
    localStorage.setItem('knowledgeBase', JSON.stringify(knowledgeBase));
}

// ── Migrate existing data — assign status if missing ──
function migrateData() {
    let changed = false;
    knowledgeBase = knowledgeBase.map(issue => {
        if (!issue.status) {
            issue.status = issue.solution ? 'solved' : 'pending';
            changed = true;
        }
        return issue;
    });
    if (changed) saveLocalData();
}

// ── Notifications ─────────────────────────────
function showSuccess(msg) {
    const el = document.getElementById('successMessage');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { if (el) el.style.display = 'none'; }, 4000);
}
function showError(msg) {
    const el = document.getElementById('errorMessage');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { if (el) el.style.display = 'none'; }, 6000);
}

// ── File Upload ───────────────────────────────
function setupFileUpload() {
    const fileUpload = document.getElementById('fileUpload');
    const fileInput  = document.getElementById('screenshotFile');
    if (!fileUpload || !fileInput) return;

    fileUpload.onclick = () => fileInput.click();
    fileUpload.addEventListener('dragover', (e) => { e.preventDefault(); fileUpload.classList.add('dragover'); });
    fileUpload.addEventListener('dragleave', () => fileUpload.classList.remove('dragover'));
    fileUpload.addEventListener('drop', (e) => { e.preventDefault(); fileUpload.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
    fileInput.onchange = (e) => handleFiles(e.target.files);
}

function handleFiles(files) {
    const container = document.getElementById('uploadedFiles');
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.style.marginTop = '10px';
                div.innerHTML = `<img src="${e.target.result}" style="max-width:200px;max-height:200px;border-radius:4px;margin-right:10px;"><span>${file.name}</span><button onclick="this.parentElement.remove()" style="margin-left:8px;padding:3px 8px;background:var(--danger-bg);color:var(--danger);border:1px solid var(--danger);cursor:pointer;font-size:11px;">Remove</button>`;
                container.appendChild(div);
            };
            reader.readAsDataURL(file);
        }
    });
}

// ── Add / Edit Form ───────────────────────────
function showAddForm() {
    editingId = null;
    clearForm();
    document.getElementById('formTitle').textContent = 'Add New Issue';
    document.getElementById('addForm').style.display = 'block';
    document.getElementById('issueTitle').focus();
    document.getElementById('addForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideAddForm() {
    document.getElementById('addForm').style.display = 'none';
    editingId = null;
    clearForm();
}

function clearForm() {
    ['issueTitle','issueCategory','issueDescription','issueSolution',
     'jiraLink','intercomId','loomUrl','additionalRef'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const uf = document.getElementById('uploadedFiles');
    if (uf) uf.innerHTML = '';
}

// ── Save Issue ────────────────────────────────
async function saveIssue() {
    const title       = document.getElementById('issueTitle').value.trim();
    const category    = document.getElementById('issueCategory').value;
    const description = document.getElementById('issueDescription').value.trim();
    const solution    = document.getElementById('issueSolution').value.trim();
    const jiraLink    = document.getElementById('jiraLink').value.trim();
    const intercomId  = document.getElementById('intercomId').value.trim();
    const loomUrl     = document.getElementById('loomUrl').value.trim();
    const additionalRef = document.getElementById('additionalRef').value.trim();

    if (!title || !category) {
        showError('Please fill in Title and Category.');
        return;
    }

    const saveBtn  = document.getElementById('saveButtonText');
    const saveSpin = document.getElementById('saveLoading');
    saveBtn.style.display  = 'none';
    saveSpin.style.display = 'inline-block';

    try {
        const images = [];
        document.getElementById('uploadedFiles').querySelectorAll('img').forEach(img => {
            images.push({ name: img.nextElementSibling?.textContent || '', data: img.src });
        });

        const existing = editingId ? knowledgeBase.find(i => i.id === editingId) : null;

        // Determine status
        let status = existing?.status || 'pending';
        if (solution && status === 'pending') status = 'solved';

        const issue = {
            id:          editingId || Date.now().toString(),
            title, category, description, solution, status,
            references:  { jira: jiraLink, intercom: intercomId, loom: loomUrl, additional: additionalRef },
            images,
            createdAt:   existing?.createdAt || new Date().toISOString(),
            updatedAt:   new Date().toISOString()
        };

        if (editingId) {
            const idx = knowledgeBase.findIndex(i => i.id === editingId);
            knowledgeBase[idx] = issue;
        } else {
            knowledgeBase.unshift(issue);
        }

        saveLocalData();
        showSuccess('Issue saved!');
        hideAddForm();
        updateStats();
        renderKB();

    } catch (err) {
        console.error('Save error:', err);
        showError('Failed to save issue.');
    }

    saveBtn.style.display  = 'inline';
    saveSpin.style.display = 'none';
}

// ── Edit Issue (from card) ────────────────────
function editIssue(id) {
    closePanel();
    const issue = knowledgeBase.find(i => i.id === id);
    if (!issue) return;

    editingId = id;
    document.getElementById('formTitle').textContent = 'Edit Issue';
    document.getElementById('issueTitle').value       = issue.title;
    document.getElementById('issueCategory').value    = issue.category;
    document.getElementById('issueDescription').value = issue.description || '';
    document.getElementById('issueSolution').value    = issue.solution || '';
    document.getElementById('jiraLink').value         = issue.references?.jira || '';
    document.getElementById('intercomId').value       = issue.references?.intercom || '';
    document.getElementById('loomUrl').value          = issue.references?.loom || '';
    document.getElementById('additionalRef').value    = issue.references?.additional || '';

    const container = document.getElementById('uploadedFiles');
    container.innerHTML = '';
    (issue.images || []).forEach(img => {
        const div = document.createElement('div');
        div.style.marginTop = '10px';
        div.innerHTML = `<img src="${img.data}" style="max-width:200px;max-height:200px;border-radius:4px;margin-right:10px;"><span>${img.name}</span><button onclick="this.parentElement.remove()" style="margin-left:8px;padding:3px 8px;background:var(--danger-bg);color:var(--danger);border:1px solid var(--danger);cursor:pointer;font-size:11px;">Remove</button>`;
        container.appendChild(div);
    });

    document.getElementById('addForm').style.display = 'block';
    document.getElementById('addForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('issueTitle').focus();
}

// ── Delete Issue ──────────────────────────────
function deleteIssue(id) {
    if (!confirm('Delete this issue?')) return;
    closePanel();
    knowledgeBase = knowledgeBase.filter(i => i.id !== id);
    saveLocalData();
    showSuccess('Issue deleted.');
    updateStats();
    renderKB();
}

// ── Search & Filter ───────────────────────────
function searchKB() { applyFilters(); }
function filterKB()  { applyFilters(); }

function setStatusFilter(btn, status) {
    activeStatusFilter = status;
    document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
}

function applyFilters() {
    const query    = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const category = document.getElementById('categoryFilter')?.value || '';

    const filtered = knowledgeBase.filter(issue => {
        const matchSearch = query === '' ||
            issue.title.toLowerCase().includes(query) ||
            (issue.description?.toLowerCase().includes(query)) ||
            (issue.solution?.toLowerCase().includes(query)) ||
            Object.values(issue.references || {}).some(r => r?.toLowerCase().includes(query));

        const matchCat    = category === '' || issue.category === category;
        const matchStatus = activeStatusFilter === '' || issue.status === activeStatusFilter;

        return matchSearch && matchCat && matchStatus;
    });

    renderKB(filtered);
}

// ── Render KB List ────────────────────────────
function renderKB(issues = knowledgeBase) {
    const container = document.getElementById('kbContent');

    if (issues.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>${knowledgeBase.length === 0 ? 'No issues yet' : 'No matching issues'}</h3><p>${knowledgeBase.length === 0 ? 'Click "+ Add Issue" to get started.' : 'Try adjusting your search or filters.'}</p></div>`;
        return;
    }

    container.innerHTML = issues.map(issue => {
        const status = issue.status || 'pending';

        const statusLabel = { pending: '⏳ Pending', solved: '✓ Solved', published: '📄 Published' }[status] || status;

        const refs = [];
        if (issue.references?.jira)       refs.push(`<a href="${issue.references.jira}" class="reference-link" target="_blank">🎫 Jira</a>`);
        if (issue.references?.intercom)   refs.push(`<a href="${issue.references.intercom}" class="reference-link" target="_blank">💬 Featurebase</a>`);
        if (issue.references?.loom)       refs.push(`<a href="${issue.references.loom}" class="reference-link" target="_blank">🎥 Loom</a>`);
        if (issue.references?.additional) refs.push(`<a href="${issue.references.additional}" class="reference-link" target="_blank">💬 Slack</a>`);

        const hasSolution = !!issue.solution;
        const isLong = hasSolution && issue.solution.length > 220;
        const solutionHtml = hasSolution ? `
            <div class="kb-solution-preview" id="sol-wrap-${issue.id}">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <strong>Solution</strong>
                    <div style="display:flex;gap:6px;">
                        <button class="btn btn-secondary btn-small" onclick="copySolution('${issue.id}')">📋 Copy</button>
                        ${isLong ? `<button class="btn btn-secondary btn-small" id="sol-toggle-${issue.id}" onclick="toggleSolution('${issue.id}')">Show more ▾</button>` : ''}
                    </div>
                </div>
                <div id="sol-text-${issue.id}" style="${isLong ? 'max-height:80px;overflow:hidden;' : ''}">${issue.solution.replace(/\n/g, '<br>')}</div>
            </div>` : '';

        const images = (issue.images || []).map(img =>
            `<img src="${img.data}" alt="${img.name}" style="max-width:180px;margin:8px 8px 0 0;cursor:pointer;border:1px solid var(--border);" onclick="window.open('${img.data}','_blank')">`
        ).join('');

        const date = new Date(issue.updatedAt || issue.createdAt).toLocaleDateString();

        return `
        <div class="kb-item" data-status="${status}" data-id="${issue.id}">
            <div class="kb-item-top">
                <div class="kb-item-left">
                    <div class="kb-title">${issue.title}</div>
                    <div class="kb-meta">
                        <span class="kb-category">${issue.category}</span>
                        <span class="kb-status-badge ${status}">${statusLabel}</span>
                    </div>
                </div>
            </div>
            ${issue.description ? `<div class="kb-description">${issue.description}</div>` : ''}
            ${solutionHtml}
            ${images ? `<div style="margin-top:4px;">${images}</div>` : ''}
            ${refs.length > 0 ? `<div class="kb-references">${refs.join('')}</div>` : ''}
            <div class="kb-actions">
                <button class="btn btn-accent btn-small" onclick="openPanel('${issue.id}')">Work on this →</button>
                <button class="btn btn-secondary btn-small" onclick="editIssue('${issue.id}')">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteIssue('${issue.id}')">Delete</button>
                <span class="kb-date">${date}</span>
            </div>
        </div>`;
    }).join('');
}

// ── Update Stats ──────────────────────────────
function updateStats() {
    const total      = knowledgeBase.length;
    const pending    = knowledgeBase.filter(i => i.status === 'pending').length;
    const categories = new Set(knowledgeBase.map(i => i.category).filter(Boolean)).size;
    const weekAgo    = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recent = knowledgeBase.filter(i => new Date(i.createdAt) > weekAgo).length;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('totalIssues', total);
    set('pendingCount', pending);
    set('totalCategories', categories);
    set('recentlyAdded', recent);
}

// ── Export / Import ───────────────────────────
function exportData() {
    const data = { knowledgeBase, exportedAt: new Date().toISOString(), version: '2.0' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `support-kb-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.knowledgeBase && Array.isArray(data.knowledgeBase)) {
                knowledgeBase = data.knowledgeBase;
                migrateData();
                saveLocalData();
                updateStats();
                renderKB();
                showSuccess(`Imported ${knowledgeBase.length} issues.`);
            } else {
                showError('Invalid file format.');
            }
        } catch { showError('Could not read file.'); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ─────────────────────────────────────────────
//  SLIDE-IN WORKFLOW PANEL
// ─────────────────────────────────────────────

function openPanel(id) {
    const issue = knowledgeBase.find(i => i.id === id);
    if (!issue) return;
    activePanelId = id;

    const status = issue.status || 'pending';

    // Set header
    document.getElementById('wpIssueTitle').textContent = issue.title;
    const meta = document.getElementById('wpIssueMeta');
    meta.innerHTML = `<span class="kb-category">${issue.category}</span><span class="kb-status-badge ${status} " style="margin-left:6px;">${{ pending:'⏳ Pending', solved:'✓ Solved', published:'📄 Published' }[status]}</span>`;

    // Reset panel state
    wpResetSearch();
    document.getElementById('wpSolutionInput').value  = issue.solution || '';
    document.getElementById('wpContextInput').value   = issue.solution || '';
    document.getElementById('wpDraftArea').style.display    = 'none';
    document.getElementById('wpDraftText').value      = '';
    // Reset ticket builder fields
    const titleEl = document.getElementById('wpArticleTitle');
    if (titleEl) titleEl.value = issue.title || '';
    const colEl = document.getElementById('wpCollection');
    if (colEl) colEl.value = '';
    const ssEl = document.getElementById('wpScreenshots');
    if (ssEl) ssEl.value = '';
    const relEl = document.getElementById('wpRelatedArticles');
    if (relEl) relEl.value = '';
    const exEl = document.getElementById('wpExistingArticle');
    if (exEl) exEl.value = '';
    const exRow = document.getElementById('wpExistingArticleRow');
    if (exRow) exRow.style.display = 'none';
    // Reset toggle to "New article"
    document.querySelectorAll('.wp-toggle').forEach(b => b.classList.remove('active'));
    const firstToggle = document.querySelector('.wp-toggle[data-val="new"]');
    if (firstToggle) firstToggle.classList.add('active');
    const typeEl = document.getElementById('wpArticleType');
    if (typeEl) typeEl.value = 'new';
    const draftBtnEl = document.getElementById('wpDraftBtn');
    if (draftBtnEl) { draftBtnEl.textContent = 'Build Jira Ticket'; draftBtnEl.disabled = false; }

    // Show/hide steps based on status
    document.getElementById('wpStep2').style.display = status === 'pending'  ? 'block' : 'none';
    document.getElementById('wpStep3').style.display = (status === 'solved' || status === 'published') ? 'block' : 'none';
    document.getElementById('wpStep4').style.display = status === 'published' ? 'block' : 'none';

    // Open panel
    document.getElementById('panelOverlay').classList.add('open');
    document.getElementById('workflowPanel').classList.add('open');
}

function closePanel() {
    document.getElementById('panelOverlay').classList.remove('open');
    document.getElementById('workflowPanel').classList.remove('open');
    activePanelId = null;
}

// Close on Escape key
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

// ── Step 1: Search the Help Centre ────────────
function wpResetSearch() {
    const res = document.getElementById('wpSearchResult');
    res.style.display = 'none';
    res.innerHTML = '';
    res.className = 'wp-search-result';
    document.getElementById('wpArticles').innerHTML = '';
    document.getElementById('wpSearchBtn').textContent = 'Search Help Centre';
    document.getElementById('wpSearchBtn').disabled = false;
}

async function wpRunSearch() {
    const issue = knowledgeBase.find(i => i.id === activePanelId);
    if (!issue) return;

    const resultEl  = document.getElementById('wpSearchResult');
    const articlesEl = document.getElementById('wpArticles');
    articlesEl.innerHTML = '';

    resultEl.style.display = 'flex';
    resultEl.className = 'wp-search-result loading-state';
    resultEl.innerHTML = '<div class="loading"></div> Searching help centre…';
    document.getElementById('wpSearchBtn').disabled = true;
    document.getElementById('wpSearchBtn').textContent = 'Searching…';

    const query = [issue.title, issue.description].filter(Boolean).join(' — ');

    try {
        const response = await fetch('/.netlify/functions/kb-featurebase-deep', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        const data = await response.json();
        if (data.error) { wpShowSearchError(data.error); return; }

        const text = data.content?.map(b => b.text || '').join('\n') || '';
        if (!text) { wpShowSearchError('No response received.'); return; }

        const hasGap = text.includes('THE GAP');
        let mainText = text;
        let gapText  = '';

        if (hasGap) {
            const parts = text.split('THE GAP');
            mainText = parts[0].trim();
            gapText  = parts[1]?.trim() || '';
        }

        // Extract Featurebase URLs
        const urlPattern = /https?:\/\/[^\s)\]>,"]+/g;
        const foundUrls  = [...new Set(text.match(urlPattern) || [])].filter(u => u.includes('featurebase'));

        resultEl.className = hasGap ? 'wp-search-result gap-state' : 'wp-search-result';
        resultEl.style.display = 'block';
        resultEl.innerHTML = formatMarkdown(mainText);

        if (foundUrls.length > 0) {
            articlesEl.innerHTML = foundUrls.map(url => {
                const safeUrl = url.replace(/'/g, '%27');
                const slug  = url.split('/').pop() || url;
                const title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                return `<div class="wp-article-item">
                    <a href="${url}" target="_blank" class="wp-article-link">${title}</a>
                    <div style="display:flex;gap:6px;margin-top:4px;">
                        <button class="btn btn-secondary btn-small" onclick="copyLink('${safeUrl}')">📋 Copy</button>
                        <a href="${url}" target="_blank" class="btn btn-secondary btn-small" style="text-decoration:none;">Open ↗</a>
                    </div>
                </div>`;
            }).join('');
        }

        if (hasGap && gapText) {
            const gapDiv = document.createElement('div');
            gapDiv.style.cssText = 'margin-top:10px;padding:10px;background:var(--warn-bg);border:1px solid #F59E0B;font-size:0.83rem;';
            gapDiv.innerHTML = `<span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--warn);">⚠ Documentation Gap</span><p style="margin-top:6px;color:var(--warn);">${gapText}</p>`;
            articlesEl.appendChild(gapDiv);
        }

    } catch (err) {
        wpShowSearchError(err.message);
    }

    document.getElementById('wpSearchBtn').textContent = 'Search again';
    document.getElementById('wpSearchBtn').disabled = false;
}

function wpShowSearchError(msg) {
    const resultEl = document.getElementById('wpSearchResult');
    resultEl.className = 'wp-search-result';
    resultEl.style.display = 'block';
    resultEl.style.borderColor = 'var(--danger)';
    resultEl.style.background = 'var(--danger-bg)';
    resultEl.textContent = '⚠️ ' + msg;
    document.getElementById('wpSearchBtn').textContent = 'Search again';
    document.getElementById('wpSearchBtn').disabled = false;
}

// ── Step 2: Save Solution ─────────────────────
function wpSaveSolution() {
    const solution = document.getElementById('wpSolutionInput').value.trim();
    if (!solution) { showError('Please enter a solution.'); return; }

    const issue = knowledgeBase.find(i => i.id === activePanelId);
    if (!issue) return;

    issue.solution  = solution;
    issue.status    = 'solved';
    issue.updatedAt = new Date().toISOString();

    saveLocalData();
    showSuccess('Solution saved!');
    updateStats();
    renderKB();

    // Pre-fill context and show step 3
    document.getElementById('wpContextInput').value = solution;
    document.getElementById('wpStep2').style.display = 'none';
    document.getElementById('wpStep3').style.display = 'block';

    // Update header badge
    const meta = document.getElementById('wpIssueMeta');
    meta.innerHTML = `<span class="kb-category">${issue.category}</span><span class="kb-status-badge solved" style="margin-left:6px;">✓ Solved</span>`;
}

// ── Step 3: Toggle helpers ────────────────────
function wpSetToggle(btn, hiddenId) {
    btn.closest('.wp-toggle-row').querySelectorAll('.wp-toggle').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(hiddenId).value = btn.dataset.val;
    // Show/hide existing article field
    const existingRow = document.getElementById('wpExistingArticleRow');
    if (existingRow) existingRow.style.display = btn.dataset.val === 'update' ? 'block' : 'none';
}

// ── Step 3: Build Jira Ticket ─────────────────
async function wpBuildTicket() {
    const issue = knowledgeBase.find(i => i.id === activePanelId);
    if (!issue) return;

    const articleType    = document.getElementById('wpArticleType').value;
    const existingArt    = document.getElementById('wpExistingArticle')?.value.trim() || '';
    const collection     = document.getElementById('wpCollection').value;
    const articleTitle   = document.getElementById('wpArticleTitle').value.trim() || issue.title;
    const notes          = document.getElementById('wpContextInput').value.trim();
    const screenshots    = document.getElementById('wpScreenshots').value.trim();
    const relatedArts    = document.getElementById('wpRelatedArticles').value.trim();

    if (!notes) { showError('Please add your notes before building the ticket.'); return; }

    const draftArea = document.getElementById('wpDraftArea');
    const draftText = document.getElementById('wpDraftText');
    const draftBtn  = document.getElementById('wpDraftBtn');

    draftArea.style.display = 'block';
    draftText.value = 'Building ticket…';
    draftBtn.textContent = 'Building…';
    draftBtn.disabled = true;
    draftArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Determine NEW OR UPDATE line
    let newOrUpdate;
    if (articleType === 'new')     newOrUpdate = 'New article';
    else if (articleType === 'update') newOrUpdate = `Update existing — ${existingArt || 'see article title above'}`;
    else                            newOrUpdate = 'Not sure — agent, check and decide';

    const collectionLine = collection || 'Agent, pick the best fit';
    const screenshotLine = screenshots || 'None provided — agent to capture as needed.';
    const relatedLine    = relatedArts || 'Only if they exist, otherwise skip.';

    // Ask Claude to polish the notes into proper CONTENT
    const prompt = `You are a technical writer for Salesbuildr, a B2B quoting and sales platform for MSPs.

A support agent has the following rough notes about a customer issue and its solution:

Issue: "${issue.title}"
${issue.description ? `Context: ${issue.description}` : ''}
Notes / solution: ${notes}

Polish these notes into clear, well-structured help article content for an end-user audience. Use:
- A brief intro paragraph explaining what this article covers
- Numbered steps where the solution involves a sequence of actions
- Tips or notes where relevant
- Plain language — no jargon, no developer terminology
- Approximately 200–400 words

Return ONLY the article content — no title, no preamble. The content will be placed into a Jira ticket CONTENT field.`;

    try {
        const response = await fetch('/.netlify/functions/kb-claude', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 1000,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        const data     = await response.json();
        const content  = data.content?.map(b => b.text || '').join('\n') || notes;

        // Assemble the full Jira ticket
        const collectionVal = document.getElementById('wpCollection').value || 'Agent, pick the best fit';

        const ticket = `TITLE
[customer-docs] ${articleTitle}

ASSIGNEE
Skynet

WHAT
Help-center article. Documentation only — no code changes.

NEW OR UPDATE?
${newOrUpdate}

COLLECTION (HELP-CENTER SECTION)
${collectionVal}

ARTICLE TITLE
${articleTitle}

CONTENT
${content}

Verify the facts against how the product actually works and correct the text if something is wrong.

SCREENSHOTS
${screenshotLine}

RELATED ARTICLES
${relatedLine}`;

        // Note: paste the ticket into Jira, then add a comment: @skynet please execute this ticket.

        draftText.value = ticket;

    } catch (err) {
        draftText.value = 'Error building ticket: ' + err.message;
    }

    draftBtn.textContent = 'Rebuild ticket';
    draftBtn.disabled = false;
}

function wpCopyDraft() {
    const text = document.getElementById('wpDraftText').value;
    navigator.clipboard.writeText(text).then(() => showSuccess('Ticket copied to clipboard!'));
}

// ── Step 4: Mark as submitted ─────────────────
function wpMarkPublished() {
    const issue = knowledgeBase.find(i => i.id === activePanelId);
    if (!issue) return;

    issue.status    = 'published';
    issue.updatedAt = new Date().toISOString();
    saveLocalData();
    showSuccess('Marked as ticket submitted!');
    updateStats();
    renderKB();

    document.getElementById('wpStep4').style.display = 'block';
    const meta = document.getElementById('wpIssueMeta');
    meta.innerHTML = `<span class="kb-category">${issue.category}</span><span class="kb-status-badge published" style="margin-left:6px;">📄 Published</span>`;
}

function wpRedraftArticle() {
    document.getElementById('wpDraftArea').style.display = 'none';
    document.getElementById('wpDraftText').value = '';
    document.getElementById('wpDraftBtn').textContent = 'Build Jira Ticket';
    document.getElementById('wpDraftBtn').disabled = false;
}

// ── Shared Helpers ────────────────────────────
function copyLink(url) {
    navigator.clipboard.writeText(url).then(() => showSuccess('Link copied!'));
}

function copySolution(id) {
    const issue = knowledgeBase.find(i => i.id === id);
    if (!issue?.solution) return;
    navigator.clipboard.writeText(issue.solution).then(() => showSuccess('Solution copied!'));
}

function toggleSolution(id) {
    const textEl   = document.getElementById('sol-text-' + id);
    const toggleEl = document.getElementById('sol-toggle-' + id);
    if (!textEl || !toggleEl) return;
    const expanded = textEl.style.maxHeight === 'none';
    textEl.style.maxHeight  = expanded ? '80px' : 'none';
    textEl.style.overflow   = expanded ? 'hidden' : 'visible';
    toggleEl.textContent    = expanded ? 'Show more ▾' : 'Show less ▴';
}

function formatMarkdown(text) {
    return text
        .replace(/^### (.+)$/gm, '<h4 style="color:var(--text);margin:12px 0 4px;font-size:0.88rem;font-family:\'Space Grotesk\',sans-serif;">$1</h4>')
        .replace(/^## (.+)$/gm,  '<h3 style="color:var(--text);margin:12px 0 4px;font-size:0.92rem;font-family:\'Space Grotesk\',sans-serif;">$1</h3>')
        .replace(/^# (.+)$/gm,   '<h3 style="color:var(--text);margin:12px 0 6px;font-size:0.95rem;font-family:\'Space Grotesk\',sans-serif;">$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g,    '<em>$1</em>')
        .replace(/^[-•]\s+(.+)$/gm,'<div style="padding:2px 0 2px 12px;">• $1</div>')
        .replace(/^\d+\.\s+(.+)$/gm,'<div style="padding:2px 0 2px 12px;">$1</div>')
        .replace(/^---+$/gm,      '<hr style="border:none;border-top:1px solid var(--border-2);margin:8px 0;">')
        .replace(/\n\n/g,         '<br><br>')
        .replace(/\n/g,           '<br>');
}
