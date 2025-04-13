/**
 * Manages DOM lifecycle observations for components
 */
export class LifecycleObserver {
    /**
     * Create a new lifecycle observer
     * @param {Component} component - The component to observe
     */
    constructor(component) {
        this.component = component
        this.element = component.element
        this.isDestroyed = false

        if (!this.component.isDestroyed) {
            this._setupIntersectionObserver()
            this._setupAttributeObserver()
            // Setup connection/disconnection observer LAST,
            // as it might immediately trigger callbacks based on current state
            this._setupConnectionObserver()
        }
    }

    /**
     * Set up observation for element visibility
     */
    _setupIntersectionObserver() {
        if (!this.element || typeof IntersectionObserver === 'undefined') return
        this._intersectionObserver = new IntersectionObserver((entries) => {
            if (this.isDestroyed || this.component.isDestroyed) return
            entries.forEach((entry) => {
                if (this.component.isConnected) {
                    if (entry.isIntersecting) {
                        this.component.visibleCallback()
                    } else {
                        this.component.hiddenCallback()
                    }
                }
            })
        })
        this._intersectionObserver.observe(this.element)
    }

    /**
     * Set up observation for DOM connection and disconnection
     */
    _setupConnectionObserver() {
        if (!this.element || typeof MutationObserver === 'undefined') return

        this._connectionObserver = new MutationObserver(() => {
            if (this.isDestroyed || this.component.isDestroyed) {
                return
            }

            const isCurrentlyConnected = document.contains(this.element)

            if (isCurrentlyConnected && !this.component.isConnected) {
                // Element was ADDED to the DOM
                this.component._handleConnected()
            } else if (!isCurrentlyConnected && this.component.isConnected) {
                // Element was REMOVED from the DOM
                this.component._handleDisconnected()
            }
        })

        // Observe the entire document body for additions/removals affecting the element
        // This is broad but necessary to catch appending anywhere.
        this._connectionObserver.observe(document.body, {
            childList: true,
            subtree: true,
        })
    }

    /**
     * Set up observation for attribute changes
     */
    _setupAttributeObserver() {
        if (!this.element || typeof MutationObserver === 'undefined') return
        this._attributeObserver = new MutationObserver((mutations) => {
            if (this.isDestroyed || this.component.isDestroyed) return
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes') {
                    const name = mutation.attributeName
                    // Check if attribute still exists before getting value (it might have been removed)
                    const newValue = this.element.hasAttribute(name)
                        ? this.element.getAttribute(name)
                        : null
                    const oldValue = mutation.oldValue

                    if (this.component.isConnected && newValue !== oldValue) {
                        this.component.attributeChangedCallback(
                            name,
                            oldValue,
                            newValue
                        )
                    }
                }
            })
        })
        this._attributeObserver.observe(this.element, {
            attributes: true,
            attributeOldValue: true,
        })
    }

    /**
     * Clean up all observers
     */
    destroy() {
        if (this.isDestroyed) return
        this.isDestroyed = true // Set flag early

        if (this._intersectionObserver) {
            this._intersectionObserver.disconnect()
            this._intersectionObserver = null
        }
        if (this._connectionObserver) {
            this._connectionObserver.disconnect()
            this._connectionObserver = null
        }
        if (this._attributeObserver) {
            this._attributeObserver.disconnect()
            this._attributeObserver = null
        }

        // Clear references
        this.component = null
        this.element = null
    }
}
