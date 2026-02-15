/**
 * Modal Component
 * 
 * Reusable modal dialog component with props-based rendering.
 * 
 * Props:
 * - title: Modal title
 * - content: Modal content (HTML string or element)
 * - actions: Array of action buttons
 * - onClose: Close handler function
 * - closeOnBackdrop: Close when clicking backdrop
 * - size: Modal size (sm, md, lg, xl)
 * 
 * @module Modal
 * @version 1.0.0
 */

/**
 * Modal Component Class
 */
class Modal {
    /**
     * Create and show a modal
     * 
     * @param {Object} props - Modal properties
     * @param {string} props.title - Modal title
     * @param {string|HTMLElement} props.content - Modal content
     * @param {Array} [props.actions=[]] - Action buttons
     * @param {Function} [props.onClose] - Close handler
     * @param {boolean} [props.closeOnBackdrop=true] - Close on backdrop click
     * @param {string} [props.size='md'] - Modal size
     * @returns {HTMLElement} Modal element
     */
    static create(props) {
        const {
            title,
            content,
            actions = [],
            onClose = null,
            closeOnBackdrop = true,
            size = 'md'
        } = props;

        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'modal-title');

        // Create modal dialog
        const dialog = document.createElement('div');
        dialog.className = `modal-dialog modal-${size}`;

        // Create modal header
        const header = document.createElement('div');
        header.className = 'modal-header';

        const titleEl = document.createElement('h2');
        titleEl.id = 'modal-title';
        titleEl.className = 'modal-title';
        titleEl.textContent = title;
        header.appendChild(titleEl);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.setAttribute('aria-label', 'Close modal');
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            Modal.close(modal);
            if (onClose) onClose();
        });
        header.appendChild(closeBtn);

        // Create modal body
        const body = document.createElement('div');
        body.className = 'modal-body';

        if (typeof content === 'string') {
            body.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            body.appendChild(content);
        }

        // Create modal footer (if actions provided)
        const footer = document.createElement('div');
        footer.className = 'modal-footer';

        actions.forEach(action => {
            const btn = Button.create({
                text: action.text,
                variant: action.variant || 'secondary',
                onClick: () => {
                    if (action.onClick) action.onClick();
                    if (action.closeOnClick !== false) {
                        Modal.close(modal);
                    }
                }
            });
            footer.appendChild(btn);
        });

        // Assemble modal
        dialog.appendChild(header);
        dialog.appendChild(body);
        if (actions.length > 0) {
            dialog.appendChild(footer);
        }
        modal.appendChild(dialog);

        // Close on backdrop click
        if (closeOnBackdrop) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    Modal.close(modal);
                    if (onClose) onClose();
                }
            });
        }

        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                Modal.close(modal);
                if (onClose) onClose();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        return modal;
    }

    /**
     * Show modal
     * 
     * @param {HTMLElement} modal - Modal element
     */
    static show(modal) {
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Trigger animation
        requestAnimationFrame(() => {
            modal.classList.add('modal-active');
        });
    }

    /**
     * Close modal
     * 
     * @param {HTMLElement} modal - Modal element
     */
    static close(modal) {
        modal.classList.remove('modal-active');

        // Wait for animation
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            document.body.style.overflow = '';
        }, 300);
    }

    /**
     * Create and show modal (convenience method)
     * 
     * @param {Object} props - Modal properties
     * @returns {HTMLElement} Modal element
     */
    static open(props) {
        const modal = Modal.create(props);
        Modal.show(modal);
        return modal;
    }
}


// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Modal;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.Modal = Modal;
}
