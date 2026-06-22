// ─────────────────────────────────────────────
//  Salesbuildr Support KB  –  kb.js
// ─────────────────────────────────────────────

// ── Global State ──────────────────────────────
let knowledgeBase = [];
let editingId = null;

// ── Init ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    loadLocalData();
    setupFileUpload();
    updateStats();
    renderKB();
});

// ── Local Storage ─────────────────────────────
function loadLocalData() {
    const stored = localStorage.getItem('knowledgeBase');
    if (stored) {
        knowledgeBase = JSON.parse(stored);
    }
}

function saveLocalData() {
    localStorage.setItem('knowledgeBase', JSON.stringify(knowledgeBase));
}

// ── UI – Add / Edit Form ──────────────────────
function showAddForm() {
    document.getElementById('addForm').style.display = 'block';
    document.getElementById('issueTitle').focus();
    editingId = null;
    clearForm();
}

function hideAddForm() {
    document.getElementById('addForm').style.display = 'none';
    editingId = null;
    clearForm();
}

function clearForm() {
    document.getElementById('issueTitle').value = '';
    document.getElementById('issueCategory').value = '';
    document.getElementById('issueDescription').value = '';
    document.getElementById('issueSolution').value = '';
    document.getElementById('jiraLink').value = '';
    document.getElementById('intercomId').value = '';
    document.getElementById('loomUrl').value = '';
    document.getElementById('additionalRef').value = '';
    document.getElementById('uploadedFiles').innerHTML = '';
}

// ── Notifications ─────────────────────────────
function showSuccess(message) {
    const el = document.getElementById('successMessage');
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 5000);
}

function showError(message) {
    const el = document.getElementById('errorMessage');
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 8000);
}

// ── File Upload ───────────────────────────────
function setupFileUpload() {
    const fileUpload = document.getElementById('fileUpload');
    const fileInput  = document.getElementById('screenshotFile');

    fileUpload.onclick = () => fileInput.click();

    fileUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUpload.classList.add('dragover');
    });

    fileUpload.addEventListener('dragleave', () => {
        fileUpload.classList.remove('dragover');
    });

    fileUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUpload.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

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
                div.innerHTML = `
                    <img src="${e.target.result}" style="max-width:200px;max-height:200px;border-radius:8px;margin-right:10px;">
                    <span>${file.name}</span>
                    <button onclick="this.parentElement.remove()" style="margin-left:10px;padding:4px 8px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;">Remove</button>
                `;
                container.appendChild(div);
            };
            reader.readAsDataURL(file);
        }
    });
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
        showError('Please fill in Title and Category (Solution can be added later).');
        return;
    }

    const saveButton  = document.getElementById('saveButtonText');
    const saveLoading = document.getElementById('saveLoading');
    saveButton.style.display  = 'none';
    saveLoading.style.display = 'inline-block';

    try {
        // Collect uploaded images
        const images = [];
        const imgElements = document.getElementById('uploadedFiles').querySelectorAll('img');
        imgElements.forEach(img => {
            images.push({ name: img.nextElementSibling.textContent, data: img.src });
        });

        const issue = {
            id: editingId || Date.now().toString(),
            title,
            category,
            description,
            solution,
            references: { jira: jiraLink, intercom: intercomId, loom: loomUrl, additional: additionalRef },
            images,
            createdAt: editingId
                ? (knowledgeBase.find(i => i.id === editingId)?.createdAt || new Date().toISOString())
                : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (editingId) {
            const index = knowledgeBase.findIndex(i => i.id === editingId);
            knowledgeBase[index] = issue;
        } else {
            knowledgeBase.unshift(issue);
        }

        saveLocalData();
        showSuccess('Issue saved!');
        hideAddForm();
        updateStats();
        renderKB();

    } catch (error) {
        console.error('Save error:', error);
        showError('Failed to save issue. Please try again.');
    }

    saveButton.style.display  = 'inline';
    saveLoading.style.display = 'none';
}

// ── Edit Issue ────────────────────────────────
function editIssue(id) {
    const issue = knowledgeBase.find(i => i.id === id);
    if (!issue) return;

    editingId = id;
    document.getElementById('issueTitle').value       = issue.title;
    document.getElementById('issueCategory').value    = issue.category;
    document.getElementById('issueDescription').value = issue.description;
    document.getElementById('issueSolution').value    = issue.solution;
    document.getElementById('jiraLink').value         = issue.references?.jira || '';
    document.getElementById('intercomId').value       = issue.references?.intercom || '';
    document.getElementById('loomUrl').value          = issue.references?.loom || '';
    document.getElementById('additionalRef').value    = issue.references?.additional || '';

    const container = document.getElementById('uploadedFiles');
    container.innerHTML = '';
    if (issue.images) {
        issue.images.forEach(img => {
            const div = document.createElement('div');
            div.style.marginTop = '10px';
            div.innerHTML = `
                <img src="${img.data}" style="max-width:200px;max-height:200px;border-radius:8px;margin-right:10px;">
                <span>${img.name}</span>
                <button onclick="this.parentElement.remove()" style="margin-left:10px;padding:4px 8px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;">Remove</button>
            `;
            container.appendChild(div);
        });
    }

    document.getElementById('addForm').style.display = 'block';
    document.getElementById('issueTitle').focus();
}

// ── Delete Issue ──────────────────────────────
function deleteIssue(id) {
    if (!confirm('Are you sure you want to delete this issue?')) return;
    knowledgeBase = knowledgeBase.filter(i => i.id !== id);
    saveLocalData();
    showSuccess('Issue deleted!');
    updateStats();
    renderKB();
}

// ── Search & Filter ───────────────────────────
function searchKB() {
    const query    = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;

    const filtered = knowledgeBase.filter(issue => {
        const matchesSearch = query === '' ||
            issue.title.toLowerCase().includes(query) ||
            (issue.description && issue.description.toLowerCase().includes(query)) ||
            (issue.solution    && issue.solution.toLowerCase().includes(query)) ||
            Object.values(issue.references || {}).some(ref => ref && ref.toLowerCase().includes(query)) ||
            query.split(' ').every(word =>
                issue.title.toLowerCase().includes(word) ||
                (issue.description && issue.description.toLowerCase().includes(word)) ||
                (issue.solution    && issue.solution.toLowerCase().includes(word))
            );

        const matchesCategory = category === '' || issue.category === category;
        return matchesSearch && matchesCategory;
    });

    renderKB(filtered);
}

function filterByCategory() {
    searchKB();
}

// ── Render KB List ────────────────────────────
function renderKB(issues = knowledgeBase) {
    const container = document.getElementById('kbContent');

    if (issues.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>${knowledgeBase.length === 0 ? 'No issues yet' : 'No matching issues found'}</h3>
                <p>${knowledgeBase.length === 0 ? 'Add your first support issue and solution to get started!' : 'Try adjusting your search or filter criteria.'}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = issues.map(issue => {
        const references = [];
        if (issue.references?.jira)       references.push(`<a href="${issue.references.jira}" class="reference-link" target="_blank">🎫 Jira Ticket</a>`);
        if (issue.references?.intercom)   references.push(`<a href="https://app.intercom.com/a/conversations/${issue.references.intercom}" class="reference-link" target="_blank">💬 Chat ${issue.references.intercom}</a>`);
        if (issue.references?.loom)       references.push(`<a href="${issue.references.loom}" class="reference-link" target="_blank">🎥 Loom Video</a>`);
        if (issue.references?.additional) references.push(`<span class="reference-link">🔗 ${issue.references.additional}</span>`);

        const images = issue.images ? issue.images.map(img =>
            `<img src="${img.data}" alt="${img.name}" style="max-width:200px;margin:10px 10px 0 0;border-radius:8px;cursor:pointer;" onclick="window.open('${img.data}','_blank')">`
        ).join('') : '';

        const solutionHtml = issue.solution
            ? `<div class="kb-solution"><strong>Solution:</strong><div>${issue.solution.replace(/\n/g, '<br>')}</div></div>`
            : `<div class="pending-solution"><strong style="color:#92400e;">⏳ Solution Pending</strong><div style="color:#78350f;">This issue is recorded but doesn't have a solution yet.</div></div>`;

        return `
            <div class="kb-item">
                <div class="kb-category">${issue.category}</div>
                <div class="kb-title">${issue.title}</div>
                ${issue.description ? `<div class="kb-description">${issue.description}</div>` : ''}
                ${solutionHtml}
                ${images ? `<div style="margin-top:15px;">${images}</div>` : ''}
                ${references.length > 0 ? `<div class="kb-references">${references.join('')}</div>` : ''}
                <div class="kb-actions">
                    <button class="btn btn-secondary btn-small" onclick="editIssue('${issue.id}')">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="deleteIssue('${issue.id}')">Delete</button>
                    <button class="btn btn-ai btn-small" onclick="checkSingleIssueGap('${issue.id}')">🤖 Check Gap</button>
                    <span style="color:#64748b;font-size:0.8rem;margin-left:10px;">
                        ${issue.updatedAt !== issue.createdAt ? 'Updated' : 'Created'}: ${new Date(issue.updatedAt || issue.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// ── Update Stats ──────────────────────────────
function updateStats() {
    document.getElementById('totalIssues').textContent = knowledgeBase.length;

    const categories = new Set(knowledgeBase.map(i => i.category)).size;
    document.getElementById('totalCategories').textContent = categories || 0;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentCount = knowledgeBase.filter(i => new Date(i.createdAt) > weekAgo).length;
    document.getElementById('recentlyAdded').textContent = recentCount;
}

// ── Export / Import ───────────────────────────
function exportData() {
    const data = { knowledgeBase, exportedAt: new Date().toISOString(), version: '1.0' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `salesbuildr-kb-${new Date().toISOString().split('T')[0]}.json`;
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
                saveLocalData();
                updateStats();
                renderKB();
                showSuccess(`Imported ${knowledgeBase.length} issues successfully!`);
            } else {
                showError('Invalid file format. Please export from this app and try again.');
            }
        } catch {
            showError('Failed to parse imported file. Please check the file format.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ─────────────────────────────────────────────
//  AI GAP ANALYSIS  (uses CLAUDE_API_KEY env
//  var via Netlify Functions proxy)
// ─────────────────────────────────────────────

const HELP_CENTER_URL = 'https://salesbuildr.featurebase.app/en/help';

// Open panel and optionally set a heading
function openAiPanel(title) {
    const panel = document.getElementById('aiPanel');
    panel.style.display = 'block';
    if (title) document.getElementById('aiPanelTitle').textContent = title;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleAiPanel() {
    const panel = document.getElementById('aiPanel');
    const isHidden = panel.style.display === 'none' || panel.style.display === '';
    if (isHidden) {
        openAiPanel('🤖 AI Gap Analysis — Full KB');
    } else {
        panel.style.display = 'none';
    }
}

// Called from the KB list "Check Gap" button
function checkSingleIssueGap(id) {
    const issue = knowledgeBase.find(i => i.id === id);
    if (!issue) return;
    openAiPanel(`🤖 Gap Check — "${issue.title}"`);
    runGapAnalysis(issue);
}

// Called from the form "Check Gap" button (uses live form values)
function checkFormIssueGap() {
    const title       = document.getElementById('issueTitle').value.trim();
    const category    = document.getElementById('issueCategory').value;
    const description = document.getElementById('issueDescription').value.trim();
    const solution    = document.getElementById('issueSolution').value.trim();

    if (!title) {
        showError('Please enter at least a title before checking the gap.');
        return;
    }

    const liveIssue = { title, category, description, solution };
    openAiPanel(`🤖 Gap Check — "${title}"`);
    runGapAnalysis(liveIssue);
}

// Core analysis — pass a single issue object, or nothing for full KB mode
async function runGapAnalysis(singleIssue = null) {
    if (!singleIssue && knowledgeBase.length === 0) {
        showError('No issues in your KB yet. Add some issues first!');
        return;
    }

    const resultEl   = document.getElementById('aiResult');
    const draftPanel = document.getElementById('aiArticleDraft');
    draftPanel.style.display = 'none';
    document.getElementById('draftControls').style.display = 'none';

    resultEl.className     = 'ai-result loading-state';
    resultEl.style.display = 'flex';
    resultEl.innerHTML     = '<div class="loading"></div> Checking against the Salesbuildr help centre…';

    let prompt;

    if (singleIssue) {
        // ── Single-issue mode ──
        const issueDetail = [
            `Title: ${singleIssue.title}`,
            singleIssue.category    ? `Category: ${singleIssue.category}`       : '',
            singleIssue.description ? `Description: ${singleIssue.description}` : '',
            singleIssue.solution    ? `Current solution notes: ${singleIssue.solution}` : '(no solution recorded yet)'
        ].filter(Boolean).join('\n');

        prompt = `You are a support documentation expert for Salesbuildr, a B2B quoting and sales tool for MSPs.

The public Salesbuildr Help Centre is at: ${HELP_CENTER_URL}

I have the following support issue in our internal KB:

${issueDetail}

Please:
1. Assess whether this issue is likely already covered by an existing help centre article (based on common SaaS documentation patterns for quoting/proposal tools).
2. If it IS covered — describe what the article likely says and suggest I link to it.
3. If it is NOT covered (a gap) — confirm it's a documentation opportunity and suggest what a help article for this issue should cover.
4. Either way, suggest whether I should write or update a help article and give a one-paragraph article outline.

Format your response with these headings:
## 📖 Help Centre Coverage Assessment
## 📝 Recommended Article Outline

Be specific and actionable.`;

    } else {
        // ── Full KB mode ──
        const kbSummary = knowledgeBase.map(i =>
            `• [${i.category}] ${i.title}${i.solution ? ' (has solution)' : ' (NO SOLUTION YET)'}`
        ).join('\n');

        prompt = `You are a support documentation expert for Salesbuildr, a B2B quoting and sales tool.

Here are the issues currently recorded in our internal Knowledge Base:

${kbSummary}

The public Salesbuildr Help Centre is at: ${HELP_CENTER_URL}

Please analyse this KB and:
1. Identify which issues likely already have coverage in the help centre.
2. Identify GAPS – issues that probably don't have a help article and represent real documentation opportunities.
3. Suggest the top 3 KB articles that should be written, with a one-line rationale for each.

Format your response clearly with these headings:
## ✅ Likely Already Documented
## 🔴 Gaps Identified
## 📝 Top 3 Recommended Articles to Write

Keep it concise and actionable.`;
    }

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

        const data = await response.json();

        if (data.error) {
            resultEl.className     = 'ai-result';
            resultEl.style.display = 'block';
            resultEl.textContent   = '⚠️ API Error: ' + (data.error.message || JSON.stringify(data.error));
            return;
        }

        const text = data.content?.map(b => b.text || '').join('\n') || 'No response received.';
        resultEl.className     = 'ai-result';
        resultEl.style.display = 'block';
        resultEl.innerHTML     = formatMarkdown(text);
        resultEl.dataset.analysis = text;

        document.getElementById('draftControls').style.display = 'block';

    } catch (err) {
        resultEl.className     = 'ai-result';
        resultEl.style.display = 'block';
        resultEl.textContent   = '⚠️ Failed to reach Claude API: ' + err.message;
    }
}

async function draftArticle() {
    const resultEl   = document.getElementById('aiResult');
    const draftPanel = document.getElementById('aiArticleDraft');
    const draftText  = document.getElementById('draftArticleText');

    const context    = document.getElementById('articleContext').value.trim();
    const analysis   = resultEl.dataset.analysis || '';

    draftPanel.style.display = 'none';
    draftText.value = 'Drafting article…';
    draftPanel.style.display = 'block';

    const prompt = `You are a technical writer for Salesbuildr, a B2B quoting and sales tool for MSPs.

Based on the following gap analysis of our KB:
${analysis}

${context ? `Additional context provided: ${context}` : ''}

Please draft a complete, well-structured help centre article for the most important gap identified. The article should:
- Have a clear title
- Include a brief intro paragraph
- Use numbered steps where relevant
- Include tips or notes where helpful
- Be written for end-users (not developers)
- Be approximately 300-500 words

Return ONLY the article content, ready to publish.`;

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

        const data = await response.json();
        const text = data.content?.map(b => b.text || '').join('\n') || 'No content generated.';
        draftText.value = text;

    } catch (err) {
        draftText.value = 'Error generating article: ' + err.message;
    }
}

function copyDraft() {
    const text = document.getElementById('draftArticleText').value;
    navigator.clipboard.writeText(text).then(() => {
        showSuccess('Article copied to clipboard!');
    });
}

// ── Simple Markdown → HTML (headings + bullets) ──
function formatMarkdown(text) {
    return text
        .replace(/^## (.+)$/gm, '<h3 style="color:var(--text);margin:16px 0 8px;font-size:0.95rem;font-family:\'Space Grotesk\',sans-serif;">$1</h3>')
        .replace(/^• (.+)$/gm, '<div style="padding:2px 0 2px 12px;">• $1</div>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '<br>');
}

// ─────────────────────────────────────────────
//  ASK THE KB  –  Right panel
//  Sends question to Claude which searches the
//  Salesbuildr help centre and returns articles
// ─────────────────────────────────────────────

async function askKB() {
    const question = document.getElementById('askQuestion').value.trim();
    if (!question) return;

    const resultEl   = document.getElementById('askResult');
    const articlesEl = document.getElementById('askArticles');
    const draftBtn   = document.getElementById('askDraftBtn');

    articlesEl.innerHTML = '';
    draftBtn.style.display = 'none';
    resultEl.style.display = 'block';
    resultEl.className = 'ask-result loading-state';
    resultEl.innerHTML = '<div class="loading"></div> Deep searching help centre — title, description & body…';

    try {
        // Use the existing featurebase.js function — sends query + instructions,
        // gets back a standard Claude API response
        const response = await fetch('/.netlify/functions/kb-featurebase-deep', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: question })
        });

        const data = await response.json();

        if (data.error) {
            resultEl.className = 'ask-result error-state';
            resultEl.style.display = 'block';
            resultEl.textContent = '⚠️ ' + data.error;
            return;
        }

        // featurebase.js returns a standard Claude API response object
        const text = data.content?.map(b => b.text || '').join('\n') || '';

        if (!text) {
            resultEl.className = 'ask-result error-state';
            resultEl.style.display = 'block';
            resultEl.textContent = '⚠️ No response received.';
            return;
        }

        // Check for gap marker
        const hasGap = text.includes('THE GAP');
        let mainText = text;
        let gapText  = '';

        if (hasGap) {
            const parts = text.split('THE GAP');
            mainText = parts[0].trim();
            gapText  = parts[1]?.trim() || '';
        }

        // Extract any URLs from the response to build clickable article links
        const urlPattern = /https?:\/\/[^\s)\]>,"]+/g;
        const foundUrls  = [...new Set(text.match(urlPattern) || [])].filter(u => u.includes('featurebase'));

        // Show the main answer text
        resultEl.className = 'ask-result';
        resultEl.style.display = 'block';
        resultEl.innerHTML = formatMarkdown(mainText);

        // If URLs were found, render them as article links
        if (foundUrls.length > 0) {
            articlesEl.innerHTML = '<div class="ask-article-label" style="margin-top:12px;">Related Articles</div>' +
                foundUrls.map(url => {
                    const safeUrl = url.replace(/'/g, '%27');
                    // Extract a readable title from the URL slug
                    const slug  = url.split('/').pop() || url;
                    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    return `
                    <div class="ask-article-item">
                        <a href="${url}" target="_blank" class="ask-article-link">${title}</a>
                        <div style="display:flex;gap:8px;margin-top:6px;">
                            <button class="btn btn-secondary btn-small" onclick="copyArticleLink('${safeUrl}')">📋 Copy Link</button>
                            <a href="${url}" target="_blank" class="btn btn-secondary btn-small" style="text-decoration:none;">Open ↗</a>
                        </div>
                    </div>`;
                }).join('');
        }

        // Show gap section if present
        if (hasGap && gapText) {
            const gapDiv = document.createElement('div');
            gapDiv.className = 'ask-result';
            gapDiv.style.marginTop = '10px';
            gapDiv.style.borderColor = 'var(--warn)';
            gapDiv.style.background = 'var(--warn-bg)';
            gapDiv.innerHTML = `<span style="color:var(--warn);font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">⚠ Documentation Gap</span><p style="margin-top:8px;color:var(--warn);font-size:0.88rem;">${gapText}</p>`;
            articlesEl.appendChild(gapDiv);
        }

        // Always show draft button after a search
        draftBtn.dataset.question = question;
        draftBtn.dataset.gapText  = gapText;
        draftBtn.textContent = hasGap ? '✍️ Draft missing article' : '✍️ Draft article for this topic';
        draftBtn.style.display = 'block';
        document.getElementById('askDevContext').value = '';
        document.getElementById('askContextArea').style.display = 'block';

    } catch (err) {
        resultEl.className = 'ask-result error-state';
        resultEl.style.display = 'block';
        resultEl.textContent = '⚠️ Error: ' + err.message;
    }
}

function copyArticleLink(url) {
    navigator.clipboard.writeText(url).then(() => showSuccess('Link copied!'));
}

async function draftMissingArticle() {
    const btn      = document.getElementById('askDraftBtn');
    const question = btn.dataset.question || '';
    const draftEl  = document.getElementById('askDraftArea');
    const textEl   = document.getElementById('askDraftText');

    draftEl.style.display = 'block';
    textEl.value = 'Drafting article…';
    draftEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const gapContext  = btn.dataset.gapText ? `\n\nGap identified: ${btn.dataset.gapText}` : '';
    const devContext  = (document.getElementById('askDevContext')?.value || '').trim();
    const devSection  = devContext ? `\n\nAdditional context from the support/dev team (use this to ensure accuracy — this takes priority over any assumptions):\n${devContext}` : '';

    const prompt = `You are a technical writer for Salesbuildr, a B2B quoting and sales platform for MSPs.

A support agent searched for help with: "${question}"${gapContext}${devSection}

Please draft a complete, well-structured help centre article that would answer this question. The article should:
- Have a clear title
- Include a brief intro paragraph
- Use numbered steps where relevant
- Include tips or notes where helpful
- Be written for end-users (not developers)
- Be approximately 300–500 words
${devContext ? '- Make sure to accurately reflect the context provided above — do not make assumptions that contradict it' : ''}

Return ONLY the article content, ready to publish.`;

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
        const data = await response.json();
        textEl.value = data.content?.map(b => b.text || '').join('\n') || 'Error generating draft.';
    } catch (err) {
        textEl.value = 'Error: ' + err.message;
    }
}

function copyAskDraft() {
    const text = document.getElementById('askDraftText').value;
    navigator.clipboard.writeText(text).then(() => showSuccess('Draft copied to clipboard!'));
}

// Allow Enter key (without Shift) to submit the ask question
document.addEventListener('DOMContentLoaded', function () {
    const askInput = document.getElementById('askQuestion');
    if (askInput) {
        askInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                askKB();
            }
        });
    }
});
