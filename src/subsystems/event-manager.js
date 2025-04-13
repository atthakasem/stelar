/**
 * Manages event handling and delegation for components
 */
export class EventManager {
    /**
     * Create a new event manager
     * @param {Component} component - The component this event manager belongs to
     */
    constructor(component) {
        this.component = component
        this.element = component.element
        this.eventHandlers = new Map()
    }

    /**
     * Add an event listener to the component's element
     * @param {string} eventType - Event type to listen for
     * @param {string|Function} selector - CSS selector for delegation or handler function
     * @param {Function} [handler] - Event handler if selector is provided
     * @returns {EventManager} This event manager instance
     */
    on(eventType, selector, handler) {
        if (typeof selector === 'function') {
            handler = selector
            selector = null
        }

        const wrappedHandler = (event) => {
            if (this.component.isDestroyed) return

            if (selector) {
                const target = event.target.closest(selector)
                if (target && this.element.contains(target)) {
                    handler.call(this.component, event, target)
                }
            } else {
                handler.call(this.component, event)
            }
        }

        this.eventHandlers.set(handler, { eventType, wrappedHandler })
        this.element.addEventListener(eventType, wrappedHandler)
        return this
    }

    /**
     * Remove an event listener from the component's element
     * @param {string} eventType - Event type to remove
     * @param {Function} handler - Original handler function to remove
     * @returns {EventManager} This event manager instance
     */
    off(eventType, handler) {
        const handlerData = this.eventHandlers.get(handler)
        if (handlerData && handlerData.eventType === eventType) {
            this.element.removeEventListener(
                eventType,
                handlerData.wrappedHandler
            )
            this.eventHandlers.delete(handler)
        }
        return this
    }

    /**
     * Emit a custom event from the component's element
     * @param {string} eventName - Name of the event to emit
     * @param {Object} detail - Data to include with the event
     * @returns {EventManager} This event manager instance
     */
    emit(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            bubbles: true,
            cancelable: true,
            detail,
        })
        this.element.dispatchEvent(event)
        return this
    }

    /**
     * Clean up all event listeners
     */
    destroy() {
        for (const [handler, handlerData] of this.eventHandlers.entries()) {
            this.element.removeEventListener(
                handlerData.eventType,
                handlerData.wrappedHandler
            )
            this.eventHandlers.delete(handler)
        }
    }
}
