import { COLORS, HARMONIC_PALETTE, getLineIntersection, getCircleIntersection } from './utils.js';
import { Shard, Emitter, Core, Mirror, Obstacle } from './entities.js';

export class LuminaEngine {
    constructor(canvas, ctx, levelNumDisplay, timerDisplay) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.levelNumDisplay = levelNumDisplay;
        this.timerDisplay = timerDisplay;

        this.level = 1; this.timeInLevel = 0; this.frame = 0;
        this.totalScore = 0; this.uniqueMirrorsHit = new Set();
        this.dockSlots = [];
        this.gameState = 'MENU';
        this.width = window.innerWidth; this.height = window.innerHeight;
        this.emitters = []; this.cores = []; this.mirrors = []; this.obstacles = []; this.shards = [];
        this.isDragging = null;
        this.totalScoreDisplay = document.getElementById('total-score-val');
        
        // Session Telemetry (v14.1)
        this.totalReflectors = 0;
        this.sessionStartTime = 0;
        
        // Audio Sensors (v10.9 Hardened)
        this.fmSynth = null; this.drone = null; this.reverb = null; 
        this.pulseSynth = null; this.syncFilter = null; this.waterChorus = null;
        this.thrumSynth = null; this.clickSynth = null;
        this.lastPingTime = 0;
        this.lastPulseTime = 0;
        this.lastSnapTime = 0; 
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousedown', (e) => this.onPointerStart(e));
        window.addEventListener('mousemove', (e) => this.onPointerMove(e));
        window.addEventListener('mouseup', (e) => this.onPointerEnd(e));
        window.addEventListener('touchstart', (e) => this.onPointerStart(e));
        window.addEventListener('touchmove', (e) => this.onPointerMove(e));
        window.addEventListener('touchend', (e) => this.onPointerEnd(e));
        
        this.loop();
    }

    initAudio() {
        if (this.reverb) return;

        // Reverb & FM Foundations (v9.7 Restored)
        this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0.4 }).toDestination();
        this.fmSynth = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 3.5, envelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.4 }
        }).connect(this.reverb);
        
        this.drone = new Tone.Oscillator(40, "sine").toDestination();
        this.drone.volume.value = -55; this.drone.start();

        // MAGNETIC PULSE ENGINE (v10.7 Acoustic Harmony)
        this.pulseSynth = new Tone.MetalSynth({
            frequency: 200, envelope: { attack: 0.001, decay: 0.1, release: 0.1 },
            harmonicity: 5.1, modulationIndex: 32, resonance: 1000, octaves: 1.5
        }).connect(this.reverb);
        this.pulseSynth.volume.value = -18; // ORIGINAL NAILD

        // TACTILE FEEDBACK SYNTHS (v7.7 Hardware Weight)
        this.thrumSynth = new Tone.MetalSynth({
            frequency: 200, envelope: { attack: 0.001, decay: 0.1, release: 0.1 },
            harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5
        }).connect(this.reverb);
        this.thrumSynth.volume.value = -16; // HARMONIZED

        this.clickSynth = new Tone.NoiseSynth({
            noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.06, release: 0.06 }
        }).connect(this.reverb);
        this.clickSynth.volume.value = -18; // HARMONIZED
    }

    playPing(freq = "C5") {
        const now = Tone.now();
        if (this.fmSynth && now > this.lastPingTime + 0.1) {
            try { this.fmSynth.triggerAttackRelease(freq, "32n", now + 0.05); this.lastPingTime = now; } catch (e) { }
        }
    }

    playSweep(rising = true) {
        if (this.fmSynth) {
            const now = Tone.now();
            this.fmSynth.triggerAttackRelease(rising ? "C4" : "C2", "2n", now);
            this.fmSynth.triggerAttackRelease(rising ? "G4" : "G1", "2n", now + 0.2);
        }
    }

    createShards(x, y, count = 10, color = COLORS.TEXT, speed = 8) {
        for (let i = 0; i < count; i++) {
            this.shards.push(new Shard(x, y, color, speed, 'SHARD'));
        }
    }

    explode(x, y, color = COLORS.DANGER) {
        // SHOCKWAVE (Inner Glow Ring)
        this.shards.push(new Shard(x, y, color, 0, 'SHOCK'));
        
        // SHRAPNEL (Fast Streak Shards)
        for (let i = 0; i < 30; i++) {
            this.shards.push(new Shard(x, y, color, 12 + Math.random() * 10, 'SHARD'));
        }
        
        // EMBERS (Glowing Smoke Clouds)
        for (let i = 0; i < 40; i++) {
            this.shards.push(new Shard(x, y, color, 2 + Math.random() * 8, 'EMBER'));
        }
    }

    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
    }

    startGame() {
        Tone.start(); Tone.context.resume(); this.initAudio();
        this.gameState = 'PLAYING';
        this.sessionStartTime = Date.now(); // v14.1
        document.getElementById('start-menu').style.display = 'none';
        document.getElementById('main-hud').style.opacity = '1';
        document.getElementById('forge-hud').style.opacity = '1';
        this.createLevel();
    }

    isSafe(x, y, radius, buffer = 40, type = 'VOID') {
        // --- TYPE-AWARE Safety Protocol (v11.0) ---
        for (let e of this.emitters) {
            // 1. Emitter-Head Clearance (Proximal range - All types)
            if (Math.hypot(x - e.x, y - e.y) < (radius + 150)) return false;

            // 2. SIGNAL PATH Clearance (Infinite lane - BOMB ONLY)
            if (type === 'BOMB') {
                if (Math.abs(y - e.y) < (radius + buffer + 20) && x > e.x) return false;
            }
        }

        // Check Emitters
        for (let e of this.emitters) {
            if (Math.hypot(x - e.x, y - e.y) < (radius + 40 + buffer)) return false;
        }
        // Check Cores
        for (let c of this.cores) {
            if (Math.hypot(x - c.x, y - c.y) < (radius + c.radius + buffer)) return false;
        }
        // Check Obstacles
        for (let o of this.obstacles) {
            if (Math.hypot(x - o.x, y - o.y) < (radius + o.radius + buffer)) return false;
        }
        return true;
    }

    createLevel() {
        this.timeInLevel = 0;
        this.uniqueMirrorsHit.clear();
        this.cores.forEach(c => c.progress = 0);
        document.getElementById('level-complete').style.display = 'none';
        document.getElementById('game-over').style.display = 'none';

        // Onboarding Hint Initialization
        const hint = document.getElementById('forge-hint');
        if (this.level === 1) hint.style.opacity = '1';
        else hint.style.opacity = '0';
        this.levelNumDisplay.textContent = this.level;
        this.shards = []; this.mirrors = []; this.obstacles = []; this.emitters = []; this.cores = [];

        const SAFE_ZONE_Y = this.height - 180;
        const emitterCount = this.level >= 8 ? 3 : (this.level >= 3 ? 2 : 1);
        const spacing = SAFE_ZONE_Y / (emitterCount + 1);

        for (let i = 0; i < emitterCount; i++) {
            const color = HARMONIC_PALETTE[i % HARMONIC_PALETTE.length];
            const ey = 80 + (spacing * (i + 1)) + (Math.random() - 0.5) * 50;
            this.emitters.push(new Emitter(80, ey, color));

            // SPATIAL HARMONY RECALIBRATION (v11.0 No-Overlap)
            let cx, cy, attempts = 0;
            do {
                cx = this.width - 150 - Math.random() * (this.width / 3);
                cy = 100 + Math.random() * (SAFE_ZONE_Y - 200);
                attempts++;
            } while (!this.isSafe(cx, cy, 60, 60) && attempts < 50);

            this.cores.push(new Core(cx, cy, 65 - (emitterCount * 5), color));

        }


        const oCount = Math.min(8, this.level + 1); // v11.0: Advanced Scaling (Start-2, Max-8)
        for (let i = 0; i < oCount; i++) {
            // ROLE DIFFERENTIATION (v11.0)
            const type = (i === 0) ? 'VOID' : (Math.random() < 0.4 ? 'BOMB' : 'VOID');
            const radius = type === 'BOMB' ? (30 + Math.random() * 35) : (35 + Math.random() * 50);
            
            let ox, oy, attempts = 0, isValid = false;
            // Target the Corridor (v10.1 Smart Spawner)
            const e = this.emitters[Math.floor(Math.random() * this.emitters.length)];
            const c = this.cores[Math.floor(Math.random() * this.cores.length)];

            do {
                attempts++;
                const t = 0.25 + Math.random() * 0.6; // Interpolate along signal path
                const tx = e.x + (c.x - e.x) * t;
                let ty = e.y + (c.y - e.y) * t;
                
                // MANDATORY BLOCKER (Only VOID can block the initial lane)
                if (i === 0) ty = e.y;

                ox = tx + (Math.random() - 0.5) * 100;
                oy = ty + (Math.random() - 0.5) * (i === 0 ? 10 : 250);

                // --- CALIBRATED Collision Check (v17.5 Safe Lane) ---
                const overlapClearance = this.obstacles.every(obst => 
                    Math.hypot(ox - obst.x, oy - obst.y) > (radius + obst.radius + 50)
                );
                
                const isSpawnSafe = this.isSafe(ox, oy, radius, 60, type); 
                
                if (isSpawnSafe && overlapClearance && attempts < 300) {
                    isValid = true;
                }
            } while (!isValid && attempts < 300);
            
            if (isValid) this.obstacles.push(new Obstacle(ox, oy, radius, type));
        }
    }

    update() {
        this.frame++;

        this.shards.forEach(p => p.update());
        this.shards = this.shards.filter(p => p.life > 0);

        if (this.gameState !== 'PLAYING') return;

        this.updateTimer();
        this.updateOptics();
        
        let allSaturated = true;
        let maxProgress = 0;
        let anyCoreCharging = false;
        this.cores.forEach(c => {
            c.update(0.007);
            if (c.progress < 1) allSaturated = false;
            if (c.isHit) {
                if (c.progress < 1) {
                    maxProgress = Math.max(maxProgress, c.progress);
                    anyCoreCharging = true;
                }
            }
        });

        if (anyCoreCharging && this.pulseSynth) {
            const now = Tone.now();
            const pulseInterval = 0.6 - (maxProgress * 0.55);
            if (now - this.lastPulseTime > pulseInterval) {
                const freq = 120 + (maxProgress * 180);
                this.pulseSynth.triggerAttackRelease(freq, "16n", now + 0.01, 0.8 + (maxProgress * 0.2));
                this.lastPulseTime = now;
            }
        }

        if (allSaturated && this.cores.length > 0) {
            this.triggerWin();
        }

        const forgeDisplay = document.getElementById('forge-val');
        if (forgeDisplay) forgeDisplay.textContent = this.mirrors.length.toString();
        
        const hint = document.getElementById('forge-hint');
        if (hint) {
            const shouldShowHint = this.level === 1 && this.mirrors.length === 0;
            hint.style.opacity = shouldShowHint ? '1' : '0';
        }
    }

    updateTimer() {
        this.timeInLevel += 1 / 60;
        this.timerDisplay.textContent = this.timeInLevel.toFixed(2) + "s";
    }

    updateOptics() {
        this.cores.forEach(c => c.isHit = false);
        this.obstacles.forEach(o => o.isHit = false);
        this.mirrors.forEach(m => {
            m.wasHit = m.isHit; 
            m.isHit = false;
        });
        this.uniqueMirrorsHit.clear();

        this.emitters.forEach(emitter => {
            emitter.isHit = false;
            emitter.beamSegments = [{ x: emitter.x, y: emitter.y }];
            let curX = emitter.x; let curY = emitter.y;
            let curAngle = 0; let limit = 15;

            while (limit--) {
                let closestHit = null, minDist = 4000;
                const rayX = Math.cos(curAngle); const rayY = Math.sin(curAngle);

                this.mirrors.forEach(m => {
                    const hit = getLineIntersection(curX, curY, curX + rayX * 3000, curY + rayY * 3000,
                        m.x - Math.cos(m.angle) * m.length / 2, m.y - Math.sin(m.angle) * m.length / 2,
                        m.x + Math.cos(m.angle) * m.length / 2, m.y + Math.sin(m.angle) * m.length / 2);
                    if (hit) {
                        const dist = Math.hypot(hit.x - curX, hit.y - curY);
                        if (dist > 5 && dist < minDist) { minDist = dist; closestHit = { ...hit, mirror: m, type: 'MIRROR' }; }
                    }
                });

                this.obstacles.forEach(o => {
                    const hit = getCircleIntersection(curX, curY, rayX, rayY, o.x, o.y, o.radius);
                    if (hit && hit.dist < minDist) { minDist = hit.dist; closestHit = { ...hit, obs: o, type: 'OBSTACLE' }; }
                });

                this.emitters.forEach(other => {
                    if (other === emitter) return;
                    if (!other.beamSegments) return;
                    for (let i = 0; i < other.beamSegments.length - 1; i++) {
                        const s1 = other.beamSegments[i]; const s2 = other.beamSegments[i+1];
                        const hit = getLineIntersection(curX, curY, curX + rayX * 3000, curY + rayY * 3000, s1.x, s1.y, s2.x, s2.y);
                        if (hit) {
                            const dist = Math.hypot(hit.x - curX, hit.y - curY);
                            if (dist > 5 && dist < minDist) { 
                                minDist = dist; 
                                closestHit = { ...hit, type: 'BEAM_COLLISION' }; 
                            }
                        }
                    }
                });

                let coreHitInfo = null;
                this.cores.forEach(core => {
                    const hit = getCircleIntersection(curX, curY, rayX, rayY, core.x, core.y, core.radius);
                    if (hit && hit.dist < minDist) {
                        minDist = hit.dist;
                        coreHitInfo = { ...hit, core: core };
                    }
                });

                if (coreHitInfo) {
                    emitter.beamSegments.push({ x: coreHitInfo.x, y: coreHitInfo.y });
                    if (coreHitInfo.core.color === emitter.color) {
                        coreHitInfo.core.isHit = true;
                        if (this.frame % 3 === 0) this.createShards(coreHitInfo.x, coreHitInfo.y, 1, emitter.color, 12);
                    } else {
                        if (this.frame % 5 === 0) this.createShards(coreHitInfo.x, coreHitInfo.y, 1, COLORS.DANGER, 5);
                    }
                    break;
                }

                if (closestHit) {
                    emitter.beamSegments.push({ x: closestHit.x, y: closestHit.y });
                    if (closestHit.type === 'MIRROR') {
                        if (!closestHit.mirror.wasHit && !closestHit.mirror.isHit && this.thrumSynth) {
                            const now = Tone.now();
                            const triggerTime = Math.max(now + 0.05, this.lastSnapTime + 0.02);
                            this.thrumSynth.triggerAttackRelease("C3", "16n", triggerTime, 0.6);
                            this.lastSnapTime = triggerTime;
                        }
                        closestHit.mirror.isHit = true;
                        closestHit.mirror.hitColor = emitter.color;
                        
                        this.uniqueMirrorsHit.add(closestHit.mirror.id);
                        curX = closestHit.x; curY = closestHit.y;
                        curAngle = 2 * closestHit.mirror.angle - curAngle;
                        if (this.frame % 8 === 0) this.createShards(curX, curY, 1, COLORS.TEXT, 5);
                    } else if (closestHit.type === 'OBSTACLE') {
                        // Impact Particles (v18.0 - Tuned Down)
                        closestHit.obs.isHit = true;
                        if (this.frame % 10 === 0) {
                            const pColor = closestHit.obs.type === 'BOMB' ? COLORS.DANGER : '#fff';
                            this.createShards(closestHit.x, closestHit.y, 1, pColor, 6);
                        }

                        if (closestHit.obs.type === 'BOMB') {
                            this.explode(closestHit.obs.x, closestHit.obs.y, COLORS.DANGER);
                            this.triggerGameOver("CRITICAL BOMB BREACH");
                        }
                        break;
                    } else if (closestHit.type === 'BEAM_COLLISION') {
                        if (this.frame % 30 === 0) this.createShards(closestHit.x, closestHit.y, 1, COLORS.SOLAR, 4);
                        break;
                    }
                } else {
                    emitter.beamSegments.push({ x: curX + rayX * 2500, y: curY + rayY * 2500 });
                    break;
                }
            }
        });
    }

    draw() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = COLORS.BG; this.ctx.fillRect(0, 0, this.width, this.height);

        this.obstacles.forEach(o => o.draw(this.ctx, this.frame));
        this.cores.forEach(c => c.draw(this.ctx, this.frame));

        this.ctx.save();
        const sx = this.width / 2; const sy = this.height - 110;
        const sPulse = 1 + Math.sin(this.frame / 10) * 0.2;
        this.ctx.globalAlpha = 0.3 * sPulse;
        this.ctx.shadowBlur = 40 * sPulse; this.ctx.shadowColor = COLORS.SOLAR;
        const tempMirror = new Mirror(999, sx, sy, 0, 100);
        tempMirror.draw(this.ctx, this.frame);
        this.ctx.restore();

        if (this.gameState !== 'FAIL_SCREEN') {
            this.emitters.forEach(e => {
                if (e.beamSegments.length < 2) return;
                
                const framePulse = Math.sin(this.frame / 5) * 1.5;
                const flicker = Math.sin(this.frame * 0.5) * 0.4; 
                const dashPattern = [25, 20]; // Shorter, denser pulses
                const dashOffset = -this.frame * 2.8; 
                
                // PASS 1: THE CORONA (Atmospheric Aura)
                this.ctx.save();
                this.ctx.globalAlpha = 0.35;
                this.ctx.shadowBlur = 35 + framePulse + flicker;
                this.ctx.shadowColor = e.color;
                this.ctx.strokeStyle = e.color;
                this.ctx.lineWidth = 12 + framePulse + flicker;
                this.ctx.lineCap = 'round';
                this.ctx.setLineDash(dashPattern);
                this.ctx.lineDashOffset = dashOffset;

                this.ctx.beginPath();
                this.ctx.moveTo(e.beamSegments[0].x, e.beamSegments[0].y);
                for (let i = 1; i < e.beamSegments.length; i++) {
                    const jitterX = (Math.random() - 0.5) * 0.6;
                    const jitterY = (Math.random() - 0.5) * 0.6;
                    this.ctx.lineTo(e.beamSegments[i].x + jitterX, e.beamSegments[i].y + jitterY);
                }
                this.ctx.stroke();
                this.ctx.restore();

                // PASS 2: THE PLASMA CORE (Spectral Wavelength)
                this.ctx.save();
                this.ctx.strokeStyle = e.color;
                this.ctx.lineWidth = 4.5 + flicker * 0.3;
                this.ctx.lineCap = 'round';
                this.ctx.setLineDash(dashPattern);
                this.ctx.lineDashOffset = dashOffset;

                this.ctx.beginPath();
                this.ctx.moveTo(e.beamSegments[0].x, e.beamSegments[0].y);
                for (let i = 1; i < e.beamSegments.length; i++) {
                    this.ctx.lineTo(e.beamSegments[i].x, e.beamSegments[i].y);
                }
                this.ctx.stroke();
                this.ctx.restore();

                // PASS 3: THE PHOTON SPARK (High-Intensity Center)
                this.ctx.save();
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 1.5;
                this.ctx.lineCap = 'round';
                this.ctx.setLineDash(dashPattern);
                this.ctx.lineDashOffset = dashOffset;

                this.ctx.beginPath();
                this.ctx.moveTo(e.beamSegments[0].x, e.beamSegments[0].y);
                for (let i = 1; i < e.beamSegments.length; i++) {
                    this.ctx.lineTo(e.beamSegments[i].x, e.beamSegments[i].y);
                }
                this.ctx.stroke();
                this.ctx.restore();

                // ATMOSPHERIC IONIZATION (Refined Sparks)
                if (this.frame % 8 === 0) {
                    const segIdx = Math.floor(Math.random() * (e.beamSegments.length - 1));
                    const s = e.beamSegments[segIdx]; const end = e.beamSegments[segIdx + 1];
                    const t = Math.random();
                    const px = s.x + (end.x - s.x) * t;
                    const py = s.y + (end.y - s.y) * t;
                    this.createShards(px, py, 1, Math.random() > 0.4 ? e.color : '#fff', 2 + Math.random() * 3);
                }
            });
        }

        this.mirrors.forEach(m => m.draw(this.ctx, this.frame));
        this.emitters.forEach(e => e.draw(this.ctx, this.frame));
        this.shards.forEach(p => p.draw(this.ctx));
    }

    triggerWin() {
        if (this.gameState !== 'PLAYING') return;
        this.gameState = 'WINNING'; this.playSweep(true);
        
        const mirrorCount = this.mirrors.length;
        const baseScore = 10000;
        const timePenalty = Math.floor(this.timeInLevel * 100);
        
        // Tactical Metrics (v13.3)
        const precisionBonus = Math.max(0, 5000 - (this.uniqueMirrorsHit.size * 200));
        const levelScore = Math.max(500, baseScore - timePenalty + precisionBonus);
        
        this.totalScore += levelScore;
        this.totalScoreDisplay.textContent = this.totalScore.toLocaleString();

        this.uniqueMirrorsHit.clear();
        this.cores.forEach(c => this.createShards(c.x, c.y, 40, c.color, 12));
        
        setTimeout(() => {
            document.getElementById('aar-time').textContent = this.timeInLevel.toFixed(2) + "s";
            document.getElementById('aar-reflectors').textContent = mirrorCount.toString().padStart(2, '0');
            document.getElementById('aar-bonus').textContent = "+" + levelScore.toLocaleString();
            document.getElementById('complete-total-score').textContent = this.totalScore.toLocaleString();
            
            const phaseInfo = document.getElementById('phase-info');
            phaseInfo.textContent = `[PHASE_${this.level.toString().padStart(2, '0')}_SUCCESS_CONFIRMED]`;

            const overlay = document.getElementById('level-complete');
            overlay.style.display = 'flex';
            this.gameState = 'WIN_SCREEN';
            
            // REFINED INFOGRAPHIC AAR (v13.7)
            anime.timeline()
            .add({ 
                targets: '#level-complete', 
                opacity: [0, 1], 
                duration: 500, 
                easing: 'linear' 
            })
            .add({
                targets: '#phase-info',
                translateY: [10, 0],
                opacity: [0, 1],
                duration: 500
            }, '-=200')
            .add({ 
                targets: '#level-complete .stat-panel', 
                translateY: [20, 0], 
                opacity: [0, 1], 
                delay: anime.stagger(100), 
                duration: 600, 
                easing: 'easeOutCubic' 
            }, '-=300')
            .add({
                targets: '#level-complete .stat, #level-complete .btn',
                opacity: [0, 1],
                duration: 500
            }, '-=300');
        }, 1200);
    }

    triggerGameOver(reason) {
        if (this.gameState !== 'PLAYING') return;
        this.gameState = 'FAILING'; this.playSweep(false);
        document.getElementById('glitch-overlay').style.display = 'block';
        anime({ targets: '#game-container', translateX: [-20, 20, 0], duration: 250, loop: 4 });
        
        let totalProg = 0;
        this.cores.forEach(c => totalProg += c.progress);
        const integrity = Math.floor((totalProg / Math.max(1, this.cores.length)) * 100);

        setTimeout(() => {
            document.getElementById('glitch-overlay').style.display = 'none';
            
            // Session-Wide Metrics (v16.3)
            document.getElementById('aar-lost').textContent = this.totalReflectors.toString().padStart(2, '0');
            document.getElementById('aar-max-phase').textContent = (this.level - 1).toString().padStart(2, '0');
            document.getElementById('aar-last-score').textContent = this.totalScore.toLocaleString();
            document.getElementById('fail-reason').textContent = `[${reason.toUpperCase().replace(/\s+/g, '_')}]`;
            
            const failInfo = document.getElementById('fail-info');
            failInfo.textContent = `PHASE_${this.level.toString().padStart(2, '0')}_SIGNAL_LOSS`;

            const overlay = document.getElementById('game-over');
            overlay.style.display = 'flex';
            this.gameState = 'FAIL_SCREEN';

            anime.timeline()
            .add({ targets: '#game-over', opacity: [0, 1], duration: 500 })
            .add({
                targets: '#fail-reason, #fail-info',
                translateY: [10, 0],
                opacity: [0, 1],
                delay: anime.stagger(100),
                duration: 500
            }, '-=200')
            .add({ 
                targets: '#game-over .stat-panel', 
                scaleX: [0, 1], 
                opacity: [0, 1], 
                delay: anime.stagger(150), 
                duration: 600, 
                easing: 'easeOutExpo' 
            }, '-=300')
            .add({
                targets: '#game-over .stat, #game-over .btn',
                opacity: [0, 1],
                duration: 500
            }, '-=300');
        }, 1000);
    }

    nextLevel() {
        this.level++;
        this.createLevel();
        this.gameState = 'PLAYING';
    }

    onPointerStart(e) {
        if (this.gameState !== 'PLAYING') return;
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches ? e.touches[0].clientX : 0)) - rect.left;
        const y = (e.clientY || (e.touches ? e.touches[0].clientY : 0)) - rect.top;
        
        const distToCore = Math.hypot(x - this.width / 2, y - (this.height - 110));
        if (distToCore < 60) {
            const newMirror = new Mirror(Date.now(), this.width / 2, this.height - 110, 0, 100);
            newMirror.inDock = false;
            this.mirrors.push(newMirror);
            this.isDragging = newMirror;
            this.totalReflectors++;
            if (this.clickSynth) this.clickSynth.triggerAttackRelease("16n");
            this.createShards(this.width / 2, this.height - 110, 8, COLORS.SOLAR, 6);
            return;
        }

        this.isDragging = this.mirrors.find(m => Math.hypot(m.x - x, m.y - y) < 60);
        if (this.isDragging) this.isDragging.isMoved = false;
    }

    onPointerMove(e) {
        if (!this.isDragging || this.gameState !== 'PLAYING') return;
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches ? e.touches[0].clientX : 0)) - rect.left;
        const y = (e.clientY || (e.touches ? e.touches[0].clientY : 0)) - rect.top;
        this.isDragging.x = x; this.isDragging.y = y; this.isDragging.isMoved = true;
    }

    onPointerEnd(e) {
        if (this.isDragging) {
            if (!this.isDragging.isMoved) { 
                this.isDragging.angle += Math.PI / 4;
                if (this.clickSynth) this.clickSynth.triggerAttackRelease("32n");
                const mx = Math.cos(this.isDragging.angle) * this.isDragging.length / 2;
                const my = Math.sin(this.isDragging.angle) * this.isDragging.length / 2;
                this.createShards(this.isDragging.x + mx, this.isDragging.y + my, 3, COLORS.SOLAR, 5);
                this.createShards(this.isDragging.x - mx, this.isDragging.y - my, 3, COLORS.SOLAR, 5);
            }
            const distToCore = Math.hypot(this.isDragging.x - this.width / 2, this.isDragging.y - (this.height - 110));
            if (distToCore < 80) {
                this.mirrors = this.mirrors.filter(m => m !== this.isDragging);
                if (this.clickSynth) this.clickSynth.triggerAttackRelease("16n");
            }
            this.isDragging = null;
        }
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}
