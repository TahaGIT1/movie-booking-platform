import { useEffect, useState } from 'react';

const MIN_3D_WIDTH = 640;

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

/** Whether the immersive 3D seat picker should be offered (WebGL + not a narrow phone). */
export function useImmersiveSupport() {
    const query = `(min-width: ${MIN_3D_WIDTH}px)`;
    const [wideEnough, setWideEnough] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
    useEffect(() => {
        const mql = window.matchMedia(query);
        const onChange = (e) => setWideEnough(e.matches);
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, [query]);
    return { webgl: hasWebGL(), wideEnough, supported: hasWebGL() && wideEnough };
}
