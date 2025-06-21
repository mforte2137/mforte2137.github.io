// SOW Creator functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('SOW Creator loaded');

    // Auto-capitalization mappings (reused from process-builder)
    const autoCapitalize = {
        // Microsoft products
        'microsoft 365': 'Microsoft 365',
        'microsoft office': 'Microsoft Office',
        'office 365': 'Office 365',
        'teams': 'Microsoft Teams',
        'sharepoint': 'SharePoint',
        'onedrive': 'OneDrive',
        'azure': 'Microsoft Azure',
        'active directory': 'Active Directory',
        'azure ad': 'Azure AD',
        'exchange': 'Microsoft Exchange',
        'outlook': 'Microsoft Outlook',
        'windows': 'Windows',
        'windows server': 'Windows Server',
        'sql server': 'SQL Server',
        'hyper-v': 'Hyper-V',
        
        // Google products
        'google workspace': 'Google Workspace',
        'g suite': 'G Suite',
        'gmail': 'Gmail',
        'google drive': 'Google Drive',
        'google docs': 'Google Docs',
        'google sheets': 'Google Sheets',
        'google meet': 'Google Meet',
        'google calendar': 'Google Calendar',
        
        // Compliance and security
        'hipaa': 'HIPAA',
        'sox': 'SOX',
        'pci-dss': 'PCI-DSS',
        'pci dss': 'PCI-DSS',
        'gdpr': 'GDPR',
        'iso 27001': 'ISO 27001',
        'nist': 'NIST',
        'cmmc': 'CMMC',
        'fisma': 'FISMA',
        
        // Technology terms
        'vpn': 'VPN',
        'wan': 'WAN',
        'lan': 'LAN',
        'wifi': 'Wi-Fi',
        'voip': 'VoIP',
        'sip': 'SIP',
        'api': 'API',
        'ssl': 'SSL',
        'tls': 'TLS',
        'dns': 'DNS',
        'dhcp': 'DHCP',
        'smtp': 'SMTP',
        'imap': 'IMAP',
        'pop3': 'POP3',
        'ftp': 'FTP',
        'sftp': 'SFTP',
        'ssh': 'SSH',
        'rdp': 'RDP',
        'tcp/ip': 'TCP/IP',
        'https': 'HTTPS',
        'http': 'HTTP',
        
        // Business terms
        'sla': 'SLA',
        'rto': 'RTO',
        'rpo': 'RPO',
        'kpi': 'KPI',
        'roi': 'ROI',
        'cio': 'CIO',
        'cto': 'CTO',
        'it': 'IT',
        'msp': 'MSP',
        'sow': 'SOW',
        'rfp': 'RFP',
        
        // Common abbreviations
        'cpu': 'CPU',
        'gpu': 'GPU',
        'ram': 'RAM',
        'ssd': 'SSD',
        'hdd': 'HDD',
        'nas': 'NAS',
        'san': 'SAN',
        'vm': 'VM',
        'vms': 'VMs'
    };

    function capitalizeText(text) {
        let result = text;
        
        // Apply auto-capitalization
        for (const [lowercase, capitalized] of Object.entries(autoCapitalize)) {
            const regex = new RegExp(`\\b${lowercase}\\b`, 'gi');
            result = result.replace(regex, capitalized);
        }
        
        return result;
    }

    // Elements
    const generateBtn = document.getElementById('generate-sow-btn');
    const clearBtn = document.getElementById('clear-sow-btn');
    const copyBtn = document.getElementById('copy-sow-html-btn');
    const serviceTypeSelect = document.getElementById('sow-service-type');
    const specificServiceInput = document.getElementById('sow-specific-service');
    const clientTypeSelect = document.getElementById('sow-client-type');
    const durationSelect = document.getElementById('sow-duration');
    const budgetSelect = document.getElementById('sow-budget-range');
    const complexitySelect = document.getElementById('sow-complexity');
    
    const statusDiv = document.getElementById('sow-status');
    const progressContainer = document.getElementById('sow-progress-container');
    const progressText = document.getElementById('sow-progress-text');
    const progressBar = document.getElementById('sow-progress-bar');
    
    const contentSection = document.getElementById('sow-content-section');
    const sowEditor = document.getElementById('sow-editor');
    const outputContainer = document.getElementById('sow-output-container');
    const sowPreview = document.getElementById('sow-preview');
    const sowHtmlCode = document.getElementById('sow-html-code');

    // Show/hide progress
    function showProgress() {
        progressContainer.style.display = 'block';
        progressBar.style.animation = 'pulse 2s infinite';
    }

    function hideProgress() {
        progressContainer.style.display = 'none';
        progressBar.style.animation = 'none';
    }

    // Show status message
    function showStatus(message, type = 'info') {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }
    }

    // Build SOW prompt
    function buildSOWPrompt() {
        const serviceType = serviceTypeSelect.value;
        const specificService = specificServiceInput.value.trim();
        const clientType = clientTypeSelect.value;
        const duration = durationSelect.value;
        const budget = budgetSelect.value;
        const complexity = complexitySelect.value;

        if (!specificService) {
            throw new Error('Please enter a specific service or project description');
        }

        let prompt = `Create a professional Statement of Work (SOW) for an MSP project: "${specificService}". `;
        
        // Add service type context
        if (serviceType) {
            const serviceTypeMap = {
                'migration': 'This is a migration project involving data, system, or platform transitions.',
                'security': 'This is a security-focused project involving assessments, compliance, or security implementations.',
                'infrastructure': 'This is an infrastructure project involving hardware, network, or system upgrades.',
                'communication': 'This is a communication systems project involving VoIP, collaboration tools, or unified communications.',
                'backup': 'This is a backup and recovery project involving disaster recovery or backup system implementation.',
                'compliance': 'This is a compliance project involving regulatory requirements and auditing.',
                'custom': 'This is a custom MSP service project.'
            };
            prompt += serviceTypeMap[serviceType] + ' ';
        }

        // Add client context
        const clientTypeMap = {
            'small-business': 'The client is a small business with 10-50 employees.',
            'medium-business': 'The client is a medium business with 50-200 employees.',
            'enterprise': 'The client is an enterprise organization with 200+ employees.',
            'healthcare': 'The client is a healthcare organization with specific compliance requirements.',
            'financial': 'The client is a financial services organization with strict security and compliance needs.',
            'nonprofit': 'The client is a non-profit organization focused on cost-effectiveness.'
        };
        prompt += clientTypeMap[clientType] + ' ';

        // Add project parameters
        prompt += `The project duration is estimated at ${duration}. `;
        
        if (budget) {
            const budgetMap = {
                'under-10k': 'Budget is under $10,000.',
                '10k-25k': 'Budget range is $10,000 - $25,000.',
                '25k-50k': 'Budget range is $25,000 - $50,000.',
                '50k-100k': 'Budget range is $50,000 - $100,000.',
                'over-100k': 'Budget is over $100,000.'
            };
            prompt += budgetMap[budget] + ' ';
        }

        const complexityMap = {
            'standard': 'This is a standard implementation with typical requirements.',
            'complex': 'This is a complex project with custom requirements and integrations.',
            'enterprise': 'This is an enterprise-level project requiring extensive planning and coordination.'
        };
        prompt += complexityMap[complexity] + ' ';

        prompt += `

Generate a comprehensive SOW with these sections:

1. Executive Summary (2-3 paragraphs explaining the project overview, business benefits, and key outcomes)

2. Scope of Work (detailed description of what will be accomplished, broken into clear phases or work streams)

3. Deliverables (specific, measurable deliverables that will be provided to the client)

4. Project Timeline (phases of work with estimated timeframes)

5. Investment & Pricing (placeholder section noting that detailed pricing will be provided separately)

6. Terms & Conditions (standard MSP project terms including change management, client responsibilities, and project assumptions)

Use professional business language appropriate for ${clientType.replace('-', ' ')} clients. Include specific technical details relevant to "${specificService}" while keeping it accessible to business decision-makers. Focus on value proposition and risk mitigation.`;

        return prompt;
    }

    // Generate SOW
    async function generateSOW() {
        try {
            showProgress();
            showStatus('Generating Statement of Work...', 'info');

            const prompt = buildSOWPrompt();
            console.log('SOW Prompt:', prompt);

            const response = await fetch('/api/claude-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic: prompt,
                    tone: 'professional',
                    paragraphs: '6'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            if (data.error) {
                throw new Error(data.error);
            }

            let generatedContent = data.content || '';

// DEBUG: Let's see what the AI is actually returning
console.log('Raw AI Content:', generatedContent);
console.log('Content split by lines:', generatedContent.split('\n'));

// Apply auto-capitalization
generatedContent = capitalizeText(generatedContent);

displaySOWEditor(generatedContent);
generateSOWHTML(generatedContent);
            
            hideProgress();
            showStatus('SOW generated successfully!', 'success');

        } catch (error) {
            console.error('Error generating SOW:', error);
            hideProgress();
            showStatus(`Error: ${error.message}`, 'error');
        }
    }

// Display editable SOW content
function displaySOWEditor(content) {
    // Remove the prompt text that might be included
    let cleanContent = content;
    
    // Remove any line that starts with "Create a professional Statement of Work"
    const lines = cleanContent.split('\n');
    const filteredLines = lines.filter(line => {
        const trimmed = line.trim();
        return !trimmed.startsWith('Create a professional Statement of Work') &&
               !trimmed.startsWith('Generate a comprehensive SOW') &&
               trimmed.length > 0;
    });
    cleanContent = filteredLines.join('\n');
    
    // Split content into sections for easier editing
    const sections = cleanContent.split(/(?=\d+\.\s+[A-Z])/);
        
        sowEditor.innerHTML = '';
        
        sections.forEach((section, index) => {
            if (section.trim()) {
                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'sow-section';
                sectionDiv.style.cssText = 'margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;';
                
                const textarea = document.createElement('textarea');
                textarea.value = section.trim();
                textarea.style.cssText = 'width: 100%; min-height: 150px; border: none; resize: vertical; font-family: inherit;';
                textarea.addEventListener('input', updateSOWHTML);
                
                sectionDiv.appendChild(textarea);
                sowEditor.appendChild(sectionDiv);
            }
        });
        
        contentSection.style.display = 'block';
    }

    // Update SOW HTML when content changes
    function updateSOWHTML() {
        const textareas = sowEditor.querySelectorAll('textarea');
        const combinedContent = Array.from(textareas).map(ta => ta.value).join('\n\n');
        generateSOWHTML(combinedContent);
    }

    // Generate SOW HTML
    function generateSOWHTML(content) {
const lines = content.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && 
           !trimmed.startsWith('Create a professional Statement of Work') &&
           !trimmed.startsWith('Generate a comprehensive SOW') &&
           !trimmed.includes('This is a migration project involving') &&
           !trimmed.includes('The client is a small business') &&
           !trimmed.includes('The project duration is estimated') &&
           !trimmed.includes('Use professional business language') &&
           !trimmed.includes('Focus on value proposition');
});

// Find where the actual SOW content starts (after "Executive Summary")
let sowStartIndex = -1;
lines.forEach((line, index) => {
    if (line.trim() === 'Executive Summary' && sowStartIndex === -1) {
        sowStartIndex = index;
    }
});

// Only use content from the SOW start onwards
const cleanLines = sowStartIndex >= 0 ? lines.slice(sowStartIndex) : lines;

// Simple deduplication
const uniqueLines = [];
const seen = new Set();

cleanLines.forEach(line => {
    const trimmed = line.trim();
    if (!seen.has(trimmed)) {
        seen.add(trimmed);
        uniqueLines.push(line);
    }
});
        let html = `<div style="max-width: 800px; margin: 0 auto; padding: 40px 30px; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #96b83b; padding-bottom: 20px;">
        <h1 style="color: #96b83b; font-size: 28px; margin: 0 0 10px 0; font-weight: 600;">STATEMENT OF WORK</h1>
        <p style="color: #333; font-size: 20px; margin: 0; font-weight: 600;">${specificServiceInput.value}</p>
    </div>`;

        let currentSection = '';
        
        uniqueLines.forEach(line => {
            const trimmedLine = line.trim();
            
if (trimmedLine.match(/^\d+\.\s+[A-Z]/) || 
    trimmedLine === 'Executive Summary' || 
    trimmedLine === 'Scope of Work' || 
    trimmedLine === 'Deliverables' || 
    trimmedLine === 'Project Timeline' || 
    trimmedLine === 'Investment & Pricing' || 
    trimmedLine === 'Terms & Conditions') {
    // Section header
    if (currentSection) {
        html += '</div>';
    }
    currentSection = trimmedLine;
    
    // Check if this is a numbered item with description
    if (trimmedLine.match(/^\d+\.\s+[A-Z]/)) {
        // Split numbered header from description
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex > -1) {
            const headerPart = trimmedLine.substring(0, colonIndex + 1);
            const descriptionPart = trimmedLine.substring(colonIndex + 1).trim();
            html += `<div style="margin-bottom: 30px;">
                <h3 style="color: #333; font-size: 18px; margin: 20px 0 10px 0; font-weight: 600;">${headerPart}</h3>
                <p style="margin: 10px 0; text-align: justify;">${descriptionPart}</p>`;
        } else {
            html += `<div style="margin-bottom: 30px;">
                <h3 style="color: #333; font-size: 18px; margin: 20px 0 10px 0; font-weight: 600;">${trimmedLine}</h3>`;
        }
    } else {
        // Main section header
        html += `<div style="margin-bottom: 30px;">
            <h2 style="color: #96b83b; font-size: 22px; margin: 0 0 15px 0; padding: 10px 0; border-bottom: 2px solid #e0e0e0; font-weight: 700;">${trimmedLine}</h2>`;
    }
    // Section header
                if (currentSection) {
                    html += '</div>';
                }
                currentSection = trimmedLine;
                html += `<div style="margin-bottom: 30px;">
                    <h2 style="color: #96b83b; font-size: 22px; margin: 0 0 15px 0; padding: 10px 0; border-bottom: 2px solid #e0e0e0; font-weight: 700;">${trimmedLine}</h2>`;
            } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
                // Bullet point
                const bulletContent = trimmedLine.substring(1).trim();
                html += `<div style="margin: 8px 0; padding-left: 20px; position: relative;">
                    <span style="position: absolute; left: 0; color: #96b83b; font-weight: bold;">•</span>
                    ${bulletContent}
                </div>`;
            } else if (trimmedLine.length > 0) {
                // Regular paragraph
                html += `<p style="margin: 15px 0; text-align: justify;">${trimmedLine}</p>`;
            }
        });
        
        if (currentSection) {
            html += '</div>';
        }
        
        html += `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0; text-align: center;">
        <p style="color: #666; font-size: 14px; margin: 0;">This Statement of Work is valid for 30 days from the date of issue.</p>
    </div>
</div>`;

        // Update preview and code
        sowPreview.innerHTML = html;
        sowHtmlCode.textContent = html;
        
        outputContainer.style.display = 'block';
    }

    // Copy HTML to clipboard
    function copySOWHTML() {
        const html = sowHtmlCode.textContent;
        navigator.clipboard.writeText(html).then(() => {
            showStatus('HTML code copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            showStatus('Failed to copy HTML code', 'error');
        });
    }

    // Clear all fields
    function clearSOWFields() {
        serviceTypeSelect.value = '';
        specificServiceInput.value = '';
        clientTypeSelect.value = 'small-business';
        durationSelect.value = '1-2 weeks';
        budgetSelect.value = '';
        complexitySelect.value = 'standard';
        
        contentSection.style.display = 'none';
        outputContainer.style.display = 'none';
        statusDiv.style.display = 'none';
        hideProgress();
        
        showStatus('All fields cleared', 'success');
    }

    // Event listeners
    if (generateBtn) {
        generateBtn.addEventListener('click', generateSOW);
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', clearSOWFields);
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', copySOWHTML);
    }

    console.log('SOW Creator initialized successfully');
});
