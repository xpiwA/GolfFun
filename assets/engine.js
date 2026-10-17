// Pure game rules and deterministic course generation; shared by the UI and tests.
export const VERSION = 1;
export const COURSE_COUNT = 100;
export const HOLE_COUNT = 18;
export const SCALE = 1.55; // Canvas units per metre. The canvas is always 1000 × 700.
export const CLUBS = Object.freeze({
    driver: { name: 'Driver', distance: 230, loft: 1 },
    wood: { name: 'Trä 3', distance: 205, loft: .85 },
    iron: { name: 'Järn 7', distance: 145, loft: 1.3 },
    wedge: { name: 'Wedge', distance: 75, loft: 1.6 },
    putter: { name: 'Putter', distance: 30, loft: 0 },
});
const PARS = [4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 5, 3, 4, 4, 3, 5, 4, 4];
const NAMES = ['Björklunden', 'Talludden', 'Ängsviken', 'Sjögläntan', 'Ekbacken', 'Morgondalen', 'Ljungheden', 'Bäckravinen', 'Solängen', 'Granviken'];
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function random(seed) {
    let n = seed >>> 0;
    return () => { n += 0x6D2B79F5; let t = Math.imul(n ^ n >>> 15, 1 | n); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function courseName(variant) { return `${NAMES[(variant - 1) % 10]} ${Math.floor((variant - 1) / 10) + 1}`; }
export function segmentDistance(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    return distance(p, { x: a.x + dx * t, y: a.y + dy * t });
}
export function inEllipse(p, ellipse) {
    return ((p.x - ellipse.x) / ellipse.rx) ** 2 + ((p.y - ellipse.y) / ellipse.ry) ** 2 < 1;
}
export function generateHole(variant, index) {
    if (!Number.isInteger(variant) || variant < 1 || variant > COURSE_COUNT || !Number.isInteger(index) || index < 0 || index >= HOLE_COUNT) throw new RangeError('Ogiltig bana eller hål.');
    const rng = random(variant * 1307 + index * 7919);
    const par = PARS[index];
    const mirror = rng() > .5;
    const tee = { x: 180 + rng() * 140, y: 565 + rng() * 35 };
    const cup = { x: par === 3 ? 420 + rng() * 70 : 650 + rng() * 110, y: par === 3 ? 310 + rng() * 35 : 115 + rng() * 60 };
    const fairway = [tee, { x: tee.x + (cup.x - tee.x) * .43 + (rng() - .5) * 150, y: tee.y + (cup.y - tee.y) * .47 }, cup];
    const water = [{ x: 825 + rng() * 20, y: 420 + rng() * 45, rx: 120 + rng() * 25, ry: 125 + rng() * 40 }];
    const bunkers = [{ x: cup.x - 65, y: cup.y - 23, rx: 32 + rng() * 15, ry: 22 + rng() * 10 }, { x: cup.x + 50, y: cup.y + 66, rx: 28 + rng() * 15, ry: 18 + rng() * 9 }];
    if (par !== 3) bunkers.push({ x: fairway[1].x - 82, y: fairway[1].y + 35, rx: 41, ry: 25 });
    const wind = { speed: Math.round(rng() * 75) / 10, direction: rng() * Math.PI * 2 };
    if (mirror) {
        for (const p of [tee, cup, ...fairway.slice(1, 2), ...water, ...bunkers]) p.x = 1000 - p.x;
    }
    return { variant, index, par, tee, cup, fairway, width: par === 3 ? 48 : 57 + rng() * 9, greenRadius: 44, water, bunkers, wind, seed: variant * 1307 + index * 7919 };
}
export function lieAt(hole, p) {
    if (p.x < 30 || p.x > 970 || p.y < 40 || p.y > 655) return 'out';
    if (hole.water.some(e => inEllipse(p, e))) return 'water';
    if (hole.bunkers.some(e => inEllipse(p, e))) return 'bunker';
    if (distance(p, hole.cup) <= hole.greenRadius) return 'green';
    if (distance(p, hole.tee) < 21) return 'tee';
    if (hole.fairway.slice(1).some((p2, i) => segmentDistance(p, hole.fairway[i], p2) < hole.width)) return 'fairway';
    return 'rough';
}
export function newRound(variant) {
    generateHole(variant, 0); // Validate the requested variant before creating state.
    const hole = generateHole(variant, 0);
    return { version: VERSION, variant, holeIndex: 0, strokes: 0, scores: Array(18).fill(null), ball: { ...hole.tee }, pending: null, holed: false, finished: false };
}
export function restoreRound(raw) {
    try {
        const s = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!s || s.version !== VERSION || !Number.isInteger(s.variant) || s.variant < 1 || s.variant > 100 || !Number.isInteger(s.holeIndex) || s.holeIndex < 0 || s.holeIndex > 17) return null;
        if (!Number.isInteger(s.strokes) || s.strokes < 0 || s.strokes > 10000 || !Array.isArray(s.scores) || s.scores.length !== 18 || s.scores.some(n => n !== null && (!Number.isInteger(n) || n < 1 || n > 10000))) return null;
        const point = p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1000 && p.y >= 0 && p.y <= 700;
        if (!point(s.ball) || ![s.holed, s.finished].every(x => typeof x === 'boolean')) return null;
        if (s.pending !== null && (!s.pending || s.pending.type !== 'water' || !point(s.pending.previous) || !point(s.pending.relief))) return null;
        if (s.scores.slice(0, s.holeIndex).some(n => n === null) || (s.holed && s.scores[s.holeIndex] !== s.strokes) || (!s.holed && s.scores[s.holeIndex] !== null) || (s.finished && (!s.holed || s.holeIndex !== 17))) return null;
        return { version: VERSION, variant: s.variant, holeIndex: s.holeIndex, strokes: s.strokes, scores: [...s.scores], ball: { ...s.ball }, pending: s.pending ? { type: 'water', previous: { ...s.pending.previous }, relief: { ...s.pending.relief } } : null, holed: s.holed, finished: s.finished };
    } catch { return null; }
}
export function recommendedClub(hole, ball) {
    const metres = distance(ball, hole.cup) / SCALE;
    if (lieAt(hole, ball) === 'green') return 'putter';
    if (lieAt(hole, ball) === 'bunker') return 'wedge';
    if (metres < 65) return 'wedge';
    if (metres < 150) return 'iron';
    return 'driver';
}
export function shotPlan(hole, ball, clubKey, power, angle) {
    const club = CLUBS[clubKey];
    if (!club || !Number.isFinite(power) || !Number.isFinite(angle)) throw new TypeError('Ogiltigt slag.');
    const lie = lieAt(hole, ball);
    const penalty = lie === 'bunker' ? (clubKey === 'wedge' ? .7 : .35) : lie === 'rough' ? .78 : 1;
    const length = club.distance * SCALE * clamp(power, 5, 100) / 100 * penalty;
    const drift = clubKey === 'putter' ? 0 : hole.wind.speed * 1.7 * (length / 350);
    const end = { x: ball.x + Math.cos(angle) * length + Math.cos(hole.wind.direction) * drift,
        y: ball.y + Math.sin(angle) * length + Math.sin(hole.wind.direction) * drift };
    const points = [];
    for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        points.push({ x: ball.x + (end.x - ball.x) * t, y: ball.y + (end.y - ball.y) * t, height: Math.sin(t * Math.PI) * Math.min(85, length * .22) * club.loft });
    }
    let pot = false;
    if (clubKey === 'putter') {
        const collision = points.findIndex((p, i) => i > 0 && (lieAt(hole, p) === 'water' || lieAt(hole, p) === 'out'));
        if (collision > -1) points.splice(collision + 1);
        const potIndex = points.findIndex((p, i) => i > 25 && distance(p, hole.cup) < 6 && length * (1 - i / 100) < 21);
        if (potIndex > -1) { points.splice(potIndex + 1); pot = true; }
    } else pot = distance(end, hole.cup) < 6;
    if (pot) points[points.length - 1] = { ...hole.cup, height: 0 };
    const landing = points[points.length - 1];
    return { club: clubKey, points, end: { x: landing.x, y: landing.y }, pot, lie: lieAt(hole, landing) };
}
export function takeShot(state, club, power, angle) {
    if (state.finished || state.holed || state.pending) throw new Error('Slaget kan inte göras nu.');
    const hole = generateHole(state.variant, state.holeIndex);
    const plan = shotPlan(hole, state.ball, club, power, angle);
    const next = { ...state, ball: { ...plan.end }, strokes: state.strokes + 1, scores: [...state.scores] };
    let message = '';
    if (plan.pot) {
        next.ball = { ...hole.cup }; next.holed = true;
        next.scores[state.holeIndex] = next.strokes;
        next.finished = state.holeIndex === 17;
        const relative = next.strokes - hole.par;
        message = next.strokes === 1 ? 'Hole-in-one! Vilket slag!' : relative <= -2 ? 'Eagle! Fantastiskt spelat.' : relative === -1 ? 'Birdie! Snyggt spelat.' : relative === 0 ? 'Par! Stabilt spelat.' : relative === 1 ? 'Bogey. Nästa hål väntar.' : `I hål på ${next.strokes} slag.`;
    } else if (plan.lie === 'out') {
        next.strokes += 1; next.ball = { ...state.ball };
        message = 'Out of bounds. Ett pliktslag tillagt. Slå igen från föregående plats.';
    } else if (plan.lie === 'water') {
        // Find the LAST water entry, then choose the dry point immediately before it.
        // This is the game's simplified red-penalty-area relief, never nearer the hole.
        let entry = 0;
        for (let i = 1; i < plan.points.length; i++) if (lieAt(hole, plan.points[i]) === 'water' && lieAt(hole, plan.points[i - 1]) !== 'water') entry = i - 1;
        let relief = plan.points[entry] || state.ball;
        const crossingDistance = distance(relief, hole.cup);
        for (let i = entry; i >= 0; i--) {
            const p = plan.points[i];
            if (!['water', 'out'].includes(lieAt(hole, p)) && distance(p, hole.cup) >= crossingDistance) { relief = p; break; }
        }
        next.pending = { type: 'water', previous: { ...state.ball }, relief: { x: relief.x, y: relief.y } };
        message = 'Bollen är i ett rött pliktområde. Välj lättnad eller slag och distans nedan (+1 pliktslag).';
    } else {
        const text = { green: 'På green! Läs linjen och putta mot flaggan.', bunker: 'I bunkern. En wedge hjälper dig upp.', rough: 'I ruffen. Räkna med kortare slag.', fairway: 'Mitt på fairway. Ett fint läge för nästa slag.', tee: 'Bollen är kvar nära tee.' };
        message = text[plan.lie] || 'Dags för nästa slag.';
    }
    return { state: next, plan, message };
}
export function takeRelief(state, replay = false) {
    if (!state.pending) throw new Error('Ingen lättnad att ta.');
    return { ...state, strokes: state.strokes + 1, ball: { ...(replay ? state.pending.previous : state.pending.relief) }, pending: null };
}
export function nextHole(state) {
    if (!state.holed || state.finished) throw new Error('Hålet är inte färdigspelat eller rundan är slut.');
    const index = state.holeIndex + 1;
    return { ...state, holeIndex: index, strokes: 0, ball: { ...generateHole(state.variant, index).tee }, holed: false, pending: null };
}
export function scoreSummary(state) {
    const played = state.scores.reduce((n, s) => n + (s === null ? 0 : 1), 0);
    const total = state.scores.reduce((n, s) => n + (s || 0), 0);
    const par = state.scores.reduce((n, s, i) => n + (s === null ? 0 : PARS[i]), 0);
    const relative = total - par;
    return { played, total, par, relative, label: relative === 0 ? 'E' : relative > 0 ? `+${relative}` : `${relative}` };
}
