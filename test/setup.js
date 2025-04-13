import { beforeEach, afterEach } from 'bun:test'
import { Window } from 'happy-dom'
import { GlobalRegistrator } from '@happy-dom/global-registrator'

GlobalRegistrator.register()

// // Create a simulated DOM environment before each test
// beforeEach(() => {
//     const window = new Window()
//     global.window = window
//     global.document = window.document
//     global.navigator = window.navigator
//     global.requestAnimationFrame = window.requestAnimationFrame.bind(window)
//     global.cancelAnimationFrame = window.cancelAnimationFrame.bind(window)
//     global.CustomEvent = window.CustomEvent
//     global.HTMLElement = window.HTMLElement
//     global.MutationObserver = window.MutationObserver
//     global.IntersectionObserver = window.IntersectionObserver // happy-dom provides mocks
// })

// // Clean up after each test
// afterEach(() => {
//     delete global.window
//     delete global.document
//     delete global.navigator
//     delete global.requestAnimationFrame
//     delete global.cancelAnimationFrame
//     delete global.CustomEvent
//     delete global.HTMLElement
//     delete global.MutationObserver
//     delete global.IntersectionObserver
// })

// Helper to wait for the next animation frame (for render checks)
export async function waitForRender() {
    return new Promise((resolve) => requestAnimationFrame(resolve))
}

// Helper to wait for microtasks (e.g., MutationObserver)
export async function nextTick() {
    return new Promise((resolve) => setTimeout(resolve, 0))
}
