// AI Certificate Template Generator
// Integrates with Google Gemini API for dynamic template generation
// ================================================================

const AI_CONFIG = {
    gemini: {
        name: 'Google Gemini',
        endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent',
        rateLimit: 60, // requests per minute
        maxTokens: 8192
    }
};

// ================================================================
// Configuration Management
// ================================================================

class AIGenerator {
    constructor() {
        this.provider = 'gemini';
        this.apiKey = this.loadAPIKey();
        this.conversationHistory = [];
    }

    // Load API key from localStorage
    loadAPIKey() {
        return localStorage.getItem('ai_api_key') || null;
    }

    // Save API key to localStorage
    saveAPIKey(key) {
        localStorage.setItem('ai_api_key', key);
        this.apiKey = key;
    }

    // Check if API is configured
    isConfigured() {
        return this.apiKey !== null && this.apiKey.length > 0;
    }

    // Test API connection
    async testConnection() {
        if (!this.isConfigured()) {
            throw new Error('API key not configured');
        }

        try {
            const response = await this.callGeminiAPI('Test connection. Respond with "OK".');
            return response.includes('OK') || response.length > 0;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    // ================================================================
    // Prompt Engineering
    // ================================================================

    buildPrompt(scenario, assets = [], csvFields = ['name', 'course', 'date', 'instructor', 'achievement']) {
        let prompt = `You are an expert certificate designer. Generate a beautiful, professional HTML certificate template.

**Scenario**: ${scenario}

**Requirements**:
1. **Dimensions**: Create a certificate sized 11 inches wide × 8.5 inches tall (landscape orientation)
2. **Styling**: Use ONLY inline styles (no external CSS). All styles must be in the style attribute.
3. **Print-ready**: The certificate should look perfect when printed
4. **Placeholders**: Use these exact placeholders for dynamic data:
   - {{name}} - Recipient's name
   - {{course}} - Course or achievement name
   - {{date}} - Date of completion/award
   - {{instructor}} - Instructor or official name
   - {{achievement}} - Achievement level or grade (e.g., "Excellence", "Distinction")
5. **Typography**: Use web-safe fonts or Google Fonts (with @import if needed)
6. **Colors**: Professional, elegant color scheme appropriate for the scenario
7. **Layout**: Well-balanced, with proper hierarchy and whitespace

`;

        // Add asset information if available
        if (assets.length > 0) {
            prompt += `**Assets to Include**:\n`;
            assets.forEach((asset, index) => {
                prompt += `${index + 1}. ${asset.category}: ${asset.name} (${asset.dimensions || 'size unknown'})\n`;
                if (asset.category === 'logo') {
                    prompt += `   → Place logo prominently (usually top-center or top-left)\n`;
                } else if (asset.category === 'signature') {
                    prompt += `   → Include signature at bottom with instructor name\n`;
                } else if (asset.category === 'background') {
                    prompt += `   → Use as background or decorative element\n`;
                }
            });
            prompt += `\n`;
        }

        prompt += `**Output Format**:
Return ONLY the HTML code for the certificate template. The output must be:
- A single <div> element with class="certificate"
- Complete with all inline styles
- Ready to use with document.createElement()
- No markdown code fence, no explanations, just the raw HTML

**Example Structure** (adapt to scenario):
<div class="certificate" style="width: 11in; height: 8.5in; padding: 1in; background: white; border: 5px solid #333; font-family: Georgia, serif;">
  <!-- Beautiful certificate design here -->
  <h1 style="text-align: center; font-size: 2.5rem;">{{name}}</h1>
  <!-- More content -->
</div>

Now, create the certificate template for the given scenario.`;

        return prompt;
    }

    // ================================================================
    // API Integration
    // ================================================================

    async callGeminiAPI(prompt, includeAssets = false, assets = []) {
        if (!this.isConfigured()) {
            throw new Error('API key not configured. Please configure your Gemini API key first.');
        }

        const config = AI_CONFIG.gemini;
        const url = `${config.endpoint}?key=${this.apiKey}`;

        // Build request body
        const parts = [{ text: prompt }];

        // Add image assets if provided
        if (includeAssets && assets.length > 0) {
            for (const asset of assets) {
                if (asset.base64Data && asset.mimeType.startsWith('image/')) {
                    // Remove data URL prefix if present
                    const base64 = asset.base64Data.split(',')[1] || asset.base64Data;
                    parts.push({
                        inline_data: {
                            mime_type: asset.mimeType,
                            data: base64
                        }
                    });
                }
            }
        }

        const requestBody = {
            contents: [{
                parts: parts
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: config.maxTokens,
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error(`API request failed: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();

            // Extract text from response
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                console.error('Unexpected API response:', data);
                throw new Error('No text in API response');
            }

            return text;
        } catch (error) {
            console.error('Gemini API call failed:', error);
            throw error;
        }
    }

    // ================================================================
    // Template Generation
    // ================================================================

    async generateTemplate(scenario, assets = []) {
        try {
            // Show loading state
            this.showLoading(true);

            // Build the prompt
            const prompt = this.buildPrompt(scenario, assets);

            console.log('Generating template with prompt:', prompt);

            // Call AI API
            const response = await this.callGeminiAPI(prompt, assets.length > 0, assets);

            console.log('AI Response:', response);

            // Parse and clean the response
            const htmlTemplate = this.parseHTMLResponse(response);

            // Validate the template
            if (!this.validateTemplate(htmlTemplate)) {
                throw new Error('Generated template is invalid');
            }

            // Store in conversation history
            this.conversationHistory.push({
                scenario,
                template: htmlTemplate,
                timestamp: new Date().toISOString()
            });

            this.showLoading(false);
            return htmlTemplate;

        } catch (error) {
            this.showLoading(false);
            console.error('Template generation failed:', error);
            throw error;
        }
    }

    // ================================================================
    // Template Refinement
    // ================================================================

    async refineTemplate(currentTemplate, refinementRequest) {
        const prompt = `You previously generated this certificate template:

${currentTemplate}

The user requests the following refinement: "${refinementRequest}"

Please modify the template according to the request. Return ONLY the updated HTML code, no explanations.`;

        const response = await this.callGeminiAPI(prompt);
        return this.parseHTMLResponse(response);
    }

    // ================================================================
    // Response Parsing
    // ================================================================

    parseHTMLResponse(response) {
        // Remove markdown code fences if present
        let html = response.trim();

        // Remove ```html and ``` markers
        html = html.replace(/^```html\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');

        // Ensure it's wrapped in a div
        if (!html.startsWith('<div')) {
            // Try to find the div
            const divMatch = html.match(/<div[\s\S]*<\/div>/i);
            if (divMatch) {
                html = divMatch[0];
            }
        }

        return html.trim();
    }

    // ================================================================
    // Template Validation
    // ================================================================

    validateTemplate(html) {
        // Basic validation: check if it's valid HTML and contains placeholders
        if (!html || html.length < 50) {
            console.error('Template too short');
            return false;
        }

        if (!html.includes('<div')) {
            console.error('No div element found');
            return false;
        }

        // Check for at least one placeholder
        const hasPlaceholder = /\{\{(name|course|date|instructor|achievement)\}\}/.test(html);
        if (!hasPlaceholder) {
            console.warn('Warning: No placeholders found in template');
            // Don't fail, just warn
        }

        return true;
    }

    // ================================================================
    // UI Helpers
    // ================================================================

    showLoading(show) {
        const loadingEl = document.getElementById('ai-loading');
        if (loadingEl) {
            if (show) {
                loadingEl.classList.remove('hidden');
            } else {
                loadingEl.classList.add('hidden');
            }
        }
    }
}

// ================================================================
// Asset Management
// ================================================================

class AssetManager {
    constructor() {
        this.assets = this.loadAssets();
    }

    // Load assets from localStorage
    loadAssets() {
        const stored = localStorage.getItem('certificate_assets');
        return stored ? JSON.parse(stored) : {
            logos: [],
            signatures: [],
            backgrounds: []
        };
    }

    // Save assets to localStorage
    saveAssets() {
        localStorage.setItem('certificate_assets', JSON.stringify(this.assets));
    }

    // Add asset
    async addAsset(file, category) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const asset = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    category: category,
                    mimeType: file.type,
                    size: file.size,
                    base64Data: e.target.result,
                    uploadedAt: new Date().toISOString()
                };

                // Get image dimensions if it's an image
                if (file.type.startsWith('image/')) {
                    const img = new Image();
                    img.onload = () => {
                        asset.dimensions = `${img.width}x${img.height}`;
                        this.assets[category].push(asset);
                        this.saveAssets();
                        resolve(asset);
                    };
                    img.src = e.target.result;
                } else {
                    this.assets[category].push(asset);
                    this.saveAssets();
                    resolve(asset);
                }
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Remove asset
    removeAsset(category, assetId) {
        this.assets[category] = this.assets[category].filter(a => a.id !== assetId);
        this.saveAssets();
    }

    // Get all assets or by category
    getAssets(category = null) {
        if (category) {
            return this.assets[category] || [];
        }
        return this.assets;
    }

    // Get asset metadata for AI prompt (without full base64 data)
    getAssetMetadata() {
        const metadata = [];
        for (const category in this.assets) {
            this.assets[category].forEach(asset => {
                metadata.push({
                    name: asset.name,
                    category: category,
                    dimensions: asset.dimensions || 'unknown',
                    mimeType: asset.mimeType
                });
            });
        }
        return metadata;
    }

    // Clear all assets
    clearAssets() {
        this.assets = {
            logos: [],
            signatures: [],
            backgrounds: []
        };
        this.saveAssets();
    }
}

// ================================================================
// Export instances
// ================================================================

// Global instances (will be initialized in main script)
let aiGenerator = null;
let assetManager = null;

// Initialize function
function initializeAI() {
    aiGenerator = new AIGenerator();
    assetManager = new AssetManager();
    console.log('AI Generator initialized');
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    window.aiGenerator = aiGenerator;
    window.assetManager = assetManager;
    window.initializeAI = initializeAI;
}
