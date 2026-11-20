let webglCache = null;
/** True when the browser can create a WebGL context. Cached after the first probe. */
export function hasWebGL() {
    if (webglCache !== null) return webglCache;
    try {
        const canvas = document.createElement('canvas');
        webglCache = Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
    } catch {
        webglCache = false;
    }
    return webglCache;
}

/**
 * Whether the immersive 3D seat picker can be offered. Every device with WebGL gets it —
 * phones and tablets included; the 3D page adapts its layout and camera to the screen.
 */
export function useImmersiveSupport() {
    const webgl = hasWebGL();
    return { webgl, supported: webgl };
}
