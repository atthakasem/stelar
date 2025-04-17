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
        this._proxyCache = new WeakMap()
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
        if (!target || typeof target !== 'object') {
            return target
        }

        if (this._proxyCache.has(target)) {
            return this._proxyCache.get(target)
        }

        const stateManager = this

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

        const proxy = new Proxy(target, {
            get: (target, property, receiver) => {
                // Special handling for symbols and non-string properties
                if (typeof property === 'symbol' || property === '__proto__') {
                    return Reflect.get(target, property, receiver)
                }

                const value = Reflect.get(target, property, receiver)

                // Intercept calls to mutating array methods
                if (
                    Array.isArray(target) &&
                    mutatingArrayMethods.includes(property)
                ) {
                    return function (...args) {
                        const result = Array.prototype[property].apply(
                            target,
                            args
                        )
                        stateManager._notifyChange(path)
                        return result
                    }
                }

                // Recursively proxy nested objects
                if (value && typeof value === 'object') {
                    const nestedPath = path
                        ? `${path}.${String(property)}`
                        : String(property)

                    return stateManager._createReactiveProxy(value, nestedPath)
                }

                return value
            },

            set: (target, property, value, receiver) => {
                // Special handling for symbols and non-string properties
                if (typeof property === 'symbol' || property === '__proto__') {
                    return Reflect.set(target, property, value, receiver)
                }

                const oldValue = Reflect.get(target, property, receiver)

                // Check if the new value is the same as the old one
                if (Object.is(oldValue, value)) {
                    return true
                }

                // If value is an object, remove its proxy from cache if it exists
                // This prevents stale proxies when replacing entire object references
                if (oldValue && typeof oldValue === 'object') {
                    this._proxyCache.delete(oldValue)
                }

                // Perform the actual set
                const success = Reflect.set(target, property, value, receiver)

                if (success) {
                    const changePath = path
                        ? `${path}.${String(property)}`
                        : String(property)
                    stateManager._notifyChange(changePath, path)
                }

                return success
            },

            deleteProperty: (target, property) => {
                if (typeof property === 'symbol' || property === '__proto__') {
                    return Reflect.deleteProperty(target, property)
                }

                if (Reflect.has(target, property)) {
                    // If we're deleting an object, remove its proxy from cache
                    const oldValue = Reflect.get(target, property)
                    if (oldValue && typeof oldValue === 'object') {
                        this._proxyCache.delete(oldValue)
                    }

                    const success = Reflect.deleteProperty(target, property)
                    if (success) {
                        const changePath = path
                            ? `${path}.${String(property)}`
                            : String(property)
                        stateManager._notifyChange(changePath, path)
                    }
                    return success
                }
                return true
            },
        })

        // Store the proxy in the cache
        this._proxyCache.set(target, proxy)

        return proxy
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

    /**
     * Clean up the proxy cache and references
     */
    destroy() {
        this._proxyCache = null
        this._rawState = null
        this._changedProps.clear()
        this._changedProps = null
    }
}
