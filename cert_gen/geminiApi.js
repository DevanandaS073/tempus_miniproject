window.geminiApi = (() => {

    // We will use the Google Gemini 2.5 Flash API to generate full HTML
    const generateCertificateHtml = async (base64Image, assets, scenarioDesc, apiKey) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        // Prepare the reference image
        const refMime = base64Image.split(';')[0].split(':')[1];
        const refData = base64Image.split(',')[1];

        let parts = [
            {
                text: `You are an expert Frontend Web Developer and UI Designer. 
I have provided an image of a certificate whose design I want you to meticulously clone using ONLY raw HTML and inline CSS. 
Do NOT import any external CSS files. Use standard Google Fonts if needed (e.g., via @import or <link>).

### Requirements:
1. **Dimension**: The container must be strictly 1123px by 794px (Standard A4 Landscape at 96 DPI) with relative internal sizing so it scales.
2. **Placeholders**: Instead of actual names and topics, insert these exact tags so my system can replace them later:
   - {{name}} (for the recipient's name)
   - {{course}} (for the topic/course name)
   - {{date}} 
   - {{grade}}
3. **Custom Assets**: The user may have uploaded custom logos/signatures to replace the ones in the reference image. If the list below contains assets, use their exact Base64 strings in your <img> src tags where appropriate based on their names. 
4. **Style**: Match the typography, colors, layout, and visual aesthetic of the reference image as closely as possible using modern CSS (flexbox, borders, pseudo-styles, gradients).
5. **Output**: Return ONLY the raw HTML string starting with <div class="certificate-container" ...>. Do not wrap it in markdown codeblocks like \`\`\`html. Do not include <html> or <body> tags. Just the wrapper div and its contents.

### User Scenario/Instructions:
${scenarioDesc ? scenarioDesc : "Match the reference image perfectly."}

### Custom Assets Available:
${assets.map(a => `- ${a.name}: ${a.base64.substring(0, 50)}... [Use the full Base64 given in the inline_data below]`).join('\n')}`
            },
            {
                inline_data: { mime_type: refMime, data: refData }
            }
        ];

        // Append custom assets to visual context so model "sees" them for sizing, but we mainly want it to use the base64 string
        assets.forEach(asset => {
            parts.push({
                text: `\n[ASSET: ${asset.name}]\nUse this precise src string for the img tag: ${asset.base64}\n`
            });
        });

        const requestBody = {
            contents: [{ parts }],
            generationConfig: {
                temperature: 0.2, // Low temp for more deterministic code structure
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "Failed to call Gemini API");
        }

        const data = await response.json();

        try {
            let rawText = data.candidates[0].content.parts[0].text;
            // Clean markdown formatting if present despite instruction
            rawText = rawText.replace(/```html/g, '').replace(/```/g, '').trim();
            return rawText;
        } catch (e) {
            throw new Error("Failed to parse ML response: " + e.message);
        }
    };

    const testConnection = async (apiKey) => {
        // Simple lightweight request to list models to verify api key
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "Invalid API Key or network issue");
        }

        return true;
    };

    return { generateCertificateHtml, testConnection };
})();
