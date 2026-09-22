import '@testing-library/jest-dom';

// Polyfill window.matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Polyfill ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom doesn't implement scrollTo/scrollIntoView — several components
// (e.g. AIAssistant's auto-scroll-to-latest-message effect) call these on
// mount/update, and an unpolyfilled call throws instead of silently no-oping
// the way a headless/undersized real viewport effectively would.
Element.prototype.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};
