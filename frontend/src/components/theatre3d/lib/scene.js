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

/** Eye-level camera for a given seat looking at the middle of the screen. */
export function seatViewPreset(seat) {
    const [x, y, z] = seat.position;
    return { position: [x, y + 1.15, z + 0.15], target: SCREEN_CENTER };
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
