/**
 * Build-time polyfills for browser-only APIs
 * This file provides minimal polyfills for browser globals that don't exist in Node.js
 * during Next.js build process.
 */

// Only apply polyfills if we're in a Node.js environment (server-side) and these don't exist
if (typeof global !== 'undefined' && typeof File === 'undefined') {
  // Minimal File polyfill for build-time type checking
  (global as any).File = class File {
    name: string;
    size: number;
    type: string;

    constructor(bits: any[], name: string, options?: any) {
      this.name = name;
      this.size = 0;
      this.type = options?.type || '';
    }

    arrayBuffer(): Promise<ArrayBuffer> {
      return Promise.resolve(new ArrayBuffer(0));
    }
  };
}

// Export empty object to make this a module
export {};
