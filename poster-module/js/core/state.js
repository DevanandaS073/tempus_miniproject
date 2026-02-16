/**
 * State Management System
 * 
 * Centralized state management with pub/sub pattern for reactive updates.
 * Provides single source of truth for application state.
 * 
 * State Structure:
 * - eventData: Current event data (title, date, time, location, description, category)
 * - selectedTemplate: Current template ID
 * - renderStatus: Current render state (idle, preview, exporting)
 * 
 * Features:
 * - Subscribe/notify mechanism for reactive updates
 * - Deterministic state updates
 * - Validation on state changes
 * - Single source of truth
 * 
 * @module StateManager
 * @version 1.0.0
 */

/**
 * State Manager Class
 * Manages application state with pub/sub pattern
 */
class StateManager {
    constructor() {
        // Internal state (private)
        this._state = {
            eventData: {
                title: '',
                date: '',
                time: '',
                location: '',
                description: '',
                category: ''
            },
            selectedTemplate: null,
            renderStatus: 'idle'  // idle | preview | exporting
        };

        // Subscribers for state changes
        this._subscribers = {
            eventData: [],
            selectedTemplate: [],
            renderStatus: [],
            all: []  // Subscribe to all state changes
        };

        // Valid render statuses
        this._validStatuses = ['idle', 'preview', 'exporting'];
    }


    /* ============================================
       STATE GETTERS
       ============================================ */

    /**
     * Get current event data
     * 
     * @returns {Object} Event data object
     */
    getEventData() {
        return { ...this._state.eventData };  // Return copy to prevent mutation
    }

    /**
     * Get specific event field
     * 
     * @param {string} field - Field name (title, date, time, etc.)
     * @returns {string} Field value
     */
    getEventField(field) {
        return this._state.eventData[field] || '';
    }

    /**
     * Get selected template ID
     * 
     * @returns {string|null} Template ID or null
     */
    getSelectedTemplate() {
        return this._state.selectedTemplate;
    }

    /**
     * Get current render status
     * 
     * @returns {string} Render status (idle, preview, exporting)
     */
    getRenderStatus() {
        return this._state.renderStatus;
    }

    /**
     * Get complete state
     * 
     * @returns {Object} Complete state object (copy)
     */
    getState() {
        return {
            eventData: { ...this._state.eventData },
            selectedTemplate: this._state.selectedTemplate,
            renderStatus: this._state.renderStatus
        };
    }


    /* ============================================
       STATE SETTERS
       ============================================ */

    /**
     * Set event data (complete object)
     * 
     * @param {Object} eventData - Event data object
     * @returns {boolean} Success
     */
    setEventData(eventData) {
        if (!eventData || typeof eventData !== 'object') {
            console.error('Invalid event data');
            return false;
        }

        // Validate required fields
        if (!eventData.title || eventData.title.trim() === '') {
            console.error('Event title is required');
            return false;
        }

        // Update state
        const previousData = { ...this._state.eventData };
        this._state.eventData = {
            title: eventData.title || '',
            date: eventData.date || '',
            time: eventData.time || '',
            location: eventData.location || '',
            description: eventData.description || '',
            category: eventData.category || ''
        };

        // Notify subscribers
        this._notify('eventData', this._state.eventData, previousData);

        return true;
    }

    /**
     * Update specific event field
     * 
     * @param {string} field - Field name
     * @param {string} value - Field value
     * @returns {boolean} Success
     */
    setEventField(field, value) {
        if (!this._state.eventData.hasOwnProperty(field)) {
            console.error(`Invalid event field: ${field}`);
            return false;
        }

        const previousData = { ...this._state.eventData };
        this._state.eventData[field] = value || '';

        // Notify subscribers
        this._notify('eventData', this._state.eventData, previousData);

        return true;
    }

    /**
     * Set selected template
     * 
     * @param {string} templateId - Template ID (e.g., "modern", "minimal")
     * @returns {boolean} Success
     */
    setSelectedTemplate(templateId) {
        if (!templateId || typeof templateId !== 'string') {
            console.error('Invalid template ID');
            return false;
        }

        const previousTemplate = this._state.selectedTemplate;
        this._state.selectedTemplate = templateId;

        // Notify subscribers
        this._notify('selectedTemplate', templateId, previousTemplate);

        return true;
    }

    /**
     * Set render status
     * 
     * @param {string} status - Render status (idle, preview, exporting)
     * @returns {boolean} Success
     */
    setRenderStatus(status) {
        if (!this._validStatuses.includes(status)) {
            console.error(`Invalid render status: ${status}. Must be one of: ${this._validStatuses.join(', ')}`);
            return false;
        }

        const previousStatus = this._state.renderStatus;
        this._state.renderStatus = status;

        // Notify subscribers
        this._notify('renderStatus', status, previousStatus);

        return true;
    }


    /* ============================================
       BULK OPERATIONS
       ============================================ */

    /**
     * Reset event data to empty state
     */
    resetEventData() {
        const previousData = { ...this._state.eventData };
        this._state.eventData = {
            title: '',
            date: '',
            time: '',
            location: '',
            description: '',
            category: ''
        };

        this._notify('eventData', this._state.eventData, previousData);
    }

    /**
     * Reset all state to initial values
     */
    resetAll() {
        const previousState = this.getState();

        this._state = {
            eventData: {
                title: '',
                date: '',
                time: '',
                location: '',
                description: '',
                category: ''
            },
            selectedTemplate: null,
            renderStatus: 'idle'
        };

        // Notify all subscribers
        this._notify('all', this._state, previousState);
    }


    /* ============================================
       PUB/SUB MECHANISM
       ============================================ */

    /**
     * Subscribe to state changes
     * 
     * @param {string} key - State key to subscribe to (eventData, selectedTemplate, renderStatus, all)
     * @param {Function} callback - Callback function (newValue, oldValue)
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this._subscribers.hasOwnProperty(key)) {
            console.error(`Invalid subscription key: ${key}`);
            return () => { };
        }

        if (typeof callback !== 'function') {
            console.error('Callback must be a function');
            return () => { };
        }

        // Add subscriber
        this._subscribers[key].push(callback);

        // Return unsubscribe function
        return () => {
            const index = this._subscribers[key].indexOf(callback);
            if (index > -1) {
                this._subscribers[key].splice(index, 1);
            }
        };
    }

    /**
     * Notify subscribers of state change
     * 
     * @param {string} key - State key that changed
     * @param {*} newValue - New value
     * @param {*} oldValue - Previous value
     * @private
     */
    _notify(key, newValue, oldValue) {
        // Notify specific subscribers
        if (this._subscribers[key]) {
            this._subscribers[key].forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`Error in subscriber callback for ${key}:`, error);
                }
            });
        }

        // Notify 'all' subscribers
        if (key !== 'all') {
            this._subscribers.all.forEach(callback => {
                try {
                    callback({ key, newValue, oldValue });
                } catch (error) {
                    console.error('Error in global subscriber callback:', error);
                }
            });
        }
    }


    /* ============================================
       VALIDATION & UTILITIES
       ============================================ */

    /**
     * Validate current event data
     * 
     * @returns {Object} Validation result { valid: boolean, errors: string[] }
     */
    validateEventData() {
        const errors = [];

        if (!this._state.eventData.title || this._state.eventData.title.trim() === '') {
            errors.push('Title is required');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Check if state is ready for rendering
     * 
     * @returns {boolean} True if ready
     */
    isReadyForRender() {
        const validation = this.validateEventData();
        return validation.valid && this._state.selectedTemplate !== null;
    }

    /**
     * Get state snapshot for debugging
     * 
     * @returns {Object} State snapshot with metadata
     */
    getSnapshot() {
        return {
            state: this.getState(),
            timestamp: new Date().toISOString(),
            subscriberCounts: {
                eventData: this._subscribers.eventData.length,
                selectedTemplate: this._subscribers.selectedTemplate.length,
                renderStatus: this._subscribers.renderStatus.length,
                all: this._subscribers.all.length
            },
            isValid: this.validateEventData().valid,
            isReady: this.isReadyForRender()
        };
    }

    /**
     * Export state as JSON
     * 
     * @returns {string} JSON string
     */
    exportState() {
        return JSON.stringify(this.getState(), null, 2);
    }

    /**
     * Import state from JSON
     * 
     * @param {string} jsonString - JSON string
     * @returns {boolean} Success
     */
    importState(jsonString) {
        try {
            const importedState = JSON.parse(jsonString);

            if (importedState.eventData) {
                this.setEventData(importedState.eventData);
            }

            if (importedState.selectedTemplate) {
                this.setSelectedTemplate(importedState.selectedTemplate);
            }

            if (importedState.renderStatus) {
                this.setRenderStatus(importedState.renderStatus);
            }

            return true;
        } catch (error) {
            console.error('Failed to import state:', error);
            return false;
        }
    }
}


// Create singleton instance
const stateManager = new StateManager();


// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = stateManager;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.stateManager = stateManager;
}
