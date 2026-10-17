import { random, distance, lieAt, shotPlan } from './engine.js';

export class CourseRenderer {
    constructor(canvas, forest) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.forest = forest;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = 1000 * ratio; canvas.height = 700 * ratio;
        this.ratio = ratio;
        this.background = document.createElement('canvas');
        this.background.width = canvas.width; this.background.height = canvas.height;
    }

    setHole(hole) {
        this.hole = hole;
        const c = this.background.getContext('2d');
        c.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
        const rng = random(hole.seed + 4242);
        const forest = this.forest;
        c.fillStyle = forest ? '#68864d' : '#93ab69'; c.fillRect(0, 0, 1000, 700);
        // Thousands of seeded grass marks make the course feel like a place rather than a diagram.
        for (let i = 0; i < 11000; i++) {
            const x = rng() * 1000, y = rng() * 700;
            c.fillStyle = rng() > .5 ? '#d1dba51b' : '#244b211a';
            c.fillRect(x, y, 1 + rng() * 3, 1 + rng() * 2);
        }
        // Contour lines, softly visible in the rough.
        for (let i = 0; i < 7; i++) {
            c.beginPath(); c.ellipse(310, 320, 240 + i * 58, 160 + i * 37, -.6, 0, Math.PI * 2);
            c.strokeStyle = forest ? '#d4d9a511' : '#e0e5bb24'; c.lineWidth = 1; c.stroke();
        }
        // A winding footpath.
        c.beginPath(); c.moveTo(70, 700); c.bezierCurveTo(85, 410, 390, 410, 400, 0);
        c.strokeStyle = '#596b3d22'; c.lineWidth = 22; c.stroke();
        c.strokeStyle = forest ? '#b2a77b' : '#c2b795'; c.lineWidth = 13; c.stroke();
        c.strokeStyle = '#ded4ac44'; c.lineWidth = 8; c.stroke();
        // Fairway outline and clipped alternating mowing stripes.
        c.save();
        c.beginPath(); c.moveTo(hole.fairway[0].x, hole.fairway[0].y);
        for (const p of hole.fairway.slice(1)) c.lineTo(p.x, p.y);
        c.lineCap = 'round'; c.lineJoin = 'round';
        c.strokeStyle = '#4e703b'; c.lineWidth = hole.width * 2 + 18; c.stroke();
        c.strokeStyle = '#a7bd76'; c.lineWidth = hole.width * 2 + 4; c.stroke();
        c.strokeStyle = forest ? '#8daf64' : '#b2c980'; c.lineWidth = hole.width * 2; c.stroke();
        const fairwayMask = document.createElement('canvas');
        fairwayMask.width = 1000; fairwayMask.height = 700;
        const m = fairwayMask.getContext('2d');
        m.beginPath(); m.moveTo(hole.tee.x, hole.tee.y);
        for (const p of hole.fairway.slice(1)) m.lineTo(p.x, p.y);
        m.lineCap = 'round'; m.lineJoin = 'round'; m.lineWidth = hole.width * 2 - 4;
        m.strokeStyle = '#b4cb7b'; m.stroke(); m.globalCompositeOperation = 'source-atop';
        m.rotate(-.7); m.fillStyle = forest ? '#477f3920' : '#477b2e18';
        for (let i = -1000; i < 1800; i += 56) m.fillRect(i, -1000, 28, 2400);
        c.drawImage(fairwayMask, 0, 0); c.restore();
        // Water has a shoreline, depth gradient, reflected clouds, reeds and red penalty stakes.
        for (const lake of hole.water) {
            c.save(); c.translate(lake.x, lake.y);
            c.beginPath(); c.ellipse(0, 0, lake.rx + 10, lake.ry + 10, 0, 0, Math.PI * 2);
            c.fillStyle = '#455c342e'; c.fill();
            c.beginPath(); c.ellipse(0, 0, lake.rx + 4, lake.ry + 4, 0, 0, Math.PI * 2);
            c.fillStyle = '#b5b17d'; c.fill();
            const water = c.createLinearGradient(-100, -150, 120, 160);
            water.addColorStop(0, forest ? '#437e7e' : '#77a8a1'); water.addColorStop(.5, '#649c98'); water.addColorStop(1, '#315f64');
            c.beginPath(); c.ellipse(0, 0, lake.rx, lake.ry, 0, 0, Math.PI * 2); c.fillStyle = water; c.fill(); c.clip();
            for (let i = 0; i < 42; i++) {
                const x = (rng() - .5) * lake.rx * 2, y = (rng() - .5) * lake.ry * 2;
                c.beginPath(); c.ellipse(x, y, 10 + rng() * 33, 2, 0, 0, Math.PI); c.strokeStyle = '#e5efd531'; c.lineWidth = 1; c.stroke();
            }
            c.restore();
            for (let i = 0; i < 12; i++) {
                const a = i / 12 * Math.PI * 2, x = lake.x + Math.cos(a) * (lake.rx + 9), y = lake.y + Math.sin(a) * (lake.ry + 9);
                c.fillStyle = '#c5654c'; c.fillRect(x, y - 7, 3, 11); c.fillStyle = '#f4cead'; c.fillRect(x, y - 7, 3, 2);
            }
        }
        // Green with subtle concentric mowing bands.
        c.save(); c.translate(hole.cup.x, hole.cup.y);
        c.beginPath(); c.ellipse(0, 0, hole.greenRadius + 7, hole.greenRadius + 4, -.4, 0, Math.PI * 2); c.fillStyle = '#658848'; c.fill();
        const green = c.createRadialGradient(-12, -15, 5, 0, 0, 55);
        green.addColorStop(0, '#d0df9c'); green.addColorStop(1, forest ? '#9cbc75' : '#b6cf87');
        c.beginPath(); c.ellipse(0, 0, hole.greenRadius, hole.greenRadius - 3, -.4, 0, Math.PI * 2); c.fillStyle = green; c.fill();
        for (let i = 1; i < 4; i++) { c.beginPath(); c.ellipse(0, 0, i * 11, i * 10, -.4, 0, Math.PI * 2); c.strokeStyle = '#e7edbb2a'; c.lineWidth = 5; c.stroke(); }
        c.restore();
        // Bunker edges and lightly raked sand.
        for (const bunker of hole.bunkers) {
            c.save(); c.beginPath(); c.ellipse(bunker.x, bunker.y, bunker.rx + 3, bunker.ry + 3, 0, 0, Math.PI * 2); c.fillStyle = '#546c3a'; c.fill();
            c.beginPath(); c.ellipse(bunker.x, bunker.y, bunker.rx, bunker.ry, 0, 0, Math.PI * 2); c.fillStyle = '#e6d5a8'; c.fill(); c.clip();
            c.shadowBlur = 5; c.shadowColor = '#6a7139'; c.strokeStyle = '#b7a97e'; c.lineWidth = 5; c.stroke(); c.shadowBlur = 0;
            for (let i = -40; i < 45; i += 5) { c.beginPath(); c.moveTo(bunker.x - 50, bunker.y + i); c.quadraticCurveTo(bunker.x, bunker.y + i - 8, bunker.x + 50, bunker.y + i); c.strokeStyle = '#aa986b25'; c.lineWidth = 1; c.stroke(); }
            c.restore();
        }
        // White course-boundary stakes.
        for (let x = 40; x < 1000; x += 110) for (const y of [43, 651]) { c.fillStyle = '#fff7'; c.fillRect(x, y - 5, 2, 7); }
        // Seeded deciduous trees or pines outside the playing corridor.
        const trees = [];
        for (let i = 0; i < (forest ? 235 : 170); i++) {
            const p = { x: rng() * 1000, y: rng() * 700 };
            if (lieAt(hole, p) !== 'rough' || distance(p, hole.tee) < 45 || distance(p, hole.cup) < 95 || hole.fairway.slice(1).some((b, j) => {
                const a = hole.fairway[j], dx = b.x - a.x, dy = b.y - a.y, t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
                return distance(p, { x: a.x + dx * t, y: a.y + dy * t }) < hole.width + 28;
            })) continue;
            trees.push({ ...p, r: 10 + rng() * 13, v: rng() });
        }
        trees.sort((a, b) => a.y - b.y);
        for (const t of trees) this.tree(c, t, forest);
        // Tee box.
        c.save(); c.translate(hole.tee.x, hole.tee.y); c.rotate(Math.atan2(hole.cup.y - hole.tee.y, hole.cup.x - hole.tee.x) + Math.PI / 2);
        c.fillStyle = '#537740'; c.fillRect(-17, -10, 34, 22); c.fillStyle = '#a9c07a'; c.fillRect(-15, -9, 30, 19);
        c.fillStyle = '#f7f1d6'; c.fillRect(-17, -2, 5, 5); c.fillRect(12, -2, 5, 5); c.restore();
        // Subtle vignette.
        const shade = c.createRadialGradient(500, 350, 220, 500, 350, 620);
        shade.addColorStop(0, '#18372000'); shade.addColorStop(1, forest ? '#122d2c60' : '#29432330'); c.fillStyle = shade; c.fillRect(0, 0, 1000, 700);
    }

    tree(c, t, pine) {
        c.save(); c.translate(t.x, t.y);
        c.fillStyle = '#172b2638'; c.beginPath(); c.ellipse(9, 8, t.r * .9, t.r * .47, .5, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#6b6341'; c.fillRect(-2, -7, 4, 12);
        if (pine) {
            for (let j = 0; j < 3; j++) {
                c.beginPath(); c.moveTo(0, -t.r * 2 + j * t.r * .42); c.lineTo(-t.r * (1 - j * .18), 2 - j * t.r * .4); c.lineTo(t.r * (1 - j * .18), 2 - j * t.r * .4); c.closePath();
                c.fillStyle = ['#2b503d', '#386345', '#46724b'][j]; c.fill();
                c.beginPath(); c.moveTo(0, -t.r * 2 + j * t.r * .42); c.lineTo(-t.r * (1 - j * .18), 2 - j * t.r * .4); c.lineTo(0, -j * t.r * .4); c.closePath(); c.fillStyle = '#ffffff0d'; c.fill();
            }
        } else {
            const g = c.createRadialGradient(-t.r * .4, -t.r * .8, 1, 0, -t.r * .5, t.r);
            g.addColorStop(0, t.v > .6 ? '#acbc65' : '#8ba455'); g.addColorStop(.6, '#62824a'); g.addColorStop(1, '#3b633b');
            c.fillStyle = g; c.beginPath(); c.arc(0, -t.r * .5, t.r, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#c1cd842d'; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; c.beginPath(); c.arc(Math.cos(a) * t.r * .52 - 2, Math.sin(a) * t.r * .5 - t.r * .6, t.r * .38, 0, Math.PI * 2); c.fill(); }
        }
        c.restore();
    }

    draw(state, aim, club, power, animated = null) {
        const c = this.ctx, hole = this.hole;
        c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(this.background, 0, 0);
        c.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
        // Flag's shadow and pole.
        c.beginPath(); c.ellipse(hole.cup.x, hole.cup.y + 1, 6, 3.5, 0, 0, Math.PI * 2); c.fillStyle = '#294126'; c.fill();
        c.strokeStyle = '#29452640'; c.lineWidth = 2; c.beginPath(); c.moveTo(hole.cup.x, hole.cup.y); c.lineTo(hole.cup.x + 26, hole.cup.y + 12); c.stroke();
        c.strokeStyle = '#fff9e0'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(hole.cup.x, hole.cup.y); c.lineTo(hole.cup.x, hole.cup.y - 47); c.stroke();
        c.fillStyle = this.forest ? '#e8c77e' : '#df7757'; c.beginPath(); c.moveTo(hole.cup.x + 1, hole.cup.y - 48); c.lineTo(hole.cup.x + 25, hole.cup.y - 41); c.lineTo(hole.cup.x + 1, hole.cup.y - 32); c.fill();
        // Aim line and landing ring.
        if (!state.pending && !state.holed && !animated) {
            const plan = shotPlan(hole, state.ball, club, power, aim);
            c.save(); c.beginPath(); c.moveTo(state.ball.x, state.ball.y); c.lineTo(plan.end.x, plan.end.y);
            c.strokeStyle = '#fffbe8bf'; c.lineWidth = 2; c.setLineDash([7, 7]); c.stroke(); c.setLineDash([]);
            c.beginPath(); c.ellipse(plan.end.x, plan.end.y, 10, 7, 0, 0, Math.PI * 2); c.strokeStyle = '#fffce7'; c.lineWidth = 1.5; c.stroke();
            c.fillStyle = '#ffffff26'; c.fill(); c.restore();
        }
        if (state.holed && !animated) return;
        const ball = animated || { ...state.ball, height: 0 };
        c.fillStyle = '#19332055'; c.beginPath(); c.ellipse(ball.x + 3 + ball.height * .12, ball.y + 3, 5 + ball.height * .025, 2.7, 0, 0, Math.PI * 2); c.fill();
        const y = ball.y - ball.height;
        const g = c.createRadialGradient(ball.x - 2, y - 2, .3, ball.x, y, 5);
        g.addColorStop(0, '#ffffff'); g.addColorStop(.7, '#fffef3'); g.addColorStop(1, '#c1c9b2');
        c.fillStyle = g; c.beginPath(); c.arc(ball.x, y, 5, 0, Math.PI * 2); c.fill();
        if (!animated) { c.beginPath(); c.arc(ball.x, y, 10, 0, Math.PI * 2); c.strokeStyle = '#fffce255'; c.lineWidth = 1; c.stroke(); }
    }
}
