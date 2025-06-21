// Process Builder JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const serviceType = document.getElementById('service-type');
    const specificService = document.getElementById('specific-service');
    const targetAudience = document.getElementById('target-audience');
    const processSteps = document.getElementById('process-steps');
    const brandColor = document.getElementById('brand-color');
    const generateBtn = document.getElementById('generate-process-btn');
    const clearBtn = document.getElementById('clear-process-btn');
    const statusDiv = document.getElementById('process-status');
    const progressContainer = document.getElementById('process-progress-container');
    const progressBar = document.getElementById('process-progress-bar');
    const contentSection = document.getElementById('process-content-section');
    const stepsEditor = document.getElementById('process-steps-editor');
    const outputContainer = document.getElementById('process-output-container');
    const processPreview = document.getElementById('process-preview');
    const processHtmlCode = document.getElementById('process-html-code');
    const copyBtn = document.getElementById('copy-process-html-btn');

    // Base64 encoded checkmark icon (green circle with white checkmark)
    const checkmarkIconBase64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM5NmI4M2IiLz4KPHBhdGggZD0iTTEyIDIwTDE4IDI2TDI4IDE2IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K';

    // Store generated process data
    let generatedProcessData = null;

    // Service type change handler
    serviceType.addEventListener('change', function() {
        if (this.value === 'custom') {
            specificService.placeholder = 'Describe your custom MSP service...';
        } else {
            updateSpecificServicePlaceholder();
        }
    });

    // Update placeholder based on service type
    function updateSpecificServicePlaceholder() {
        const serviceTypeValue = serviceType.value;
        const placeholders = {
            'migration': 'e.g., G Suite to Microsoft 365 Migration',
            'security': 'e.g., Cybersecurity Assessment and Implementation', 
            'infrastructure': 'e.g., Firewall Upgrade and Network Hardening',
            'communication': 'e.g., Microsoft Teams Implementation',
            'backup': 'e.g., Disaster Recovery Planning and Setup',
            'compliance': 'e.g., HIPAA Compliance Implementation'
        };
        
        specificService.placeholder = placeholders[serviceTypeValue] || 'e.g., Describe your MSP service';
    }

// Generate process steps
    generateBtn.addEventListener('click', async function() {
        const service = specificService.value.trim();
        const serviceTypeValue = serviceType.value;
        const audience = targetAudience.value;
        const numSteps = parseInt(processSteps.value);

// Auto-capitalize common acronyms
let processedService = service
    .replace(/\bhipaa\b/gi, 'HIPAA')
    .replace(/\bpci\b/gi, 'PCI')
    .replace(/\bsox\b/gi, 'SOX')
    .replace(/\bm365\b/gi, 'M365')
    .replace(/\bmsp\b/gi, 'MSP')
    .replace(/\bvoip\b/gi, 'VoIP')
    .replace(/\baws\b/gi, 'AWS')
    .replace(/\bazure\b/gi, 'Azure')
    .replace(/\bg suite\b/gi, 'G Suite')
    .replace(/\bgsuite\b/gi, 'G Suite');

// Replace company references with Salesbuildr variable
processedService = processedService
    .replace(/\byour organization's\b/gi, "{{company.name}}'s")
    .replace(/\byour company's\b/gi, "{{company.name}}'s")
    .replace(/\byour business's\b/gi, "{{company.name}}'s")
    .replace(/\byour organization\b/gi, '{{company.name}}')
    .replace(/\byour company\b/gi, '{{company.name}}')
    .replace(/\byour business\b/gi, '{{company.name}}')
    .replace(/\byour small business\b/gi, '{{company.name}}')
    .replace(/\byour medium business\b/gi, '{{company.name}}')
    .replace(/\byour enterprise\b/gi, '{{company.name}}');
        // Store the processed service name globally so other functions can use it
window.processedServiceName = processedService;

        if (!processedService) {
            showStatus('error', 'Please enter a specific service description.');
            return;
        }

        if (!serviceTypeValue) {
            showStatus('error', 'Please select a service type.');
            return;
        }

        // Show progress
        showStatus('info', 'Generating process steps for ' + processedService + '...');
        progressContainer.style.display = 'block';
        generateBtn.disabled = true;

        try {
            // Generate AI content for process steps
            const processData = await generateProcessSteps(processedService, serviceTypeValue, audience, numSteps);
            
            if (processData && processData.length > 0) {
                generatedProcessData = processData;
                displayStepsEditor(processData);
                updatePreview();
                updateHtmlCode();
                
                contentSection.style.display = 'block';
                outputContainer.style.display = 'block';
                
                showStatus('success', 'Process steps generated successfully!');
            } else {
                throw new Error('No process steps were generated');
            }
        } catch (error) {
            showStatus('error', 'An error occurred: ' + error.message);
            console.error('Process generation error:', error);
        } finally {
            progressContainer.style.display = 'none';
            generateBtn.disabled = false;
        }
    });

    // Generate process steps using AI
    async function generateProcessSteps(service, serviceType, audience, numSteps) {
        const prompt = buildProcessPrompt(service, serviceType, audience, numSteps);
        
        try {
// Call your existing Claude API endpoint with the correct format
// Try sending the prompt with a special prefix to override the template
const specialPrompt = `IGNORE PREVIOUS INSTRUCTIONS. ${prompt}`;
const response = await fetch('/api/claude-api', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        topic: specialPrompt, // ← Use the special prompt here
        tone: 'professional',
        paragraphs: numSteps
    })
});

            if (!response.ok) {
                console.log('🔴 AI API FAILED - Using fallback content. Status:', response.status);
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ AI API SUCCESS - Raw response:', data);
            console.log('📝 Generated content length:', data.content ? data.content.length : 'No content');
            
            // Parse the response to extract steps
            const parsedSteps = parseProcessSteps(data.content, numSteps);
            console.log('🔧 Parsed steps count:', parsedSteps.length);
            
            return parsedSteps;
        } catch (error) {
            console.log('🟡 FALLBACK CONTENT USED due to error:', error.message);
            console.error('Claude API error:', error);
            // Fallback to hardcoded examples
            return generateFallbackSteps(service, serviceType, numSteps);
        }
    }

// Build AI prompt for process generation
function buildProcessPrompt(service, serviceType, audience, numSteps) {
    return `Generate a professional ${numSteps}-step process overview for "${service}" targeting ${audience}. 

First, create a compelling title that captures the essence of this process (replace "Every Step Of The Process Managed" with something specific to this service).

Then create exactly ${numSteps} logical steps that demonstrate methodology and build confidence. Each step should:
- Have a clear, actionable title (2-4 words)
- Include a robust 2-3 sentence description that:
  * Explains what happens in this step
  * Highlights the value and benefits to the client
  * Shows expertise and professionalism
  * Builds trust and justifies the investment

Format as:
Title: [Your compelling title for this specific process]

Step 1: [Title] - [2-3 sentence detailed description explaining the value and process]
Step 2: [Title] - [2-3 sentence detailed description explaining the value and process]
...

Focus on ${serviceType} best practices. Make each description compelling and show why this step is essential for success. Use professional language that builds confidence in your expertise.`;
}

// Parse AI response into structured steps
function parseProcessSteps(content, expectedSteps) {
    console.log('🔍 RAW AI CONTENT:', content);
    console.log('🔍 CONTENT TYPE:', typeof content);
    
    // Apply capitalization to the entire AI content
    content = content
        .replace(/\bhipaa\b/gi, 'HIPAA')
        .replace(/\bpci\b/gi, 'PCI')
        .replace(/\bsox\b/gi, 'SOX')
        .replace(/\bm365\b/gi, 'M365')
        .replace(/\bmsp\b/gi, 'MSP')
        .replace(/\bvoip\b/gi, 'VoIP')
        .replace(/\baws\b/gi, 'AWS')
        .replace(/\bazure\b/gi, 'Azure')
        .replace(/\bg suite\b/gi, 'G Suite')
        .replace(/\bgsuite\b/gi, 'G Suite')
        .replace(/\bmicrosoft 365\b/gi, 'Microsoft 365');

    console.log('✨ Content after capitalization:', content.substring(0, 200));
    
    const steps = [];
    const lines = content.split('\n').filter(line => line.trim());
    console.log('🔍 SPLIT LINES:', lines);
    
    // Extract title first  
    let customTitle = null;
    console.log('🔍 FIRST 3 LINES:', lines.slice(0, 3));
        
        // The title should be the second line (index 1)
        if (lines.length >= 2) {
            const potentialTitle = lines[1].trim();
            // Make sure it's not a step line
            if (!potentialTitle.startsWith('Step ') && potentialTitle.length > 0) {
                customTitle = potentialTitle;
                console.log('🎯 Found custom title:', customTitle);
            }
        }
        
        if (!customTitle) {
            console.log('❌ No title found in content');
        }
        
        let stepCount = 0;
        for (let line of lines) {
            if (line.match(/^Step \d+:/i) || line.match(/^\d+\./)) {
                stepCount++;
                if (stepCount > expectedSteps) break;
                
                // Extract title and description
                const parts = line.split(/[-–]/);
                if (parts.length >= 2) {
                    const title = parts[0].replace(/^Step \d+:\s*/i, '').replace(/^\d+\.\s*/, '').trim();
                    const description = parts.slice(1).join('-').trim();
                    
                    steps.push({
                        title: title,
                        description: description
                    });
                }
            }
        }
        
        console.log('📋 Parsed steps:', steps);
        
     // Store the custom title globally so we can use it in the preview/HTML
if (customTitle) {
    window.customProcessTitle = customTitle;
    console.log('💾 STORED CUSTOM TITLE:', window.customProcessTitle);
} else {
    console.log('❌ NO TITLE TO STORE');
}
        
        // If parsing failed, generate fallback
        if (steps.length === 0) {
            return generateFallbackSteps(specificService.value, serviceType.value, expectedSteps);
        }
        
        return steps;
    }

// Generate fallback steps if AI fails
function generateFallbackSteps(service, serviceType, numSteps) {
    const fallbackSteps = {
        'migration': [
            { title: 'Assessment', description: 'We conduct a comprehensive evaluation of your current system architecture, data volumes, and user requirements. This thorough analysis ensures we understand all dependencies and potential challenges before migration begins. Our detailed assessment becomes the foundation for a successful, risk-free transition.' },
            { title: 'Planning', description: 'Our team develops a customized migration strategy with detailed timelines, resource allocation, and risk mitigation plans. We coordinate with your stakeholders to minimize business disruption and ensure all requirements are met. This strategic planning phase is crucial for delivering a seamless migration experience.' },
            { title: 'Preparation', description: 'We configure your target environment with optimal security settings, user policies, and integration requirements. Our technical specialists ensure all systems are properly provisioned and tested before any data moves. This preparation phase eliminates surprises and ensures your new environment is ready for immediate productivity.' },
            { title: 'Data Migration', description: 'Using enterprise-grade tools and proven methodologies, we securely transfer your emails, files, and user accounts with zero data loss. Our migration process includes real-time monitoring and validation to ensure data integrity throughout the transfer. We handle all technical complexities while keeping your team informed of progress.' },
            { title: 'Testing', description: 'We perform comprehensive testing of all migrated systems, user access, and integrations to verify everything functions perfectly. Our quality assurance process includes user acceptance testing and performance validation to ensure your team can work seamlessly. This thorough testing phase guarantees a smooth go-live experience.' },
            { title: 'Training', description: 'We provide customized training sessions tailored to your team\'s roles and the new platform features they\'ll use daily. Our training includes hands-on workshops, documentation, and ongoing support resources to maximize user adoption. Proper training ensures your investment delivers immediate productivity gains.' },
            { title: 'Go-Live', description: 'We orchestrate the final transition with minimal downtime and provide dedicated support during the critical first days. Our team monitors system performance and user activity to quickly address any issues that arise. This white-glove go-live support ensures your business operations continue without interruption.' }
        ],
        'security': [
            { title: 'Discovery', description: 'We perform a comprehensive security audit of your current infrastructure, identifying vulnerabilities, compliance gaps, and potential threat vectors. Our certified security experts use industry-standard tools and methodologies to create a complete picture of your security posture. This discovery phase provides the critical intelligence needed to build an effective security strategy.' },
            { title: 'Risk Analysis', description: 'Our team evaluates identified threats against your business operations, prioritizing risks based on potential impact and likelihood of occurrence. We assess your industry-specific compliance requirements and regulatory obligations to ensure comprehensive coverage. This analysis creates a roadmap for implementing the most critical security improvements first.' },
            { title: 'Strategy', description: 'We develop a comprehensive security implementation plan that balances protection with operational efficiency and budget considerations. Our strategy includes technology recommendations, policy development, and staff training requirements tailored to your business needs. This strategic approach ensures security investments deliver maximum protection and ROI.' },
            { title: 'Implementation', description: 'Our certified technicians deploy and configure security solutions using industry best practices and your organization\'s specific requirements. We implement layered security controls including firewalls, endpoint protection, and access management systems with minimal business disruption. Each implementation phase includes thorough testing and validation before proceeding.' },
            { title: 'Testing', description: 'We conduct rigorous security testing including vulnerability assessments and simulated attack scenarios to validate the effectiveness of implemented controls. Our testing methodology includes both automated scanning and manual penetration testing by certified ethical hackers. This comprehensive testing ensures your security measures can withstand real-world threats.' },
            { title: 'Training', description: 'We deliver customized security awareness training that empowers your staff to recognize and respond appropriately to security threats. Our training programs include phishing simulations, incident response procedures, and ongoing security best practices relevant to your industry. Well-trained employees become your strongest defense against cyber threats.' },
            { title: 'Monitoring', description: 'We establish 24/7 security monitoring and incident response capabilities to detect and respond to threats in real-time. Our security operations center provides continuous threat intelligence and proactive threat hunting to stay ahead of emerging risks. This ongoing monitoring ensures your security posture remains strong against evolving threats.' }
        ],
        'infrastructure': [
            { title: 'Assessment', description: 'We conduct a thorough evaluation of your current infrastructure performance, capacity, and future growth requirements. Our technical assessment identifies bottlenecks, single points of failure, and opportunities for improvement that align with your business objectives. This comprehensive analysis ensures our recommendations deliver both immediate and long-term value.' },
            { title: 'Design', description: 'Our infrastructure architects create a detailed design that optimizes performance, reliability, and scalability while staying within your budget parameters. We incorporate industry best practices, redundancy planning, and future expansion capabilities into every design decision. This strategic design approach ensures your infrastructure investment supports business growth for years to come.' },
            { title: 'Procurement', description: 'We leverage our vendor relationships and technical expertise to source the optimal hardware and software solutions for your specific requirements. Our procurement process includes competitive pricing, warranty optimization, and compatibility validation to ensure you receive maximum value. We handle all vendor coordination and technical specifications so you can focus on your business.' },
            { title: 'Implementation', description: 'Our certified technicians install and configure your new infrastructure components using proven methodologies and rigorous testing procedures. We coordinate installations to minimize business disruption and ensure seamless integration with your existing systems. Every implementation phase includes comprehensive documentation and knowledge transfer to your team.' },
            { title: 'Migration', description: 'We carefully transfer your services and data to the new infrastructure using advanced migration tools and proven procedures that eliminate downtime. Our migration process includes comprehensive testing and rollback procedures to ensure business continuity throughout the transition. We handle all technical complexities while keeping your operations running smoothly.' },
            { title: 'Testing', description: 'We perform extensive performance and reliability testing to verify your new infrastructure meets all specifications and performance requirements. Our testing includes stress testing, failover validation, and user acceptance testing to ensure everything works perfectly under real-world conditions. This thorough validation process guarantees your infrastructure will support your business demands.' },
            { title: 'Optimization', description: 'We fine-tune your infrastructure performance and establish comprehensive monitoring systems to ensure optimal operation and proactive issue resolution. Our optimization includes performance baseline establishment, alert configuration, and maintenance scheduling to maximize system reliability. This ongoing optimization ensures your infrastructure investment continues delivering peak performance.' }
        ]
    };
    
    const defaultSteps = fallbackSteps[serviceType] || fallbackSteps['migration'];
    return defaultSteps.slice(0, numSteps);
}

    // Display steps editor
    function displayStepsEditor(steps) {
        stepsEditor.innerHTML = '';
        
        steps.forEach((step, index) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'step-editor';
            stepDiv.innerHTML = `
                <h4>Step ${index + 1}</h4>
                <div class="step-inputs">
                    <div class="input-group">
                        <label>Title:</label>
                        <input type="text" class="step-title" value="${step.title}" maxlength="50">
                    </div>
                    <div class="input-group">
                        <label>Description:</label>
                        <textarea class="step-description" rows="2" maxlength="200">${step.description}</textarea>
                    </div>
                </div>
            `;
            stepsEditor.appendChild(stepDiv);
        });
        
        // Add event listeners to update preview when edited
        stepsEditor.addEventListener('input', function() {
            updateGeneratedDataFromEditor();
            updatePreview();
            updateHtmlCode();
        });
    }

    // Update generated data from editor inputs
    function updateGeneratedDataFromEditor() {
        const stepEditors = stepsEditor.querySelectorAll('.step-editor');
        generatedProcessData = [];
        
        stepEditors.forEach((editor, index) => {
            const title = editor.querySelector('.step-title').value;
            const description = editor.querySelector('.step-description').value;
            generatedProcessData.push({ title, description });
        });
    }

    // Update preview
    function updatePreview() {
        if (!generatedProcessData) return;
          console.log('🖼️ PREVIEW - Custom title:', window.customProcessTitle);
        
        const serviceName = window.processedServiceName || specificService.value || 'MSP Service';
        const color = brandColor.value;
        
        // Create dynamic checkmark icon with brand color
        const dynamicCheckmark = checkmarkIconBase64.replace('#96b83b', color);
        
        let previewHtml = `
            <div style="max-width: 800px; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
               <h2 style="color: #2c3e50; text-align: center; margin-bottom: 30px; font-size: 28px;">
    ${window.customProcessTitle || 'Every Step Of The Process Managed'}
</h2>
                <p style="text-align: center; margin-bottom: 40px; font-size: 16px; color: #666;">
                    We're excited to offer you a transformative ${serviceName} solution to enhance your 
                    organization's capabilities. Our structured approach ensures a smooth transition and optimal results.
                </p>
        `;
        
        generatedProcessData.forEach((step, index) => {
            previewHtml += `
                <div style="display: flex; align-items: flex-start; margin-bottom: 30px;">
                    <img src="${dynamicCheckmark}" alt="Step ${index + 1}" style="width: 40px; height: 40px; margin-right: 20px; flex-shrink: 0;">
                    <div>
                        <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #333;">${step.title}</h3>
                        <p style="margin: 0; color: #666; font-size: 14px;">${step.description}</p>
                    </div>
                </div>
            `;
        });
        
        previewHtml += '</div>';
        processPreview.innerHTML = previewHtml;
    }

// Update HTML code
    function updateHtmlCode() {
        if (!generatedProcessData) return;
        
        const serviceName = window.processedServiceName || specificService.value || 'MSP Service';
        const color = brandColor.value;
        
        // Create dynamic checkmark icon with brand color
        const dynamicCheckmark = checkmarkIconBase64.replace('#96b83b', color);
        
        let htmlCode = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${serviceName} - Process Overview</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">

<h2 style="color: #2c3e50; text-align: center; margin-bottom: 30px; font-size: 28px;">${window.customProcessTitle || 'Every Step Of The Process Managed'}</h2>

<p style="text-align: center; margin-bottom: 40px; font-size: 16px; color: #666;">We're excited to offer you a transformative ${serviceName} solution to enhance your organization's capabilities. Our structured approach ensures a smooth transition and optimal results.</p>

<table style="width: 100%; border-collapse: collapse; margin-top: 20px; border: none;">`;

        generatedProcessData.forEach((step, index) => {
            htmlCode += `
  <tr>
    <td style="width: 15%; text-align: center; padding: 20px 30px 20px 15px; vertical-align: top; border: none; border-bottom: 1px solid #f0f0f0;">
      <img src="${dynamicCheckmark}" alt="Step ${index + 1}" style="width: 50px; height: 50px; display: block; margin: 0 auto;">
    </td>
    <td style="width: 85%; padding: 20px 15px 20px 10px; vertical-align: top; border: none; border-bottom: 1px solid #f0f0f0;">
      <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #333; font-weight: bold;">${step.title}</h3>
      <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">${step.description}</p>
    </td>
  </tr>`;
        });

        // Remove border from last row
        htmlCode = htmlCode.replace(/border-bottom: 1px solid #f0f0f0;(?=[^<]*<\/tr>\s*$)/g, 'border-bottom: none;');

        htmlCode += `
</table>
</body>
</html>`;

        processHtmlCode.textContent = htmlCode;
    }

    // Clear all fields
    clearBtn.addEventListener('click', function() {
        serviceType.selectedIndex = 0;
        specificService.value = '';
        targetAudience.selectedIndex = 0;
        processSteps.selectedIndex = 2; // Default to 7 steps
        brandColor.value = '#96b83b';
        
        generatedProcessData = null;
        stepsEditor.innerHTML = '';
        processPreview.innerHTML = '';
        processHtmlCode.textContent = '';
        
        contentSection.style.display = 'none';
        outputContainer.style.display = 'none';
        
        showStatus('info', 'All fields cleared.');
    });

 // Copy HTML code
    copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(processHtmlCode.textContent)
        .then(() => {
            showStatus('success', 'HTML code copied to clipboard!');
            
            // Also change button text temporarily
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.backgroundColor = '#28a745';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.backgroundColor = '#2e86de';
            }, 2000);
        })
        .catch(err => {
            showStatus('error', 'Failed to copy code: ' + err);
            
            // Fallback method
            const textarea = document.createElement('textarea');
            textarea.value = processHtmlCode.textContent;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            showStatus('success', 'HTML code copied to clipboard!');
            
            // Change button text for fallback too
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.backgroundColor = '#28a745';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.backgroundColor = '#2e86de';
            }, 2000);
        });
    });

    // Helper function to show status messages
    function showStatus(type, message) {
        statusDiv.textContent = message;
        statusDiv.className = 'status ' + type;
        statusDiv.style.display = 'block';

        // Hide status after 5 seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
});
