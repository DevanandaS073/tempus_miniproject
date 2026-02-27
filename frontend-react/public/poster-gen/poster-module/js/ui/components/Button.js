/**
 * Button Component
 * 
 * Reusable button component with props-based rendering and token-driven styling.
 * 
 * Props:
 * - text: Button text
 * - variant: Button variant (primary, secondary, danger, ghost)
 * - size: Button size (sm, md, lg)
 * - icon: Optional icon (emoji or HTML)
 * - onClick: Click handler function
 * - disabled: Disabled state
 * - ariaLabel: Accessibility label
 * 
 * @module Button
 * @version 1.0.0
 */

/**
 * Button Component Class
 */
class Button {
    /**
     * Create a button element
     * 
     * @param {Object} props - Button properties
     * @param {string} props.text - Button text
     * @param {string} [props.variant='primary'] - Button variant
     * @param {string} [props.size='md'] - Button size
     * @param {string} [props.icon] - Optional icon
     * @param {Function} [props.onClick] - Click handler
     * @param {boolean} [props.disabled=false] - Disabled state
     * @param {string} [props.ariaLabel] - Accessibility label
     * @returns {HTMLButtonElement} Button element
     */
    static create(props) {
        const {
            text,
            variant = 'primary',
            size = 'md',
            icon = null,
            onClick = null,
            disabled = false,
            ariaLabel = null
        } = props;

        // Create button element
        const button = document.createElement('button');
        button.className = `btn btn-${variant} btn-${size}`;
        button.disabled = disabled;

        // Set accessibility label
        if (ariaLabel) {
            button.setAttribute('aria-label', ariaLabel);
        }

        // Add icon if provided
        if (icon) {
            const iconEl = document.createElement('span');
            iconEl.className = 'btn-icon';
            iconEl.innerHTML = icon;
            button.appendChild(iconEl);
        }

        // Add text
        if (text) {
            const textEl = document.createElement('span');
            textEl.className = 'btn-text';
            textEl.textContent = text;
            button.appendChild(textEl);
        }

        // Attach click handler
        if (onClick && typeof onClick === 'function') {
            button.addEventListener('click', onClick);
        }

        return button;
    }

    /**
     * Update button properties
     * 
     * @param {HTMLButtonElement} button - Button element
     * @param {Object} props - Properties to update
     */
    static update(button, props) {
        if (props.text !== undefined) {
            const textEl = button.querySelector('.btn-text');
            if (textEl) {
                textEl.textContent = props.text;
            }
        }

        if (props.disabled !== undefined) {
            button.disabled = props.disabled;
        }

        if (props.variant !== undefined) {
            button.className = button.className.replace(/btn-\w+/, `btn-${props.variant}`);
        }
    }
}


// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Button;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.Button = Button;
}
