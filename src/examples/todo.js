import { Component } from '../stelar'

export class Todo extends Component {
    initialState() {
        return {
            todos: [],
        }
    }

    init() {
        this.on('submit', this.handleSubmit)
    }

    // Use a render map to selectively render changes using a specified method
    // and only when a specific state has changed
    renderMap() {
        return {
            // When `todos` state has changed, render using `this.renderListItems`
            // onto the list element with selector `[data-ref="list"]`
            todos: {
                el: this.ref('list'),
                fn: this.renderListItems,
            },
        }
    }

    handleSubmit(event) {
        event.preventDefault()

        // Storing a reference to an element within the component in a variable can be infeasible. When the component
        // is re-rendered, that reference will be lost. Use `this.ref()` to track an element regardless of render cycle.
        if (this.ref('new-todo').value.trim() === '') return

        this.state.todos.push(this.ref('new-todo').value)

        // No need to wait for rendering to finish before manipulating the DOM since the input field
        // is never re-rendered thanks to the renderMap() above. Otherwise use `await this.waitForRender()`
        this.ref('new-todo').value = ''
        this.ref('new-todo').focus()
    }

    // Method for the (initial or otherwise) full render
    render() {
        return `
            <h3>To do</h3>
            <form action>
                <input type="text" data-ref="new-todo">
                <button type="submit">Add</button>
            </form>
            <ul data-ref="list"> <!-- Added data-ref -->
                ${this.renderListItems()}
            </ul>`
    }

    // Standalone method for rendering list items only
    renderListItems() {
        return this.state.todos.map((todo) => `<li>${todo}</li>`).join('')
    }
}
