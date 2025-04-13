import { EventManager } from './subsystems/event-manager'
import { LifecycleObserver } from './subsystems/lifecycle-observer'
import { Renderer } from './subsystems/renderer'
import { StateManager } from './subsystems/state-manager'

/**
 * STELAR - Stateful Element Augmentor
 * Base Component class for creating lightweight, DOM-based components
 */
export class Component {
    /**
     * Create a new component instance
     * @param {HTMLElement} element - The DOM element this component controls
     * @param {Object} options - Configuration options
     * @param {Object} [options.initialState={}] - Initial state for the component
     * @param {boolean} [options.renderOnCreate=true] - Whether to render on component creation
     * @param {boolean} [options.renderOnStateChange=true] - Whether to automatically render on state changes
     */
    constructor(element, options = {}) {
        this.element = element
        this.options = {
            initialState: {},
            renderOnCreate: true,
            renderOnStateChange: true,
            ...options,
        }

        this.isDestroyed = false
        this.isConnected = false
        this.hasRenderedInitially = false
        element._component = this

        // Initialize core subsystems
        this.stateManager = new StateManager(
            this,
            { ...this.initialState(), ...this.options.initialState },
            this.options.renderOnStateChange
        )
        this.eventManager = new EventManager(this)
        this.renderer = new Renderer(this)
        this.lifecycleObserver = new LifecycleObserver(this)

        // Get state from the state manager
        this.state = this.stateManager.state

        // Initialize component
        this.init()

        // Handle *initial* connected state and render (if already in DOM)
        // The LifecycleObserver will handle connection if it happens later.
        if (document.contains(this.element)) {
            this._handleConnected()
        }
    }

    /**
     * Create component instances for all matching elements
     * @param {string} selector - CSS selector to find elements
     * @param {Object} options - Options to pass to component constructor
     * @param {Function} [BaseClass] - Component class to instantiate (defaults to this)
     * @returns {Array} Array of created component instances
     */
    static create(selector, options = {}, BaseClass = this) {
        const instances = []
        document.querySelectorAll(selector).forEach((element) => {
            // Skip if already initialized with this component type
            if (element._component instanceof BaseClass) return

            instances.push(new BaseClass(element, options))
        })
        return instances
    }

    /**
     * Override to provide initial state for the component
     * @returns {Object} Initial state object
     */
    initialState() {
        return {}
    }

    /**
     * Initialize the component
     * Override in subclass
     */
    init() {
        // To be implemented by subclasses
    }

    /**
     * Define selective rendering functions for specific properties
     * @returns {Object} Map of property names to render functions
     */
    renderMap() {
        return {} // Override in subclasses
    }

    /**
     * Define properties that trigger a render when changed
     * @returns {?Array} Property names that trigger renders (null for all properties)
     */
    renderProps() {
        return null // Override in subclasses
    }

    /**
     * Render the component's UI
     * Override in subclass
     */
    render() {
        // To be implemented by subclasses
    }

    /**
     * Update component state and trigger render if needed
     * @param {Object} newState - New state to merge with existing state
     * @returns {Component} This component instance for chaining
     */
    setState(newState) {
        this.stateManager.setState(newState)
        return this
    }

    /**
     * Add an event listener to the component's element
     * @param {string} eventType - Event type to listen for
     * @param {string|Function} selector - CSS selector for delegation or handler function
     * @param {Function} [handler] - Event handler if selector is provided
     * @returns {Component} This component instance for chaining
     */
    on(eventType, selector, handler) {
        this.eventManager.on(eventType, selector, handler)
        return this
    }

    /**
     * Remove an event listener from the component's element
     * @param {string} eventType - Event type to remove
     * @param {Function} handler - Original handler function to remove
     * @returns {Component} This component instance for chaining
     */
    off(eventType, handler) {
        this.eventManager.off(eventType, handler)
        return this
    }

    /**
     * Emit a custom event from the component's element
     * @param {string} eventName - Name of the event to emit
     * @param {Object} detail - Data to include with the event
     * @returns {Component} This component instance for chaining
     */
    emit(eventName, detail = {}) {
        this.eventManager.emit(eventName, detail)
        return this
    }

    /**
     * Lifecycle hook called when component is connected to the DOM
     */
    connectedCallback() {
        // To be implemented by subclasses
    }

    /**
     * Lifecycle hook called when component is disconnected from the DOM
     */
    disconnectedCallback() {
        // To be implemented by subclasses
    }

    /**
     * @private Internal method to handle connection logic.
     * Called either by constructor (if already connected) or LifecycleObserver.
     */
    _handleConnected() {
        if (this.isDestroyed || this.isConnected) {
            return // Prevent double execution
        }
        this.isConnected = true
        this.connectedCallback()

        // Trigger initial render only on the *first* connection
        if (this.options.renderOnCreate && !this.hasRenderedInitially) {
            this.hasRenderedInitially = true
            this.render()
        }
    }

    /**
     * @private Internal method to handle disconnection logic.
     * Called by LifecycleObserver.
     */
    _handleDisconnected() {
        if (this.isDestroyed || !this.isConnected) {
            return // Prevent double execution or acting if never connected
        }
        this.isConnected = false // Update state *before* calling user code/destroy
        this.disconnectedCallback()
        this.destroy()
    }

    /**
     * Lifecycle hook called when an attribute changes on the element
     * @param {string} name - Name of the attribute
     * @param {string} oldValue - Previous value
     * @param {string} newValue - New value
     */
    attributeChangedCallback(name, oldValue, newValue) {
        // To be implemented by subclasses
    }

    /**
     * Lifecycle hook called when component becomes visible in viewport
     */
    visibleCallback() {
        // To be implemented by subclasses
    }

    /**
     * Lifecycle hook called when component becomes hidden from viewport
     */
    hiddenCallback() {
        // To be implemented by subclasses
    }

    /**
     * Clean up and destroy the component
     */
    destroy() {
        if (this.isDestroyed) return

        // Set flags early to prevent race conditions
        this.isDestroyed = true
        this.isConnected = false // Ensure disconnected state on destroy

        // Destroy subsystems first
        this.lifecycleObserver.destroy()
        this.eventManager.destroy()
        this.renderer.destroy()
        // StateManager doesn't have explicit destroy, relies on component GC

        // Clean up element reference
        if (this.element._component === this) {
            delete this.element._component
        }

        // Nullify references (optional, helps GC)
        this.element = null
        this.stateManager = null
        this.eventManager = null
        this.renderer = null
        this.lifecycleObserver = null
        this.state = null
        this.options = null
    }
}
