import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { AuditoriumShell } from './AuditoriumShell';
import { ScreenMesh } from './ScreenMesh';
import { SeatInstances } from './SeatInstances';
import { CameraRig } from './CameraRig';
import { ROOM } from './lib/scene';

/**
 * The WebGL canvas: room, screen, seats and camera. Renders on demand
 * (pointer/camera/screen changes call invalidate), DPR capped, no shadows.
 */
export function TheatreScene({
    layout, seatClasses, occupiedSet, selectedSeats, hoverId, onHover, onSelect,
    shot, onTourEnd, initialShot, media, paused, reducedMotion,
}) {
    const classColors = useMemo(() => Object.fromEntries(seatClasses.map((c) => [c.id, c.color])), [seatClasses]);
    const midZ = (layout.bounds.frontZ + layout.bounds.backZ) / 2;

    return (
        <Canvas
            frameloop="demand"
            dpr={[1, 1.75]}
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
            <ScreenMesh {...media} paused={paused} />
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
                rotateSpeed={0.6}
            />
            <CameraRig initialTarget={initialShot.target} shot={shot} onTourEnd={onTourEnd} reducedMotion={reducedMotion} />
        </Canvas>
    );
}
