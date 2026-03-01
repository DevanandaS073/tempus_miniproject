document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const btnDashboard = document.getElementById('btn-dashboard');
    const btnSettings = document.getElementById('btn-settings');
    const settingsModal = document.getElementById('settings-modal');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const btnSaveSettings = document.getElementById('btn-save-settings');
    const btnTestKey = document.getElementById('btn-test-key');
    const apiKeyInput = document.getElementById('api-key-input');
    const apiKeyStatus = document.getElementById('api-key-status');

    const viewDashboard = document.getElementById('view-dashboard');
    const viewGenerator = document.getElementById('view-generator');
    const viewMlCreator = document.getElementById('view-ml-creator');

    const cardGenerator = document.getElementById('card-generator');
    const cardMlCreator = document.getElementById('card-ml-creator');
    const btnsBack = document.querySelectorAll('.btn-back');

    // State
    const state = {
        apiKey: localStorage.getItem('gemini_api_key') || '',
        csvData: null,
        csvHeaders: [],
        currentTemplate: 'modern_minimal',
        uploadedImageBase64: null,
        mlBoxes: [],
    };

    // Initialize API Key if exists
    if (state.apiKey) apiKeyInput.value = state.apiKey;

    // Navigation
    const switchView = (viewToShow) => {
        [viewDashboard, viewGenerator, viewMlCreator].forEach(v => {
            v.classList.add('hidden');
            v.classList.remove('active');
        });
        viewToShow.classList.remove('hidden');
        viewToShow.classList.add('active');

        btnDashboard.classList.remove('active');
        if (viewToShow === viewDashboard) btnDashboard.classList.add('active');
    };

    btnDashboard.addEventListener('click', () => switchView(viewDashboard));
    btnsBack.forEach(btn => btn.addEventListener('click', () => switchView(viewDashboard)));

    cardGenerator.addEventListener('click', () => switchView(viewGenerator));
    cardMlCreator.addEventListener('click', () => switchView(viewMlCreator));

    // Settings Modal
    btnSettings.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
        apiKeyStatus.textContent = '';
    });
    btnCloseSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));

    btnSaveSettings.addEventListener('click', () => {
        const val = apiKeyInput.value.trim();
        if (val) {
            localStorage.setItem('gemini_api_key', val);
            state.apiKey = val;
            apiKeyStatus.innerHTML = '<i class="fa-solid fa-check"></i> API Key Saved Successfully!';
            apiKeyStatus.style.color = 'var(--success)';
            setTimeout(() => {
                settingsModal.classList.add('hidden');
                apiKeyStatus.textContent = '';
            }, 1000);
        } else {
            apiKeyStatus.textContent = 'Please enter a valid API key.';
            apiKeyStatus.style.color = '#ef4444';
        }
    });

    btnTestKey.addEventListener('click', async () => {
        const val = apiKeyInput.value.trim();
        if (!val) {
            apiKeyStatus.textContent = 'Please enter an API key to test.';
            apiKeyStatus.style.color = '#ef4444';
            return;
        }
        btnTestKey.disabled = true;
        btnTestKey.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Testing...';
        apiKeyStatus.textContent = 'Testing connection...';
        apiKeyStatus.style.color = '#cbd5e1';

        try {
            const result = await window.geminiApi.testConnection(val);
            if (result) {
                apiKeyStatus.innerHTML = '<i class="fa-solid fa-check"></i> Connection successful!';
                apiKeyStatus.style.color = 'var(--success)';
            }
        } catch (err) {
            apiKeyStatus.innerHTML = '<i class="fa-solid fa-xmark"></i> Connection failed: ' + err.message;
            apiKeyStatus.style.color = '#ef4444';
        } finally {
            btnTestKey.disabled = false;
            btnTestKey.textContent = 'Test Key';
        }
    });

    // Generator Mode - CSV Upload Setup
    const csvUploadArea = document.getElementById('csv-upload-area');
    const csvFileInput = document.getElementById('csv-file-input');
    const btnGeneratePdf = document.getElementById('btn-generate-pdf');
    const templateSelect = document.getElementById('template-select');

    const handleCsvSelect = (file) => {
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    alert('Error parsing CSV');
                    return;
                }
                state.csvData = results.data;
                state.csvHeaders = results.meta.fields;
                csvUploadArea.innerHTML = `<i class="fa-solid fa-file-circle-check text-success"></i><p class="highlight">${file.name} loaded</p><p class="text-sm">${state.csvData.length} records found</p>`;
                btnGeneratePdf.disabled = false;

                // Trigger preview logic
                if (window.pdfGen) window.pdfGen.renderPreview(state);
            }
        });
    };

    csvUploadArea.addEventListener('click', () => csvFileInput.click());
    csvUploadArea.addEventListener('dragover', (e) => { e.preventDefault(); csvUploadArea.classList.add('dragover'); });
    csvUploadArea.addEventListener('dragleave', () => csvUploadArea.classList.remove('dragover'));
    csvUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        csvUploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleCsvSelect(e.dataTransfer.files[0]);
    });
    csvFileInput.addEventListener('change', (e) => handleCsvSelect(e.target.files[0]));

    templateSelect.addEventListener('change', (e) => {
        state.currentTemplate = e.target.value;
        if (state.csvData && window.pdfGen) window.pdfGen.renderPreview(state);
    });

    // Generate PDF Button
    btnGeneratePdf.addEventListener('click', async () => {
        if (!state.csvData) return;
        btnGeneratePdf.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
        btnGeneratePdf.disabled = true;

        try {
            await window.pdfGen.generateAll(state);
        } catch (err) {
            console.error(err);
            alert('Error generating PDF: ' + err.message);
        } finally {
            btnGeneratePdf.innerHTML = '<i class="fa-solid fa-download"></i> Generate PDF';
            btnGeneratePdf.disabled = false;
        }
    });

    // ML Creator Mode (HTML AI Builder) Setup
    state.assets = []; // Store custom uploaded assets {name, base64}

    const imgUploadArea = document.getElementById('image-upload-area');
    const imgFileInput = document.getElementById('image-file-input');
    const btnRunAi = document.getElementById('btn-run-ai');

    const btnAddAsset = document.getElementById('btn-add-asset');
    const assetFileInput = document.getElementById('asset-file-input');
    const assetsList = document.getElementById('assets-list');

    const promptInput = document.getElementById('ai-scenario-prompt');
    const htmlPreviewContainer = document.getElementById('html-preview-container');
    const htmlCodeEditor = document.getElementById('html-code-editor');

    const btnTabPreview = document.getElementById('btn-tab-preview');
    const btnTabCode = document.getElementById('btn-tab-code');

    // Handle Uploading the Reference Image
    const handleImgSelect = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            state.uploadedImageBase64 = e.target.result;
            imgUploadArea.innerHTML = `<i class="fa-solid fa-image text-success" style="font-size: 1.5rem; margin-bottom: 0.5rem;"></i><p class="highlight text-sm">${file.name} loaded</p>`;
        };
        reader.readAsDataURL(file);
    };

    imgUploadArea.addEventListener('click', () => imgFileInput.click());
    imgUploadArea.addEventListener('dragover', (e) => { e.preventDefault(); imgUploadArea.classList.add('dragover'); });
    imgUploadArea.addEventListener('dragleave', () => imgUploadArea.classList.remove('dragover'));
    imgUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        imgUploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleImgSelect(e.dataTransfer.files[0]);
    });
    imgFileInput.addEventListener('change', (e) => handleImgSelect(e.target.files[0]));

    // Handle Uploading Custom Assets
    const renderAssetsList = () => {
        assetsList.innerHTML = '';
        state.assets.forEach((asset, idx) => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.gap = '0.5rem';
            div.style.marginBottom = '0.5rem';
            div.innerHTML = `
                <img src="${asset.base64}" style="width: 30px; height: 30px; object-fit: contain; background: #fff; border-radius: 4px;">
                <span class="text-sm" style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${asset.name}</span>
                <button class="btn secondary-btn delete-asset-btn" data-index="${idx}" style="padding: 0.2rem 0.6rem;"><i class="fa-solid fa-trash" style="color: #ef4444;"></i></button>
            `;
            assetsList.appendChild(div);
        });

        document.querySelectorAll('.delete-asset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const i = e.currentTarget.getAttribute('data-index');
                state.assets.splice(i, 1);
                renderAssetsList();
            });
        });
    };

    btnAddAsset.addEventListener('click', () => assetFileInput.click());
    assetFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            state.assets.push({ name: file.name, base64: evt.target.result });
            renderAssetsList();
        };
        reader.readAsDataURL(file);
    });

    // Preview / Code Tabs
    btnTabPreview.addEventListener('click', () => {
        btnTabPreview.classList.add('active');
        btnTabCode.classList.remove('active');
        htmlPreviewContainer.classList.remove('hidden');
        htmlCodeEditor.classList.add('hidden');

        // sync code to preview
        htmlPreviewContainer.innerHTML = htmlCodeEditor.value || '<p class="placeholder-text" style="color: #64748b; height:100%; display:flex; align-items:center; justify-content:center;">Upload reference and click Generate</p>';
    });

    btnTabCode.addEventListener('click', () => {
        btnTabCode.classList.add('active');
        btnTabPreview.classList.remove('active');
        htmlCodeEditor.classList.remove('hidden');
        htmlPreviewContainer.classList.add('hidden');
    });

    htmlCodeEditor.addEventListener('input', () => {
        // live update the internal state
        state.aiGeneratedHtml = htmlCodeEditor.value;
    });

    // Run AI Generation
    btnRunAi.addEventListener('click', async () => {
        if (!state.apiKey) {
            alert("Please configure your Gemini API Key in Settings first.");
            settingsModal.classList.remove('hidden');
            return;
        }
        if (!state.uploadedImageBase64) {
            alert("Please upload a Reference Certificate Image first.");
            return;
        }

        btnRunAi.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating Code...';
        btnRunAi.disabled = true;

        try {
            const resultHtml = await window.geminiApi.generateCertificateHtml(
                state.uploadedImageBase64,
                state.assets,
                promptInput.value,
                state.apiKey
            );

            state.aiGeneratedHtml = resultHtml;
            htmlCodeEditor.value = resultHtml;
            htmlPreviewContainer.innerHTML = resultHtml;

            // Switch to preview tab
            btnTabPreview.click();

            document.getElementById('btn-save-template').classList.remove('hidden');
            btnRunAi.innerHTML = '<i class="fa-solid fa-brain"></i> Re-Generate Template';
        } catch (err) {
            console.error(err);
            alert("Error calling AI: " + err.message);
            btnRunAi.innerHTML = '<i class="fa-solid fa-brain"></i> Generate HTML Template';
        } finally {
            btnRunAi.disabled = false;
        }
    });

    // Save Template
    document.getElementById('btn-save-template').addEventListener('click', () => {
        if (!state.aiGeneratedHtml) return;

        // Save raw HTML string to local storage
        localStorage.setItem('certigen_custom_html_template', state.aiGeneratedHtml);

        alert("Custom Template Saved! You can now select 'Custom (ML Generated)' in the Standard Generator.");

        // Switch back to generator and select custom model
        const select = document.getElementById('template-select');
        select.value = 'custom_html';

        // Add option if it doesn't exist
        if (!Array.from(select.options).some(opt => opt.value === 'custom_html')) {
            const opt = document.createElement('option');
            opt.value = 'custom_html';
            opt.text = 'Custom HTML (AI Generated)';
            select.appendChild(opt);
        }

        select.value = 'custom_html';
        state.currentTemplate = 'custom_html';

        switchView(viewGenerator);

        if (state.csvData && window.pdfGen) window.pdfGen.renderPreview(state);
    });

    // EXPOSE state globally for modules
    window.appState = state;
});
