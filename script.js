// Global variables for images and colors
let websiteImageData = null;
let productImageData = null;
let featureBackgroundColor = "#f8f9fa";  // Default light gray

// Backend API functions
async function fetchWebPageData(url) {
  try {
    // The API URL will be relative when deployed to Vercel
    const apiUrl = `/api/fetch-url?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch URL data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching web page data:', error);
    return null;
  }
}

// Function to fetch images via the backend proxy
function getProxiedImageUrl(originalUrl) {
  if (!originalUrl) return null;
  return `/api/fetch-image?url=${encodeURIComponent(originalUrl)}`;
}

// Tab functionality
function openTab(evt, tabName) {
  // Hide all tab content
  const tabContents = document.getElementsByClassName("tab-content");
  for (let i = 0; i < tabContents.length; i++) {
    tabContents[i].classList.remove("active");
  }
  
  // Remove active class from all tab buttons
  const tabButtons = document.getElementsByClassName("tab-button");
  for (let i = 0; i < tabButtons.length; i++) {
    tabButtons[i].classList.remove("active");
  }
  
  // Show the selected tab and add active class to the button
  document.getElementById(tabName).classList.add("active");
  evt.currentTarget.classList.add("active");
}

// Color picker functions
function updateBackgroundColor() {
  const colorInput = document.getElementById('background-color');
  const colorValue = colorInput.value.trim();
  
  // Basic hex color validation
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colorValue)) {
    featureBackgroundColor = colorValue;
    generateFeature(); // Regenerate preview with new color
  } else {
    alert('Please enter a valid hex color code (e.g., #f8f9fa)');
  }
}

function setBackgroundColor(color) {
  document.getElementById('background-color').value = color;
  featureBackgroundColor = color;
  generateFeature(); // Regenerate preview with new color
}

// Website image upload
document.getElementById('website-image-upload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  if (!file.type.match('image.*')) {
    alert('Please select an image file (JPG, PNG, etc.)');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    websiteImageData = e.target.result; // This is the base64 data
    
    // Show preview
    const preview = document.getElementById('website-image-preview');
    preview.innerHTML = `<img src="${websiteImageData}" alt="Website Image">`;
    
    // If we already generated a preview, update it
    if (document.getElementById('website-output').value) {
      generateWebsite();
    }
  };
  reader.readAsDataURL(file);
});

// Product image upload
document.getElementById('product-image-upload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  if (!file.type.match('image.*')) {
    alert('Please select an image file (JPG, PNG, etc.)');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    productImageData = e.target.result; // This is the base64 data
    
    // Show preview
    const preview = document.getElementById('product-image-preview');
    preview.innerHTML = `<img src="${productImageData}" alt="Product Image">`;
    
    // If we already generated a preview, update it
    if (document.getElementById('product-output').value) {
      generateProduct();
    }
  };
  reader.readAsDataURL(file);
});

// WEBSITE WIDGET FUNCTIONS
async function generateWebsite() {
  const url = document.getElementById('url-input').value;
  const layout = document.getElementById('layout-select').value;
  
  // Show loading indicator
  document.getElementById('website-preview').innerHTML = "Loading...";
  
  // Fetch data about the URL
  const webData = await fetchWebPageData(url);
  
  let title = webData?.title || url.replace('https://', '').replace('http://', '').split('/').pop() || 'Web Page';
  title = title.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  let description = webData?.description || 'This is sample content for the web page. In a real implementation, this would contain content from the actual webpage.';
  
  // Create image HTML - either use the fetched image, uploaded image, or placeholder
  let imageHtml;
  if (websiteImageData) {
    // User uploaded image takes precedence
    imageHtml = `<img src="${websiteImageData}" alt="${title}" style="max-width: 100%; display: block;">`;
  } else if (webData?.imageUrl) {
    // Use image from metadata, proxied through our API
    const proxiedUrl = getProxiedImageUrl(webData.imageUrl);
    imageHtml = `<img src="${proxiedUrl}" alt="${title}" style="max-width: 100%; display: block;">`;
  } else {
    // Fall back to placeholder
    imageHtml = `<div style="background: #f0f0f0; height: 200px; display: flex; align-items: center; justify-content: center;">Image Placeholder</div>`;
  }
  
  // Create the HTML with fetched data
  const html = `<div style="font-family: Arial; max-width: 900px; margin: 0 auto;">
  <table style="width: 100%; border-collapse: collapse; border: none;">
    <tr style="border: none;">
      ${layout === 'left' ? `<td style="width: 30%; padding: 20px; border: none;">${imageHtml}</td>` : ''}
      <td style="padding: 20px; border: none;">
        <h2 style="margin-top: 0;">${title}</h2>
        <p>${description}</p>
      </td>
      ${layout === 'right' ? `<td style="width: 30%; padding: 20px; border: none;">${imageHtml}</td>` : ''}
    </tr>
  </table>
</div>`;
  
  document.getElementById('website-output').value = html;
  document.getElementById('website-preview').innerHTML = html;
}

function clearWebsite() {
  document.getElementById('url-input').value = '';
  document.getElementById('layout-select').value = 'right';
  document.getElementById('website-output').value = '';
  document.getElementById('website-preview').innerHTML = '';
  document.getElementById('website-image-preview').innerHTML = 'No image uploaded';
  websiteImageData = null;
  document.getElementById('website-image-upload').value = ''; // Reset file input
}

function copyWebsiteHTML() {
  const textarea = document.getElementById('website-output');
  textarea.select();
  document.execCommand('copy');
  alert('HTML copied to clipboard!');
}

// FEATURE WIDGET FUNCTIONS
function addFeature() {
  const container = document.getElementById('feature-items');
  const newFeature = document.createElement('div');
  newFeature.className = 'feature-item';
  newFeature.innerHTML = `
    <input type="text" placeholder="Feature title" value="New Feature">
    <input type="text" placeholder="Feature description" value="Feature description">
    <button onclick="removeFeature(this)">Remove</button>
  `;
  container.appendChild(newFeature);
}

function removeFeature(button) {
  button.parentElement.remove();
}

function generateFeature() {
  const title = document.getElementById('feature-title').value;
  const layout = document.getElementById('feature-layout').value;
  
  const features = [];
  const featureItems = document.querySelectorAll('.feature-item');
  
  featureItems.forEach(item => {
    const inputs = item.querySelectorAll('input');
    features.push({
      title: inputs[0].value,
      description: inputs[1].value
    });
  });
  
  let featuresHTML = '';
  
  if (layout === 'grid') {
    featuresHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">';
    features.forEach(feature => {
      featuresHTML += `
        <div style="background: ${featureBackgroundColor}; padding: 20px; border-radius: 5px; text-align: center;">
          <h3 style="margin-top: 0;">${feature.title}</h3>
          <p>${feature.description}</p>
        </div>
      `;
    });
    featuresHTML += '</div>';
  } else {
    featuresHTML = '<div>';
    features.forEach(feature => {
      featuresHTML += `
        <div style="background: ${featureBackgroundColor}; padding: 15px; border-radius: 5px; margin-bottom: 10px; display: flex;">
          <div style="margin-right: 15px; color: green; font-weight: bold;">✓</div>
          <div>
            <h3 style="margin-top: 0;">${feature.title}</h3>
            <p>${feature.description}</p>
          </div>
        </div>
      `;
    });
    featuresHTML += '</div>';
  }
  
  const html = `<div style="font-family: Arial; max-width: 900px; margin: 0 auto;">
  <h2 style="text-align: center; margin-bottom: 20px;">${title}</h2>
  ${featuresHTML}
</div>`;
  
  document.getElementById('feature-output').value = html;
  document.getElementById('feature-preview').innerHTML = html;
}

function clearFeature() {
  document.getElementById('feature-title').value = 'Key Features';
  document.getElementById('feature-layout').value = 'list';
  document.getElementById('background-color').value = '#f8f9fa';
  featureBackgroundColor = '#f8f9fa';  // Reset to default
  document.getElementById('feature-items').innerHTML = `
    <div class="feature-item">
      <input type="text" placeholder="Feature title" value="24/7 Support">
      <input type="text" placeholder="Feature description" value="Round-the-clock technical support">
      <button onclick="removeFeature(this)">Remove</button>
    </div>
  `;
  document.getElementById('feature-output').value = '';
  document.getElementById('feature-preview').innerHTML = '';
}

function copyFeatureHTML() {
  const textarea = document.getElementById('feature-output');
  textarea.select();
  document.execCommand('copy');
  alert('HTML copied to clipboard!');
}

// PRODUCT WIDGET FUNCTIONS
function addBenefit() {
  const container = document.getElementById('benefit-items');
  const newBenefit = document.createElement('div');
  newBenefit.className = 'benefit-item';
  newBenefit.innerHTML = `
    <input type="text" placeholder="Product benefit" value="New Benefit">
    <button onclick="removeBenefit(this)">Remove</button>
  `;
  container.appendChild(newBenefit);
}

function removeBenefit(button) {
  button.parentElement.remove();
}

function generateProduct() {
  const name = document.getElementById('product-name').value;
  const layout = document.getElementById('product-layout').value;
  
  const benefits = [];
  const benefitItems = document.querySelectorAll('.benefit-item');
  
  benefitItems.forEach(item => {
    benefits.push(item.querySelector('input').value);
  });
  
  let benefitsHTML = '';
  if (benefits.length > 0) {
    benefitsHTML = '<h3 style="margin-top: 20px;">Key Benefits</h3><ul>';
    benefits.forEach(benefit => {
      benefitsHTML += `<li style="margin-bottom: 8px;">${benefit}</li>`;
    });
    benefitsHTML += '</ul>';
  }
  
  // Create image HTML - either use the uploaded image or placeholder
  let imageHtml;
  if (productImageData) {
    imageHtml = `<img src="${productImageData}" alt="${name}" style="max-width: 100%; display: block;">`;
  } else {
    imageHtml = `<div style="background: #f0f0f0; height: 240px; display: flex; align-items: center; justify-content: center;">Product Image</div>`;
  }
  
  // Updated to remove the border
  const html = `<div style="font-family: Arial; max-width: 900px; margin: 0 auto;">
  <table style="width: 100%; border-collapse: collapse; border: none;">
    <tr style="border: none;">
      ${layout === 'left' ? `<td style="width: 30%; padding: 20px; border: none;">${imageHtml}</td>` : ''}
      <td style="padding: 20px; border: none;">
        <h2 style="margin-top: 0;">${name}</h2>
        <p>This premium product offers exceptional quality and performance for your business needs.</p>
        ${benefitsHTML}
      </td>
      ${layout === 'right' ? `<td style="width: 30%; padding: 20px; border: none;">${imageHtml}</td>` : ''}
    </tr>
  </table>
</div>`;
  
  document.getElementById('product-output').value = html;
  document.getElementById('product-preview').innerHTML = html;
}

function clearProduct() {
  document.getElementById('product-name').value = 'Premium Server';
  document.getElementById('product-layout').value = 'right';
  document.getElementById('benefit-items').innerHTML = `
    <div class="benefit-item">
      <input type="text" placeholder="Product benefit" value="Enhanced Security">
      <button onclick="removeBenefit(this)">Remove</button>
    </div>
    <div class="benefit-item">
      <input type="text" placeholder="Product benefit" value="99.9% Uptime">
      <button onclick="removeBenefit(this)">Remove</button>
    </div>
  `;
  document.getElementById('product-output').value = '';
  document.getElementById('product-preview').innerHTML = '';
  document.getElementById('product-image-preview').innerHTML = 'No image uploaded';
  productImageData = null;
  document.getElementById('product-image-upload').value = ''; // Reset file input
}

function copyProductHTML() {
  const textarea = document.getElementById('product-output');
  textarea.select();
  document.execCommand('copy');
  alert('HTML copied to clipboard!');
}

// PASTE WIDGET FUNCTIONS

// Function to clean and format the pasted content
function cleanPastedContent() {
  const pasteArea = document.getElementById('paste-area');
  const content = pasteArea.value;
  
  if (!content.trim()) {
    alert('Please paste some content first.');
    return;
  }
  
  // Split into lines and process
  let lines = content.split('\n');
  let cleanedHTML = '';
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      if (inList) {
        cleanedHTML += '</ul>\n';
        inList = false;
      }
      continue;
    }
    
    // More aggressive bullet detection - look for indentation, special characters,
    // or lines that begin with a number followed by a period or parenthesis
    // This handles a wide variety of bullet styles from Word
    if (line.match(/^[\s\t]*[•\-\*o◦→⇒⊕⊗⊙⊚⊛⊝⊞⊟□■]+.+/) || // Bullets with any character
        line.match(/^\s+.+/) || // Indented lines
        line.match(/^\d+[\.\)]\s+.+/)) { // Numbered lists: "1. " or "1) "
      
      // Strip out the bullet characters, numbers, and excess whitespace
      line = line.replace(/^[\s\t]*[•\-\*o◦→⇒⊕⊗⊙⊚⊛⊝⊞⊟□■]+\s*/, '');
      line = line.replace(/^\s+/, '');
      line = line.replace(/^\d+[\.\)]\s+/, '');
      
      if (!inList) {
        cleanedHTML += '<ul style="list-style-type: disc; padding-left: 30px; margin: 15px 0;">\n';
        inList = true;
      }
      
      cleanedHTML += `  <li style="margin-bottom: 8px;">${line}</li>\n`;
    } else {
      // Not a bullet point
      if (inList) {
        cleanedHTML += '</ul>\n';
        inList = false;
      }
      
      // Check for headings (assume lines with few words and ending with colon might be headings)
      if (line.length < 50 && line.match(/[a-zA-Z]{2,}:$/)) {
        cleanedHTML += `<h3 style="margin-top: 15px; margin-bottom: 10px;">${line}</h3>\n`;
      } else {
        cleanedHTML += `<p style="margin-bottom: 10px;">${line}</p>\n`;
      }
    }
  }
  
  // Close any open list
  if (inList) {
    cleanedHTML += '</ul>\n';
  }
  
  // Wrap everything in a container with inline styles
  const formattedHTML = `<div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; line-height: 1.5;">
  ${cleanedHTML}
</div>`;
  
  // Set output and preview
  document.getElementById('paste-output').value = formattedHTML;
  document.getElementById('paste-preview').innerHTML = formattedHTML;
}

// Function to clear the paste area
function clearPasteArea() {
  document.getElementById('paste-area').value = '';
  document.getElementById('paste-output').value = '';
  document.getElementById('paste-preview').innerHTML = '';
}

// Function to copy the formatted HTML
function copyPasteHTML() {
  const textarea = document.getElementById('paste-output');
  textarea.select();
  document.execCommand('copy');
  alert('HTML copied to clipboard!');
}

// Initialize the first tab
document.addEventListener('DOMContentLoaded', function() {
  // First tab is active by default, but we need to make sure it's actually visible
  openTab({currentTarget: document.querySelector('.tab-button')}, 'tab1');
  
  // Initialize the default background color for features
  featureBackgroundColor = "#f8f9fa";
  document.getElementById('background-color').value = featureBackgroundColor;
});