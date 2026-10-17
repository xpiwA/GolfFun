import test from 'node:test';
import assert from 'node:assert/strict';
import { generateHole, newRound, restoreRound, shotPlan, takeShot, takeRelief, nextHole, scoreSummary, lieAt, distance, SCALE } from '../assets/engine.js';

test('all 100 variants have 18 reproducible playable holes and a par of 72', () => {
    const layouts = new Set();
    for (let variant = 1; variant <= 100; variant++) {
        let par = 0;
        for (let i = 0; i < 18; i++) {
            const h = generateHole(variant, i);
            assert.deepEqual(h, generateHole(variant, i));
            assert.equal(lieAt(h, h.cup), 'green');
            assert.equal(lieAt(h, h.tee), 'tee');
            assert.ok(distance(h.tee, h.cup) > 250);
            assert.ok(h.wind.speed >= 0 && h.wind.speed <= 7.5);
            par += h.par;
        }
        assert.equal(par, 72);
        layouts.add(JSON.stringify(generateHole(variant, 0)));
    }
    assert.equal(layouts.size, 100);
});

test('wind moves air shots but not putts; rough and bunker reduce shot length', () => {
    const h = generateHole(1, 0), calm = { ...h, wind: { speed: 0, direction: 0 } };
    const windy = { ...h, wind: { speed: 7, direction: 0 } };
    assert.notDeepEqual(shotPlan(calm, h.tee, 'driver', 80, -.5).end, shotPlan(windy, h.tee, 'driver', 80, -.5).end);
    assert.deepEqual(shotPlan(calm, h.cup, 'putter', 50, 1).end, shotPlan(windy, h.cup, 'putter', 50, 1).end);
    const plain = { ...calm, water: [], bunkers: [], fairway: [{ x: 100, y: 350 }, { x: 900, y: 350 }], cup: { x: 900, y: 350 }, tee: { x: 100, y: 350 } };
    const fairway = { x: 400, y: 350 }, rough = { x: 400, y: 550 };
    assert.ok(distance(rough, shotPlan(plain, rough, 'iron', 100, 0).end) < distance(fairway, shotPlan(plain, fairway, 'iron', 100, 0).end));
    assert.throws(() => shotPlan(h, h.tee, 'invalid', 50, 0));
});

test('out of bounds counts the stroke plus one penalty and returns to the original spot', () => {
    const s = newRound(3);
    s.ball = { x: 35, y: 350 };
    const { state } = takeShot(s, 'driver', 100, Math.PI);
    assert.equal(state.strokes, 2);
    assert.deepEqual(state.ball, s.ball);
    assert.equal(s.strokes, 0, 'input state is not mutated');
});

test('water requires a relief decision; each option adds exactly one penalty', () => {
    const s = newRound(7), h = generateHole(7, 0), lake = h.water[0];
    s.ball = { x: lake.x, y: lake.y - lake.ry - 8 };
    const result = takeShot(s, 'putter', 100, Math.PI / 2);
    assert.equal(result.state.strokes, 1);
    assert.equal(result.state.pending.type, 'water');
    assert.throws(() => takeShot(result.state, 'putter', 20, 0));
    const relieved = takeRelief(result.state);
    assert.equal(relieved.strokes, 2);
    assert.equal(relieved.pending, null);
    assert.notEqual(lieAt(h, relieved.ball), 'water');
    assert.deepEqual(takeRelief(result.state, true).ball, s.ball);
    assert.equal(restoreRound(JSON.stringify(result.state)).pending.type, 'water');
});

test('a full 18-hole round records every score and finishes without advancing past 18', () => {
    let s = newRound(45);
    for (let i = 0; i < 18; i++) {
        const h = generateHole(s.variant, i);
        s.ball = { x: h.cup.x - 15, y: h.cup.y };
        s.strokes = h.par - 1;
        const result = takeShot(s, 'putter', 15 / (30 * SCALE) * 100, 0);
        assert.equal(result.state.holed, true);
        s = result.state;
        assert.equal(s.scores[i], h.par);
        assert.ok(restoreRound(JSON.stringify(s)));
        if (i < 17) { s = nextHole(s); assert.equal(s.strokes, 0); }
    }
    assert.equal(s.finished, true);
    assert.deepEqual(scoreSummary(s), { played: 18, total: 72, par: 72, relative: 0, label: 'E' });
    assert.throws(() => nextHole(s));
    assert.throws(() => takeShot(s, 'putter', 50, 0));
});

test('persisted state rejects corruption and impossible score transitions', () => {
    const s = newRound(1);
    assert.deepEqual(restoreRound(JSON.stringify(s)), s);
    for (const raw of ['{', 'null', '{}', JSON.stringify({ ...s, variant: 101 }), JSON.stringify({ ...s, ball: { x: '3', y: 0 } }), JSON.stringify({ ...s, strokes: -1 }), JSON.stringify({ ...s, finished: true }), JSON.stringify({ ...s, holeIndex: 2 })]) assert.equal(restoreRound(raw), null);
});
