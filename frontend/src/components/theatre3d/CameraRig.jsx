import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { DEFAULT_NEAR, fitSeatView } from './lib/scene';

const TWEEN_MS = 1300;
const TOUR_MS = 22000;

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const toVec = (arr) => new THREE.Vector3(arr[0], arr[1], arr[2]);

/**
 * Tweens the camera + OrbitControls target to a preset, or flies the Tour path.
 * `shot` = { key, position, target } for a tween, or { key, tour: [keyframes] }.
 * A new `key` starts a new move. Controls are disabled while the camera is moving.
 * Seat shots (`fitScreen`) are re-framed so the whole screen is visible on any viewport,
 * which may temporarily widen the FOV; every other shot tweens the FOV back to its base.
 */
export function CameraRig({ initialTarget, shot, onTourEnd, reducedMotion }) {
    const camera = useThree((s) => s.camera);
    const controls = useThree((s) => s.controls);
    const invalidate = useThree((s) => s.invalidate);
    const anim = useRef(null);
    const onTourEndRef = useRef(onTourEnd);
    useEffect(() => {
        onTourEndRef.current = onTourEnd;
    }, [onTourEnd]);

    // Aim the controls once they exist (the camera position comes from the Canvas props).
    useEffect(() => {
        if (!controls || !initialTarget) return;
        controls.target.set(initialTarget[0], initialTarget[1], initialTarget[2]);
        controls.update();
        invalidate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [controls]);

    // Once the user drags or pinches out of a seat view, drop the seat-view clip plane so
    // nothing gets clipped as they move the camera around.
    useEffect(() => {
        if (!controls) return undefined;
        const onStart = () => {
            if (camera.near === DEFAULT_NEAR) return;
            camera.near = DEFAULT_NEAR;
            camera.updateProjectionMatrix();
            invalidate();
        };
        controls.addEventListener('start', onStart);
        return () => controls.removeEventListener('start', onStart);
    }, [controls, camera, invalidate]);

    useEffect(() => {
        if (!shot || !controls) return;
        const now = performance.now();
        const baseFov = camera.userData.baseFov ?? camera.fov;
        let toPosition = shot.position;
        let toFov = baseFov;
        let toNear = DEFAULT_NEAR;
        if (shot.fitScreen) {
            const fit = fitSeatView(shot.position, shot.target, {
                baseFov,
                aspect: camera.aspect,
                visibleFraction: camera.userData.visibleFraction ?? 1,
                backWallZ: shot.backWallZ,
            });
            toPosition = fit.position;
            toFov = fit.fov ?? baseFov;
            toNear = fit.near ?? DEFAULT_NEAR;
        }
        // Leaving a seat view: restore the normal clip plane before the camera starts moving.
        if (camera.near !== DEFAULT_NEAR) {
            camera.near = DEFAULT_NEAR;
            camera.updateProjectionMatrix();
        }
        camera.userData.fovOverride = shot.fitScreen && toFov !== baseFov ? toFov : null;
        const fovTween = { fromFov: camera.fov, toFov, toNear };
        if (shot.tour) {
            const positions = [camera.position.clone(), ...shot.tour.map((k) => toVec(k.position))];
            const targets = [controls.target.clone(), ...shot.tour.map((k) => toVec(k.target))];
            anim.current = {
                kind: 'tour',
                start: now,
                duration: reducedMotion ? 1 : TOUR_MS,
                posCurve: new THREE.CatmullRomCurve3(positions, false, 'centripetal'),
                targetCurve: new THREE.CatmullRomCurve3(targets, false, 'centripetal'),
                ...fovTween,
            };
        } else {
            anim.current = {
                kind: 'tween',
                start: now,
                duration: reducedMotion ? 1 : TWEEN_MS,
                fromPos: camera.position.clone(),
                fromTarget: controls.target.clone(),
                toPos: toVec(toPosition),
                toTarget: toVec(shot.target),
                ...fovTween,
            };
        }
        controls.enabled = false;
        invalidate();
        // Only a new shot key restarts the move.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shot?.key, controls]);

    useFrame(() => {
        const a = anim.current;
        if (!a || !controls) return;
        const raw = Math.min(1, (performance.now() - a.start) / a.duration);
        if (a.kind === 'tour') {
            const t = easeInOutCubic(raw);
            a.posCurve.getPoint(t, camera.position);
            a.targetCurve.getPoint(t, controls.target);
        } else {
            const t = easeInOutCubic(raw);
            camera.position.lerpVectors(a.fromPos, a.toPos, t);
            controls.target.lerpVectors(a.fromTarget, a.toTarget, t);
        }
        const fovT = easeInOutCubic(Math.min(1, raw * (a.kind === 'tour' ? 8 : 1)));
        const fov = a.fromFov + (a.toFov - a.fromFov) * fovT;
        if (Math.abs(camera.fov - fov) > 1e-3) {
            camera.fov = fov;
            camera.updateProjectionMatrix();
        }
        controls.update();
        if (raw >= 1) {
            // Clip the rows behind a seat only once the camera has arrived at the seat view.
            if (a.toNear !== camera.near) {
                camera.near = a.toNear;
                camera.updateProjectionMatrix();
            }
            anim.current = null;
            controls.enabled = true;
            if (a.kind === 'tour') onTourEndRef.current?.();
        }
        invalidate();
    });

    return null;
}
