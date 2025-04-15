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
     * @param {Object|Array} target - The object or array to make reactive
     * @param {string} path - Property path for nested objects/arrays
     * @returns {Proxy} A reactive proxy of the target
     */
    _createReactiveProxy(target, path = '') {
        const stateManager = this

        // List of array methods that mutate the array in place
        const mutatingArrayMethods = [
            'push',
            'pop',
            'shift',
            'unshift',
            'splice',
            'sort',
            'reverse',
            'fill',
            'copyWithin',
        ]

        return new Proxy(target, {
            get: (target, property, receiver) => {
                // Use Reflect.get for correct receiver behavior
                const value = Reflect.get(target, property, receiver)

                // Intercept calls to mutating array methods
                if (
                    Array.isArray(target) &&
                    typeof property === 'string' &&
                    mutatingArrayMethods.includes(property)
                ) {
                    // Return a wrapper function for the mutating method
                    return function (...args) {
                        // Call the original array method on the raw target
                        const result = Array.prototype[property].apply(
                            target,
                            args
                        )

                        // Trigger reactivity: Mark the array path itself as changed
                        stateManager._notifyChange(path)

                        // Return the original result (e.g., pushed length, popped item)
                        return result
                    }
                }

                // Recursively proxy nested objects AND arrays
                // Check if value is an object (includes arrays) and not null
                if (value && typeof value === 'object') {
                    // Avoid proxying already proxied objects (though less critical with Reflect)
                    // Construct the nested path correctly for objects and arrays
                    const nestedPath = path
                        ? `${path}.${String(property)}`
                        : String(property)
                    return stateManager._createReactiveProxy(value, nestedPath)
                }

                // Return primitive values or non-mutating methods directly
                return value
            },

            set: (target, property, value, receiver) => {
                const oldValue = Reflect.get(target, property, receiver)

                // Prevent unnecessary updates if the value is identical
                // Use Object.is for accurate comparison (handles NaN)
                if (Object.is(oldValue, value)) {
                    return true
                }

                // Perform the set operation using Reflect
                const success = Reflect.set(target, property, value, receiver)

                if (success) {
                    // Determine the specific path that changed (e.g., 'list.0', 'user.name')
                    const changePath = path
                        ? `${path}.${String(property)}`
                        : String(property)
                    stateManager._notifyChange(changePath, path)
                }

                return success
            },

            deleteProperty: (target, property) => {
                if (Reflect.has(target, property)) {
                    const success = Reflect.deleteProperty(target, property)
                    if (success) {
                        const changePath = path
                            ? `${path}.${String(property)}`
                            : String(property)
                        stateManager._notifyChange(changePath, path)
                    }
                    return success
                }
                return true // Property didn't exist
            },
        })
    }

    /**
     * @private Helper to record changes and queue render
     * @param {string} specificPath - The full path of the changed property (e.g., 'a.b.c', 'arr.0')
     * @param {string} [basePath] - The path of the direct parent object/array (e.g., 'a.b', 'arr')
     */
    _notifyChange(specificPath, basePath = null) {
        // Add the specific path that changed
        this._changedProps.add(specificPath)

        // Also add the base path of the containing object/array if it exists.
        // This helps renderProps/renderMap keyed on top-level properties.
        // If specificPath is 'arr.0', basePath is 'arr'.
        // If specificPath is 'arr' (due to push/pop), basePath is null/empty, so we add 'arr'.
        const pathToAdd =
            basePath !== null
                ? basePath
                : specificPath.includes('.')
                  ? specificPath.substring(0, specificPath.lastIndexOf('.'))
                  : specificPath
        if (pathToAdd && pathToAdd !== specificPath) {
            // Avoid adding duplicates if specificPath is top-level
            this._changedProps.add(pathToAdd)
        } else if (!pathToAdd && specificPath) {
            // Handle top-level property change
            this._changedProps.add(specificPath)
        }

        if (this._isReactive && this.component?.renderer) {
            this.component.renderer.queueRender()
        }
    }

    /**
     * Update multiple state properties at once
     * @param {Object} newState - State properties to update
     * @returns {StateManager} This state manager instance
     */
    setState(newState) {
        // Use the proxy's set trap implicitly by assigning properties
        Object.entries(newState).forEach(([key, value]) => {
            // Accessing this.state[key] might trigger nested proxy creation if needed
            // Assigning triggers the 'set' trap defined in _createReactiveProxy
            this.state[key] = value
        })
        return this
    }

    /**
     * Get the set of properties that changed since last render
     * @returns {Set<string>} Set of changed property paths
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
