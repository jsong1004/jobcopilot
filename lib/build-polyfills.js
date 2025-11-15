/**
 * Build-time polyfills for browser-only APIs
 * This file provides minimal polyfills for browser globals that don't exist in Node.js
 * during Next.js build process.
 *
 * IMPORTANT: This runs during build to support static analysis, but not during production runtime.
 */

// Check if we're in a build context (not production runtime)
const isBuildContext = process.env.IS_BUILDING === 'true' ||
                       process.env.NODE_ENV !== 'production' ||
                       process.argv.some(arg => arg.includes('next') && arg.includes('build'));

// Always polyfill during build if File doesn't exist
if (typeof global !== 'undefined' && typeof File === 'undefined') {
  // Minimal File polyfill for build-time type checking and static analysis
  global.File = class File {
    constructor(bits, name, options) {
      this.name = name || '';
      this.size = 0;
      this.type = (options && options.type) || '';
    }

    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(0));
    }

    text() {
      return Promise.resolve('');
    }
  };

  // Only log during actual builds, not at runtime
  if (isBuildContext) {
    console.log('[Build Polyfill] File API polyfill loaded for Next.js build analysis');
  }
}

module.exports = {};
