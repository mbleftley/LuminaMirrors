export const COLORS = {
    CYAN: '#00f2ff',
    NEON_GREEN: '#33ff88', 
    SOLAR: '#ffcf33',
    DANGER: '#ff3e3e',
    TEXT: '#ffffff',
    BG: '#030303',
    VOID_STROKE: '#333b49'
};

export const HARMONIC_PALETTE = [COLORS.CYAN, COLORS.NEON_GREEN, COLORS.SOLAR];

export function getLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    const den = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (den === 0) return null;
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / den;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / den;
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) return { x: x1 + ua * (x2 - x1), y: y1 + ua * (y2 - y1) };
    return null;
}

export function getCircleIntersection(ox, oy, dx, dy, cx, cy, r) {
    const vx = ox - cx; const vy = oy - cy;
    const b = 2 * (dx * vx + dy * vy);
    const c = vx * vx + vy * vy - r * r;
    const disc = b * b - 4 * c;
    if (disc < 0) return null;
    const t = (-b - Math.sqrt(disc)) / 2;
    if (t > 0) return { x: ox + dx * t, y: oy + dy * t, dist: t };
    return null;
}
