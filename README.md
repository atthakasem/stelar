# STELAR.js - Stateful Element Augmentor

[![NPM Version](https://img.shields.io/npm/v/stelar.svg)](https://www.npmjs.com/package/stelar)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**STELAR.js** is a lightweight, reactive component library for building modern web applications with minimal overhead. It enhances standard HTML elements with state management, lifecycle hooks, and efficient DOM interactions, offering a simple alternative to larger frameworks.

## Key Features

- **DOM-Centric:** Augments existing HTML elements, integrating smoothly into server-rendered or static HTML.
- **Reactive State:** Simple state management (`this.state`, `this.setState`) with automatic UI updates.
- **Efficient Rendering:** Uses `requestAnimationFrame` for debounced rendering. Supports selective rendering via `renderMap` and `renderProps` for performance optimization.
- **Lifecycle Hooks:** Comprehensive hooks including `init`, `connectedCallback`, `disconnectedCallback`, `attributeChangedCallback`, `visibleCallback`, and `hiddenCallback`.
- **Event Handling:** Easy event listener management (`on`, `off`, `emit`) with built-in delegation support.
- **Lightweight & Minimal:** Small footprint, focusing on core component functionalities without unnecessary abstractions.
- **Modular Design:** Core functionalities (State, Events, Rendering, Lifecycle) are handled by dedicated subsystems.
- **Automatic Cleanup:** Automatically removes listeners and observers when elements are removed from the DOM or `destroy()` is called.

## Installation

```bash
# Using npm
npm install stelar

# Using yarn
yarn add stelar

# Using bun
bun add stelar
```

## Getting Started: Simple Counter Example

### HTML

```html
<!-- Use any identifier for your component, preferably data attributes or classes -->
<div data-counter></div>
```

### JavaScript

**counter-example.js:**

```javascript
import { Component } from 'stelar'

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
        this.element.innerHTML = `
            <p>Count: <span class="count">${this.state.count}</span></p>
            <button data-action="increment">⬆️</button>
            <button data-action="decrement">⬇️</button>
        `
    }
}
```

**app.js:**

```javascript
import { Counter } from './counter-example'

// Automatically initialize all elements matching the selector
Counter.create('[data-counter]')

// You can also create instances manually:
const element = document.querySelector('[data-counter]')
new Counter(element, { initialState: { count: 10 } }) // with optional initial state
```

## API Overview

### `Component`

The base class for all STELAR.js components.

- **`constructor(element, options = {})`**: Creates a component instance.
  - `element`: The `HTMLElement` the component manages.
  - `options`:
    - `initialState` (Object): Initial state values (merged with `initialState()` method such that conflicting keys are overridden by the option).
    - `renderOnCreate` (boolean, default: `true`): Render immediately after creation if connected to DOM.
    - `renderOnStateChange` (boolean, default: `true`): Automatically queue render on state changes.
- **`static create(selector, options = {}, BaseClass = this)`**: Finds elements matching `selector` and creates component instances of `BaseClass`. Returns an array of instances. Skips elements already initialized with the same `BaseClass`.
- **`initialState()`**: (Override) Returns an object defining the component's default initial state.
- **`init()`**: (Override) Called once after the component is constructed. Ideal for setting up initial event listeners, finding child elements, etc.
- **`render()`**: (Override) Updates the component's DOM based on `this.state`. Called automatically on creation (if `renderOnCreate`) and state changes (if `renderOnStateChange`), or manually.
- **`renderMap()`**: (Override) Returns an object mapping state property names (top-level) to specific rendering functions (e.g., `{ count: this.renderCountDisplay }`). Used for optimized partial renders.
- **`renderProps()`**: (Override) Returns an array of state property names (top-level). If defined, only changes to these properties (or their nested values) will trigger a render. If `null` (default), _any_ state change triggers a render check.
- **`setState(newState)`**: Merges `newState` into `this.state`. Triggers a render if `renderOnStateChange` is true and state actually changed. Returns the component instance.
- **`on(eventType, selector, handler)`**: Adds an event listener. Supports event delegation if `selector` (a CSS string) is provided. `handler` is bound to the component instance. Returns the component instance.
- **`off(eventType, handler)`**: Removes an event listener previously added with `on`. Returns the component instance.
- **`emit(eventName, detail = {})`**: Dispatches a `CustomEvent` from the component's element. Returns the component instance.
- **`destroy()`**: Cleans up the component, removing event listeners and observers.
- **Lifecycle Hooks**: (Override)
  - `connectedCallback()`: Called when the element is connected to the DOM.
  - `disconnectedCallback()`: Called when the element is disconnected from the DOM (triggers `destroy`).
  - `attributeChangedCallback(name, oldValue, newValue)`: Called when an observed attribute changes.
  - `visibleCallback()`: Called when the element enters the viewport (via `IntersectionObserver`).
  - `hiddenCallback()`: Called when the element exits the viewport.
- **Properties**:
  - `element`: The managed `HTMLElement`.
  - `state`: A reactive proxy (if `renderOnStateChange` is true) or plain object representing the component's state.
  - `options`: The configuration options passed to the constructor.
  - `isDestroyed`: Boolean indicating if `destroy()` has been called.

### Subsystems (Internal but accessible)

- `this.stateManager`: Manages state and reactivity.
- `this.eventManager`: Handles event listener registration and delegation.
- `this.renderer`: Manages the rendering queue and logic (`requestAnimationFrame`, `renderMap`).
- `this.lifecycleObserver`: Sets up and manages `MutationObserver` and `IntersectionObserver`.

## Advanced Usages

### Selective Rendering

For components with complex rendering logic, you can optimize updates by defining `renderMap` and/or `renderProps`.

_Code example coming soon_

- **`renderProps`**: Good for simple cases where you know only certain top-level state properties affect the UI. The entire `render()` method runs if _any_ listed prop changes.
- **`renderMap`**: Provides more granular control. Allows specific functions to run for specific top-level property changes, potentially avoiding a full `render()`. If a changed property _isn't_ in the map, the full `render()` is called as a fallback (unless prevented by `renderProps`).

**Note:** If both `renderProps` and `renderMap` are defined, `renderProps` acts as a primary filter. If a change occurs in a property _not_ listed in `renderProps`, _no_ render action (neither `renderMap` function nor full `render()`) will occur.

### Event handling

_Documentation coming soon_

### Lifecycle hooks

_Documentation coming soon_

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
