/**
 * Poster Data Validator
 * 
 * Validates event data before poster generation to ensure high-quality output.
 * Prevents rendering of incomplete or invalid posters.
 * 
 * Validation Pipeline:
 * 1. validate(eventData) → returns { isValid, errors, warnings }
 * 2. If isValid = false → block rendering
 * 3. If warnings exist → render but log warnings
 * 
 * @module PosterValidator
 * @version 1.0.0
 */

/**
 * Poster Validator Class
 * Pure validation logic with no DOM manipulation
 */
class PosterValidator {
    constructor() {
        // Placeholder text patterns to block
        this.placeholderPatterns = [
            /^test$/i,
            /^sample$/i,
            /^placeholder$/i,
            /^untitled$/i,
            /^event$/i,
            /^title$/i,
            /^example$/i
        ];

        // Minimum lengths
        this.minTitleLength = 3;
        this.recommendedDescriptionLength = 20;

        // Allowed themes
        this.allowedThemes = ['default', 'ocean', 'sunset', 'neon'];
    }

    /**
     * Main validation function
     * 
     * @param {Object} eventData - Raw event data
     * @returns {Object} Validation result { isValid, errors, warnings }
     */
    validate(eventData) {
        const errors = [];
        const warnings = [];

        // Required field validations (errors)
        this._validateTitle(eventData, errors);

        // Soft validations (warnings)
        this._validateDescription(eventData, warnings);
        this._validateEventDetails(eventData, warnings);
        this._validateSubtitle(eventData, warnings);
        this._validateTheme(eventData, warnings);  // New: Theme validation

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }

    /**
     * Validate title/hero (REQUIRED)
     * 
     * @param {Object} eventData - Event data
     * @param {Array} errors - Errors array to append to
     * @private
     */
    _validateTitle(eventData, errors) {
        const title = eventData.title;

        // Check if title exists
        if (!title) {
            errors.push({
                field: 'title',
                message: 'Title is required',
                severity: 'error'
            });
            return;
        }

        // Check if title is only whitespace
        const trimmedTitle = title.trim();
        if (trimmedTitle.length === 0) {
            errors.push({
                field: 'title',
                message: 'Title cannot be only whitespace',
                severity: 'error'
            });
            return;
        }

        // Check minimum length
        if (trimmedTitle.length < this.minTitleLength) {
            errors.push({
                field: 'title',
                message: `Title must be at least ${this.minTitleLength} characters`,
                severity: 'error',
                currentLength: trimmedTitle.length
            });
            return;
        }

        // Check for placeholder text
        const isPlaceholder = this.placeholderPatterns.some(pattern =>
            pattern.test(trimmedTitle)
        );

        if (isPlaceholder) {
            errors.push({
                field: 'title',
                message: 'Title appears to be placeholder text',
                severity: 'error',
                value: trimmedTitle
            });
        }
    }

    /**
     * Validate description (SOFT - warning only)
     * 
     * @param {Object} eventData - Event data
     * @param {Array} warnings - Warnings array to append to
     * @private
     */
    _validateDescription(eventData, warnings) {
        const description = eventData.description;

        if (!description || description.trim().length === 0) {
            warnings.push({
                field: 'description',
                message: 'Description is missing',
                severity: 'warning',
                recommendation: 'Add a description to provide event details'
            });
            return;
        }

        const trimmedDescription = description.trim();
        if (trimmedDescription.length < this.recommendedDescriptionLength) {
            warnings.push({
                field: 'description',
                message: `Description is short (${trimmedDescription.length} chars)`,
                severity: 'warning',
                recommendation: `Consider adding more details (recommended: ${this.recommendedDescriptionLength}+ chars)`,
                currentLength: trimmedDescription.length
            });
        }
    }

    /**
     * Validate event details (date/time/location) (SOFT - warning only)
     * 
     * @param {Object} eventData - Event data
     * @param {Array} warnings - Warnings array to append to
     * @private
     */
    _validateEventDetails(eventData, warnings) {
        const hasDate = eventData.date && eventData.date.trim().length > 0;
        const hasTime = eventData.time && eventData.time.trim().length > 0;
        const hasLocation = eventData.location && eventData.location.trim().length > 0;

        // Check if at least one detail exists
        if (!hasDate && !hasTime && !hasLocation) {
            warnings.push({
                field: 'event_details',
                message: 'No event details provided',
                severity: 'warning',
                recommendation: 'Add at least one of: date, time, or location'
            });
            return;
        }

        // Individual field warnings
        if (!hasDate) {
            warnings.push({
                field: 'date',
                message: 'Event date is missing',
                severity: 'warning',
                recommendation: 'Add event date for better clarity'
            });
        }

        if (!hasTime) {
            warnings.push({
                field: 'time',
                message: 'Event time is missing',
                severity: 'warning',
                recommendation: 'Add event time for better clarity'
            });
        }

        if (!hasLocation) {
            warnings.push({
                field: 'location',
                message: 'Event location is missing',
                severity: 'warning',
                recommendation: 'Add event location for better clarity'
            });
        }
    }

    /**
     * Validate subtitle (SOFT - warning only)
     * 
     * @param {Object} eventData - Event data
     * @param {Array} warnings - Warnings array to append to
     * @private
     */
    _validateSubtitle(eventData, warnings) {
        const subtitle = eventData.subtitle;

        if (!subtitle || subtitle.trim().length === 0) {
            warnings.push({
                field: 'subtitle',
                message: 'Subtitle is missing',
                severity: 'info',
                recommendation: 'Consider adding a subtitle for additional context (optional)'
            });
        }
    }

    /**
     * Validate theme (SOFT - warning only)
     * 
     * @param {Object} eventData - Event data
     * @param {Array} warnings - Warnings array to append to
     * @private
     */
    _validateTheme(eventData, warnings) {
        const theme = eventData.theme;

        // If no theme specified, it's fine (defaults to 'default')
        if (!theme || theme.trim().length === 0) {
            return;
        }

        const normalizedTheme = theme.trim().toLowerCase();

        // Check if theme is in allowed list
        if (!this.allowedThemes.includes(normalizedTheme)) {
            warnings.push({
                field: 'theme',
                message: `Theme "${theme}" is not recognized`,
                severity: 'warning',
                recommendation: `Use one of: ${this.allowedThemes.join(', ')}`,
                value: theme,
                allowedValues: this.allowedThemes
            });
        }
    }

    /**
     * Validate before rendering (convenience method)
     * Logs warnings to console
     * 
     * @param {Object} eventData - Event data
     * @returns {Object} Validation result
     */
    validateForRendering(eventData) {
        const result = this.validate(eventData);

        // Log warnings to console
        if (result.warnings.length > 0) {
            console.warn(`⚠️ Poster validation warnings (${result.warnings.length}):`);
            result.warnings.forEach((warning, index) => {
                console.warn(`  ${index + 1}. [${warning.field}] ${warning.message}`);
                if (warning.recommendation) {
                    console.warn(`     → ${warning.recommendation}`);
                }
            });
        }

        // Log errors to console
        if (result.errors.length > 0) {
            console.error(`❌ Poster validation errors (${result.errors.length}):`);
            result.errors.forEach((error, index) => {
                console.error(`  ${index + 1}. [${error.field}] ${error.message}`);
            });
        }

        return result;
    }

    /**
     * Get formatted validation summary
     * 
     * @param {Object} validationResult - Result from validate()
     * @returns {string} Human-readable summary
     */
    getValidationSummary(validationResult) {
        if (validationResult.isValid && validationResult.warnings.length === 0) {
            return '✅ Validation passed with no issues';
        }

        let summary = [];

        if (!validationResult.isValid) {
            summary.push(`❌ Validation failed with ${validationResult.errors.length} error(s)`);
        } else {
            summary.push('✅ Validation passed');
        }

        if (validationResult.warnings.length > 0) {
            summary.push(`⚠️  ${validationResult.warnings.length} warning(s)`);
        }

        return summary.join(' | ');
    }

    /**
     * Check if specific field is required
     * 
     * @param {string} fieldName - Field name
     * @returns {boolean} True if required
     */
    isFieldRequired(fieldName) {
        const requiredFields = ['title'];
        return requiredFields.includes(fieldName);
    }

    /**
     * Get all validation rules
     * 
     * @returns {Object} Validation rules documentation
     */
    getValidationRules() {
        return {
            required: {
                title: {
                    minLength: this.minTitleLength,
                    notWhitespace: true,
                    notPlaceholder: true
                }
            },
            recommended: {
                description: {
                    minLength: this.recommendedDescriptionLength
                },
                event_details: {
                    requireAtLeastOne: ['date', 'time', 'location']
                },
                subtitle: {
                    optional: true
                }
            }
        };
    }

    /**
     * Add custom placeholder pattern
     * 
     * @param {RegExp} pattern - RegExp pattern to block
     */
    addPlaceholderPattern(pattern) {
        if (pattern instanceof RegExp) {
            this.placeholderPatterns.push(pattern);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PosterValidator;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.PosterValidator = PosterValidator;
}
