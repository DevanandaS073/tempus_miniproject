/**
 * Content Mapper
 * 
 * Transforms raw event data into render-safe content optimized for poster templates.
 * Maps event fields to template zones and applies design rules for optimal layout.
 * 
 * Separation of concerns:
 * - Accepts raw event data (title, date, time, location, description)
 * - Maps data to template zones (title, meta, body, footer)
 * - Applies design rules (font scaling, contrast, truncation)
 * - Returns render-safe content (ready for template rendering)
 * 
 * No DOM manipulation - pure data transformation only.
 * 
 * @module ContentMapper
 * @version 1.0.0
 */

// Import design rules engine (if using modules)
// import PosterRulesEngine from './poster_rules.js';

/**
 * Content Mapper Class
 * Transforms event data into optimized poster content
 */
class ContentMapper {
    constructor(rulesEngine = null) {
        // Initialize design rules engine
        this.rulesEngine = rulesEngine || (typeof PosterRulesEngine !== 'undefined' ? new PosterRulesEngine() : null);

        // Default template zone mapping
        this.zoneMapping = {
            title: 'title',
            meta: ['date', 'time', 'location'],
            body: 'description',
            footer: ['website', 'contact', 'hashtag']
        };
    }


    /* ============================================
       EVENT DATA ACCEPTANCE
       ============================================ */

    /**
     * Validate event data structure
     * 
     * @param {Object} eventData - Raw event data
     * @returns {Object} Validation result
     */
    validateEventData(eventData) {
        const errors = [];
        const warnings = [];

        if (!eventData || typeof eventData !== 'object') {
            return {
                isValid: false,
                errors: ['Event data must be an object'],
                warnings
            };
        }

        // Required fields
        if (!eventData.title || eventData.title.trim() === '') {
            errors.push('Title is required');
        }

        // Optional but recommended fields
        if (!eventData.date) {
            warnings.push('Date is missing');
        }
        if (!eventData.time) {
            warnings.push('Time is missing');
        }
        if (!eventData.location) {
            warnings.push('Location is missing');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Normalize event data (sanitize, format, defaults)
     * 
     * @param {Object} eventData - Raw event data
     * @returns {Object} Normalized event data
     */
    normalizeEventData(eventData) {
        return {
            title: (eventData.title || '').trim(),
            subtitle: (eventData.subtitle || '').trim(),
            date: (eventData.date || '').trim(),
            time: (eventData.time || '').trim(),
            location: (eventData.location || '').trim(),
            description: (eventData.description || '').trim(),
            website: (eventData.website || '').trim(),
            contact: (eventData.contact || '').trim(),
            hashtag: (eventData.hashtag || '').trim(),
            cta_text: (eventData.cta_text || eventData.ctaText || 'Register Now').trim(),
            theme: (eventData.theme || 'default').trim().toLowerCase(),
            // New asset fields
            backgroundImage: eventData.backgroundImage || null,
            logoUrl: eventData.logoUrl || null,
            orgName: (eventData.orgName || '').trim()
        };
    }


    /* ============================================
       DATA → TEMPLATE ZONE MAPPING
       ============================================ */

    /**
     * Map event data to template zones
     * Updated for schema v2.0.0 with new zone structure
     * 
     * @param {Object} eventData - Normalized event data
     * @returns {Object} Zone-mapped content
     */
    mapToZones(eventData) {
        return {
            hero: eventData.title,
            subtitle: eventData.subtitle || null,
            meta: {
                date: eventData.date || null,
                time: eventData.time || null,
                location: eventData.location || null
            },
            body: eventData.description,
            cta: eventData.cta_text,
            footer: {
                website: eventData.website,
                contact: eventData.contact,
                hashtag: eventData.hashtag
            },
            theme: eventData.theme,
            // Asset fields
            backgroundImage: eventData.backgroundImage || null,
            logoUrl: eventData.logoUrl || null,
            orgName: eventData.orgName || ''
        };
    }

    /**
     * Extract meta items as array (for rendering)
     * 
     * @param {Object} metaObject - Meta data object
     * @returns {Array} Array of meta items
     */
    extractMetaItems(metaObject) {
        const items = [];

        if (metaObject.date) {
            items.push({
                type: 'date',
                value: metaObject.date,
                icon: '📅'
            });
        }

        if (metaObject.time) {
            items.push({
                type: 'time',
                value: metaObject.time,
                icon: '🕐'
            });
        }

        if (metaObject.location) {
            items.push({
                type: 'location',
                value: metaObject.location,
                icon: '📍'
            });
        }

        return items;
    }

    /**
     * Extract footer items as array (for rendering)
     * 
     * @param {Object} footerObject - Footer data object
     * @returns {Array} Array of footer items
     */
    extractFooterItems(footerObject) {
        const items = [];

        if (footerObject.website) {
            items.push({
                type: 'website',
                value: footerObject.website,
                icon: '🌐'
            });
        }

        if (footerObject.contact) {
            items.push({
                type: 'contact',
                value: footerObject.contact,
                icon: '✉️'
            });
        }

        if (footerObject.hashtag) {
            items.push({
                type: 'hashtag',
                value: footerObject.hashtag,
                icon: '#️⃣'
            });
        }

        return items;
    }


    /* ============================================
       DESIGN RULES APPLICATION
       ============================================ */

    /**
     * Apply design rules to mapped content
     * Uses PosterRulesEngine for optimization
     * 
     * @param {Object} mappedContent - Zone-mapped content
     * @param {Object} options - Rendering options (colors, dimensions)
     * @returns {Object} Optimized content with applied rules
     */
    applyDesignRules(mappedContent, options = {}) {
        if (!this.rulesEngine) {
            console.warn('Design rules engine not available, returning content without optimization');


            return {
                title: {
                    text: mappedContent.hero || mappedContent.title || '',  // Try both properties
                    fontSize: 40,
                    maxLines: 3
                },
                body: {
                    text: mappedContent.body || '',
                    fontSize: 16,
                    wasClamped: false,
                    maxLines: 12
                },
                colors: {
                    text: null,       // Let CSS handle text color
                    background: null, // Let CSS handle background
                    contrastRatio: null,
                    meetsAccessibility: true
                },
                spacing: {
                    zonePadding: 32,
                    sectionGap: 24,
                    elementGap: 16,
                    textGap: 8
                },
                scaleFactor: 1
            };
        }

        const {
            colors = { background: '#0f172a', primary: '#4F46E5' },
            dimensions = { width: 800, height: 1200 }
        } = options;

        // Prepare content for rules engine


        const content = {
            title: mappedContent.hero,  // Fixed: mapToZones maps title to 'hero'
            body: mappedContent.body,
            meta: this.extractMetaItems(mappedContent.meta)
        };



        // Apply all design rules
        const optimized = this.rulesEngine.applyAllRules(content, colors, dimensions);

        return optimized;
    }


    /* ============================================
       RENDER-SAFE CONTENT GENERATION
       ============================================ */

    /**
     * Generate render-safe content object
     * Combines mapped data with applied rules
     * Updated for schema v2.0.0
     * 
     * @param {Object} mappedContent - Zone-mapped content
     * @param {Object} optimized - Rules-optimized parameters
     * @returns {Object} Render-safe content
     */
    generateRenderSafeContent(mappedContent, optimized) {
        return {
            zones: {
                // v2.0.0: title → hero
                hero: {
                    type: 'heading',
                    level: 1,
                    content: optimized.title.text,
                    fontSize: optimized.title.fontSize,
                    maxLines: optimized.title.maxLines
                },
                // v2.0.0: New subtitle zone (conditional)
                subtitle: mappedContent.subtitle ? {
                    type: 'paragraph',
                    content: mappedContent.subtitle,
                    maxChars: 120
                } : null,
                // v2.0.0: meta → info-card (structured object)
                meta: {
                    type: 'structured',
                    data: mappedContent.meta,  // Keep as object: { date, time, location }
                    maxItems: 3
                },
                // v2.0.0: body (renamed zone class but similar content)
                body: {
                    type: 'paragraph',
                    content: optimized.body.text,
                    fontSize: optimized.body.fontSize,
                    maxLines: optimized.body.maxLines,
                    wasClamped: optimized.body.wasClamped
                },
                // v2.0.0: New CTA zone
                cta: {
                    type: 'button',
                    content: mappedContent.cta,
                    defaultText: 'Register Now'
                },
                footer: {
                    type: 'list',
                    items: this.extractFooterItems(mappedContent.footer),
                    maxItems: 3
                },
                // Asset zones
                backgroundImage: mappedContent.backgroundImage || null,
                logoUrl: mappedContent.logoUrl || null,
                orgName: mappedContent.orgName || ''
            },

            design: {
                colors: optimized.colors,
                typography: {
                    heroSize: optimized.title.fontSize,  // Renamed from titleSize
                    bodySize: optimized.body.fontSize
                },
                spacing: optimized.spacing,
                scaleFactor: optimized.scaleFactor,
                theme: mappedContent.theme || 'default'  // New: Theme selection
            },

            // Metadata
            metadata: {
                generatedAt: new Date().toISOString(),
                rulesApplied: !!this.rulesEngine,
                accessible: optimized.colors.meetsAccessibility,
                schemaVersion: '2.0.0'  // Track schema version
            }
        };
    }


    /* ============================================
       MAIN MAPPING PIPELINE
       ============================================ */

    /**
     * Complete content mapping pipeline
     * Accept event data → Map to zones → Apply rules → Return render-safe content
     * 
     * @param {Object} eventData - Raw event data
     * @param {Object} options - Rendering options (colors, dimensions, template)
     * @returns {Object} Render-safe content object
     */
    mapContent(eventData, options = {}) {
        // Step 1: Validate event data
        const validation = this.validateEventData(eventData);
        if (!validation.isValid) {
            throw new Error(`Invalid event data: ${validation.errors.join(', ')}`);
        }

        // Step 2: Normalize event data
        const normalized = this.normalizeEventData(eventData);

        // Step 3: Map to template zones
        const mapped = this.mapToZones(normalized);

        // Step 4: Apply design rules
        const optimized = this.applyDesignRules(mapped, options);

        // Step 5: Generate render-safe content
        const renderSafe = this.generateRenderSafeContent(mapped, optimized);

        return renderSafe;
    }

    /**
     * Map content with error handling
     * Provides graceful fallback on errors
     * 
     * @param {Object} eventData - Raw event data
     * @param {Object} options - Rendering options
     * @returns {Object} Result object with content or error
     */
    mapContentSafe(eventData, options = {}) {
        try {
            const content = this.mapContent(eventData, options);
            return {
                success: true,
                content,
                errors: null
            };
        } catch (error) {
            console.error('Content mapping failed:', error);
            return {
                success: false,
                content: null,
                errors: [error.message]
            };
        }
    }


    /* ============================================
       UTILITY METHODS
       ============================================ */

    /**
     * Get content statistics
     * 
     * @param {Object} renderSafeContent - Render-safe content
     * @returns {Object} Content statistics
     */
    getContentStats(renderSafeContent) {
        return {
            titleLength: (renderSafeContent.zones.title.content || '').length,
            bodyLength: (renderSafeContent.zones.body.content || '').length,
            metaItemCount: renderSafeContent.zones.meta.items.length,
            footerItemCount: renderSafeContent.zones.footer.items.length,
            wasClamped: renderSafeContent.zones.body.wasClamped,
            accessible: renderSafeContent.metadata.accessible,
            scaleFactor: renderSafeContent.design.scaleFactor
        };
    }

    /**
     * Export content as JSON
     * 
     * @param {Object} renderSafeContent - Render-safe content
     * @returns {string} JSON string
     */
    exportAsJSON(renderSafeContent) {
        return JSON.stringify(renderSafeContent, null, 2);
    }
}


// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentMapper;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.ContentMapper = ContentMapper;
}
