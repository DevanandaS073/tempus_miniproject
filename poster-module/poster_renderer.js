/**
 * Poster Renderer
 * 
 * Production-quality rendering system for poster export.
 * Converts DOM poster to high-resolution canvas and exports as PNG.
 * 
 * Features:
 * - html2canvas integration for DOM → canvas conversion
 * - Resolution scaling (1x, 2x, 3x for retina displays)
 * - PNG export with configurable quality
 * - Preview/export parity (identical output)
 * 
 * Dependencies:
 * - html2canvas (must be loaded before this script)
 * 
 * @module PosterRenderer
 * @version 1.0.0
 */

/**
 * Poster Renderer Class
 * Controls rendering and export of posters to canvas/PNG
 */
class PosterRenderer {
    constructor(options = {}) {
        this.options = {
            // Default resolution scale (1x = standard, 2x = retina, 3x = super retina)
            scale: options.scale || 2,

            // Export format
            format: options.format || 'png',

            // PNG quality (0-1)
            quality: options.quality || 1.0,

            // Background (null = transparent)
            backgroundColor: options.backgroundColor || '#FFFFFF',

            // Logging
            logging: options.logging !== false,

            // html2canvas options
            html2canvasOptions: options.html2canvasOptions || {}
        };

        // Validate html2canvas availability
        if (typeof html2canvas === 'undefined') {
            console.error('html2canvas library not loaded. Please include html2canvas before poster_renderer.js');
        }
    }

    /**
     * Wait for document fonts to finish loading (when supported).
     * html2canvas can capture before web fonts render, resulting in
     * missing or fallback typography in the downloaded image.
     */
    async _waitForFonts() {
        if (typeof document === 'undefined' || !document.fonts || !document.fonts.ready) {
            return;
        }

        try {
            await document.fonts.ready;
        } catch (err) {
            console.warn('Fonts readiness check failed, continuing anyway:', err);
        }
    }


    /* ============================================
       RENDERING (DOM → CANVAS)
       ============================================ */

    /**
     * Render poster DOM element to canvas
     * 
     * @param {HTMLElement} posterElement - Poster DOM element to render
     * @param {Object} options - Rendering options (override defaults)
     * @returns {Promise<HTMLCanvasElement>} Canvas element with rendered poster
     */
    async renderToCanvas(posterElement, options = {}) {
        if (!posterElement) {
            throw new Error('Poster element is required for rendering');
        }

        if (typeof html2canvas === 'undefined') {
            throw new Error('html2canvas library not loaded');
        }

        // Create a clone to render at full resolution
        const clone = posterElement.cloneNode(true);

        // Reset styles on clone to ensure full 800x1200 resolution
        // We position it absolute/off-screen so it doesn't affect the layout
        clone.style.position = 'fixed';
        clone.style.left = '-9999px';
        clone.style.top = '0';
        clone.style.transform = 'none';
        clone.style.width = '800px';
        clone.style.height = '1200px';
        clone.style.maxWidth = 'none';
        clone.style.maxHeight = 'none';
        clone.style.margin = '0';
        clone.style.borderRadius = '0'; // Optional: remove border radius if present on preview

        // Ensure the class name is just 'poster-container' (plus theme) to avoid preview-specific styles
        // This might be risky if theme logic relies on other classes, but usually safe for this structure
        // clone.className = posterElement.className.replace('poster-preview', '');

        document.body.appendChild(clone);

        // Merge options
        const renderOptions = {
            ...this.options.html2canvasOptions,
            scale: options.scale || this.options.scale,
            backgroundColor: options.backgroundColor || this.options.backgroundColor,
            logging: options.logging !== undefined ? options.logging : this.options.logging,
            useCORS: true, // Enable CORS for external images
            allowTaint: false, // Prevent tainting for cross-origin images
            windowWidth: 800,
            windowHeight: 1200,
            width: 800,
            height: 1200
        };

        if (this.options.logging) {
            console.log('Rendering poster to canvas with options:', renderOptions);
        }

        try {
            // Ensure fonts are ready before capture to avoid flashes/missing glyphs
            await this._waitForFonts();

            // Render the clone using html2canvas
            const canvas = await html2canvas(clone, renderOptions);

            if (this.options.logging) {
                console.log('Poster rendered successfully:', {
                    width: canvas.width,
                    height: canvas.height,
                    scale: renderOptions.scale
                });
            }

            return canvas;
        } catch (error) {
            console.error('Failed to render poster to canvas:', error);
            throw error;
        } finally {
            // Clean up clone
            document.body.removeChild(clone);
        }
    }

    /**
     * Render with specific resolution scale
     * 
     * @param {HTMLElement} posterElement - Poster DOM element
     * @param {number} scale - Resolution scale (1x, 2x, 3x)
     * @returns {Promise<HTMLCanvasElement>} Canvas element
     */
    async renderAtScale(posterElement, scale) {
        return this.renderToCanvas(posterElement, { scale });
    }

    /**
     * Render standard resolution (1x)
     * 
     * @param {HTMLElement} posterElement - Poster DOM element
     * @returns {Promise<HTMLCanvasElement>} Canvas element
     */
    async renderStandard(posterElement) {
        return this.renderAtScale(posterElement, 1);
    }

    /**
     * Render retina resolution (2x)
     * 
     * @param {HTMLElement} posterElement - Poster DOM element
     * @returns {Promise<HTMLCanvasElement>} Canvas element
     */
    async renderRetina(posterElement) {
        return this.renderAtScale(posterElement, 2);
    }

    /**
     * Render super retina resolution (3x)
     * 
     * @param {HTMLElement} posterElement - Poster DOM element
     * @returns {Promise<HTMLCanvasElement>} Canvas element
     */
    async renderSuperRetina(posterElement) {
        return this.renderAtScale(posterElement, 3);
    }


    /* ============================================
       EXPORT (CANVAS → PNG)
       ============================================ */

    /**
     * Export canvas to PNG data URL
     * 
     * @param {HTMLCanvasElement} canvas - Canvas to export
     * @param {number} quality - PNG quality (0-1)
     * @returns {string} PNG data URL
     */
    canvasToPNG(canvas, quality = 1.0) {
        return canvas.toDataURL('image/png', quality);
    }

    /**
     * Export canvas to Blob
     * 
     * @param {HTMLCanvasElement} canvas - Canvas to export
     * @param {number} quality - PNG quality (0-1)
     * @returns {Promise<Blob>} PNG blob
     */
    async canvasToBlob(canvas, quality = 1.0) {
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob from canvas'));
                    }
                },
                'image/png',
                quality
            );
        });
    }

    /**
     * Download canvas as PNG file
     * 
     * @param {HTMLCanvasElement} canvas - Canvas to download
     * @param {string} filename - Download filename (without extension)
     * @param {number} quality - PNG quality (0-1)
     */
    async downloadCanvasAsPNG(canvas, filename = 'poster', quality = 1.0) {
        const createBlob = () => new Promise((resolve, reject) => {
            if (!canvas.toBlob) {
                // Fallback for older browsers (e.g., some Safari versions)
                try {
                    const dataUrl = canvas.toDataURL('image/png', quality);
                    const binary = atob(dataUrl.split(',')[1]);
                    const array = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) {
                        array[i] = binary.charCodeAt(i);
                    }
                    resolve(new Blob([array], { type: 'image/png' }));
                } catch (err) {
                    reject(err);
                }
                return;
            }

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Canvas to Blob conversion failed'));
                }
            }, 'image/png', quality);
        });

        try {
            const blob = await createBlob();

            if (this.options.logging) {
                console.log(`Blob created: size=${blob.size} bytes`);
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.png`;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            setTimeout(() => URL.revokeObjectURL(url), 100);

            if (this.options.logging) {
                console.log(`Downloaded poster as ${filename}.png`);
            }
        } catch (error) {
            console.error('Failed to download canvas as PNG:', error);
            throw error;
        }
    }


    /* ============================================
       COMBINED RENDER + EXPORT
       ============================================ */

    /**
     * Render poster and export as PNG (complete workflow)
     * 
     * @param {HTMLElement} posterElement - Poster DOM element
     * @param {Object} options - Export options
     * @returns {Promise<string>} PNG data URL
     */
    async renderAndExport(posterElement, options = {}) {
        const {
            filename = 'poster',
            scale = this.options.scale,
            quality = this.options.quality,
            download = true
        } = options;

        if (this.options.logging) {
            console.log('Starting render and export workflow...');
        }

        // Step 1: Render to canvas
        const canvas = await this.renderToCanvas(posterElement, { scale });

        // Step 2: Convert to PNG
        const dataURL = this.canvasToPNG(canvas, quality);

        // Step 3: Download if requested
        if (download) {
            await this.downloadCanvasAsPNG(canvas, filename, quality);
        }

        return dataURL;
    }

    /**
     * Export poster at multiple resolutions
     * 
     * @param {HTMLElement} posterElement - Poster DOM element
     * @param {Object} options - Export options
     * @returns {Promise<Object>} Object with data URLs for each resolution
     */
    async exportMultipleResolutions(posterElement, options = {}) {
        const {
            filename = 'poster',
            quality = this.options.quality,
            resolutions = [1, 2, 3] // 1x, 2x, 3x
        } = options;

        const exports = {};

        for (const scale of resolutions) {
            if (this.options.logging) {
                console.log(`Exporting at ${scale}x resolution...`);
            }

            const canvas = await this.renderAtScale(posterElement, scale);
            const dataURL = this.canvasToPNG(canvas, quality);

            exports[`${scale}x`] = {
                dataURL,
                width: canvas.width,
                height: canvas.height,
                scale
            };

            // Optional: Download each resolution
            if (options.downloadAll) {
                await this.downloadCanvasAsPNG(canvas, `${filename}_${scale}x`, quality);
            }
        }

        return exports;
    }


    /* ============================================
       PREVIEW GENERATION
       ============================================ */

    /**
     * Generate preview canvas (matches export exactly)
     * 
     * @param {HTMLElement} posterElement - Poster DOM element
     * @param {HTMLElement} previewContainer - Container for preview canvas
     * @param {Object} options - Preview options
     * @returns {Promise<HTMLCanvasElement>} Preview canvas
     */
    async generatePreview(posterElement, previewContainer, options = {}) {
        const {
            scale = this.options.scale,
            maxWidth = previewContainer.offsetWidth,
            maxHeight = previewContainer.offsetHeight
        } = options;

        // Render to canvas
        const canvas = await this.renderToCanvas(posterElement, { scale });

        // Calculate display dimensions (maintain aspect ratio)
        const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
        const displayWidth = canvas.width * ratio;
        const displayHeight = canvas.height * ratio;

        // Set canvas display size
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        // Clear container and add canvas
        previewContainer.innerHTML = '';
        previewContainer.appendChild(canvas);

        if (this.options.logging) {
            console.log('Preview generated:', {
                canvasSize: `${canvas.width}x${canvas.height}`,
                displaySize: `${displayWidth}x${displayHeight}`
            });
        }

        return canvas;
    }


    /* ============================================
       UTILITY METHODS
       ============================================ */

    /**
     * Get optimal scale for device
     * 
     * @returns {number} Recommended scale (1, 2, or 3)
     */
    getOptimalScale() {
        const devicePixelRatio = window.devicePixelRatio || 1;

        if (devicePixelRatio >= 3) {
            return 3; // Super retina
        } else if (devicePixelRatio >= 2) {
            return 2; // Retina
        } else {
            return 1; // Standard
        }
    }

    /**
     * Calculate export file size estimate
     * 
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {number} scale - Resolution scale
     * @returns {Object} File size estimate
     */
    estimateFileSize(width, height, scale = 1) {
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;
        const pixels = scaledWidth * scaledHeight;

        // Rough estimate: ~4 bytes per pixel for RGBA, with PNG compression (~40% reduction)
        const sizeBytes = pixels * 4 * 0.6;
        const sizeKB = Math.round(sizeBytes / 1024);
        const sizeMB = (sizeKB / 1024).toFixed(2);

        return {
            width: scaledWidth,
            height: scaledHeight,
            pixels,
            sizeKB,
            sizeMB: parseFloat(sizeMB)
        };
    }

    /**
     * Get rendering statistics
     * 
     * @param {HTMLCanvasElement} canvas - Rendered canvas
     * @returns {Object} Rendering statistics
     */
    getStats(canvas) {
        return {
            width: canvas.width,
            height: canvas.height,
            aspectRatio: (canvas.width / canvas.height).toFixed(2),
            pixels: canvas.width * canvas.height,
            megapixels: ((canvas.width * canvas.height) / 1000000).toFixed(2)
        };
    }
}


// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PosterRenderer;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.PosterRenderer = PosterRenderer;
}
