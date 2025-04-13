/**
 * Manages reactive state with automatic change tracking
 */
export class StateManager {
    /**
     * Create a new state manager
     * @param {Component} component - The component this state belongs to
     * @param {Object} initialState - Initial state values
     * @param {boolean} isReactive - Whether state changes should trigger renders
     */
    constructor(component, initialState = {}, isReactive = true) {
        console.log('is reactive', isReactive)
        this.component = component
        this._changedProps = new Set()
        this._isReactive = isReactive

        this._initState(initialState)
    }

    /**
     * Initialize component state
     * @param {Object} initialState - Initial state values
     */
    _initState(initialState) {
        if (!this._isReactive) {
            this.state = { ...initialState }
            return
        }

        this._rawState = { ...initialState }
        this.state = this._createReactiveProxy(this._rawState)
    }

    /**
     * Create a reactive proxy that tracks state changes
     * @param {Object} target - The object to make reactive
     * @param {string} path - Property path for nested objects
     * @returns {Proxy} A reactive proxy of the target
     */
    _createReactiveProxy(target, path = '') {
        return new Proxy(target, {
            get: (target, property) => {
                const value = target[property]

                if (
                    value &&
                    typeof value === 'object' &&
                    !Array.isArray(value)
                ) {
                    return this._createReactiveProxy(
                        value,
                        path ? `${path}.${property}` : property
                    )
                }

                return value
            },

            set: (target, property, value) => {
                if (target[property] === value) {
                    return true
                }

                target[property] = value
                this._changedProps.add(path ? `${path}.${property}` : property)

                if (this._isReactive) {
                    this.component.renderer.queueRender()
                }

                return true
            },

            deleteProperty: (target, property) => {
                if (property in target) {
                    delete target[property]
                    this._changedProps.add(
                        path ? `${path}.${property}` : property
                    )

                    if (this._isReactive) {
                        this.component.renderer.queueRender()
                    }
                }
                return true
            },
        })
    }

    /**
     * Update multiple state properties at once
     * @param {Object} newState - State properties to update
     * @returns {StateManager} This state manager instance
     */
    setState(newState) {
        Object.entries(newState).forEach(([key, value]) => {
            if (this.state[key] !== value) {
                this.state[key] = value
            }
        })

        return this
    }

    /**
     * Get the set of properties that changed since last render
     * @returns {Set} Set of changed property paths
     */
    getChangedProps() {
        return new Set(this._changedProps)
    }

    /**
     * Clear the list of changed properties
     */
    clearChangedProps() {
        this._changedProps.clear()
    }
}
