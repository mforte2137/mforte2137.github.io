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

5. Investment & Pricing (section referencing that detailed pricing and line items are included in the pricing section of this proposal)

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
    // Use the same simple approach as generateSOWHTML
    const lines = content.split('\n');
    
    // Find where "Executive Summary" first appears and start from there
    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === 'Executive Summary') {
            startIndex = i;
            break;
        }
    }
    
    // Use only the content from Executive Summary onwards
    const cleanLines = startIndex >= 0 ? lines.slice(startIndex) : lines;
    const cleanContent = cleanLines.join('\n');
    
    // Split into sections based on main headers, not numbered items
    const sections = cleanContent.split(/(Executive Summary|Scope of Work|Deliverables|Project Timeline|Investment & Pricing|Terms & Conditions)/);
    
    sowEditor.innerHTML = '';
    
    // Process sections in pairs (header + content)
    for (let i = 1; i < sections.length; i += 2) {
        const header = sections[i];
        const content = sections[i + 1] || '';
        const combined = header + content;
        
        if (combined.trim()) {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'sow-section';
            sectionDiv.style.cssText = 'margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;';
            
            const textarea = document.createElement('textarea');
            textarea.value = combined.trim();
            textarea.style.cssText = 'width: 100%; min-height: 150px; border: none; resize: vertical; font-family: inherit;';
            textarea.addEventListener('input', updateSOWHTML);
            
            sectionDiv.appendChild(textarea);
            sowEditor.appendChild(sectionDiv);
        }
    }
    
    contentSection.style.display = 'block';
}

    // Update SOW HTML when content changes
    function updateSOWHTML() {
        const textareas = sowEditor.querySelectorAll('textarea');
        const combinedContent = Array.from(textareas).map(ta => ta.value).join('\n\n');
        generateSOWHTML(combinedContent);
    }

// Generate SOW HTML (Table-based for TinyMCE compatibility)
function generateSOWHTML(content) {
    const lines = content.split('\n');
    
    // Find where "Executive Summary" first appears and start from there
    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === 'Executive Summary') {
            startIndex = i;
            break;
        }
    }
    
    // Use only the content from Executive Summary onwards
    const cleanLines = startIndex >= 0 ? lines.slice(startIndex) : lines;
    
    let html = `<h2 style="color: #2c3e50; text-align: center; margin-bottom: 30px; font-size: 28px;">STATEMENT OF WORK</h2>
<p style="text-align: center; margin-bottom: 40px; font-size: 16px; color: #666;">${specificServiceInput.value}</p>
<table style="width: 100%; border-collapse: collapse; margin-top: 20px; border: none;">`;

    let currentSection = '';
    let sectionContent = '';
    
    cleanLines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        if (trimmedLine === 'Executive Summary' || 
            trimmedLine === 'Scope of Work' || 
            trimmedLine === 'Deliverables' || 
            trimmedLine === 'Project Timeline' || 
            trimmedLine === 'Investment & Pricing' || 
            trimmedLine === 'Terms & Conditions') {
            
            // Add previous section to table if exists
            if (currentSection && sectionContent) {
                html += `
  <tr>
    <td style="width: 25%; padding: 20px 15px; vertical-align: top; border: none; border-bottom: 1px solid #f0f0f0;">
      <h3 style="margin: 0; font-size: 18px; color: #333; font-weight: bold;">${currentSection}</h3>
    </td>
    <td style="width: 75%; padding: 20px 15px; vertical-align: top; border: none; border-bottom: 1px solid #f0f0f0;">
      ${sectionContent}
    </td>
  </tr>`;
            }
            
            // Start new section
            currentSection = trimmedLine;
            sectionContent = '';
            
        } else if (trimmedLine.match(/^\d+\.\s+[A-Z]/)) {
            // Numbered header
            const colonIndex = trimmedLine.indexOf(':');
            if (colonIndex > -1) {
                const headerPart = trimmedLine.substring(0, colonIndex + 1);
                const descriptionPart = trimmedLine.substring(colonIndex + 1).trim();
                sectionContent += `<h4 style="margin: 15px 0 8px 0; font-size: 16px; color: #333; font-weight: bold;">${headerPart}</h4>`;
                if (descriptionPart) {
                    sectionContent += `<p style="margin: 0 0 10px 0; color: #666; font-size: 14px; line-height: 1.5;">${descriptionPart}</p>`;
                }
            } else {
                sectionContent += `<h4 style="margin: 15px 0 8px 0; font-size: 16px; color: #333; font-weight: bold;">${trimmedLine}</h4>`;
            }
            
        } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
            // Bullet points
            const bulletContent = trimmedLine.substring(1).trim();
            sectionContent += `<p style="margin: 3px 0; color: #666; font-size: 14px; line-height: 1.5;">• ${bulletContent}</p>`;
            
        } else if (trimmedLine.length > 0) {
            // Regular paragraphs
            sectionContent += `<p style="margin: 10px 0; color: #666; font-size: 14px; line-height: 1.5;">${trimmedLine}</p>`;
        }
    });
    
    // Add final section
    if (currentSection && sectionContent) {
        html += `
  <tr>
    <td style="width: 25%; padding: 20px 15px; vertical-align: top; border: none; border-bottom: 1px solid #f0f0f0;">
      <h3 style="margin: 0; font-size: 18px; color: #333; font-weight: bold;">${currentSection}</h3>
    </td>
    <td style="width: 75%; padding: 20px 15px; vertical-align: top; border: none; border-bottom: 1px solid #f0f0f0;">
      ${sectionContent}
    </td>
  </tr>`;
    }
    
    // Remove border from last row and close table
    html = html.replace(/border-bottom: 1px solid #f0f0f0;(?=[^<]*<\/tr>\s*$)/g, 'border-bottom: none;');
    html += `
</table>
<p style="text-align: center; margin-top: 40px; font-size: 12px; color: #999;">This Statement of Work is valid for 30 days from the date of issue.</p>`;

    // Update preview and code
    sowPreview.innerHTML = html;
    sowHtmlCode.textContent = html;
    
    outputContainer.style.display = 'block';
}

// Copy HTML to clipboard
function copySOWHTML() {
    const html = sowHtmlCode.textContent;
    navigator.clipboard.writeText(html).then(() => {
        // Store original button text
        const originalText = copyBtn.textContent;
        
        // Change button to show "Copied!"
        copyBtn.textContent = 'Copied!';
        copyBtn.style.backgroundColor = '#28a745'; // Green color
        
        // Reset button after 2 seconds
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.backgroundColor = '#96b83b'; // Original color
        }, 2000);
        
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
