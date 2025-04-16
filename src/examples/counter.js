import { Component } from '../stelar'

export class Counter extends Component {
    // Define the initial state (or set via options like below in app.js)
    initialState() {
        return {
            count: 0,
        }
    }

    // Set up event listeners and internal component logic here
    init() {
        // Add event listeners using delegation via `on()`
        this.on('click', '[data-action="increment"]', this.increment)
        this.on('click', '[data-action="decrement"]', this.decrement)
    }

    // Event handlers for increment & decrement
    increment() {
        // Modify state
        this.state.count++
    }

    decrement() {
        // You can also use `setState()`
        this.setState({ count: this.state.count - 1 })
    }

    // Automatically render the component's UI based on state
    render() {
        return `
            <p>Count: <span class="count">${this.state.count}</span></p>
            <button data-action="increment">⬆️</button>
            <button data-action="decrement">⬇️</button>
        `
    }
}
