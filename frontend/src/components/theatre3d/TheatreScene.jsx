import React, { useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { AuditoriumShell } from './AuditoriumShell';
import { ScreenMesh } from './ScreenMesh';
import { SeatInstances } from './SeatInstances';
import { CameraRig } from './CameraRig';
import { ROOM } from './lib/scene';

// The camera presets were composed for a ~1.25:1 stage at a 50° vertical FOV. On taller
// (portrait) stages we keep that horizontal coverage by widening the vertical FOV, so the
// screen and the seating both stay in frame on phones and portrait tablets.
const BASE_FOV = 50;
const REFERENCE_ASPECT = 1.25;
const MAX_FOV = 78;
const REFERENCE_HALF_HFOV = Math.atan(Math.tan(THREE_DEG(BASE_FOV / 2)) * REFERENCE_ASPECT);
function THREE_DEG(deg) { return (deg * Math.PI) / 180; }

/**
 * Keeps the horizontal field of view constant as the stage gets narrower than the reference.
 * The responsive value is stored as camera.userData.baseFov; CameraRig may temporarily widen
 * it (camera.userData.fovOverride) for the seat view and tweens back to the base afterwards.
 */
function ResponsiveFov() {
    const camera = useThree((s) => s.camera);
    const width = useThree((s) => s.size.width);
    const height = useThree((s) => s.size.height);
    const invalidate = useThree((s) => s.invalidate);
    useEffect(() => {
        const aspect = width / Math.max(1, height);
        const fov = aspect >= REFERENCE_ASPECT
            ? BASE_FOV
            : Math.min(MAX_FOV, (2 * Math.atan(Math.tan(REFERENCE_HALF_HFOV) / aspect) * 180) / Math.PI);
        camera.userData.baseFov = fov;
        const applied = camera.userData.fovOverride ?? fov;
        if (Math.abs(camera.fov - applied) > 0.1) {
            camera.fov = applied;
            camera.updateProjectionMatrix();
            invalidate();
        }
    }, [camera, width, height, invalidate]);
    return null;
}

/**
 * The phone bottom sheet covers the lower part of the canvas. Shift the projection centre up
 * by half the covered height (setViewOffset) so every shot is centred in the part the user can
 * actually see, and publish the visible fraction for CameraRig's seat-view framing.
 */
function ViewInset({ bottomInset }) {
    const camera = useThree((s) => s.camera);
    const width = useThree((s) => s.size.width);
    const height = useThree((s) => s.size.height);
    const invalidate = useThree((s) => s.invalidate);
    useEffect(() => {
        const inset = Math.max(0, Math.min(bottomInset || 0, height * 0.6));
        if (inset > 0) camera.setViewOffset(width, height, 0, inset / 2, width, height);
        else camera.clearViewOffset();
        camera.userData.visibleFraction = height > 0 ? (height - inset) / height : 1;
        camera.updateProjectionMatrix();
        invalidate();
    }, [camera, width, height, bottomInset, invalidate]);
    return null;
}

// Touch devices get a lower pixel-ratio cap: phones have dense screens and weaker GPUs.
const IS_COARSE_POINTER = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
const DPR_RANGE = IS_COARSE_POINTER ? [1, 1.5] : [1, 1.75];

/**
 * The WebGL canvas: room, screen, seats and camera. Renders on demand
 * (pointer/camera/screen changes call invalidate), DPR capped, no shadows.
 */
export function TheatreScene({
    layout, seatClasses, occupiedSet, selectedSeats, hoverId, onHover, onSelect,
    shot, onTourEnd, initialShot, media, paused, muted, trailerLayer, reducedMotion, bottomInset = 0,
}) {
    const classColors = useMemo(() => Object.fromEntries(seatClasses.map((c) => [c.id, c.color])), [seatClasses]);
    const midZ = (layout.bounds.frontZ + layout.bounds.backZ) / 2;

    return (
        <Canvas
            frameloop="demand"
            dpr={DPR_RANGE}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            camera={{ position: initialShot.position, fov: 50, near: 0.1, far: 220 }}
            onPointerMissed={() => onHover(null, null)}
            style={{ touchAction: 'none' }}
        >
            <color attach="background" args={['#07080d']} />
            <fog attach="fog" args={['#07080d', 45, 110]} />
            <ambientLight intensity={0.55} color="#ffe2c4" />
            <hemisphereLight args={['#ffd7a8', '#2a0d08', 0.6]} />
            <directionalLight position={[4, 14, 10]} intensity={0.9} color="#ffe9cf" />
            <pointLight position={[-ROOM.halfWidth + 1.5, 7, midZ]} intensity={25} distance={26} color="#ffb070" />
            <pointLight position={[ROOM.halfWidth - 1.5, 7, midZ]} intensity={25} distance={26} color="#ffb070" />

            <AuditoriumShell layout={layout} />
            <ScreenMesh {...media} paused={paused} muted={muted} trailerLayer={trailerLayer} />
            <SeatInstances
                seats={layout.seats}
                classColors={classColors}
                occupiedSet={occupiedSet}
                selectedSeats={selectedSeats}
                hoverId={hoverId}
                onHover={onHover}
                onSelect={onSelect}
            />

            <OrbitControls
                makeDefault
                enableDamping
                dampingFactor={0.08}
                minDistance={3}
                maxDistance={62}
                maxPolarAngle={Math.PI * 0.54}
                zoomSpeed={0.8}
                rotateSpeed={IS_COARSE_POINTER ? 0.9 : 0.6}
            />
            <ResponsiveFov />
            <ViewInset bottomInset={bottomInset} />
            <CameraRig initialTarget={initialShot.target} shot={shot} onTourEnd={onTourEnd} reducedMotion={reducedMotion} />
        </Canvas>
    );
}
