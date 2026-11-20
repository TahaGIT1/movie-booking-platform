import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { SCREEN } from './lib/scene';

// The player is laid out at this CSS size, then scaled down onto the 17 x 7.4 unit screen.
const PX_PER_UNIT = 80;
const PLAYER_WIDTH = Math.round(SCREEN.width * PX_PER_UNIT);
const PLAYER_HEIGHT = Math.round(SCREEN.height * PX_PER_UNIT);
// YouTube letterboxes 16:9 inside its frame; scale the iframe so it covers the wider screen.
const COVER_SCALE = Math.max(1, (SCREEN.width / SCREEN.height) / (16 / 9));
// Small delay after the iframe loads so the YouTube poster/first frame is up before we reveal it.
const REVEAL_DELAY_MS = 1200;

const buildEmbedUrl = (videoId) => {
    const params = new URLSearchParams({
        autoplay: '1',
        mute: '1',
        controls: '0',
        loop: '1',
        playlist: videoId, // required for loop to work on a single video
        rel: '0',
        playsinline: '1',
        modestbranding: '1',
        iv_load_policy: '3',
        disablekb: '1',
        enablejsapi: '1',
        origin: window.location.origin,
    });
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
};

/** Sends a command to the embedded player through the YouTube IFrame API postMessage channel. */
const sendPlayerCommand = (iframe, func) => {
    iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
};

function createPlayerElement(videoId, onLoad) {
    const holder = document.createElement('div');
    Object.assign(holder.style, {
        width: `${PLAYER_WIDTH}px`,
        height: `${PLAYER_HEIGHT}px`,
        overflow: 'hidden',
        background: '#000',
        pointerEvents: 'none',
    });
    const iframe = document.createElement('iframe');
    iframe.title = 'Movie trailer';
    iframe.src = buildEmbedUrl(videoId);
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.tabIndex = -1;
    Object.assign(iframe.style, {
        width: '100%',
        height: '100%',
        border: '0',
        pointerEvents: 'none',
        transform: `scale(${COVER_SCALE})`,
    });
    iframe.addEventListener('load', onLoad);
    holder.appendChild(iframe);
    return { holder, iframe };
}

/**
 * Plays the movie's YouTube trailer on the cinema screen. A YouTube video cannot be a WebGL
 * texture, so the iframe lives in a CSS3D layer *behind* the canvas (`layerEl`), placed with
 * the same camera, and a transparent mesh cuts a hole in the canvas where the screen is.
 * Seats, curtains and the stage still draw over it because the hole respects depth.
 */
export function TrailerScreen({ videoId, muted, paused, layerEl }) {
    const camera = useThree((s) => s.camera);
    const size = useThree((s) => s.size);
    const invalidate = useThree((s) => s.invalidate);
    const iframeRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const css = useMemo(() => ({ renderer: new CSS3DRenderer(), scene: new THREE.Scene() }), []);

    useEffect(() => {
        if (!layerEl || !videoId) return undefined;
        let revealTimer = null;
        const { holder, iframe } = createPlayerElement(videoId, () => {
            revealTimer = setTimeout(() => {
                setIsReady(true);
                invalidate();
            }, REVEAL_DELAY_MS);
        });
        iframeRef.current = iframe;

        const object = new CSS3DObject(holder);
        object.position.set(0, SCREEN.y, SCREEN.z + 0.02);
        object.scale.setScalar(1 / PX_PER_UNIT);
        css.scene.add(object);

        const dom = css.renderer.domElement;
        Object.assign(dom.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
        layerEl.appendChild(dom);
        invalidate();

        return () => {
            clearTimeout(revealTimer);
            setIsReady(false);
            iframeRef.current = null;
            css.scene.remove(object);
            iframe.src = 'about:blank';
            if (dom.parentNode === layerEl) layerEl.removeChild(dom);
        };
    }, [layerEl, videoId, css, invalidate]);

    useEffect(() => {
        css.renderer.setSize(size.width, size.height);
        invalidate();
    }, [size.width, size.height, css, invalidate]);

    // Keep the CSS3D layer in step with every WebGL frame (camera moves call invalidate()).
    useFrame(() => {
        css.renderer.render(css.scene, camera);
    });

    useEffect(() => {
        if (isReady) sendPlayerCommand(iframeRef.current, muted ? 'mute' : 'unMute');
    }, [muted, isReady]);

    useEffect(() => {
        if (isReady) sendPlayerCommand(iframeRef.current, paused ? 'pauseVideo' : 'playVideo');
    }, [paused, isReady]);

    if (!isReady) return null;

    // Writes alpha 0 over the screen so the trailer layer behind the canvas shows through.
    return (
        <mesh position={[0, 0, 0.01]} renderOrder={-1}>
            <planeGeometry args={[SCREEN.width, SCREEN.height]} />
            <meshBasicMaterial color="#000000" transparent opacity={0} blending={THREE.NoBlending} fog={false} toneMapped={false} />
        </mesh>
    );
}
