import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const BOOKED_COLOR = new THREE.Color('#2a2c35');
const SELECTED_COLOR = new THREE.Color('#2ee6d0').multiplyScalar(1.7); // >1 reads as a glow
const WHITE = new THREE.Color('#ffffff');
const POP_MS = 320;
const CLICK_DRAG_TOLERANCE_PX = 5;

/** Builds a chair (facing -Z) out of a few boxes merged into one geometry. */
function chairGeometry({ width, depth, backHeight }) {
    const part = (w, h, d, x, y, z, tiltX = 0) => {
        const g = new THREE.BoxGeometry(w, h, d);
        if (tiltX) g.rotateX(tiltX);
        g.translate(x, y, z);
        return g;
    };
    const parts = [
        part(width * 0.9, 0.16, depth, 0, 0.42, 0), // cushion
        part(width * 0.9, backHeight, 0.13, 0, 0.42 + backHeight / 2, depth / 2 - 0.02, -0.16), // backrest
        part(0.08, 0.3, depth * 0.95, -width / 2 + 0.04, 0.55, 0), // armrests
        part(0.08, 0.3, depth * 0.95, width / 2 - 0.04, 0.55, 0),
        part(width * 0.5, 0.36, depth * 0.5, 0, 0.18, 0.05), // pedestal
    ];
    const merged = mergeGeometries(parts);
    parts.forEach((p) => p.dispose());
    return merged;
}

const tmpObject = new THREE.Object3D();
const tmpColor = new THREE.Color();

function writeMatrix(mesh, index, seat, scale = 1) {
    tmpObject.position.set(seat.position[0], seat.position[1], seat.position[2]);
    tmpObject.rotation.set(0, seat.rotationY, 0);
    tmpObject.scale.setScalar(scale);
    tmpObject.updateMatrix();
    mesh.setMatrixAt(index, tmpObject.matrix);
}

/**
 * One InstancedMesh for a group of seats (standard chairs or recliners).
 * Colours are per instance: class colour, booked grey, selected cyan, hover highlight.
 */
function SeatMesh({ seats, geometry, colorFor, occupiedSet, selectedSet, hoverId, onHover, onSelect }) {
    const meshRef = useRef(null);
    const invalidate = useThree((s) => s.invalidate);
    const pops = useRef(new Map()); // seat index -> start time
    const prevSelected = useRef(selectedSet);
    const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 }), []);
    useEffect(() => () => material.dispose(), [material]);

    useLayoutEffect(() => {
        const mesh = meshRef.current;
        if (!mesh) return;
        seats.forEach((seat, i) => {
            writeMatrix(mesh, i, seat);
            if (occupiedSet.has(seat.id)) tmpColor.copy(BOOKED_COLOR);
            else if (selectedSet.has(seat.id)) tmpColor.copy(SELECTED_COLOR);
            else tmpColor.set(colorFor(seat));
            if (seat.id === hoverId && !occupiedSet.has(seat.id)) tmpColor.lerp(WHITE, 0.35);
            mesh.setColorAt(i, tmpColor);
        });
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.computeBoundingSphere();

        // Pop seats whose selection state changed.
        const now = performance.now();
        seats.forEach((seat, i) => {
            if (prevSelected.current.has(seat.id) !== selectedSet.has(seat.id)) pops.current.set(i, now);
        });
        prevSelected.current = selectedSet;
        invalidate();
    }, [seats, colorFor, occupiedSet, selectedSet, hoverId, invalidate]);

    useFrame(() => {
        const mesh = meshRef.current;
        if (!mesh || pops.current.size === 0) return;
        const now = performance.now();
        pops.current.forEach((start, i) => {
            const t = (now - start) / POP_MS;
            if (t >= 1) {
                writeMatrix(mesh, i, seats[i]);
                pops.current.delete(i);
            } else {
                writeMatrix(mesh, i, seats[i], 1 + Math.sin(t * Math.PI) * 0.35);
            }
        });
        mesh.instanceMatrix.needsUpdate = true;
        invalidate();
    });

    if (seats.length === 0) return null;

    return (
        <instancedMesh
            key={seats.length}
            ref={meshRef}
            args={[geometry, material, seats.length]}
            onPointerMove={(e) => {
                e.stopPropagation();
                onHover(seats[e.instanceId]?.id ?? null, e.nativeEvent);
            }}
            onPointerOut={() => onHover(null, null)}
            onClick={(e) => {
                e.stopPropagation();
                if (e.delta > CLICK_DRAG_TOLERANCE_PX) return; // a drag, not a click
                const seat = seats[e.instanceId];
                if (seat) onSelect(seat.id);
            }}
        />
    );
}

export function SeatInstances({ seats, classColors, occupiedSet, selectedSeats, hoverId, onHover, onSelect }) {
    const standard = useMemo(() => seats.filter((s) => !s.recliner), [seats]);
    const recliners = useMemo(() => seats.filter((s) => s.recliner), [seats]);
    const selectedSet = useMemo(() => new Set(selectedSeats), [selectedSeats]);
    const colorFor = useMemo(() => (seat) => classColors[seat.classId] || '#888888', [classColors]);

    const geometries = useMemo(
        () => ({
            standard: chairGeometry({ width: 0.66, depth: 0.56, backHeight: 0.62 }),
            recliner: chairGeometry({ width: 1.0, depth: 0.85, backHeight: 0.78 }),
        }),
        [],
    );
    useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries]);

    const shared = { colorFor, occupiedSet, selectedSet, hoverId, onHover, onSelect };
    return (
        <group>
            <SeatMesh seats={standard} geometry={geometries.standard} {...shared} />
            <SeatMesh seats={recliners} geometry={geometries.recliner} {...shared} />
        </group>
    );
}
