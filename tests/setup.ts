import "@testing-library/jest-dom/vitest";

// Node 25+ may expose an incomplete localStorage object when no
// --localstorage-file path is configured. JSDOM can inherit that object
// instead of installing its Storage implementation, so keep component tests
// deterministic across local Node versions.
if (typeof window.localStorage?.clear !== "function") {
  const values = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: memoryStorage,
  });
}
