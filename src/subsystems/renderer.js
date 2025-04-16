/**
 * Manages rendering for components with optimization support
 */
export class Renderer {
    /**
     * Create a new renderer
     * @param {Component} component - The component this renderer belongs to
     */
    constructor(component) {
        this.component = component
        this._renderScheduled = false
    }

    /**
     * Schedule a render using requestAnimationFrame
     */
    queueRender() {
        if (this._renderScheduled) return

        this._renderScheduled = true
        this._animationFrame = requestAnimationFrame(() => {
            if (!this.component.isDestroyed) {
                const changedProps =
                    this.component.stateManager.getChangedProps()
                this.component.stateManager.clearChangedProps()

                const renderProps = this.component.renderProps()
                const shouldRender =
                    !renderProps ||
                    Array.from(changedProps).some((prop) =>
                        renderProps.includes(prop.split('.')[0])
                    )

                if (shouldRender) {
                    this._handleRender(changedProps)
                }
            }
            this._renderScheduled = false
        })
    }

    /**
     * Orchestrate rendering based on component's render map and changed properties
     * @param {Set} changedProps - Set of property paths that changed
     */
    _handleRender(changedProps = null) {
        const renderMap = this.component.renderMap()

        if (Object.keys(renderMap).length === 0 || !changedProps) {
            return this.render()
        }

        const needsFullRender = Array.from(changedProps).some((prop) => {
            const topProp = prop.split('.')[0]
            return !renderMap[topProp]
        })

        if (needsFullRender) {
            return this.render()
        }

        Array.from(changedProps).forEach((prop) => {
            const topProp = prop.split('.')[0]
            if (renderMap[topProp]) {
                renderMap[topProp].el.innerHTML = renderMap[topProp].fn.call(
                    this.component
                )
                this.component._updateRefs()
            }
        })
    }

    /**
     * Perform a full render of the component
     */
    render() {
        this.component.element.innerHTML = this.component.render()
        this.component._updateRefs()
    }

    /**
     * Clean up any pending render operations
     */
    destroy() {
        if (this._animationFrame) {
            cancelAnimationFrame(this._animationFrame)
            this._renderScheduled = false
        }
    }
}
