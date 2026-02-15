/**
 * Application Orchestration
 * 
 * Main application entry point that orchestrates all core modules.
 * Handles initialization and coordination between state, templates, and rendering.
 * 
 * @module App
 * @version 1.0.0
 */

// Import core modules
// Note: In browser, these are loaded via script tags and available globally
// In Node.js/bundler environment, use proper imports

// State management
// import stateManager from './state.js';

// Template engine
// import templateEngine from './template_engine.js';

// Content processing
// import ContentMapper from '../../content_mapper.js';
// import PosterRulesEngine from '../../poster_rules.js';
// import PosterRenderer from '../../poster_renderer.js';


/**
 * Initialize application
 * 
 * Sets up all core modules and establishes connections between components.
 */
function initializeApp() {
    const supportedTemplates = new Set(['modern']);

    // Initialize state manager
    // State is initialized with:
    // - eventData: {} (empty object with all fields set to '')
    // - selectedTemplate: null
    // - renderStatus: 'idle'

    if (typeof stateManager !== 'undefined') {
        if (typeof ContentMapper === 'undefined') {
            console.error('ContentMapper not available. Ensure content_mapper.js is loaded.');
            return;
        }
        if (typeof templateEngine === 'undefined') {
            console.error('Template engine not available. Ensure template_engine.js is loaded.');
            return;
        }
        if (typeof PosterRenderer === 'undefined') {
            console.error('PosterRenderer not available. Ensure poster_renderer.js is loaded.');
            return;
        }

        // Reset state to initial values (clean slate)
        stateManager.resetAll();

        console.log('✓ State manager initialized');

        // Initialize content mapper
        const contentMapper = new ContentMapper();

        // Subscribe to all state changes
        stateManager.subscribe('all', (change) => {
            console.log('📊 State changed:', {
                key: change.key,
                newValue: change.newValue,
                oldValue: change.oldValue
            });

            // Only render when content/template inputs change.
            if (change.key !== 'eventData' && change.key !== 'selectedTemplate') {
                return;
            }

            // Extract current event data from state
            const eventData = stateManager.getEventData();

            // Skip mapping if event data is empty (initial state)
            if (!eventData.title || eventData.title.trim() === '') {
                console.log('⏭️  Skipping content mapping (no title)');
                return;
            }

            // Map event data to render-safe content
            const result = contentMapper.mapContentSafe(eventData);

            if (result.success) {
                console.log('✅ Content mapped successfully:', result.content);

                // Get selected template from state
                const selectedTemplate = stateManager.getSelectedTemplate();

                if (!selectedTemplate) {
                    console.log('⏭️  No template selected, skipping render');
                    return;
                }

                if (!supportedTemplates.has(selectedTemplate)) {
                    console.warn(`⚠️ Template "${selectedTemplate}" is not migrated yet. Select "modern".`);
                    return;
                }

                // Load and render template
                templateEngine.loadTemplate(selectedTemplate)
                    .then(({ schema, html }) => {
                        console.log('✅ Template loaded:', selectedTemplate);

                        // Get preview container
                        const previewContainer = document.getElementById('poster-preview');

                        if (!previewContainer) {
                            console.error('❌ Preview container not found (id="poster-preview")');
                            return;
                        }

                        // Set template HTML
                        previewContainer.innerHTML = html;

                        // Render content into template zones
                        templateEngine.render(previewContainer, result.content, schema);
                        stateManager.setRenderStatus('preview');

                        console.log('✅ Template rendered successfully');
                    })
                    .catch(error => {
                        console.error('❌ Template loading/rendering failed:', error);
                    });
            } else {
                console.error('❌ Content mapping failed:', result.errors);
            }
        });

        console.log('✓ State subscriptions established');

        // Set up export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                console.log('📤 Export button clicked');

                const previewElement = document.getElementById('poster-preview');

                if (!previewElement) {
                    console.error('❌ Cannot export: poster-preview element not found');
                    return;
                }

                // Check if content is rendered
                if (!previewElement.innerHTML || previewElement.innerHTML.trim() === '') {
                    console.error('❌ Cannot export: no content rendered');
                    return;
                }

                const posterElement = previewElement.querySelector('[data-template]') || previewElement;

                // Create renderer instance and export
                const renderer = new PosterRenderer();

                try {
                    stateManager.setRenderStatus('exporting');
                    await renderer.renderAndExport(posterElement, {
                        scale: 2,  // 2x for retina quality
                        filename: `poster-${Date.now()}`,
                        download: true
                    });
                    console.log('✅ Export successful');
                } catch (error) {
                    console.error('❌ Export failed:', error);
                } finally {
                    stateManager.setRenderStatus('idle');
                }
            });

            console.log('✓ Export button handler attached');
        } else {
            console.warn('⚠️  Export button not found (id="export-btn")');
        }
    } else {
        console.error('State manager not available. Ensure state.js is loaded.');
    }
}


// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeApp };
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.initializeApp = initializeApp;
}
