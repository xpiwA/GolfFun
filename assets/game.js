import { CLUBS, SCALE, COURSE_COUNT, newRound, restoreRound, generateHole, courseName, recommendedClub, distance, lieAt, shotPlan, takeShot, takeRelief, nextHole, scoreSummary, clamp } from './engine.js';
import { CourseRenderer } from './renderer.js';
import { GolfAudio } from './audio.js';

const randomVariant = except => {
    const values = new Uint32Array(1); crypto.getRandomValues(values);
    const n = values[0] % COURSE_COUNT + 1;
    return n === except ? n % COURSE_COUNT + 1 : n;
};
const rules = `<p>GolfFun är ett förenklat digitalt slagspel. Målet är att håla ut på så få slag som möjligt under 18 hål. Varje hål måste spelas klart; det finns ingen automatisk maxpoäng.</p>
<h3>Sikta, välj klubba och slå</h3><ol><li>Klicka eller tryck på banan för att sikta. Du kan också fokusera banan och använda piltangenterna, eller knapparna ↶ och ↷.</li><li>Välj klubba och justera slagstyrkan. Den streckade linjen visar beräknad landning, inklusive vind.</li><li>Tryck på ”Slå bollen”. På green rekommenderas puttern. Ruff och bunker förkortar slagen; vind påverkar luftslagen.</li></ol>
<h3>Slagspel och plikt</h3><p>Alla slag räknas. Lägre totalresultat är bättre. Par, birdie och bogey beräknas mot hålets par.</p><ul><li><strong>Out of bounds:</strong> ett pliktslag och slag från föregående plats (slag och distans, regel 18.2).</li><li><strong>Vatten:</strong> sjöarna behandlas som röda pliktområden. Välj mellan slag och distans eller spelets förenklade lättnad nära senaste gränspassagen, aldrig närmare hålet. Båda ger ett pliktslag.</li></ul>
<h3>Vad spelet förenklar</h3><p>GolfFun tillämpar inte hela regelverket. Bland annat är droppningsproceduren förenklad och alternativet att spela bollen som den ligger i vatten saknas. Ospelbar boll, provisorisk boll, utrustningsregler och handicap ingår inte. Rundorna är inte handicapgrundande.</p><p>För verkligt golfspel gäller <a href="https://golf.se/for-spelaren/regler-och-handicap/regler/" target="_blank" rel="noopener noreferrer">Svenska Golfförbundets aktuella golfregler</a>.</p>
<h3>Ljud och sparad rond</h3><p>Musik och vindljud genereras i webbläsaren och startar efter ”Aktivera ljud”. Ronden och dina ljudval sparas lokalt på den här enheten när webbläsaren tillåter det. Ingen inloggning krävs.</p>`;

class GolfGame {
    constructor(root, index) {
        this.root = root;
        this.config = JSON.parse(root.dataset.golffun);
        this.ui = Object.fromEntries([...root.querySelectorAll('[data-ui]')].map(el => [el.dataset.ui, el]));
        this.key = `golffun-round-v1:${location.pathname}:${index}`;
        this.audioKey = 'golffun-audio-v1';
        this.state = null;
        try { this.state = restoreRound(localStorage.getItem(this.key)); } catch { /* Private browsing remains playable. */ }
        this.state ||= newRound(randomVariant());
        this.audio = new GolfAudio();
        this.audio.music = !!this.config.music; this.audio.weather = !!this.config.weather;
        try {
            const saved = JSON.parse(localStorage.getItem(this.audioKey));
            if (typeof saved?.music === 'boolean' && typeof saved?.weather === 'boolean') { this.audio.music = saved.music; this.audio.weather = saved.weather; }
        } catch { /* Defaults are safe. */ }
        this.renderer = new CourseRenderer(this.ui.canvas, this.config.theme === 'forest');
        this.busy = false; this.soundActive = false;
        this.loadHole(); this.bind(); this.render(); this.syncSound();
        if (this.state.pending) this.message('Återupptagen rond: välj lättnad för bollen i pliktområdet.');
        else if (this.state.holed) this.message(this.state.finished ? 'Din runda är klar. Öppna scorekortet för resultatet.' : 'Hålet är färdigspelat. Fortsätt till nästa tee.');
        else if (this.state.strokes || this.state.holeIndex) this.message('Välkommen tillbaka. Vi har sparat din plats på banan.');
        this.cleanup = () => { this.audio.dispose(); if (this.frame) cancelAnimationFrame(this.frame); };
        window.addEventListener('pagehide', event => { if (!event.persisted) this.cleanup(); });
    }
    message(text) { this.ui.message.textContent = text; }
    loadHole() {
        this.hole = generateHole(this.state.variant, this.state.holeIndex);
        this.aim = Math.atan2(this.hole.cup.y - this.state.ball.y, this.hole.cup.x - this.state.ball.x);
        this.club = recommendedClub(this.hole, this.state.ball);
        this.power = this.club === 'putter' ? clamp(Math.round(distance(this.state.ball, this.hole.cup) / SCALE / 30 * 100), 5, 100) : 80;
        this.renderer.setHole(this.hole); this.audio.wind = this.hole.wind.speed; this.audio.sync();
    }
    save() {
        try {
            localStorage.setItem(this.key, JSON.stringify(this.state));
            this.ui['save-status'].textContent = 'Ronden sparas på den här enheten.';
            this.ui['save-status'].classList.remove('gf-storage-warning');
        } catch {
            this.ui['save-status'].textContent = 'Lagring är blockerad. Ronden sparas inte om du lämnar sidan.';
            this.ui['save-status'].classList.add('gf-storage-warning');
        }
    }
    render(animated = null) {
        const s = this.state, h = this.hole;
        const set = (key, text) => { this.ui[key].textContent = text; };
        set('course-name', courseName(s.variant)); set('variant', `Banvariant ${String(s.variant).padStart(3, '0')} av 100`);
        set('hole', String(s.holeIndex + 1).padStart(2, '0')); set('par', h.par); set('strokes', s.strokes);
        set('distance', Math.round(distance(s.ball, h.cup) / SCALE)); set('wind', h.wind.speed.toLocaleString('sv-SE', { maximumFractionDigits: 1 }));
        this.ui['wind-arrow'].style.transform = `rotate(${h.wind.direction * 180 / Math.PI + 90}deg)`;
        const lies = { tee: 'På tee', fairway: 'På fairway', green: 'På green', rough: 'I ruffen', bunker: 'I bunkern', water: 'Rött pliktområde' };
        set('location', s.holed ? 'I hål!' : lies[lieAt(h, s.ball)] || 'På banan');
        set('total', scoreSummary(s).label); set('power-value', `${this.power} %`);
        this.ui.club.value = this.club; this.ui.power.value = this.power;
        const hit = this.root.querySelector('[data-action="hit"]');
        hit.replaceChildren(document.createTextNode(this.busy ? 'Bollen är i spel…' : s.finished ? 'Se ditt resultat' : s.holed ? 'Nästa hål' : 'Slå bollen '));
        if (!this.busy) { const arrow = document.createElement('span'); arrow.className = 'gf-shot-arrow'; arrow.setAttribute('aria-hidden', 'true'); hit.append(arrow); }
        hit.disabled = this.busy || !!s.pending;
        for (const el of [this.ui.club, this.ui.power, ...this.root.querySelectorAll('[data-action="left"], [data-action="right"], [data-action="shuffle"]')]) el.disabled = this.busy || !!s.pending || (s.holed && el !== this.root.querySelector('[data-action="shuffle"]'));
        this.ui.relief.hidden = !s.pending;
        this.renderer.draw(s, this.aim, this.club, this.power, animated);
    }
    bind() {
        this.root.addEventListener('click', event => {
            const button = event.target.closest('button[data-action]');
            if (!button || button.disabled) return;
            const action = button.dataset.action;
            if (['left', 'right'].includes(action) && !this.busy && !this.state.pending && !this.state.holed) { this.aim += action === 'left' ? -.035 : .035; this.render(); }
            if (action === 'hit') this.hit();
            if (action === 'help' || action === 'rules') this.dialog('Så spelar du GolfFun', rules);
            if (action === 'scorecard') this.scorecard();
            if (action === 'close') this.ui.dialog.close();
            if (action === 'shuffle') this.dialog('En ny plats att spela på?', '<p>Din nuvarande runda ersätts med en ny 18-hålsbana. Du kan upptäcka 100 olika banvarianter.</p><button type="button" class="gf-dialog-button" data-action="new-round">Starta en ny runda</button>');
            if (action === 'new-round' && !this.busy) {
                this.state = newRound(randomVariant(this.state.variant)); this.loadHole(); this.save(); this.render(); this.ui.dialog.close(); this.message('Ny bana, nya möjligheter. Välkommen till första tee.');
            }
            if (['relief', 'replay'].includes(action) && this.state.pending && !this.busy) {
                this.state = takeRelief(this.state, action === 'replay'); this.loadHole(); this.save(); this.render(); this.message('Ett pliktslag tillagt. Bollen är redo för nästa slag.');
            }
            if (['music', 'weather'].includes(action)) {
                this.audio[action] = !this.audio[action];
                try { localStorage.setItem(this.audioKey, JSON.stringify({ music: this.audio.music, weather: this.audio.weather })); } catch { /* Sound still works without storage. */ }
                this.syncSound(); this.audio.sync();
            }
            if (action === 'audio') this.activateAudio();
        });
        this.ui.canvas.addEventListener('click', event => {
            if (this.busy || this.state.pending || this.state.holed) return;
            const r = this.ui.canvas.getBoundingClientRect();
            const x = (event.clientX - r.left) / r.width * 1000, y = (event.clientY - r.top) / r.height * 700;
            this.aim = Math.atan2(y - this.state.ball.y, x - this.state.ball.x); this.render();
        });
        this.ui.canvas.addEventListener('keydown', event => {
            if (this.busy || this.state.pending || this.state.holed) return;
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) event.preventDefault();
            if (event.key === 'ArrowLeft') this.aim -= .035;
            if (event.key === 'ArrowRight') this.aim += .035;
            if (event.key === 'ArrowUp') this.power = clamp(this.power + 1, 5, 100);
            if (event.key === 'ArrowDown') this.power = clamp(this.power - 1, 5, 100);
            if (event.key === ' ') this.hit(); else this.render();
        });
        this.ui.club.addEventListener('change', () => { this.club = this.ui.club.value; this.render(); });
        this.ui.power.addEventListener('input', () => { this.power = Number(this.ui.power.value); this.render(); });
    }
    syncSound() {
        for (const key of ['music', 'weather']) this.root.querySelector(`[data-action="${key}"]`).setAttribute('aria-pressed', String(this.audio[key]));
    }
    async activateAudio() {
        try {
            const ok = await this.audio.activate();
            this.soundActive = ok;
            this.root.querySelector('[data-action="audio"]').textContent = ok ? '✓ Ljud aktiverat' : 'Ljud stöds inte i webbläsaren';
        } catch { this.message('Ljud kunde inte starta. Försök med ”Aktivera ljud” igen.'); }
    }
    hit() {
        if (this.busy || this.state.pending) return;
        if (this.state.finished) { this.scorecard(); return; }
        if (this.state.holed) {
            this.state = nextHole(this.state); this.loadHole(); this.save(); this.render(); this.message(`Hål ${this.state.holeIndex + 1}. Par ${this.hole.par}. Lycka till!`); return;
        }
        const result = takeShot(this.state, this.club, this.power, this.aim);
        this.busy = true; if (this.soundActive) this.audio.hit();
        this.message('Bollen är på väg…'); this.render();
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const duration = reduced ? 150 : this.club === 'putter' ? 850 : 1300;
        const start = performance.now();
        const animate = now => {
            if (!this.root.isConnected) { this.cleanup(); return; }
            const t = clamp((now - start) / duration, 0, 1);
            const eased = this.club === 'putter' ? 1 - (1 - t) ** 1.6 : t;
            const p = result.plan.points[Math.min(result.plan.points.length - 1, Math.floor(eased * (result.plan.points.length - 1)))];
            this.renderer.draw(this.state, this.aim, this.club, this.power, p);
            if (t < 1) this.frame = requestAnimationFrame(animate);
            else {
                this.state = result.state; this.busy = false;
                if (this.state.holed && this.soundActive) this.audio.holed();
                this.club = recommendedClub(this.hole, this.state.ball);
                this.aim = Math.atan2(this.hole.cup.y - this.state.ball.y, this.hole.cup.x - this.state.ball.x);
                if (this.club === 'putter') this.power = clamp(Math.round(distance(this.state.ball, this.hole.cup) / SCALE / 30 * 100), 5, 100);
                this.save(); this.render(); this.message(result.message);
                if (this.state.finished) this.scorecard();
            }
        };
        this.frame = requestAnimationFrame(animate);
    }
    dialog(title, html) {
        this.ui['dialog-title'].textContent = title;
        this.ui['dialog-body'].innerHTML = html; // Only developer-owned markup and validated numeric state.
        if (!this.ui.dialog.open) this.ui.dialog.showModal();
    }
    scorecard() {
        const summary = scoreSummary(this.state);
        const rows = Array.from({ length: 18 }, (_, i) => `<tr${i === this.state.holeIndex ? ' class="gf-active-row"' : ''}><td>${i + 1}</td><td>${generateHole(this.state.variant, i).par}</td><td>${this.state.scores[i] ?? '–'}</td></tr>`).join('');
        this.dialog(this.state.finished ? 'Din runda är klar. Snyggt spelat!' : 'Ditt scorekort', `<p>${courseName(this.state.variant)} · Banvariant ${this.state.variant} av 100</p><div class="gf-score-summary">${summary.total} slag · ${summary.label} mot par</div><p>${summary.played} av 18 hål färdigspelade. Pågående hål räknas när bollen är i hål.</p><table class="gf-score-table"><thead><tr><th scope="col">Hål</th><th scope="col">Par</th><th scope="col">Slag</th></tr></thead><tbody>${rows}</tbody></table>${this.state.finished ? '<button type="button" class="gf-dialog-button" data-action="new-round">Spela en ny runda</button>' : ''}`);
    }
}

document.querySelectorAll('[data-golffun]').forEach((root, index) => {
    try { new GolfGame(root, index); }
    catch (error) {
        console.error('GolfFun:', error);
        const message = root.querySelector('[data-ui="message"]');
        if (message) message.textContent = 'Spelet kunde inte starta. Ladda om sidan och försök igen.';
    }
});
