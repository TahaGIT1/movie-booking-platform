import * as THREE from 'three';

/** Fixed auditorium dimensions (scene units). Seats come from seatLayout.js. */
export const SCREEN = { width: 17, height: 7.4, y: 5.6, z: -15 };
export const STAGE = { width: 24, depth: 3.4, height: 1.0, frontZ: -11.6 };
export const ROOM = { halfWidth: 13.5, height: 15, frontZ: -15.6 };

export const PRESET_IDS = ['overview', 'stage', 'balcony', 'bird', 'tour'];
export const PRESET_LABELS = {
    overview: 'Overview',
    stage: 'From stage',
    balcony: 'Balcony',
    bird: "Bird's eye",
    tour: 'Tour',
};

const SCREEN_CENTER = [0, SCREEN.y, SCREEN.z];

/** Camera presets derived from the layout bounds so they adapt to hall size. */
export function buildCameraPresets(bounds) {
    const { backZ, balconyFrontZ, balconyFloorY, topY } = bounds;
    return {
        overview: { position: [12.5, topY + 9, backZ - 3], target: [-1, 0.5, -5] },
        stage: { position: [0, 3.4, -12.6], target: [0, 3, 3] },
        balcony: { position: [0, balconyFloorY + 2.4, balconyFrontZ + 1.8], target: [0, 2.5, -11] },
        bird: { position: [0, 44, (backZ - 12) / 2 + 0.5], target: [0, 0, (backZ - 12) / 2] },
    };
}

/** Z of the auditorium's back wall (shared by the room geometry and camera limits). */
export const backWallZ = (bounds) => bounds.backZ + 3;

/** Eye-level camera for a given seat looking at the middle of the screen. */
export function seatViewPreset(seat, bounds) {
    const [x, y, z] = seat.position;
    return { position: [x, y + 1.15, z + 0.15], target: SCREEN_CENTER, fitScreen: true, backWallZ: backWallZ(bounds) };
}

const SEAT_VIEW_MARGIN = 1.1; // leave a little room around the screen edges
const SEAT_VIEW_MAX_FOV = 90;
const WALL_CLEARANCE = 0.6;
const NEAR_CLIP_MARGIN = 0.15; // keep the clip plane just in front of the seat's eye point
const DISTANCE_STEP = 0.25; // pull-back search resolution (scene units)
export const DEFAULT_NEAR = 0.1;

/**
 * Frames the whole cinema screen for "View from seat" on any viewport. A seat close to the
 * screen on a narrow (portrait) display cannot see the full screen at the normal field of view,
 * so the camera first widens its FOV a little and then backs away behind the seat (never
 * dropping below the seat's eye height), staying inside the room. The fit is checked exactly by
 * projecting the screen corners, so steep side seats are handled too.
 *
 * @param {number[]} position seat eye position
 * @param {number[]} target screen centre
 * @param {{ baseFov: number, aspect: number, visibleFraction: number, backWallZ: number }} view
 * @returns {{ position: number[], fov: number | null, near: number | null }} fov / near are null
 *   when no override is needed
 */
export function fitSeatView(position, target, { baseFov, aspect, visibleFraction, backWallZ: wallZ }) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const P = new THREE.Vector3(...position);
    const T = new THREE.Vector3(...target);
    // Backing-off direction: away from the screen through the seat, but never downwards. Seat
    // eyes sit below the screen centre, so the plain sight line would sink behind the seat and
    // the rows in front would cover more of the screen.
    const away = P.clone().sub(T).normalize();
    const u = new THREE.Vector3(away.x, Math.max(away.y, 0), away.z).normalize();
    const posAt = (extra, out = new THREE.Vector3()) => out.copy(P).addScaledVector(u, extra);

    // Exact check: project the four screen corners through a probe camera that matches the
    // *visible* part of the canvas (the area not covered by the phone sheet). Off-axis seats see
    // the near edge of the screen much larger, which a straight-on estimate misses.
    const visible = Math.max(0.2, Math.min(1, visibleFraction));
    const probe = new THREE.PerspectiveCamera(baseFov, aspect / visible, 0.1, 500);
    const halfW = SCREEN.width / 2;
    const halfH = SCREEN.height / 2;
    const corners = [
        new THREE.Vector3(-halfW, SCREEN.y - halfH, SCREEN.z),
        new THREE.Vector3(halfW, SCREEN.y - halfH, SCREEN.z),
        new THREE.Vector3(-halfW, SCREEN.y + halfH, SCREEN.z),
        new THREE.Vector3(halfW, SCREEN.y + halfH, SCREEN.z),
    ];
    const limit = 1 / SEAT_VIEW_MARGIN;
    const projected = new THREE.Vector3();
    // `extra` = how far the camera has backed away from the seat's eye point.
    const fits = (fov, extra) => {
        // The visible window's vertical FOV is the full FOV narrowed by the covered fraction.
        probe.fov = (2 * Math.atan(Math.tan(toRad(fov) / 2) * visible) * 180) / Math.PI;
        probe.updateProjectionMatrix();
        posAt(extra, probe.position);
        probe.lookAt(T);
        probe.updateMatrixWorld();
        return corners.every((c) => {
            projected.copy(c).project(probe);
            return projected.z < 1 && Math.abs(projected.x) <= limit && Math.abs(projected.y) <= limit;
        });
    };

    // Furthest the camera may back away before leaving the room.
    const limits = [];
    if (u.z > 1e-6) limits.push((wallZ - WALL_CLEARANCE - P.z) / u.z);
    if (u.y > 1e-6) limits.push((ROOM.height - WALL_CLEARANCE - P.y) / u.y);
    if (Math.abs(u.x) > 1e-6) limits.push((ROOM.halfWidth - WALL_CLEARANCE - Math.sign(u.x) * P.x) / Math.abs(u.x));
    const maxExtra = Math.max(0, Math.min(...limits, Infinity));

    // Smallest FOV in [from, to] that fits at `extra`, or null.
    const fovThatFits = (from, to, extra) => {
        for (let f = from; f <= to; f += 1) if (fits(f, extra)) return f;
        return null;
    };
    // Smallest back-off in [0, maxExtra] that fits at `fov`, or null.
    const extraThatFits = (fov) => {
        for (let e = 0; e <= maxExtra + 1e-6; e += DISTANCE_STEP) if (fits(fov, e)) return e;
        return null;
    };

    let finalFov = baseFov;
    let finalExtra = 0;
    if (!fits(baseFov, 0)) {
        const comfortableMax = Math.min(baseFov + 12, SEAT_VIEW_MAX_FOV);
        // 1. Widen the FOV a little (up to +12°) while staying exactly at the seat.
        const atSeat = fovThatFits(baseFov, comfortableMax, 0);
        if (atSeat !== null) {
            finalFov = atSeat;
        } else {
            // 2. Step back behind the seat, as far as the room allows.
            finalFov = comfortableMax;
            const backed = extraThatFits(comfortableMax);
            finalExtra = backed ?? maxExtra;
            // 3. Wall reached first: widen further, up to the hard cap.
            if (backed === null) {
                finalFov = fovThatFits(comfortableMax, SEAT_VIEW_MAX_FOV, maxExtra) ?? SEAT_VIEW_MAX_FOV;
            }
        }
    }

    const finalPos = posAt(finalExtra);
    // When the camera backs away from the seat, the rows behind the seat would sit between the
    // camera and the screen. Push the near clip plane to just in front of the seat's eye point
    // so everything behind the seat (including its own backrest) is clipped away: the view is
    // the seat's view, zoomed out.
    const viewDir = T.clone().sub(finalPos).normalize();
    const seatDepth = P.clone().sub(finalPos).dot(viewDir);
    return {
        position: [finalPos.x, finalPos.y, finalPos.z],
        fov: Math.abs(finalFov - baseFov) < 0.1 ? null : finalFov,
        near: seatDepth > NEAR_CLIP_MARGIN ? seatDepth - NEAR_CLIP_MARGIN : null,
    };
}

/** Keyframes for the automatic fly-through; ends on the overview shot. */
export function buildTourKeyframes(presets, bounds) {
    const midZ = (bounds.frontZ + bounds.backZ) / 2;
    return [
        presets.overview,
        { position: [-11, 4, bounds.frontZ - 1], target: [0, 2, midZ] },
        presets.stage,
        { position: [11, 6, midZ], target: [0, SCREEN.y, SCREEN.z] },
        presets.balcony,
        { position: [0, 22, bounds.backZ - 2], target: [0, 1, midZ - 2] },
        presets.overview,
    ];
}

/** Procedural wood panelling so no texture files need to be fetched. */
export function makeWoodTexture({ base = '#7a3f1d', dark = '#4a220e', panels = 6, size = 512, grooves = true } = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    const panelW = size / panels;
    // Deterministic pseudo-random so the texture is stable between renders.
    let seed = 7;
    const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
    };
    for (let p = 0; p < panels; p += 1) {
        const x0 = p * panelW;
        const grad = ctx.createLinearGradient(x0, 0, x0 + panelW, 0);
        grad.addColorStop(0, 'rgba(255,200,150,0.08)');
        grad.addColorStop(0.5, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.18)');
        ctx.fillStyle = grad;
        ctx.fillRect(x0, 0, panelW, size);
        ctx.strokeStyle = 'rgba(40,15,5,0.25)';
        for (let g = 0; g < 9; g += 1) {
            ctx.lineWidth = 0.6 + rand() * 1.2;
            const gx = x0 + rand() * panelW;
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.bezierCurveTo(gx + rand() * 8 - 4, size * 0.33, gx + rand() * 8 - 4, size * 0.66, gx + rand() * 6 - 3, size);
            ctx.stroke();
        }
        if (grooves) {
            ctx.fillStyle = dark;
            ctx.fillRect(x0, 0, 3, size);
        }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    return tex;
}

/** Placeholder "now showing" card used when the backdrop image cannot be loaded. */
export function makeTitleCardTexture(title) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 446;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 1024, 446);
    grad.addColorStop(0, '#1b1030');
    grad.addColorStop(1, '#3a1410');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 446);
    ctx.fillStyle = '#f5a623';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NOW SHOWING', 512, 170);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 58px sans-serif';
    ctx.fillText(String(title || '').slice(0, 28), 512, 250);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

export const isDirectVideoUrl = (url) => typeof url === 'string' && /^https?:\/\/.+\.(mp4|webm|ogv|ogg|mov)(\?.*)?$/i.test(url);

const YOUTUBE_ID_PATTERN = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

/** Returns the 11-character video id from any common YouTube URL, or null. */
export const extractYouTubeId = (url) => {
    if (typeof url !== 'string') return null;
    if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;
    return url.match(YOUTUBE_ID_PATTERN)?.[1] || null;
};
