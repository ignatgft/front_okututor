// Wrapper so locales can be lazy-loaded via dynamic import of a JS module
// (direct dynamic import of JSON breaks vite's SSR transform in vitest).
import translation from "./translation.json";
export default translation;
