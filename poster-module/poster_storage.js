/**
 * Poster Storage Manager
 * 
 * Production-aligned storage system for poster metadata and data.
 * Uses localStorage for persistence (simulation of database storage).
 * 
 * Metadata stored for each poster:
 * - poster_id: Unique identifier
 * - template_id: Template used (e.g., "modern")
 * - token_version: Design token version
 * - event_hash: Hash of event data for change detection
 * - generated_at: ISO timestamp
 * - event_data: Original event data
 * - render_safe_content: Processed content
 * - export_data_url: PNG data URL (optional)
 * 
 * @module PosterStorage
 * @version 1.0.0
 */

/**
 * Poster Storage Class
 * Manages poster persistence with metadata
 */
class PosterStorage {
    constructor(options = {}) {
        this.storageKey = options.storageKey || 'posters';
        this.tokenVersion = options.tokenVersion || '1.0.0';
        this.maxPosters = options.maxPosters || 100;
    }


    /* ============================================
       METADATA GENERATION
       ============================================ */

    /**
     * Generate unique poster ID
     * 
     * @returns {string} Unique poster ID
     */
    generatePosterId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        return `poster_${timestamp}_${random}`;
    }

    /**
     * Generate hash of event data for change detection
     * 
     * @param {Object} eventData - Event data object
     * @returns {string} Hash string
     */
    generateEventHash(eventData = {}) {
        // Simple hash based on key fields
        const hashData = JSON.stringify({
            title: eventData.title,
            date: eventData.date,
            time: eventData.time,
            location: eventData.location,
            description: eventData.description
        });

        // Simple hash function (for demo purposes)
        let hash = 0;
        for (let i = 0; i < hashData.length; i++) {
            const char = hashData.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        return Math.abs(hash).toString(36);
    }

    /**
     * Create poster metadata object
     * 
     * @param {Object} eventData - Event data
     * @param {string} templateId - Template identifier
     * @param {Object} renderSafeContent - Processed content
     * @param {string} exportDataUrl - Optional PNG data URL
     * @returns {Object} Poster metadata
     */
    createPosterMetadata(eventData, templateId, renderSafeContent, exportDataUrl = null) {
        return {
            poster_id: this.generatePosterId(),
            template_id: templateId,
            token_version: this.tokenVersion,
            event_hash: this.generateEventHash(eventData),
            generated_at: new Date().toISOString(),
            event_data: eventData,
            render_safe_content: renderSafeContent,
            export_data_url: exportDataUrl,
            metadata: {
                title: eventData.title,
                date: eventData.date,
                accessible: renderSafeContent?.metadata?.accessible || false
            }
        };
    }


    /* ============================================
       STORAGE OPERATIONS
       ============================================ */

    /**
     * Get all posters from localStorage
     * 
     * @returns {Array} Array of poster metadata objects
     */
    getAllPosters() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load posters:', error);
            return [];
        }
    }

    /**
     * Save posters to localStorage
     * 
     * @param {Array} posters - Array of poster metadata objects
     */
    saveAllPosters(posters) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(posters));
        } catch (error) {
            console.error('Failed to save posters:', error);

            // Handle quota exceeded
            if (error.name === 'QuotaExceededError') {
                console.warn('localStorage quota exceeded, removing oldest posters');
                this.cleanupOldPosters(posters, Math.floor(posters.length * 0.7));
            }
        }
    }

    /**
     * Save a new poster
     * 
     * @param {Object} eventData - Event data
     * @param {string} templateId - Template identifier
     * @param {Object} renderSafeContent - Processed content
     * @param {string} exportDataUrl - Optional PNG data URL
     * @returns {Object} Saved poster metadata
     */
    savePoster(eventData, templateId, renderSafeContent, exportDataUrl = null) {
        const posters = this.getAllPosters();
        const metadata = this.createPosterMetadata(eventData, templateId, renderSafeContent, exportDataUrl);

        // Add to beginning (most recent first)
        posters.unshift(metadata);

        // Enforce max posters limit
        if (posters.length > this.maxPosters) {
            posters.length = this.maxPosters;
        }

        this.saveAllPosters(posters);

        console.log('Poster saved:', metadata.poster_id);
        return metadata;
    }

    /**
     * Get poster by ID
     * 
     * @param {string} posterId - Poster ID
     * @returns {Object|null} Poster metadata or null
     */
    getPosterById(posterId) {
        const posters = this.getAllPosters();
        return posters.find(p => p.poster_id === posterId) || null;
    }

    /**
     * Delete poster by ID
     * 
     * @param {string} posterId - Poster ID
     * @returns {boolean} Success
     */
    deletePoster(posterId) {
        const posters = this.getAllPosters();
        const index = posters.findIndex(p => p.poster_id === posterId);

        if (index !== -1) {
            posters.splice(index, 1);
            this.saveAllPosters(posters);
            console.log('Poster deleted:', posterId);
            return true;
        }

        return false;
    }

    /**
     * Update poster export data URL
     * 
     * @param {string} posterId - Poster ID
     * @param {string} exportDataUrl - PNG data URL
     * @returns {boolean} Success
     */
    updatePosterExport(posterId, exportDataUrl) {
        const posters = this.getAllPosters();
        const poster = posters.find(p => p.poster_id === posterId);

        if (poster) {
            poster.export_data_url = exportDataUrl;
            this.saveAllPosters(posters);
            return true;
        }

        return false;
    }


    /* ============================================
       QUERY OPERATIONS
       ============================================ */

    /**
     * Get posters by template ID
     * 
     * @param {string} templateId - Template identifier
     * @returns {Array} Matching posters
     */
    getPostersByTemplate(templateId) {
        const posters = this.getAllPosters();
        return posters.filter(p => p.template_id === templateId);
    }

    /**
     * Search posters by title
     * 
     * @param {string} query - Search query
     * @returns {Array} Matching posters
     */
    searchPosters(query) {
        if (!query || typeof query !== 'string') {
            return this.getAllPosters();
        }

        const posters = this.getAllPosters();
        const lowerQuery = query.toLowerCase();

        return posters.filter(p =>
            p.metadata.title?.toLowerCase().includes(lowerQuery) ||
            p.event_data.description?.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Get recent posters
     * 
     * @param {number} count - Number of posters to return
     * @returns {Array} Recent posters
     */
    getRecentPosters(count = 10) {
        const posters = this.getAllPosters();
        return posters.slice(0, count);
    }


    /* ============================================
       UTILITY OPERATIONS
       ============================================ */

    /**
     * Check if event data has changed
     * 
     * @param {string} posterId - Poster ID
     * @param {Object} eventData - New event data
     * @returns {boolean} True if changed
     */
    hasEventChanged(posterId, eventData) {
        const poster = this.getPosterById(posterId);
        if (!poster) return true;

        const newHash = this.generateEventHash(eventData);
        return newHash !== poster.event_hash;
    }

    /**
     * Get storage statistics
     * 
     * @returns {Object} Storage stats
     */
    getStats() {
        const posters = this.getAllPosters();
        const totalSize = JSON.stringify(posters).length;

        return {
            totalPosters: posters.length,
            maxPosters: this.maxPosters,
            storageSizeBytes: totalSize,
            storageSizeKB: Math.round(totalSize / 1024),
            tokenVersion: this.tokenVersion
        };
    }

    /**
     * Cleanup old posters (keep only N most recent)
     * 
     * @param {Array} posters - Posters array
     * @param {number} keepCount - Number to keep
     */
    cleanupOldPosters(posters, keepCount) {
        const trimmed = posters.slice(0, keepCount);
        this.saveAllPosters(trimmed);
        console.log(`Cleaned up posters: ${posters.length} → ${trimmed.length}`);
    }

    /**
     * Clear all posters (use with caution)
     */
    clearAll() {
        localStorage.removeItem(this.storageKey);
        console.log('All posters cleared');
    }

    /**
     * Export all posters as JSON
     * 
     * @returns {string} JSON string
     */
    exportAsJSON() {
        const posters = this.getAllPosters();
        return JSON.stringify(posters, null, 2);
    }

    /**
     * Import posters from JSON
     * 
     * @param {string} jsonString - JSON string of posters
     * @returns {number} Number of posters imported
     */
    importFromJSON(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (Array.isArray(imported)) {
                this.saveAllPosters(imported);
                return imported.length;
            }
            return 0;
        } catch (error) {
            console.error('Failed to import posters:', error);
            return 0;
        }
    }
}


// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PosterStorage;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.PosterStorage = PosterStorage;
}
