/**
 * Poster Design Rules Engine
 * 
 * Deterministic rules-based design engine that enforces design constraints
 * and automatically adjusts poster elements for optimal visual output.
 * 
 * All rules are deterministic (no randomness) and pure logic (no UI code).
 * 
 * @module PosterRulesEngine
 * @version 1.0.0
 */

/**
 * Design Rules Engine
 * Enforces design constraints and provides automatic adjustments
 */
class PosterRulesEngine {
    constructor() {
        // Base design constants (from design system)
        this.CONSTANTS = {
            // Font size ranges (in pixels)
            TITLE_FONT_MIN: 32,
            TITLE_FONT_MAX: 48,
            TITLE_FONT_BASE: 40,
            BODY_FONT_MIN: 16,
            BODY_FONT_MAX: 18,
            BODY_FONT_BASE: 16,

            // Character limits
            TITLE_CHAR_OPTIMAL: 40,
            TITLE_CHAR_MAX: 80,
            BODY_CHAR_OPTIMAL: 300,
            BODY_CHAR_MAX: 500,

            // Line limits
            TITLE_LINE_MAX: 3,
            BODY_LINE_MAX: 12,

            // Contrast thresholds (WCAG AA compliance)
            CONTRAST_RATIO_MIN: 4.5,
            CONTRAST_RATIO_PREFERRED: 7.0,

            // Spacing multipliers
            SPACING_TIGHT: 0.75,
            SPACING_NORMAL: 1.0,
            SPACING_RELAXED: 1.25,

            // Color luminance thresholds
            LUMINANCE_DARK_THRESHOLD: 0.5
        };
    }

    /**
     * Clamp a numeric value between min and max.
     *
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum allowed
     * @param {number} max - Maximum allowed
     * @returns {number} Clamped value
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }


    /* ============================================
       TITLE LENGTH HANDLING
       ============================================ */

    /**
     * Calculate optimal title font size based on character count
     * Longer titles get smaller fonts to maintain visual balance
     * 
     * @param {string} title - Title text
     * @param {number} baseSize - Base font size (optional)
     * @returns {number} Calculated font size in pixels
     */
    calculateTitleFontSize(title, baseSize = this.CONSTANTS.TITLE_FONT_BASE) {
        if (!title || typeof title !== 'string') {
            return baseSize;
        }

        const length = title.length;
        const { TITLE_CHAR_OPTIMAL, TITLE_CHAR_MAX, TITLE_FONT_MIN, TITLE_FONT_MAX } = this.CONSTANTS;

        // Optimal length or shorter: use max font size
        if (length <= TITLE_CHAR_OPTIMAL) {
            return TITLE_FONT_MAX;
        }

        // Length exceeds max: use min font size
        if (length >= TITLE_CHAR_MAX) {
            return TITLE_FONT_MIN;
        }

        // Linear interpolation between optimal and max length
        const lengthRatio = (length - TITLE_CHAR_OPTIMAL) / (TITLE_CHAR_MAX - TITLE_CHAR_OPTIMAL);
        const fontSize = TITLE_FONT_MAX - (lengthRatio * (TITLE_FONT_MAX - TITLE_FONT_MIN));

        return Math.round(fontSize);
    }

    /**
     * Truncate title to maximum allowed length
     * 
     * @param {string} title - Title text
     * @param {number} maxLength - Maximum character count
     * @returns {string} Truncated title with ellipsis if needed
     */
    truncateTitle(title, maxLength = this.CONSTANTS.TITLE_CHAR_MAX) {
        if (!title || typeof title !== 'string') {
            return '';
        }

        if (title.length <= maxLength) {
            return title;
        }

        // Truncate and add ellipsis
        return title.substring(0, maxLength - 3) + '...';
    }


    /* ============================================
       DYNAMIC FONT SCALING
       ============================================ */

    /**
     * Calculate font scale factor based on content density
     * More content = smaller scale factor to fit everything
     * 
     * @param {Object} content - Content object with text properties
     * @returns {number} Scale factor (0.8 - 1.2)
     */
    calculateFontScaleFactor(content) {
        const { title = '', body = '' } = content;

        const titleLength = title.length;
        const bodyLength = body.length;

        // Calculate density score (0-1)
        const titleDensity = Math.min(titleLength / this.CONSTANTS.TITLE_CHAR_MAX, 1);
        const bodyDensity = Math.min(bodyLength / this.CONSTANTS.BODY_CHAR_MAX, 1);
        const overallDensity = (titleDensity * 0.6) + (bodyDensity * 0.4); // Title weighted more

        // Scale factor ranges from 1.0 (low density) to 0.8 (high density)
        const scaleFactor = 1.0 - (overallDensity * 0.2);

        return Math.round(scaleFactor * 100) / 100; // Round to 2 decimals
    }

    /**
     * Calculate responsive font size based on container width
     * 
     * @param {number} containerWidth - Width of container in pixels
     * @param {number} baseSize - Base font size
     * @returns {number} Scaled font size
     */
    calculateResponsiveFontSize(containerWidth, baseSize) {
        const breakpoints = {
            mobile: 600,
            tablet: 800,
            desktop: 1200
        };

        if (containerWidth <= breakpoints.mobile) {
            return Math.round(baseSize * 0.8); // 80% on mobile
        } else if (containerWidth <= breakpoints.tablet) {
            return Math.round(baseSize * 0.9); // 90% on tablet
        } else {
            return baseSize; // 100% on desktop
        }
    }


    /* ============================================
       CONTRAST SAFETY
       ============================================ */

    /**
     * Calculate relative luminance of a color (WCAG formula)
     * 
     * @param {string} hexColor - Hex color code (e.g., "#FF5733")
     * @returns {number} Relative luminance (0-1)
     */
    calculateLuminance(hexColor) {
        // Remove # if present
        const hex = hexColor.replace('#', '');

        // Parse RGB values
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;

        // Apply sRGB gamma correction
        const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
        const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
        const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

        // Calculate luminance
        const luminance = 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;

        return luminance;
    }

    /**
     * Calculate contrast ratio between two colors (WCAG formula)
     * 
     * @param {string} color1 - First hex color
     * @param {string} color2 - Second hex color
     * @returns {number} Contrast ratio (1-21)
     */
    calculateContrastRatio(color1, color2) {
        const lum1 = this.calculateLuminance(color1);
        const lum2 = this.calculateLuminance(color2);

        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);

        return (lighter + 0.05) / (darker + 0.05);
    }

    /**
     * Determine if text should be light or dark for optimal contrast
     * 
     * @param {string} backgroundColor - Background hex color
     * @returns {string} Recommended text color ("light" or "dark")
     */
    getOptimalTextColor(backgroundColor) {
        const luminance = this.calculateLuminance(backgroundColor);

        // If background is light (high luminance), use dark text
        // If background is dark (low luminance), use light text
        return luminance > this.CONSTANTS.LUMINANCE_DARK_THRESHOLD ? 'dark' : 'light';
    }

    /**
     * Validate if color combination meets WCAG AA standards
     * 
     * @param {string} textColor - Text hex color
     * @param {string} backgroundColor - Background hex color
     * @returns {Object} Validation result with pass/fail and ratio
     */
    validateContrast(textColor, backgroundColor) {
        const ratio = this.calculateContrastRatio(textColor, backgroundColor);
        const meetsAA = ratio >= this.CONSTANTS.CONTRAST_RATIO_MIN;
        const meetsAAA = ratio >= this.CONSTANTS.CONTRAST_RATIO_PREFERRED;

        return {
            ratio: Math.round(ratio * 100) / 100,
            meetsAA,
            meetsAAA,
            recommendation: meetsAA ? 'acceptable' : 'needs-adjustment'
        };
    }

    /**
     * Auto-adjust text color for sufficient contrast
     * 
     * @param {string} backgroundColor - Background hex color
     * @param {string} preferredDark - Preferred dark color (default: #111827)
     * @param {string} preferredLight - Preferred light color (default: #FFFFFF)
     * @returns {string} Adjusted text color
     */
    autoAdjustTextColor(backgroundColor, preferredDark = '#111827', preferredLight = '#FFFFFF') {
        const optimal = this.getOptimalTextColor(backgroundColor);

        return optimal === 'dark' ? preferredDark : preferredLight;
    }


    /* ============================================
       LINE CLAMPING
       ============================================ */

    /**
     * Calculate number of lines text will occupy
     * 
     * @param {string} text - Text content
     * @param {number} charsPerLine - Average characters per line
     * @returns {number} Estimated line count
     */
    calculateLineCount(text, charsPerLine = 50) {
        if (!text || typeof text !== 'string') {
            return 0;
        }

        // Account for manual line breaks
        const manualBreaks = (text.match(/\n/g) || []).length;

        // Calculate natural wrapping lines
        const naturalLines = Math.ceil(text.length / charsPerLine);

        return manualBreaks + naturalLines;
    }

    /**
     * Truncate text to fit within line limit
     * 
     * @param {string} text - Text content
     * @param {number} maxLines - Maximum allowed lines
     * @param {number} charsPerLine - Average characters per line
     * @returns {string} Truncated text
     */
    clampToLines(text, maxLines, charsPerLine = 50) {
        if (!text || typeof text !== 'string') {
            return '';
        }

        const estimatedLines = this.calculateLineCount(text, charsPerLine);

        if (estimatedLines <= maxLines) {
            return text;
        }

        // Calculate max characters for line limit
        const maxChars = maxLines * charsPerLine;

        // Truncate with ellipsis
        if (text.length > maxChars) {
            return text.substring(0, maxChars - 3) + '...';
        }

        return text;
    }

    /**
     * Apply line clamping rules for body text
     * 
     * @param {string} bodyText - Body content
     * @returns {Object} Clamped text and metadata
     */
    applyBodyLineClamping(bodyText) {
        const maxLines = this.CONSTANTS.BODY_LINE_MAX;
        const clampedText = this.clampToLines(bodyText, maxLines);
        const wasClamped = clampedText !== bodyText;

        return {
            text: clampedText,
            wasClamped,
            originalLength: bodyText.length,
            clampedLength: clampedText.length
        };
    }


    /* ============================================
       VERTICAL SPACING NORMALIZATION
       ============================================ */

    /**
     * Calculate normalized spacing based on content density
     * 
     * @param {number} baseSpacing - Base spacing value (in pixels or rems)
     * @param {number} contentDensity - Content density (0-1)
     * @returns {number} Normalized spacing
     */
    normalizeSpacing(baseSpacing, contentDensity = 0.5) {
        const { SPACING_TIGHT, SPACING_NORMAL, SPACING_RELAXED } = this.CONSTANTS;

        // Low density: use relaxed spacing
        // High density: use tight spacing
        let multiplier;

        if (contentDensity < 0.3) {
            multiplier = SPACING_RELAXED;
        } else if (contentDensity > 0.7) {
            multiplier = SPACING_TIGHT;
        } else {
            multiplier = SPACING_NORMAL;
        }

        return Math.round(baseSpacing * multiplier);
    }

    /**
     * Calculate vertical rhythm spacing
     * Ensures consistent spacing based on baseline grid
     * 
     * @param {number} baselineUnit - Base unit in pixels (typically 4 or 8)
     * @param {number} multiplier - Multiplier for spacing scale
     * @returns {number} Spacing value aligned to baseline grid
     */
    calculateVerticalRhythm(baselineUnit = 8, multiplier = 1) {
        return baselineUnit * multiplier;
    }

    /**
     * Generate spacing scale for entire poster
     * 
     * @param {Object} content - Content object
     * @returns {Object} Spacing values for different zones
     */
    generateSpacingScale(content) {
        const { title = '', body = '' } = content || {};
        const titleDensity = Math.min(title.length / this.CONSTANTS.TITLE_CHAR_MAX, 1);
        const bodyDensity = Math.min(body.length / this.CONSTANTS.BODY_CHAR_MAX, 1);
        const overallDensity = (titleDensity * 0.6) + (bodyDensity * 0.4);

        return {
            zonePadding: this.normalizeSpacing(32, overallDensity),
            sectionGap: this.normalizeSpacing(24, overallDensity),
            elementGap: this.normalizeSpacing(16, overallDensity),
            textGap: this.normalizeSpacing(8, overallDensity)
        };
    }


    /* ============================================
       COMPREHENSIVE RULE APPLICATION
       ============================================ */

    /**
     * Apply all design rules to poster content
     * Returns optimized parameters for rendering
     * 
     * @param {Object} content - Poster content
     * @param {Object} colors - Color scheme (background, primary)
     * @param {Object} dimensions - Poster dimensions
     * @returns {Object} Optimized design parameters
     */
    applyAllRules(content, colors = {}, dimensions = {}) {
        const {
            title = '',
            body = '',
            meta = []
        } = content;

        const {
            background = '#0f172a',
            primary = '#4F46E5'
        } = colors;

        const {
            width = 800,
            height = 1200
        } = dimensions;

        // Title processing
        const titleFontSize = this.calculateTitleFontSize(title);
        const truncatedTitle = this.truncateTitle(title);

        // Font scaling
        const fontScaleFactor = this.calculateFontScaleFactor(content);

        // Contrast safety
        const textColor = this.autoAdjustTextColor(background);
        const contrastValidation = this.validateContrast(textColor, background);

        // Line clamping
        const bodyLineClamping = this.applyBodyLineClamping(body);

        // Spacing normalization
        const spacing = this.generateSpacingScale(content);

        return {
            title: {
                text: truncatedTitle,
                fontSize: this.clamp(
                    Math.round(titleFontSize * fontScaleFactor),
                    this.CONSTANTS.TITLE_FONT_MIN,
                    this.CONSTANTS.TITLE_FONT_MAX
                ),
                maxLines: this.CONSTANTS.TITLE_LINE_MAX
            },
            body: {
                text: bodyLineClamping.text,
                fontSize: this.clamp(
                    Math.round(this.CONSTANTS.BODY_FONT_BASE * fontScaleFactor),
                    this.CONSTANTS.BODY_FONT_MIN,
                    this.CONSTANTS.BODY_FONT_MAX
                ),
                wasClamped: bodyLineClamping.wasClamped,
                maxLines: this.CONSTANTS.BODY_LINE_MAX
            },
            colors: {
                text: textColor,
                background: background,
                contrastRatio: contrastValidation.ratio,
                meetsAccessibility: contrastValidation.meetsAA
            },
            spacing: spacing,
            scaleFactor: fontScaleFactor,
            dimensions: {
                width: width,
                height: height
            }
        };
    }
}


// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PosterRulesEngine;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.PosterRulesEngine = PosterRulesEngine;
}
