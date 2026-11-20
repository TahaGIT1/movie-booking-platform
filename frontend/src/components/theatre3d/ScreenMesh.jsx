import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { SCREEN, isDirectVideoUrl, extractYouTubeId, makeTitleCardTexture } from './lib/scene';
import { TrailerScreen } from './TrailerScreen';

const SCREEN_FPS = 24;
const KEN_BURNS_PERIOD_S = 28;

/** Crops the texture to cover the screen aspect ratio, then applies a slow zoom/pan. */
function applyCover(tex, mediaAspect, t, kenBurns) {
    const screenAspect = SCREEN.width / SCREEN.height;
    let rx = 1;
    let ry = 1;
    if (mediaAspect > screenAspect) rx = screenAspect / mediaAspect;
    else ry = mediaAspect / screenAspect;
    const phase = kenBurns ? (Math.sin((t / KEN_BURNS_PERIOD_S) * Math.PI * 2) + 1) / 2 : 0;
    const zoom = 1 + phase * 0.14;
    rx /= zoom;
    ry /= zoom;
    const panX = kenBurns ? Math.sin((t / KEN_BURNS_PERIOD_S) * Math.PI) * 0.6 : 0;
    tex.repeat.set(rx, ry);
    tex.offset.set(((1 - rx) / 2) * (1 + panX), (1 - ry) / 2);
}

/**
 * The cinema screen. A YouTube trailer plays on top through <TrailerScreen>; a direct video
 * file plays as a WebGL texture; otherwise (and while the trailer loads) the backdrop shows
 * with a Ken Burns drift. Renders at ~24fps through invalidate() so the canvas can stay on
 * frameloop="demand".
 */
export function ScreenMesh({ videoUrl, imageUrl, fallbackImageUrl, title, paused, muted = true, trailerLayer }) {
    const youtubeId = useMemo(() => extractYouTubeId(videoUrl), [videoUrl]);
    const invalidate = useThree((s) => s.invalidate);
    const [media, setMedia] = useState(null); // { texture, aspect, kind }
    const fallback = useMemo(() => makeTitleCardTexture(title), [title]);
    const startRef = useRef(0);
    useEffect(() => {
        startRef.current = performance.now();
    }, []);

    useEffect(() => {
        let disposed = false;
        let video = null;
        let texture = null;

        const loadImage = (url, next) => {
            if (!url) {
                next();
                return;
            }
            new THREE.TextureLoader().load(
                url,
                (tex) => {
                    if (disposed) {
                        tex.dispose();
                        return;
                    }
                    tex.colorSpace = THREE.SRGBColorSpace;
                    texture = tex;
                    setMedia({ texture: tex, aspect: tex.image.width / tex.image.height, kind: 'image' });
                },
                undefined,
                () => next(),
            );
        };
        let fellBack = false;
        const loadImages = () => {
            if (fellBack || disposed) return;
            fellBack = true;
            loadImage(imageUrl, () => loadImage(fallbackImageUrl, () => setMedia(null)));
        };

        if (isDirectVideoUrl(videoUrl)) {
            video = document.createElement('video');
            video.src = videoUrl;
            video.crossOrigin = 'anonymous';
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.onloadeddata = () => {
                if (disposed) return;
                texture = new THREE.VideoTexture(video);
                texture.colorSpace = THREE.SRGBColorSpace;
                setMedia({ texture, aspect: video.videoWidth / video.videoHeight || 16 / 9, kind: 'video', video });
            };
            video.onerror = loadImages;
            video.play().catch(loadImages);
        } else {
            loadImages();
        }

        return () => {
            disposed = true;
            if (video) {
                video.pause();
                video.removeAttribute('src');
                video.load();
            }
            if (texture) texture.dispose();
        };
    }, [videoUrl, imageUrl, fallbackImageUrl]);

    useEffect(() => () => fallback.dispose(), [fallback]);

    // Drive the screen at a capped frame rate instead of rendering the whole scene at 60fps.
    useEffect(() => {
        if (paused) {
            media?.video?.pause();
            return undefined;
        }
        media?.video?.play().catch(() => {});
        const tick = () => {
            if (media?.texture) {
                const t = (performance.now() - startRef.current) / 1000;
                applyCover(media.texture, media.aspect, t, media.kind === 'image');
            }
            invalidate();
        };
        tick();
        if (!media) return undefined;
        const id = setInterval(tick, 1000 / SCREEN_FPS);
        return () => clearInterval(id);
    }, [media, paused, invalidate]);

    const map = media?.texture || fallback;

    return (
        <group position={[0, SCREEN.y, SCREEN.z]}>
            {/* frame */}
            <mesh position={[0, 0, -0.05]}>
                <planeGeometry args={[SCREEN.width + 0.6, SCREEN.height + 0.6]} />
                <meshBasicMaterial color="#050505" />
            </mesh>
            <mesh>
                <planeGeometry args={[SCREEN.width, SCREEN.height]} />
                <meshBasicMaterial map={map} toneMapped={false} />
            </mesh>
            {youtubeId && trailerLayer && <TrailerScreen videoId={youtubeId} muted={muted} paused={paused} layerEl={trailerLayer} />}
            {/* spill light from the screen onto the first rows */}
            <pointLight position={[0, -1.5, 4]} intensity={18} distance={22} decay={1.6} color="#cfe0ff" />
        </group>
    );
}
