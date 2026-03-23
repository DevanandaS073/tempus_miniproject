import { VISION_SYSTEM_PROMPT } from "./prompt";

function cleanJsonResponse(response) {
  // Remove markdown code blocks if the AI accidentally includes them
  let cleaned = response.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

/**
 * Attempts to recover data from a Gemini response truncated mid-JSON.
 * Directly extracts the html, csv_schema, and required_assets fields
 * rather than trying to close open delimiters, which is fragile.
 */
function extractFromTruncatedResponse(raw) {
  const htmlKeyMatch = raw.match(/"html"\s*:\s*"/);
  if (!htmlKeyMatch) return null;

  const htmlStart = htmlKeyMatch.index + htmlKeyMatch[0].length;
  let i = htmlStart;
  let html = "";

  // Walk the html string value, honoring backslash escapes
  while (i < raw.length) {
    const char = raw[i];
    if (char === "\\" && i + 1 < raw.length) {
      const next = raw[i + 1];
      if (next === '"') html += '"';
      else if (next === 'n') html += '\n';
      else if (next === 't') html += '\t';
      else if (next === 'r') html += '\r';
      else if (next === '\\') html += '\\';
      else html += next;
      i += 2;
      continue;
    }
    if (char === '"') break; // end of html string
    html += char;
    i++;
  }

  const remainder = raw.slice(i + 1);
  let csvSchema = [];
  let requiredAssets = [];

  try {
    const m = remainder.match(/"csv_schema"\s*:\s*(\[[^\]]*\])/);
    if (m) csvSchema = JSON.parse(m[1]);
  } catch (_) {}

  try {
    const m = remainder.match(/"required_assets"\s*:\s*(\[[^\]]*\])/);
    if (m) requiredAssets = JSON.parse(m[1]);
  } catch (_) {}

  if (!html) return null;
  return { html, csv_schema: csvSchema, required_assets: requiredAssets };
}

export async function analyzeWithOpenAI(base64Image, apiKey) {
  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: VISION_SYSTEM_PROMPT },
          {
            type: "image_url",
            image_url: {
              url: base64Image, // e.g., data:image/jpeg;base64,...
            },
          },
        ],
      },
    ],
    temperature: 0.1, // Low temperature for more deterministic layout extraction
    response_format: { type: "json_object" },
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error?.message || "Failed to communicate with OpenAI API",
    );
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  try {
    const parsed = JSON.parse(cleanJsonResponse(content));
    return parsed;
  } catch (e) {
    console.error("Failed to parse OpenAI response:", content);
    throw new Error("OpenAI returned malformed JSON");
  }
}

const GEMINI_MODELS = {
  "gemini": "gemini-2.5-flash",
};

function validateGeminiApiKey(apiKey) {
  const key = (apiKey || "").trim();
  if (!key) {
    throw new Error("Missing Gemini API key.");
  }

  if (key.startsWith("gen-lang-client-")) {
    throw new Error(
      "Invalid Gemini key format. Use a real Google AI Studio API key (starts with 'AIza'), not a client placeholder key.",
    );
  }

  if (!key.startsWith("AIza")) {
    throw new Error(
      "Invalid Gemini API key format. Expected a Google API key that starts with 'AIza'.",
    );
  }

  return key;
}

export async function analyzeWithGemini(base64Image, apiKey, providerId = "gemini") {
  const safeApiKey = validateGeminiApiKey(apiKey);
  const modelId = GEMINI_MODELS[providerId] || providerId;
  // Gemini expects raw base64 without the data URI prefix for inlineData
  const base64Data = base64Image.split(",")[1] || base64Image;
  const mimeType =
    base64Image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] ||
    "image/jpeg";

  const payload = {
    contents: [
      {
        parts: [
          { text: VISION_SYSTEM_PROMPT },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      maxOutputTokens: 65536,
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${safeApiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    let error = null;
    try {
      error = await response.json();
    } catch (_) {}

    if (response.status === 400) {
      throw new Error(
        error?.error?.message ||
          "Gemini request rejected (400). Check that your API key is valid and Generative Language API is enabled for the key.",
      );
    }

    throw new Error(
      error?.error?.message || "Failed to communicate with Gemini API",
    );
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error("Gemini returned an empty response.");
  }

  try {
    const parsed = JSON.parse(cleanJsonResponse(content));
    return parsed;
  } catch (e) {
    // Response was likely truncated — attempt field-level extraction
    const recovered = extractFromTruncatedResponse(cleanJsonResponse(content));
    if (recovered) {
      console.warn("Gemini response was truncated; partial result returned.");
      return recovered;
    }
    console.error("Failed to parse Gemini response:", content);
    throw new Error(
      "Gemini returned a response that was too long and could not be parsed. " +
      "Try a simpler certificate image."
    );
  }
}

export async function testOpenAIConnection(apiKey) {
  const response = await fetch("https://api.openai.com/v1/models", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Invalid OpenAI API Key");
  }
  return true;
}

export async function testGeminiConnection(apiKey, providerId = "gemini") {
  const safeApiKey = validateGeminiApiKey(apiKey);
  const modelId = GEMINI_MODELS[providerId] || providerId;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}?key=${safeApiKey}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    let error = null;
    try {
      error = await response.json();
    } catch (_) {}
    throw new Error(
      error?.error?.message ||
        "Invalid Gemini API key or API access not enabled.",
    );
  }
  return true;
}
