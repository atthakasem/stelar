import { GlobalRegistrator } from '@happy-dom/global-registrator'

GlobalRegistrator.register()

// Helper to wait for the next animation frame (for render checks)
export async function waitForRender() {
    return new Promise((resolve) => requestAnimationFrame(resolve))
}

// Helper to wait for microtasks (e.g., MutationObserver)
export async function nextTick() {
    return new Promise((resolve) => setTimeout(resolve, 0))
}
