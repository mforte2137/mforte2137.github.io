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

        if (!service) {
            showStatus('error', 'Please enter a specific service description.');
            return;
        }

        if (!serviceTypeValue) {
            showStatus('error', 'Please select a service type.');
            return;
        }

        // Show progress
        showStatus('info', 'Generating process steps for ' + service + '...');
        progressContainer.style.display = 'block';
        generateBtn.disabled = true;

        try {
            // Generate AI content for process steps
            const processData = await generateProcessSteps(service, serviceTypeValue, audience, numSteps);
            
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
            // Call your existing Claude API endpoint
            const response = await fetch('/api/claude-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    topic: service,
                    customPrompt: prompt,
                    maxTokens: 1500
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            
            // Parse the response to extract steps
            return parseProcessSteps(data.content, numSteps);
        } catch (error) {
            console.error('Claude API error:', error);
            // Fallback to hardcoded examples
            return generateFallbackSteps(service, serviceType, numSteps);
        }
    }

    // Build AI prompt for process generation
    function buildProcessPrompt(service, serviceType, audience, numSteps) {
        return `Generate a professional ${numSteps}-step process overview for "${service}" targeting ${audience}. 

Create exactly ${numSteps} logical steps that demonstrate methodology and build confidence. Each step should:
- Have a clear, actionable title (2-4 words)
- Include a compelling description that justifies the investment
- Show expertise and professionalism
- Build trust with the client

Format as:
Step 1: [Title] - [Description]
Step 2: [Title] - [Description]
...

Focus on ${serviceType} best practices. Make each step sound essential and valuable.`;
    }

    // Parse AI response into structured steps
    function parseProcessSteps(content, expectedSteps) {
        const steps = [];
        const lines = content.split('\n').filter(line => line.trim());
        
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
                { title: 'Assessment', description: 'Evaluate current system setup and data requirements.' },
                { title: 'Planning', description: 'Develop a tailored migration strategy and timeline.' },
                { title: 'Preparation', description: 'Set up target environment and configure security settings.' },
                { title: 'Data Migration', description: 'Transfer emails, files, and user accounts securely.' },
                { title: 'Testing', description: 'Verify all systems are functioning correctly.' },
                { title: 'Training', description: 'Provide user training on new platform features.' },
                { title: 'Go-Live', description: 'Complete the transition and provide ongoing support.' }
            ],
            'security': [
                { title: 'Discovery', description: 'Assess current security posture and identify vulnerabilities.' },
                { title: 'Risk Analysis', description: 'Evaluate threats and prioritize security improvements.' },
                { title: 'Strategy', description: 'Develop comprehensive security implementation plan.' },
                { title: 'Implementation', description: 'Deploy security solutions and configure protections.' },
                { title: 'Testing', description: 'Validate security measures and conduct penetration testing.' },
                { title: 'Training', description: 'Educate staff on security best practices and protocols.' },
                { title: 'Monitoring', description: 'Establish ongoing security monitoring and maintenance.' }
            ],
            'infrastructure': [
                { title: 'Assessment', description: 'Evaluate current infrastructure and performance requirements.' },
                { title: 'Design', description: 'Create optimized infrastructure architecture plan.' },
                { title: 'Procurement', description: 'Source and acquire necessary hardware and software.' },
                { title: 'Implementation', description: 'Install and configure new infrastructure components.' },
                { title: 'Migration', description: 'Transfer services to new infrastructure safely.' },
                { title: 'Testing', description: 'Verify performance and reliability of new systems.' },
                { title: 'Optimization', description: 'Fine-tune performance and establish monitoring.' }
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
        
        const serviceName = specificService.value || 'MSP Service';
        const color = brandColor.value;
        
        // Create dynamic checkmark icon with brand color
        const dynamicCheckmark = checkmarkIconBase64.replace('#96b83b', color);
        
        let previewHtml = `
            <div style="max-width: 800px; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #2c3e50; text-align: center; margin-bottom: 30px; font-size: 28px;">
                    Every Step Of The Process Managed
                </h2>
                <p style="text-align: center; margin-bottom: 40px; font-size: 16px; color: #666;">
                    We're excited to offer you a transformative ${serviceName.toLowerCase()} solution to enhance your 
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
        
        const serviceName = specificService.value || 'MSP Service';
        const color = brandColor.value;
        
        // Create dynamic checkmark icon with brand color
        const dynamicCheckmark = checkmarkIconBase64.replace('#96b83b', color);
        
        let htmlCode = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${serviceName} - Process Overview</title>
<style>
body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
h2 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
  font-size: 28px;
}
.intro {
  text-align: center;
  margin-bottom: 40px;
  font-size: 16px;
  color: #666;
}
.process-step {
  display: flex;
  align-items: flex-start;
  margin-bottom: 30px;
}
.step-icon {
  width: 40px;
  height: 40px;
  margin-right: 20px;
  flex-shrink: 0;
}
.step-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
}
.step-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
}
@media (max-width: 600px) {
  .process-step {
    flex-direction: column;
    text-align: center;
  }
  .step-icon {
    margin: 0 auto 10px auto;
  }
}
</style>
</head>
<body>
<h2>Every Step Of The Process Managed</h2>
<p class="intro">We're excited to offer you a transformative ${serviceName.toLowerCase()} solution to enhance your organization's capabilities. Our structured approach ensures a smooth transition and optimal results.</p>

`;

        generatedProcessData.forEach((step, index) => {
            htmlCode += `<div class="process-step">
  <img src="${dynamicCheckmark}" alt="Step ${index + 1}" class="step-icon">
  <div class="step-content">
    <h3>${step.title}</h3>
    <p>${step.description}</p>
  </div>
</div>

`;
        });

        htmlCode += `</body>
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
