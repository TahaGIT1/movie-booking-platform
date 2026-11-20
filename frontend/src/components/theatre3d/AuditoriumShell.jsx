import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CURVE_CENTER_Z, CURVE_RADIUS } from './lib/seatLayout';
import { ROOM, SCREEN, STAGE, makeWoodTexture, backWallZ as getBackWallZ } from './lib/scene';

const ROW_HALF_DEPTH = 0.6;
const STEP_HALF_ANGLE = 0.6;

/** A curved riser (annular sector) so steps follow the curved seat rows. */
function stepGeometry(rInner, rOuter, bottom, top) {
    // Clamp the sweep so risers stop at the side walls.
    const halfAngle = Math.min(STEP_HALF_ANGLE, Math.asin(Math.min(1, (ROOM.halfWidth - 0.05) / rOuter)));
    const shape = new THREE.Shape();
    const mid = -Math.PI / 2;
    shape.absarc(0, 0, rOuter, mid - halfAngle, mid + halfAngle, false);
    shape.absarc(0, 0, rInner, mid + halfAngle, mid - halfAngle, true);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.05, top - bottom), bevelEnabled: false, curveSegments: 28 });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, bottom, CURVE_CENTER_Z);
    return geo;
}

/** Curtain with sine folds. */
function curtainGeometry(width, height, folds) {
    const geo = new THREE.PlaneGeometry(width, height, folds * 6, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i);
        pos.setZ(i, Math.sin((x / width) * folds * Math.PI * 2) * 0.18);
    }
    geo.computeVertexNormals();
    return geo;
}

function useRiserGeometry(rows) {
    return useMemo(() => {
        const stalls = [];
        const balcony = [];
        const radiusOf = (row) => CURVE_RADIUS + row.depth;
        rows.forEach((row, i) => {
            const r = radiusOf(row);
            const prev = rows[i - 1];
            const next = rows[i + 1];
            const inner = prev && prev.tier === row.tier ? (radiusOf(prev) + r) / 2 : r - ROW_HALF_DEPTH - 0.4;
            const outer = next && next.tier === row.tier ? (radiusOf(next) + r) / 2 : r + (row.recliner ? 0.95 : ROW_HALF_DEPTH + 0.2);
            if (row.tier === 'balcony') balcony.push(stepGeometry(inner, outer, row.y - 0.9, row.y));
            else stalls.push(stepGeometry(inner, outer, 0, row.y));
        });
        return {
            stalls: stalls.length ? mergeGeometries(stalls) : null,
            balcony: balcony.length ? mergeGeometries(balcony) : null,
        };
    }, [rows]);
}

export function AuditoriumShell({ layout }) {
    const { rows, bounds } = layout;
    const backWallZ = getBackWallZ(bounds);
    const roomDepth = backWallZ - ROOM.frontZ;
    const roomMidZ = (backWallZ + ROOM.frontZ) / 2;

    const textures = useMemo(() => {
        const wall = makeWoodTexture({ base: '#8a4a22', dark: '#3d1b0a', panels: 6 });
        wall.repeat.set(roomDepth / 6, 2.2);
        const front = makeWoodTexture({ base: '#7d4120', dark: '#3d1b0a', panels: 8 });
        front.repeat.set(3, 2);
        const stage = makeWoodTexture({ base: '#b06a35', dark: '#6b3a18', panels: 16, grooves: true });
        stage.rotation = Math.PI / 2;
        stage.repeat.set(1, 3);
        const riser = makeWoodTexture({ base: '#6e3518', dark: '#3a1808', panels: 10 });
        riser.repeat.set(0.05, 0.05);
        return { wall, front, stage, riser };
    }, [roomDepth]);
    useEffect(() => () => Object.values(textures).forEach((t) => t.dispose()), [textures]);

    const risers = useRiserGeometry(rows);
    useEffect(() => () => {
        risers.stalls?.dispose();
        risers.balcony?.dispose();
    }, [risers]);

    const curtain = useMemo(() => curtainGeometry(3.4, SCREEN.height + 4, 5), []);
    const valance = useMemo(() => curtainGeometry(SCREEN.width + 7, 1.6, 22), []);
    useEffect(() => () => {
        curtain.dispose();
        valance.dispose();
    }, [curtain, valance]);

    const balconyRows = rows.filter((r) => r.tier === 'balcony');
    const balconyFront = balconyRows[0];
    const parapet = useMemo(() => {
        if (!balconyFront) return null;
        const r = CURVE_RADIUS + balconyFront.depth - ROW_HALF_DEPTH - 0.55;
        return stepGeometry(r - 0.15, r + 0.15, balconyFront.y - 1.0, balconyFront.y + 0.8);
    }, [balconyFront]);
    useEffect(() => () => parapet?.dispose(), [parapet]);

    return (
        <group>
            {/* Floor (carpet) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, roomMidZ]}>
                <planeGeometry args={[ROOM.halfWidth * 2, roomDepth]} />
                <meshStandardMaterial color="#3a1414" roughness={1} />
            </mesh>

            {/* Side walls (single sided, face inward, so outside camera views see through) */}
            <mesh position={[-ROOM.halfWidth, ROOM.height / 2, roomMidZ]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[roomDepth, ROOM.height]} />
                <meshStandardMaterial map={textures.wall} roughness={0.75} />
            </mesh>
            <mesh position={[ROOM.halfWidth, ROOM.height / 2, roomMidZ]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[roomDepth, ROOM.height]} />
                <meshStandardMaterial map={textures.wall} roughness={0.75} />
            </mesh>
            <mesh position={[0, ROOM.height / 2, backWallZ]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[ROOM.halfWidth * 2, ROOM.height]} />
                <meshStandardMaterial map={textures.wall} roughness={0.75} />
            </mesh>
            <mesh position={[0, ROOM.height / 2, ROOM.frontZ]}>
                <planeGeometry args={[ROOM.halfWidth * 2, ROOM.height]} />
                <meshStandardMaterial map={textures.front} roughness={0.8} />
            </mesh>
            {/* Ceiling faces down only, so the bird's-eye camera looks straight through it */}
            <mesh position={[0, ROOM.height, roomMidZ]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[ROOM.halfWidth * 2, roomDepth]} />
                <meshStandardMaterial color="#1a0d08" roughness={1} />
            </mesh>

            {/* Stage */}
            <mesh position={[0, STAGE.height / 2, STAGE.frontZ - STAGE.depth / 2]}>
                <boxGeometry args={[STAGE.width, STAGE.height, STAGE.depth]} />
                <meshStandardMaterial map={textures.stage} roughness={0.55} metalness={0.05} />
            </mesh>
            <mesh position={[0, STAGE.height - 0.02, STAGE.frontZ + 0.03]}>
                <boxGeometry args={[STAGE.width, 0.06, 0.08]} />
                <meshStandardMaterial color="#ffcf8a" emissive="#ffb347" emissiveIntensity={1.2} />
            </mesh>

            {/* Curtains */}
            {[-1, 1].map((side) => (
                <mesh key={side} geometry={curtain} position={[side * (SCREEN.width / 2 + 1.5), SCREEN.y + 0.6, SCREEN.z + 0.35]}>
                    <meshStandardMaterial color="#9b0f16" roughness={0.65} side={THREE.DoubleSide} />
                </mesh>
            ))}
            <mesh geometry={valance} position={[0, SCREEN.y + SCREEN.height / 2 + 1.1, SCREEN.z + 0.45]}>
                <meshStandardMaterial color="#8a0c12" roughness={0.65} side={THREE.DoubleSide} />
            </mesh>

            {/* Stadium risers + balcony */}
            {risers.stalls && (
                <mesh geometry={risers.stalls}>
                    <meshStandardMaterial color="#5a2a14" roughness={0.9} />
                </mesh>
            )}
            {risers.balcony && (
                <mesh geometry={risers.balcony}>
                    <meshStandardMaterial color="#4a2010" roughness={0.9} />
                </mesh>
            )}
            {parapet && (
                <mesh geometry={parapet}>
                    <meshStandardMaterial map={textures.riser} color="#a0582c" roughness={0.6} />
                </mesh>
            )}

            {/* Exit signs and wall sconces */}
            {[-1, 1].map((side) => (
                <group key={`deco-${side}`}>
                    <mesh position={[side * (ROOM.halfWidth - 0.05), 3.2, STAGE.frontZ + 2]} rotation={[0, -side * Math.PI / 2, 0]}>
                        <planeGeometry args={[0.9, 0.35]} />
                        <meshBasicMaterial color="#22ff88" toneMapped={false} />
                    </mesh>
                    {[0.2, 0.5, 0.8].map((f) => (
                        <mesh key={f} position={[side * (ROOM.halfWidth - 0.08), 6.5, ROOM.frontZ + roomDepth * f]}>
                            <boxGeometry args={[0.1, 0.9, 0.3]} />
                            <meshStandardMaterial color="#ffd9a0" emissive="#ffb066" emissiveIntensity={2} toneMapped={false} />
                        </mesh>
                    ))}
                </group>
            ))}
        </group>
    );
}
