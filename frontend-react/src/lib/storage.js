import localforage from "localforage";

// Initialize localforage store specifically for our cert templates
localforage.config({
  driver: localforage.INDEXEDDB, // Force WebSQL or IndexedDB
  name: "CertiGen",
  version: 1.0,
  storeName: "templates",
  description: "Saved certificate templates and schemas",
});

/**
 * Save a new certificate template to IndexedDB.
 */
export async function saveTemplate(template) {
  const templates = await getTemplates();
  templates.push(template);
  // Sort descending by creation date
  templates.sort((a, b) => b.createdAt - a.createdAt);
  await localforage.setItem("cert_templates", templates);
}

/**
 * Retrieve all saved certificate templates.
 */
export async function getTemplates() {
  const templates = await localforage.getItem("cert_templates");
  return templates || [];
}

/**
 * Retrieve a specific template by its UUID.
 */
export async function getTemplateById(id) {
  const templates = await getTemplates();
  return templates.find((t) => t.id === id) || null;
}

/**
 * Update an existing template by ID (merges provided fields into the stored record).
 */
export async function updateTemplate(id, updates) {
  const templates = await getTemplates();
  const idx = templates.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error("Template not found");
  templates[idx] = { ...templates[idx], ...updates };
  await localforage.setItem("cert_templates", templates);
}

/**
 * Delete a specific template by its UUID.
 */
export async function deleteTemplate(id) {
  const templates = await getTemplates();
  const filtered = templates.filter((t) => t.id !== id);
  await localforage.setItem("cert_templates", filtered);
}
