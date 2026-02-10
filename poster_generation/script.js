// AI-Powered Certificate Generator -Main Application Logic
// ================================================================

// Application State
let appState = {
    aiProvider: 'gemini',
    apiKey: null,
    assets: {
        logos: [],
        signatures: [],
        backgrounds: []
    },
    currentTemplate: null,  // AI-generated template HTML
    csvData: null,
    csvHeaders: [],
    isFileUploaded: false,
    isAPIConfigured: false
};

// Required CSV columns
const REQUIRED_COLUMNS = ['name', 'course', 'date', 'instructor', 'achievement'];

// ================================================================
// Initialization
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎓 AI Certificate Generator loaded');

    // Initialize AI module
    initializeAI();

    // Check API configuration
    checkAPIStatus();

    // Load existing assets
    loadAssets();

    // Setup drag and drop for CSV
    setupCSVUpload();
});

// ================================================================
// API Configuration
// ================================================================

function checkAPIStatus() {
    if (!aiGenerator) {
        console.error('AI Generator not initialized');
        return;
    }

    const isConfigured = aiGenerator.isConfigured();
    appState.isAPIConfigured = isConfigured;

    const statusEl = document.getElementById('config-status');
    const generateBtn = document.getElementById('generate-template-btn');

    if (isConfigured) {
        statusEl.textContent = '✅ Configured';
        statusEl.style.color = 'var(--success)';
        if (generateBtn) generateBtn.disabled = false;
    } else {
        statusEl.textContent = '❌ Not configured';
        statusEl.style.color = 'var(--error)';
        if (generateBtn) generateBtn.disabled = true;
    }
}

function configureAPI() {
    const apiKeyInput = document.getElementById('api-key-input');
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
        alert('Please enter your API key');
        return;
    }

    aiGenerator.saveAPIKey(apiKey);
    appState.apiKey = apiKey;
    appState.isAPIConfigured = true;

    checkAPIStatus();
    alert('✅ API key saved successfully!');

    // Clear input for security
    apiKeyInput.value = '';
}

async function testAPIConnection() {
    if (!aiGenerator.isConfigured()) {
        alert('Please configure your API key first');
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '🔄 Testing...';

    try {
        const success = await aiGenerator.testConnection();
        if (success) {
            alert('✅ Connection successful! API is working correctly.');
        } else {
            alert('❌ Connection failed. Please check your API key.');
        }
    } catch (error) {
        alert(`❌ Connection error: ${error.message}`);
    } finally {
        btn.disabled = false;
        btn.textContent = '🔌 Test Connection';
    }
}

// ================================================================
// Asset Management
// ================================================================

function loadAssets() {
    if (!assetManager) return;

    appState.assets = assetManager.getAssets();

    // Display assets in galleries
    displayAssetGallery('logos');
    displayAssetGallery('signatures');
    displayAssetGallery('backgrounds');
}

async function handleAssetUpload(event, category) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File too large. Please upload images smaller than 5MB');
        return;
    }

    try {
        const asset = await assetManager.addAsset(file, category);
        appState.assets[category].push(asset);

        // Update display
        displayAssetGallery(category);

        // Clear input
        event.target.value = '';

        console.log(`Asset added to ${category}:`, asset.name);
    } catch (error) {
        alert(`Error uploading asset: ${error.message}`);
    }
}

function displayAssetGallery(category) {
    const gallery = document.getElementById(`${category}-gallery`);
    if (!gallery) return;

    const assets = appState.assets[category];

    if (assets.length === 0) {
        gallery.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted);">No assets uploaded</p>';
        return;
    }

    gallery.innerHTML = assets.map(asset => `
    <div class="asset-item" style="display: inline-block; margin: 0.5rem; position: relative;">
      <img src="${asset.base64Data}" alt="${asset.name}" 
           style="width: 80px; height: 80px; object-fit: cover; border-radius: var(--radius-sm); border: 2px solid var(--surface-border);">
      <button onclick="removeAsset('${category}', ${asset.id})" 
              style="position: absolute; top: -8px; right: -8px; background: var(--error); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 0.75rem;">×</button>
      <p style="font-size: 0.75rem; margin-top: 0.25rem; max-width: 80px; overflow: hidden; text-overflow: ellipsis;">${asset.name}</p>
    </div>
  `).join('');
}

function removeAsset(category, assetId) {
    assetManager.removeAsset(category, assetId);
    appState.assets[category] = appState.assets[category].filter(a => a.id !== assetId);
    displayAssetGallery(category);
}

function clearAllAssets() {
    if (!confirm('Are you sure you want to clear all uploaded assets?')) {
        return;
    }

    assetManager.clearAssets();
    appState.assets = {
        logos: [],
        signatures: [],
        backgrounds: []
    };

    displayAssetGallery('logos');
    displayAssetGallery('signatures');
    displayAssetGallery('backgrounds');
}

// ================================================================
// AI Template Generation
// ================================================================

async function generateAITemplate() {
    const scenarioInput = document.getElementById('scenario-input');
    const scenario = scenarioInput.value.trim();

    if (!scenario) {
        alert('Please describe your certificate scenario');
        return;
    }

    if (!aiGenerator.isConfigured()) {
        alert('Please configure your API key first');
        return;
    }

    try {
        // Get asset metadata for prompt
        const assetMetadata = assetManager.getAssetMetadata();

        // Get actual asset data for API call
        const allAssets = [];
        for (const category in appState.assets) {
            allAssets.push(...appState.assets[category]);
        }

        // Generate template
        const templateHTML = await aiGenerator.generateTemplate(scenario, assetMetadata);

        // Store and display
        appState.currentTemplate = templateHTML;
        displayTemplatePreview(templateHTML);

        // Show refinement option
        document.getElementById('refine-template-btn').classList.remove('hidden');

    } catch (error) {
        alert(`Error generating template: ${error.message}\n\nPlease check your API key and try again.`);
        console.error('Generation error:', error);
    }
}

function displayTemplatePreview(htmlTemplate) {
    const previewContainer = document.getElementById('template-preview-container');
    const preview = document.getElementById('template-preview');

    // Create a temporary div to render the template
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlTemplate;

    // Scale down for preview
    const cert = tempDiv.firstElementChild;
    if (cert) {
        cert.style.transform = 'scale(0.5)';
        cert.style.transformOrigin = 'top left';
        cert.style.margin = '0';
    }

    preview.innerHTML = '';
    preview.appendChild(tempDiv);

    previewContainer.classList.remove('hidden');

    // Scroll to preview
    previewContainer.scrollIntoView({ behavior: 'smooth' });
}

function acceptTemplate() {
    if (!appState.currentTemplate) {
        alert('No template generated');
        return;
    }

    // Show CSV upload section
    document.getElementById('upload-section').classList.remove('hidden');

    // Scroll to CSV section
    document.getElementById('upload-section').scrollIntoView({ behavior: 'smooth' });

    console.log('Template accepted, ready for CSV upload');
}

async function regenerateTemplate() {
    if (!confirm('Generate a new template? This will replace the current one.')) {
        return;
    }

    await generateAITemplate();
}

function showRefineDialog() {
    document.getElementById('refine-modal').classList.remove('hidden');
}

function closeRefineDialog() {
    document.getElementById('refine-modal').classList.add('hidden');
    document.getElementById('refinement-input').value = '';
}

async function refineTemplate() {
    const refinementInput = document.getElementById('refinement-input');
    const refinement = refinementInput.value.trim();

    if (!refinement) {
        alert('Please describe what you want to change');
        return;
    }

    if (!appState.currentTemplate) {
        alert('No template to refine');
        return;
    }

    try {
        const refinedHTML = await aiGenerator.refineTemplate(appState.currentTemplate, refinement);
        appState.currentTemplate = refinedHTML;
        displayTemplatePreview(refinedHTML);
        closeRefineDialog();
    } catch (error) {
        alert(`Error refining template: ${error.message}`);
    }
}

// ================================================================
// CSV Upload and Handling
// ================================================================

function setupCSVUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('csv-file');

    if (!uploadArea || !fileInput) return;

    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop events
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    handleFile(file);
}

function handleFile(file) {
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
        alert('Please upload a CSV file');
        return;
    }

    // Show file info
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('file-info').classList.remove('hidden');

    // Parse CSV
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            handleCSVData(results.data, results.meta.fields);
        },
        error: function (error) {
            alert('Error parsing CSV: ' + error.message);
            console.error('CSV Parse Error:', error);
        }
    });
}

function handleCSVData(data, headers) {
    console.log('CSV Data:', data);
    console.log('Headers:', headers);

    // Validate headers
    const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
        alert(`Missing required columns: ${missingColumns.join(', ')}\n\nRequired columns: ${REQUIRED_COLUMNS.join(', ')}`);
        return;
    }

    // Filter out empty rows
    const validData = data.filter(row => row.name && row.name.trim() !== '');

    if (validData.length === 0) {
        alert('No valid data found in CSV file');
        return;
    }

    // Update state
    appState.csvData = validData;
    appState.csvHeaders = headers;
    appState.isFileUploaded = true;

    // Update UI
    document.getElementById('file-rows').textContent = validData.length;
    showDataPreview(validData, headers);

    // Enable generate button
    document.getElementById('generate-btn').disabled = false;
}

function showDataPreview(data, headers) {
    const preview = document.getElementById('data-preview');
    const tableHead = document.getElementById('table-head');
    const tableBody = document.getElementById('table-body');

    // Clear existing content
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    // Create header row
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    tableHead.appendChild(headerRow);

    // Create data rows (show first 5 rows)
    const previewData = data.slice(0, 5);
    previewData.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] || '';
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });

    // Show preview
    preview.classList.remove('hidden');
}

// ================================================================
// Certificate Generation
// ================================================================

function generateCertificates() {
    if (!appState.isFileUploaded || !appState.csvData) {
        alert('Please upload a CSV file first');
        return;
    }

    if (!appState.currentTemplate) {
        alert('Please generate a template first');
        return;
    }

    const container = document.getElementById('certificates-container');
    container.innerHTML = ''; // Clear existing certificates

    // Generate certificate for each row
    appState.csvData.forEach((row, index) => {
        const certificate = generateCertificate(appState.currentTemplate, row, index);
        container.appendChild(certificate);
    });

    // Update count
    document.getElementById('cert-count').textContent = appState.csvData.length;

    // Show certificates section
    document.getElementById('certificates-section').classList.remove('hidden');

    // Scroll to certificates
    document.getElementById('certificates-section').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function generateCertificate(templateHTML, data, index) {
    // Create container
    const container = document.createElement('div');
    container.innerHTML = templateHTML;

    const certDiv = container.firstElementChild;

    // Replace placeholders with actual data
    let html = certDiv.outerHTML;

    html = html.replace(/\{\{name\}\}/g, data.name || 'N/A');
    html = html.replace(/\{\{course\}\}/g, data.course || 'N/A');
    html = html.replace(/\{\{date\}\}/g, formatDate(data.date) || 'N/A');
    html = html.replace(/\{\{instructor\}\}/g, data.instructor || 'N/A');
    html = html.replace(/\{\{achievement\}\}/g, data.achievement || '');

    // Create new element from updated HTML
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const cert = wrapper.firstElementChild;

    // Add animation
    cert.classList.add('fade-in');
    cert.style.animationDelay = `${index * 100}ms`;

    return cert;
}

function formatDate(dateString) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString;
        }

        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    } catch (e) {
        return dateString;
    }
}

// ================================================================
// Utility Functions
// ================================================================

function downloadSampleCSV() {
    const sampleData = [
        ['name', 'course', 'date', 'instructor', 'achievement'],
        ['John Doe', 'Web Development Bootcamp', '2026-02-10', 'Jane Smith', 'Excellence'],
        ['Alice Johnson', 'Data Science Fundamentals', '2026-02-09', 'Dr. Robert Wilson', 'Outstanding Performance'],
        ['Michael Chen', 'Advanced JavaScript', '2026-02-08', 'Sarah Williams', 'Distinction'],
        ['Emily Rodriguez', 'UI/UX Design Mastery', '2026-02-07', 'David Brown', 'High Achievement']
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_certificates.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function resetApp() {
    if (!confirm('Start over? This will clear all generated certificates.')) {
        return;
    }

    // Reset state
    appState.currentTemplate = null;
    appState.csvData = null;
    appState.csvHeaders = [];
    appState.isFileUploaded = false;

    // Reset UI
    document.getElementById('csv-file').value = '';
    document.getElementById('file-info').classList.add('hidden');
    document.getElementById('data-preview').classList.add('hidden');
    document.getElementById('generate-btn').disabled = true;
    document.getElementById('certificates-section').classList.add('hidden');
    document.getElementById('certificates-container').innerHTML = '';
    document.getElementById('template-preview-container').classList.add('hidden');
    document.getElementById('scenario-input').value = '';
    document.getElementById('refine-template-btn').classList.add('hidden');
    document.getElementById('upload-section').classList.add('hidden');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================================================================
// Console Messages
// ================================================================

console.log('%c🤖 AI Certificate Generator', 'font-size: 20px; font-weight: bold; color: #4F46E5;');
console.log('%cPowered by Google Gemini', 'font-size: 14px; color: #7C3AED;');
console.log('Ready to create custom certificates with AI!');
