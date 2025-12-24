// Advanced Fingerprint Spoofing Script - 2025 Edition (Optimized for BrowserScan)
(function() {
    const config = window.__FINGERPRINT_CONFIG__ || {
        seed: Math.floor(Math.random() * 1000000),
        canvas: { enabled: true },
        webgl: { 
            enabled: true, 
            vendor: 'Google Inc. (NVIDIA)', 
            renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0, D3D11)',
            params: {
                maxTextureSize: 16384,
                redBits: 8, greenBits: 8, blueBits: 8, alphaBits: 8, depthBits: 24, stencilBits: 8,
                maxCombinedTextureImageUnits: 32
            }
        },
        navigator: { 
            platform: 'Win32', 
            hardwareConcurrency: 16, 
            deviceMemory: 32,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        }
    };

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

    // 1. Canvas Spoofing (Subtle & Persistent)
    if (config.canvas.enabled) {
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

        HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
            const context = this.getContext('2d');
            if (context) {
                const imageData = originalGetImageData.call(context, 0, 0, this.width, this.height);
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
    }

    // 2. WebGL Spoofing (Comprehensive)
    if (config.webgl.enabled) {
        const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
        const newGetParameter = function(parameter) {
            const UNMASKED_VENDOR_WEBGL = 37445;
            const UNMASKED_RENDERER_WEBGL = 37446;
            if (parameter === UNMASKED_VENDOR_WEBGL) return config.webgl.vendor;
            if (parameter === UNMASKED_RENDERER_WEBGL) return config.webgl.renderer;
            
            const paramMap = {
                3379: config.webgl.params.maxTextureSize,
                3410: config.webgl.params.redBits,
                3411: config.webgl.params.greenBits,
                3412: config.webgl.params.blueBits,
                3413: config.webgl.params.alphaBits,
                3414: config.webgl.params.depthBits,
                3415: config.webgl.params.stencilBits,
                35661: config.webgl.params.maxCombinedTextureImageUnits,
            };
            if (paramMap[parameter] !== undefined) return paramMap[parameter];
            return originalGetParameter.call(this, parameter);
        };
        hideFunction(newGetParameter, originalGetParameter);
        WebGLRenderingContext.prototype.getParameter = newGetParameter;
        if (window.WebGL2RenderingContext) {
            WebGL2RenderingContext.prototype.getParameter = newGetParameter;
        }
    }

    // 3. Navigator & Client Hints
    const descriptors = {
        platform: { get: () => config.navigator.platform, configurable: true },
        hardwareConcurrency: { get: () => config.navigator.hardwareConcurrency, configurable: true },
        deviceMemory: { get: () => config.navigator.deviceMemory, configurable: true },
        userAgent: { get: () => config.navigator.userAgent, configurable: true },
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

    // 4. Audio Spoofing
    const originalGetChannelData = AudioBuffer.prototype.getChannelData;
    AudioBuffer.prototype.getChannelData = function(channel) {
        const data = originalGetChannelData.call(this, channel);
        for (let i = 0; i < data.length; i += 100) {
            data[i] += (seededRandom(config.seed + i) - 0.5) * 0.0000001;
        }
        return data;
    };
    hideFunction(AudioBuffer.prototype.getChannelData, originalGetChannelData);

    console.log('[Manus] 2025 Stealth Protection Active');
})();
