/**
 * Template Engine
 * 
 * Modular template engine for loading, parsing, and rendering poster templates.
 * Separates template logic from event data and DOM manipulation.
 * 
 * Responsibilities:
 * - Load template schema (JSON)
 * - Load template HTML
 * - Bind zones dynamically based on schema
 * - Expose render(container, content) API
 * 
 * Design Principles:
 * - No direct DOM querying outside this module
 * - No event data logic inside
 * - Reusable for any template
 * - Schema-driven rendering
 * 
 * @module TemplateEngine
 * @version 1.0.0
 */

/**
 * Template Engine Class
 * Handles template loading and rendering
 */
class TemplateEngine {
    constructor() {
        // Cache for loaded templates
        this._templateCache = {
            schemas: {},
            html: {}
        };

        // Base paths for template files
        this._basePath = {
            schemas: './templates/',
            html: './templates/'
        };
    }


    /* ============================================
       TEMPLATE LOADING
       ============================================ */

    /**
     * Load template schema
     * 
     * @param {string} templateId - Template ID (e.g., "modern")
     * @returns {Promise<Object>} Template schema
     */
    async loadSchema(templateId) {
        // Check cache first
        if (this._templateCache.schemas[templateId]) {
            return this._templateCache.schemas[templateId];
        }

        try {
            const schemaPath = `${this._basePath.schemas}template_${templateId}.schema.json`;
            const response = await fetch(schemaPath, { cache: 'no-store' });

            if (!response.ok) {
                throw new Error(`Failed to load schema: ${response.status} ${response.statusText}`);
            }

            const schema = await response.json();

            // Validate schema structure
            this._validateSchema(schema);

            // Cache schema
            this._templateCache.schemas[templateId] = schema;

            return schema;
        } catch (error) {
            console.error(`Error loading schema for template "${templateId}":`, error);
            throw error;
        }
    }

    /**
     * Load template HTML
     * 
     * @param {string} templateId - Template ID
     * @returns {Promise<string>} Template HTML string
     */
    async loadHTML(templateId) {
        // Check cache first
        if (this._templateCache.html[templateId]) {
            return this._templateCache.html[templateId];
        }

        try {
            const htmlPath = `${this._basePath.html}template_${templateId}.html`;
            const response = await fetch(htmlPath, { cache: 'no-store' });

            if (!response.ok) {
                throw new Error(`Failed to load HTML: ${response.status} ${response.statusText}`);
            }

            const rawHtml = await response.text();

            // Parse document so we can keep template styles/fonts alongside the fragment
            let html = rawHtml;
            if (typeof DOMParser !== 'undefined') {
                const parser = new DOMParser();
                const doc = parser.parseFromString(rawHtml, 'text/html');

                // Inject <style> and <link rel="stylesheet"> assets once per template
                this._injectTemplateStyles(templateId, doc);

                const root = doc.querySelector('[data-template]') || doc.querySelector('.poster-container');
                if (root) {
                    html = root.outerHTML;
                }
            } else {
                html = this._extractTemplateFragment(rawHtml);
            }

            // Cache HTML fragment
            this._templateCache.html[templateId] = html;

            return html;
        } catch (error) {
            console.error(`Error loading HTML for template "${templateId}":`, error);
            throw error;
        }
    }

    /**
     * Load complete template (schema + HTML)
     * 
     * @param {string} templateId - Template ID
     * @returns {Promise<Object>} Template data { schema, html }
     */
    async loadTemplate(templateId) {
        try {
            const [schema, html] = await Promise.all([
                this.loadSchema(templateId),
                this.loadHTML(templateId)
            ]);

            return { schema, html };
        } catch (error) {
            console.error(`Error loading template "${templateId}":`, error);
            throw error;
        }
    }


    /* ============================================
       ZONE BINDING
       ============================================ */

    /**
     * Bind zones to container based on schema
     * 
     * @param {HTMLElement} container - Container element
     * @param {Object} schema - Template schema
     * @returns {Object} Zone elements mapped by zone ID
     */
    bindZones(container, schema) {
        if (!container || !schema) {
            throw new Error('Container and schema are required');
        }

        const zoneElements = {};
        const zones = schema.zones || {};
        const templateRoot = this._getTemplateRoot(container);

        this._applyGridConfig(templateRoot, schema.grid);

        // Find and bind each zone
        Object.keys(zones).forEach(zoneId => {
            const zoneEl = templateRoot.querySelector(`[data-zone="${zoneId}"]`);

            if (!zoneEl) {
                console.warn(`Zone "${zoneId}" not found in template`);
                return;
            }

            zoneElements[zoneId] = zoneEl;

            // Apply zone configuration from schema
            const zoneConfig = zones[zoneId];
            this._applyZoneConfig(zoneEl, zoneConfig);
        });

        return zoneElements;
    }

    /**
     * Apply zone configuration to element
     * 
     * @param {HTMLElement} element - Zone element
     * @param {Object} config - Zone configuration from schema
     * @private
     */
    _applyZoneConfig(element, config) {
        // Apply grid positioning if specified
        if (config.grid) {
            if (config.grid.row) {
                element.style.gridRow = config.grid.row;
            }
            if (config.grid.column) {
                element.style.gridColumn = config.grid.column;
            }
        }

        // Support schema format that uses gridArea directly
        if (config.gridArea) {
            element.style.gridArea = config.gridArea;
        }

        // Apply alignment if specified
        if (config.display) {
            element.style.display = config.display;
        }
        if (config.flexDirection) {
            element.style.flexDirection = config.flexDirection;
        }
        if (config.justifyContent) {
            element.style.justifyContent = config.justifyContent;
        }
        if (config.alignItems) {
            element.style.alignItems = config.alignItems;
        }
        if (config.gap) {
            element.style.gap = config.gap;
        }
        if (config.padding) {
            element.style.padding = config.padding;
        }

        if (config.alignment) {
            element.style.textAlign = config.alignment;
        }
        if (config.textAlign) {
            element.style.textAlign = config.textAlign;
        }

        // Store zone metadata as data attributes
        if (config.maxLines) {
            element.dataset.maxLines = config.maxLines;
        }
        if (config.maxChars) {
            element.dataset.maxChars = config.maxChars;
        }
        if (config.maxCharacters) {
            element.dataset.maxChars = config.maxCharacters;
        }
    }


    /* ============================================
       RENDERING
       ============================================ */

    /**
     * Render template to container
     * 
     * Main API for rendering templates. Takes render-safe content and
     * populates the template zones.
     * 
     * Updated for schema v2.0.0 with backward compatibility.
     * 
     * @param {HTMLElement} container - Container element to render into
     * @param {Object} content - Render-safe content with zones
     * @param {Object} schema - Template schema (optional, will be inferred if not provided)
     * @returns {Object} Zone elements
     */
    render(container, content, schema = null) {
        if (!container) {
            throw new Error('Container element is required');
        }

        if (!content || !content.zones) {
            throw new Error('Content with zones is required');
        }

        // Detect schema version (v2.0.0 or v1.0.0)
        const schemaVersion = content.metadata?.schemaVersion || '1.0.0';

        // Bind zones if schema provided
        let zoneElements = {};
        if (schema) {
            zoneElements = this.bindZones(container, schema);
        } else {
            // Manual zone discovery if no schema
            zoneElements = this._discoverZones(container);
        }

        // Render each zone
        Object.keys(content.zones).forEach(zoneId => {
            const zoneContent = content.zones[zoneId];

            // Handle schema v2.0.0 zone name mapping
            let actualZoneId = zoneId;
            if (schemaVersion === '2.0.0') {
                // Map v2.0.0 zone names to HTML data-zone attributes
                // hero -> hero, subtitle -> subtitle, meta -> meta, etc.
                actualZoneId = zoneId;
            }

            const zoneEl = zoneElements[actualZoneId];

            if (!zoneEl) {
                console.warn(`Zone element "${actualZoneId}" not found`);
                return;
            }

            // Conditional rendering for v2.0.0
            if (schemaVersion === '2.0.0') {
                // Hide zone if content is null (e.g., subtitle)
                if (zoneContent === null || zoneContent === undefined) {
                    zoneEl.style.display = 'none';
                    return;
                } else {
                    zoneEl.style.display = '';  // Ensure visible
                }
            }

            this._renderZone(zoneEl, zoneContent, schemaVersion);
        });

        // Apply design rules if provided
        if (content.design) {
            this._applyDesign(this._getTemplateRoot(container), content.design);
        }

        return zoneElements;
    }

    /**
     * Render content to a specific zone
     * 
     * Updated for schema v2.0.0 with new content types.
     * 
     * @param {HTMLElement} zoneEl - Zone element
     * @param {Object} zoneContent - Zone content (type, content, items, etc.)
     * @param {string} schemaVersion - Schema version (default '1.0.0')
     * @private
     */
    _renderZone(zoneEl, zoneContent, schemaVersion = '1.0.0') {
        if (!zoneContent) {
            // Don't clear content, just return (content already in HTML)
            return;
        }

        // Render based on content type
        switch (zoneContent.type) {
            case 'heading':
                this._renderHeading(zoneEl, zoneContent);
                break;

            case 'paragraph':
                this._renderParagraph(zoneEl, zoneContent);
                break;

            case 'list':
                this._renderList(zoneEl, zoneContent);
                break;

            case 'structured':  // v2.0.0: New type for info-card
                this._renderStructured(zoneEl, zoneContent);
                break;

            case 'button':  // v2.0.0: New type for CTA
                this._renderButton(zoneEl, zoneContent);
                break;

            default:
                // Fallback: render content as text
                const textContent = zoneContent.content || zoneContent.text || '';
                const targetEl = zoneEl.querySelector('[data-content]') || zoneEl;
                targetEl.textContent = textContent;
        }
    }

    /**
     * Render heading content
     * 
     * @param {HTMLElement} zoneEl - Zone element
     * @param {Object} content - Heading content
     * @private
     */
    _renderHeading(zoneEl, content) {
        const level = Math.min(Math.max(content.level || 1, 1), 6);
        const heading = document.createElement(`h${level}`);
        heading.textContent = content.content || content.text || '';
        heading.className = 'poster-title';
        if (content.fontSize) {
            heading.style.fontSize = `${content.fontSize}px`;
        }
        if (content.maxLines) {
            heading.style.display = '-webkit-box';
            heading.style.webkitLineClamp = String(content.maxLines);
            heading.style.webkitBoxOrient = 'vertical';
            heading.style.overflow = 'hidden';
        }
        zoneEl.appendChild(heading);
    }

    /**
     * Render paragraph content
     * 
     * @param {HTMLElement} zoneEl - Zone element
     * @param {Object} content - Paragraph content
     * @private
     */
    _renderParagraph(zoneEl, content) {
        const p = document.createElement('p');
        p.textContent = content.content || content.text || '';
        p.className = 'poster-body';
        if (content.fontSize) {
            p.style.fontSize = `${content.fontSize}px`;
        }
        if (content.maxLines) {
            p.style.display = '-webkit-box';
            p.style.webkitLineClamp = String(content.maxLines);
            p.style.webkitBoxOrient = 'vertical';
            p.style.overflow = 'hidden';
        }
        zoneEl.appendChild(p);
    }

    /**
     * Render list content
     * 
     * @param {HTMLElement} zoneEl - Zone element
     * @param {Object} content - List content
     * @private
     */
    _renderList(zoneEl, content) {
        if (!content.items || !Array.isArray(content.items)) {
            return;
        }

        content.items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'poster-meta-item';

            // Icon (if provided)
            if (item.icon) {
                const iconEl = document.createElement('span');
                iconEl.className = 'meta-icon';
                iconEl.textContent = item.icon;
                itemEl.appendChild(iconEl);
            }

            // Label (if provided)
            if (item.label) {
                const labelEl = document.createElement('span');
                labelEl.className = 'meta-label';
                labelEl.textContent = item.label + ': ';
                itemEl.appendChild(labelEl);
            }

            // Value
            const valueEl = document.createElement('span');
            valueEl.className = 'meta-value';
            valueEl.textContent = item.value || '';
            itemEl.appendChild(valueEl);

            zoneEl.appendChild(itemEl);
        });
    }

    /**
     * Render structured content (v2.0.0 info-card)
     * 
     * Renders structured data object to individual data-content elements.
     * Hides elements where data is null.
     * 
     * @param {HTMLElement} zoneEl - Zone element
     * @param {Object} content - Structured content { type: 'structured', data: { date, time, location } }
     * @private
     */
    _renderStructured(zoneEl, content) {
        if (!content.data || typeof content.data !== 'object') {
            // Hide entire zone if no data
            zoneEl.style.display = 'none';
            return;
        }

        const data = content.data;
        let hasAnyData = false;

        // Iterate through data fields (date, time, location)
        Object.keys(data).forEach(key => {
            const value = data[key];

            // Find the element with data-content="key"
            const contentEl = zoneEl.querySelector(`[data-content="${key}"]`);

            if (!contentEl) {
                console.warn(`Element with data-content="${key}" not found in zone`);
                return;
            }

            // Find the parent .info-item element
            const itemEl = contentEl.closest('.info-item');

            if (value === null || value === undefined || value === '') {
                // Hide this specific info-item
                if (itemEl) {
                    itemEl.style.display = 'none';
                }
            } else {
                // Show and populate this info-item
                hasAnyData = true;
                if (itemEl) {
                    itemEl.style.display = '';  // Ensure visible
                }
                contentEl.textContent = value;
            }
        });

        // Hide entire zone if all fields are null
        if (!hasAnyData) {
            zoneEl.style.display = 'none';
        } else {
            zoneEl.style.display = '';  // Ensure visible
        }
    }

    /**
     * Render button content (v2.0.0 CTA)
     * 
     * Renders button text to CTA button element.
     * Uses default text if content is null.
     * 
     * @param {HTMLElement} zoneEl - Zone element
     * @param {Object} content - Button content { type: 'button', content: '...', defaultText: '...' }
     * @private
     */
    _renderButton(zoneEl, content) {
        // Find the button element
        const buttonEl = zoneEl.querySelector('.cta-button, button[data-content]');

        if (!buttonEl) {
            console.warn('Button element not found in CTA zone');
            return;
        }

        // Use provided content or fall back to default
        const text = content.content || content.defaultText || 'Register Now';
        buttonEl.textContent = text;
    }

    /**
     * Apply design rules to container
     * 
     * @param {HTMLElement} container - Container element
     * @param {Object} design - Design rules (colors, typography, spacing, theme)
     * @private
     */
    _applyDesign(container, design) {
        if (!design) return;

        // Apply theme CSS class (v2.0.0)
        if (design.theme) {
            // Remove any existing theme classes
            const themeClasses = ['theme-ocean', 'theme-sunset', 'theme-neon'];
            themeClasses.forEach(cls => container.classList.remove(cls));

            // Apply new theme class (only if not default)
            if (design.theme !== 'default') {
                const themeClass = `theme-${design.theme}`;
                container.classList.add(themeClass);
            }
        }

        // Apply colors
        if (design.colors) {
            if (design.colors.text) {
                container.style.color = design.colors.text;
            }
            if (design.colors.background) {
                container.style.backgroundColor = design.colors.background;
            }
        }

        // Apply typography (could be applied to specific zones)
        if (design.typography) {
            // Typography is typically handled by CSS classes
            // This is just a placeholder for future enhancements
        }

        // Apply spacing
        if (design.spacing) {
            if (design.spacing.zonePadding) {
                container.style.padding = `${design.spacing.zonePadding}px`;
            }
        }
    }

    /**
     * Discover zones in container (without schema)
     * 
     * @param {HTMLElement} container - Container element
     * @returns {Object} Zone elements mapped by zone ID
     * @private
     */
    _discoverZones(container) {
        const zoneElements = {};
        const templateRoot = this._getTemplateRoot(container);
        const zoneEls = templateRoot.querySelectorAll('[data-zone]');

        zoneEls.forEach(zoneEl => {
            const zoneId = zoneEl.dataset.zone;
            if (zoneId) {
                zoneElements[zoneId] = zoneEl;
            }
        });

        return zoneElements;
    }


    /* ============================================
       VALIDATION
       ============================================ */

    /**
     * Validate schema structure
     * 
     * @param {Object} schema - Template schema
     * @private
     */
    _validateSchema(schema) {
        if (!schema.id && !schema.templateId) {
            throw new Error('Schema must have an "id" or "templateId" field');
        }

        if (!schema.name && !schema.templateName) {
            throw new Error('Schema must have a "name" or "templateName" field');
        }

        if (!schema.zones || typeof schema.zones !== 'object') {
            throw new Error('Schema must have a "zones" object');
        }

        // Validate each zone
        Object.keys(schema.zones).forEach(zoneId => {
            const zone = schema.zones[zoneId];

            if (!zone.grid && !zone.gridArea && !zone.alignment && !zone.textAlign) {
                console.warn(`Zone "${zoneId}" has no grid or alignment configuration`);
            }
        });
    }


    /* ============================================
       CACHE MANAGEMENT
       ============================================ */

    /**
     * Clear template cache
     * 
     * @param {string} templateId - Template ID (optional, clears all if not provided)
     */
    clearCache(templateId = null) {
        if (templateId) {
            delete this._templateCache.schemas[templateId];
            delete this._templateCache.html[templateId];
        } else {
            this._templateCache = {
                schemas: {},
                html: {}
            };
        }
    }

    /**
     * Get cache status
     * 
     * @returns {Object} Cache status
     */
    getCacheStatus() {
        return {
            schemas: Object.keys(this._templateCache.schemas),
            html: Object.keys(this._templateCache.html)
        };
    }


    /* ============================================
       TEMPLATE ASSET INJECTION
       ============================================ */

    /**
     * Ensure template-specific stylesheets are present in the document head.
     * Adds both inline <style> blocks and external <link rel="stylesheet"> tags
     * while avoiding duplicates by tagging injected nodes with data attributes.
     *
     * @param {string} templateId - Template identifier
     * @param {Document} doc - Parsed template document
     * @private
     */
    _injectTemplateStyles(templateId, doc) {
        if (typeof document === 'undefined' || !doc) {
            return;
        }

        const head = document.head || document.getElementsByTagName('head')[0];
        if (!head) {
            return;
        }

        // Inline <style> blocks
        const styleBlocks = doc.querySelectorAll('style');
        styleBlocks.forEach((styleEl, index) => {
            const signature = `template-${templateId}-style-${index}`;
            if (head.querySelector(`style[data-template-style="${signature}"]`)) {
                return; // Already injected
            }

            const clone = document.createElement('style');
            clone.setAttribute('data-template-style', signature);
            clone.textContent = styleEl.textContent;
            head.appendChild(clone);
        });

        // External stylesheets (e.g., Google Fonts)
        const linkNodes = doc.querySelectorAll('link[rel~="stylesheet"]');
        linkNodes.forEach((linkEl, index) => {
            const href = linkEl.getAttribute('href');
            if (!href) return;

            const signature = `template-${templateId}-link-${index}`;
            if (head.querySelector(`link[rel~="stylesheet"][data-template-style="${signature}"][href="${href}"]`)) {
                return; // Already injected
            }

            const clone = document.createElement('link');
            clone.rel = 'stylesheet';
            clone.href = href;
            clone.setAttribute('data-template-style', signature);

            // Preserve crossorigin hint if provided for fonts
            if (linkEl.crossOrigin) {
                clone.crossOrigin = linkEl.crossOrigin;
            }

            head.appendChild(clone);
        });
    }


    /* ============================================
       UTILITIES
       ============================================ */

    /**
     * Set base path for template files
     * 
     * @param {string} type - Path type ('schemas' or 'html')
     * @param {string} path - Base path
     */
    setBasePath(type, path) {
        if (this._basePath.hasOwnProperty(type)) {
            this._basePath[type] = path;
        } else {
            console.error(`Invalid path type: ${type}`);
        }
    }

    /**
     * Extract only template fragment from a fetched HTML document/string.
     *
     * @param {string} html - Raw HTML string
     * @returns {string} Template fragment HTML
     * @private
     */
    _extractTemplateFragment(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        // Fast path: already a fragment.
        if (!/<html[\s>]/i.test(html)) {
            return html;
        }

        if (typeof DOMParser === 'undefined') {
            return html;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const root = doc.querySelector('[data-template]') || doc.querySelector('.poster-container');

        return root ? root.outerHTML : html;
    }

    /**
     * Get the template root element inside the provided container.
     *
     * @param {HTMLElement} container - Render container
     * @returns {HTMLElement} Template root
     * @private
     */
    _getTemplateRoot(container) {
        return container.querySelector('[data-template]') ||
            container.querySelector('.poster-container') ||
            container;
    }

    /**
     * Apply grid config to template root element.
     *
     * @param {HTMLElement} templateRoot - Template root element
     * @param {Object} grid - Grid config
     * @private
     */
    _applyGridConfig(templateRoot, grid) {
        if (!templateRoot || !grid) {
            return;
        }

        templateRoot.style.display = 'grid';
        if (grid.columns) {
            templateRoot.style.gridTemplateColumns = `repeat(${grid.columns}, 1fr)`;
        }
        if (grid.rows) {
            templateRoot.style.gridTemplateRows = `repeat(${grid.rows}, 1fr)`;
        }
        if (grid.columnGap) {
            templateRoot.style.columnGap = grid.columnGap;
        }
        if (grid.rowGap) {
            templateRoot.style.rowGap = grid.rowGap;
        }
        if (grid.width) {
            templateRoot.style.width = grid.width;
        }
        if (grid.height) {
            templateRoot.style.height = grid.height;
        }
        if (grid.padding) {
            templateRoot.style.padding = grid.padding;
        }
    }

    /**
     * Get supported zone types
     * 
     * @returns {string[]} Supported zone types
     */
    getSupportedZoneTypes() {
        return ['heading', 'paragraph', 'list'];
    }
}


// Create singleton instance
const templateEngine = new TemplateEngine();


// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = templateEngine;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.templateEngine = templateEngine;
}
