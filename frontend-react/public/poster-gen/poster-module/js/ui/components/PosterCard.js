/**
 * PosterCard Component
 * 
 * Reusable poster card component for displaying poster previews with metadata.
 * 
 * Props:
 * - posterId: Unique poster ID
 * - title: Poster title
 * - date: Event date
 * - templateId: Template ID
 * - previewUrl: Preview image URL (data URL or path)
 * - accessible: Accessibility badge (WCAG AA compliance)
 * - onDownload: Download handler function
 * - onRegenerate: Regenerate handler function
 * - onDelete: Delete handler function
 * 
 * @module PosterCard
 * @version 1.0.0
 */

/**
 * PosterCard Component Class
 */
class PosterCard {
    /**
     * Create a poster card element
     * 
     * @param {Object} props - Poster card properties
     * @param {string} props.posterId - Poster ID
     * @param {string} props.title - Poster title
     * @param {string} props.date - Event date
     * @param {string} props.templateId - Template ID
     * @param {string} [props.previewUrl] - Preview image URL
     * @param {boolean} [props.accessible=false] - WCAG AA compliance
     * @param {Function} [props.onDownload] - Download handler
     * @param {Function} [props.onRegenerate] - Regenerate handler
     * @param {Function} [props.onDelete] - Delete handler
     * @returns {HTMLElement} Poster card element
     */
    static create(props) {
        const {
            posterId,
            title,
            date,
            templateId,
            previewUrl = null,
            accessible = false,
            onDownload = null,
            onRegenerate = null,
            onDelete = null
        } = props;

        // Create card container
        const card = document.createElement('div');
        card.className = 'poster-card';
        card.dataset.posterId = posterId;

        // Create preview section
        const preview = document.createElement('div');
        preview.className = 'poster-preview';

        if (previewUrl) {
            const img = document.createElement('img');
            img.src = previewUrl;
            img.alt = `Preview of ${title}`;
            img.loading = 'lazy';
            preview.appendChild(img);
        } else {
            // Placeholder if no preview
            const placeholder = document.createElement('div');
            placeholder.className = 'poster-preview-placeholder';
            placeholder.textContent = '📄';
            preview.appendChild(placeholder);
        }

        // Accessibility badge
        if (accessible) {
            const badge = document.createElement('div');
            badge.className = 'poster-badge poster-badge-accessible';
            badge.textContent = 'WCAG AA';
            badge.setAttribute('title', 'Meets WCAG AA accessibility standards');
            preview.appendChild(badge);
        }

        card.appendChild(preview);

        // Create metadata section
        const meta = document.createElement('div');
        meta.className = 'poster-meta';

        // Title
        const titleEl = document.createElement('h3');
        titleEl.className = 'poster-title';
        titleEl.textContent = title;
        meta.appendChild(titleEl);

        // Details
        const details = document.createElement('div');
        details.className = 'poster-details';

        const dateEl = document.createElement('span');
        dateEl.className = 'poster-date';
        dateEl.textContent = `📅 ${date}`;
        details.appendChild(dateEl);

        const templateEl = document.createElement('span');
        templateEl.className = 'poster-template';
        templateEl.textContent = `📐 ${PosterCard._formatTemplateName(templateId)}`;
        details.appendChild(templateEl);

        meta.appendChild(details);
        card.appendChild(meta);

        // Create actions section
        const actions = document.createElement('div');
        actions.className = 'poster-actions';

        // Download button
        if (onDownload) {
            const downloadBtn = Button.create({
                text: 'Download',
                variant: 'primary',
                size: 'sm',
                icon: '⬇️',
                onClick: () => onDownload(posterId),
                ariaLabel: `Download ${title}`
            });
            actions.appendChild(downloadBtn);
        }

        // Regenerate button
        if (onRegenerate) {
            const regenBtn = Button.create({
                text: 'Regenerate',
                variant: 'secondary',
                size: 'sm',
                icon: '🔄',
                onClick: () => onRegenerate(posterId),
                ariaLabel: `Regenerate ${title}`
            });
            actions.appendChild(regenBtn);
        }

        // Delete button
        if (onDelete) {
            const deleteBtn = Button.create({
                text: 'Delete',
                variant: 'danger',
                size: 'sm',
                icon: '🗑️',
                onClick: () => onDelete(posterId),
                ariaLabel: `Delete ${title}`
            });
            actions.appendChild(deleteBtn);
        }

        card.appendChild(actions);

        return card;
    }

    /**
     * Format template name for display
     * 
     * @param {string} templateId - Template ID
     * @returns {string} Formatted template name
     * @private
     */
    static _formatTemplateName(templateId) {
        // Capitalize first letter
        return templateId.charAt(0).toUpperCase() + templateId.slice(1);
    }

    /**
     * Update poster card
     * 
     * @param {HTMLElement} card - Card element
     * @param {Object} props - Properties to update
     */
    static update(card, props) {
        if (props.title !== undefined) {
            const titleEl = card.querySelector('.poster-title');
            if (titleEl) {
                titleEl.textContent = props.title;
            }
        }

        if (props.date !== undefined) {
            const dateEl = card.querySelector('.poster-date');
            if (dateEl) {
                dateEl.textContent = `📅 ${props.date}`;
            }
        }

        if (props.previewUrl !== undefined) {
            const img = card.querySelector('.poster-preview img');
            if (img) {
                img.src = props.previewUrl;
            }
        }

        if (props.accessible !== undefined) {
            const badge = card.querySelector('.poster-badge-accessible');
            if (props.accessible && !badge) {
                // Add badge
                const newBadge = document.createElement('div');
                newBadge.className = 'poster-badge poster-badge-accessible';
                newBadge.textContent = 'WCAG AA';
                newBadge.setAttribute('title', 'Meets WCAG AA accessibility standards');
                card.querySelector('.poster-preview').appendChild(newBadge);
            } else if (!props.accessible && badge) {
                // Remove badge
                badge.remove();
            }
        }
    }

    /**
     * Create multiple poster cards
     * 
     * @param {Array} posters - Array of poster data
     * @param {Object} handlers - Event handlers (onDownload, onRegenerate, onDelete)
     * @returns {HTMLElement} Container with poster cards
     */
    static createGrid(posters, handlers = {}) {
        const container = document.createElement('div');
        container.className = 'poster-grid';

        posters.forEach(poster => {
            const card = PosterCard.create({
                posterId: poster.poster_id,
                title: poster.metadata.title,
                date: poster.metadata.date,
                templateId: poster.template_id,
                previewUrl: poster.export_data_url,
                accessible: poster.metadata.accessible,
                onDownload: handlers.onDownload,
                onRegenerate: handlers.onRegenerate,
                onDelete: handlers.onDelete
            });
            container.appendChild(card);
        });

        return container;
    }
}


// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PosterCard;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.PosterCard = PosterCard;
}
