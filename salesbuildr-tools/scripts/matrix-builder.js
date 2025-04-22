/**
 * Matrix Builder JavaScript
 * Handles the creation of comparison tables and feature matrices
 */

function initMatrixBuilder() {
    console.log('Initializing Matrix Builder...');
    
    // DOM Elements
    const matrixRows = document.getElementById('matrix-rows');
    const matrixColumns = document.getElementById('matrix-columns');
    const headerBgColor = document.getElementById('header-bg-color');
    const headerTextColor = document.getElementById('header-text-color');
    const rowBgColor1 = document.getElementById('row-bg-color-1');
    const rowBgColor2 = document.getElementById('row-bg-color-2');
    const updateMatrixBtn = document.getElementById('update-matrix-btn');
    const generateMatrixBtn = document.getElementById('generate-matrix-btn');
    const clearMatrixBtn = document.getElementById('clear-matrix-btn');
    const matrixHeaders = document.getElementById('matrix-headers');
    const matrixRowsContainer = document.getElementById('matrix-rows-container');
    const matrixPreviewContainer = document.getElementById('matrix-preview-container');
    const matrixPreview = document.getElementById('matrix-preview');
    const matrixCode = document.getElementById('matrix-code');
    const copyMatrixCodeBtn = document.getElementById('copy-matrix-code-btn');
    
    // Cell content options
    const cellOptions = [
        { value: 'check', label: 'Checkmark' },
        { value: 'text', label: 'Text' },
        { value: 'optional', label: 'Optional' },
        { value: 'empty', label: 'Empty' }
    ];
    
    if (!matrixRows || !matrixHeaders) {
        console.error('Matrix Builder elements not found. DOM structure issue.');
        return;
    }
    
    // Initialize the matrix editor
    updateMatrixEditor();
    
    // Event Listeners
    updateMatrixBtn.addEventListener('click', updateMatrixEditor);
    generateMatrixBtn.addEventListener('click', generateMatrix);
    clearMatrixBtn.addEventListener('click', clearMatrix);
    copyMatrixCodeBtn.addEventListener('click', copyMatrixCode);
    
    // Update the matrix editor based on rows and columns
    function updateMatrixEditor() {
        const rows = parseInt(matrixRows.value) || 5;
        const columns = parseInt(matrixColumns.value) || 4;
        
        // Update headers
        updateHeaders(columns);
        
        // Update rows
        updateMatrixRows(rows, columns);
        
        console.log(`Matrix updated: ${rows} rows, ${columns} columns`);
    }
    
    // Update the column headers
    function updateHeaders(columns) {
        matrixHeaders.innerHTML = '';
        
        // Add the feature column header
        const featureHeader = document.createElement('div');
        featureHeader.className = 'header-cell';
        
        const featureInput = document.createElement('input');
        featureInput.type = 'text';
        featureInput.value = 'Feature/Service';
        featureInput.placeholder = 'Features';
        featureInput.style.cssText = 'width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;';
        featureHeader.appendChild(featureInput);
        
        matrixHeaders.appendChild(featureHeader);
        
        // Add the column headers
        for (let i = 0; i < columns; i++) {
            const headerCell = document.createElement('div');
            headerCell.className = 'header-cell';
            
            const headerInput = document.createElement('input');
            headerInput.type = 'text';
            headerInput.value = i === 0 ? 'Basic' : i === 1 ? 'Standard' : i === 2 ? 'Premium' : `Plan ${i+1}`;
            headerInput.placeholder = `Column ${i+1}`;
            headerInput.style.cssText = 'width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;';
            headerCell.appendChild(headerInput);
            
            matrixHeaders.appendChild(headerCell);
        }
    }
    
    // Update the matrix rows
    function updateMatrixRows(rows, columns) {
        matrixRowsContainer.innerHTML = '';
        
        for (let i = 0; i < rows; i++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'matrix-row';
            
            // Feature name cell
            const featureCell = document.createElement('div');
            featureCell.className = 'feature-name';
            
            const featureInput = document.createElement('input');
            featureInput.type = 'text';
            featureInput.placeholder = `Feature ${i+1}`;
            featureInput.value = '';
            featureInput.style.cssText = 'width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;';
            featureCell.appendChild(featureInput);
            
            rowDiv.appendChild(featureCell);
            
            // Add cells for each column
            for (let j = 0; j < columns; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell-content';
                
                const select = document.createElement('select');
                select.className = 'cell-type-select';
                
                // Add options to the select
                cellOptions.forEach(option => {
                    const optionEl = document.createElement('option');
                    optionEl.value = option.value;
                    optionEl.textContent = option.label;
                    // Default to checkmark for the first two columns
                    if (option.value === 'check' && j <= 1) {
                        optionEl.selected = true;
                    }
                    // Default to empty for others
                    if (option.value === 'empty' && j > 1) {
                        optionEl.selected = true;
                    }
                    select.appendChild(optionEl);
                });
                
                cell.appendChild(select);
                rowDiv.appendChild(cell);
            }
            
            matrixRowsContainer.appendChild(rowDiv);
        }
    }
    
    // Generate the matrix preview and HTML code
    function generateMatrix() {
        // Get all the current values
        const rows = parseInt(matrixRows.value) || 5;
        const columns = parseInt(matrixColumns.value) || 4;
        const headerBg = headerBgColor.value;
        const headerText = headerTextColor.value;
        const rowBg1 = rowBgColor1.value;
        const rowBg2 = rowBgColor2.value;
        
        // Get column headers
        const headerInputs = matrixHeaders.querySelectorAll('input');
        const headers = Array.from(headerInputs).map(input => input.value.trim() || input.placeholder);
        
        // Get row data
        const rowDivs = matrixRowsContainer.querySelectorAll('.matrix-row');
        const rowData = Array.from(rowDivs).map(row => {
            const featureInput = row.querySelector('input');
            const selects = row.querySelectorAll('select');
            
            return {
                feature: featureInput.value.trim() || featureInput.placeholder,
                cells: Array.from(selects).map(select => select.value)
            };
        });
        
        // Generate HTML table
        let tableHtml = `<table style="width:100%; border-collapse:collapse;">\n`;
        
        // Table header
        tableHtml += `  <tr>\n`;
        headers.forEach((header, index) => {
            tableHtml += `    <th style="padding:12px; text-align:${index === 0 ? 'left' : 'center'}; background-color:${headerBg}; color:${headerText};">${header}</th>\n`;
        });
        tableHtml += `  </tr>\n`;
        
        // Table rows
        rowData.forEach((row, rowIndex) => {
            const rowColor = rowIndex % 2 === 0 ? rowBg1 : rowBg2;
            
            tableHtml += `  <tr>\n`;
            tableHtml += `    <td style="padding:12px; text-align:left; background-color:${rowColor};">${row.feature}</td>\n`;
            
            row.cells.forEach(cell => {
                let cellContent = '';
                
                switch(cell) {
                    case 'check':
                        cellContent = `<div style="display:inline-block; width:24px; height:24px; background-color:#8bc34a; border-radius:50%; text-align:center; line-height:24px; color:white;">✓</div>`;
                        break;
                    case 'text':
                        cellContent = 'Yes';
                        break;
                    case 'optional':
                        cellContent = 'Optional';
                        break;
                    case 'empty':
                    default:
                        cellContent = '';
                        break;
                }
                
                tableHtml += `    <td style="padding:12px; text-align:center; background-color:${rowColor};">${cellContent}</td>\n`;
            });
            
            tableHtml += `  </tr>\n`;
        });
        
        tableHtml += `</table>`;
        
        // Update the preview
        matrixPreview.innerHTML = tableHtml;
        
        // Update the code
        matrixCode.textContent = tableHtml;
        
        // Show the preview container
        matrixPreviewContainer.style.display = 'block';
        
        console.log('Matrix generated successfully');
    }
    
    // Clear the matrix editor
    function clearMatrix() {
        matrixRows.value = '5';
        matrixColumns.value = '4';
        headerBgColor.value = '#96b83b';
        headerTextColor.value = '#ffffff';
        rowBgColor1.value = '#f2f2f2';
        rowBgColor2.value = '#ffffff';
        
        updateMatrixEditor();
        matrixPreviewContainer.style.display = 'none';
        
        console.log('Matrix cleared');
    }
    
    // Copy the matrix HTML code
    function copyMatrixCode() {
        const codeText = matrixCode.textContent;
        
        navigator.clipboard.writeText(codeText)
            .then(() => {
                // Show success message
                copyMatrixCodeBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyMatrixCodeBtn.textContent = 'Copy Code';
                }, 2000);
                
                console.log('Matrix code copied to clipboard');
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                
                // Fallback copy method
                const textarea = document.createElement('textarea');
                textarea.value = codeText;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                
                copyMatrixCodeBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyMatrixCodeBtn.textContent = 'Copy Code';
                }, 2000);
            });
    }
}

// Initialize the matrix builder when the DOM is loaded
document.addEventListener('DOMContentLoaded', initMatrixBuilder);
