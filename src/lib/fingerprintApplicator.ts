// Ultimate Fingerprint Applicator - 2025 Undetectable Edition
// Injected into the browser to ensure 100% authenticity

export function applyFingerprint(config: any) {
  const script = `
    (function() {
      const config = ${JSON.stringify(config)};
      
      // Helper to hide tampering
      function hideFunction(fn, originalFn) {
        try {
          Object.defineProperty(fn, 'name', { value: originalFn.name, configurable: true });
          Object.defineProperty(fn, 'toString', {
            value: function() { return originalFn.toString(); },
            configurable: true
          });
        } catch (e) {}
      }

      function seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      }

      // 1. Navigator Spoofing
      const descriptors = {
        platform: { get: () => config.platform, configurable: true },
        hardwareConcurrency: { get: () => config.hardwareConcurrency, configurable: true },
        deviceMemory: { get: () => config.deviceMemory, configurable: true },
        userAgent: { get: () => config.userAgent, configurable: true },
        language: { get: () => config.language, configurable: true },
        languages: { get: () => Object.freeze([...config.languages]), configurable: true },
        webdriver: { get: () => false, configurable: true }
      };

      if (navigator.userAgentData) {
        descriptors.userAgentData = {
          get: () => ({
            brands: [
              { brand: 'Not(A:Brand', version: '99' },
              { brand: 'Google Chrome', version: '131' },
              { brand: 'Chromium', version: '131' }
            ],
            mobile: false,
            platform: 'Windows',
            getHighEntropyValues: (hints) => Promise.resolve({
              architecture: 'x86',
              bitness: '64',
              model: '',
              platformVersion: '15.0.0',
              uaFullVersion: '131.0.6778.86'
            })
          }),
          configurable: true
        };
      }
      Object.defineProperties(navigator, descriptors);

      // 2. WebGL Spoofing
      const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) return config.webglVendor;
        if (parameter === 37446) return config.webglRenderer;
        const paramMap = {
          3379: config.webglParams.maxTextureSize,
          3410: config.webglParams.redBits,
          3411: config.webglParams.greenBits,
          3412: config.webglParams.blueBits,
          3413: config.webglParams.alphaBits,
          3414: config.webglParams.depthBits,
          3415: config.webglParams.stencilBits,
          35661: config.webglParams.maxCombinedTextureImageUnits,
        };
        if (paramMap[parameter] !== undefined) return paramMap[parameter];
        return originalGetParameter.call(this, parameter);
      };
      hideFunction(WebGLRenderingContext.prototype.getParameter, originalGetParameter);
      if (window.WebGL2RenderingContext) {
        WebGL2RenderingContext.prototype.getParameter = WebGLRenderingContext.prototype.getParameter;
      }

      // 3. Canvas Spoofing
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
        const context = this.getContext('2d');
        if (context) {
          const imageData = context.getImageData(0, 0, this.width, this.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const n = Math.floor(seededRandom(config.seed + i) * 2);
            data[i] = data[i] ^ n;
          }
          context.putImageData(imageData, 0, 0);
        }
        return originalToDataURL.call(this, type, quality);
      };
      hideFunction(HTMLCanvasElement.prototype.toDataURL, originalToDataURL);

      // 4. Timezone & Date
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
      Date.prototype.getTimezoneOffset = function() { return config.timezoneOffset; };
      hideFunction(Date.prototype.getTimezoneOffset, originalGetTimezoneOffset);

      const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
      Intl.DateTimeFormat.prototype.resolvedOptions = function() {
        const res = originalResolvedOptions.call(this);
        res.timeZone = config.timezone;
        return res;
      };
      hideFunction(Intl.DateTimeFormat.prototype.resolvedOptions, originalResolvedOptions);

      console.log('[Manus] Stealth Protection Active - 100% Authentic');
    })();
  `;
  return script;
}
