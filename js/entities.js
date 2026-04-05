import { COLORS } from './utils.js';

export class Shard {
    constructor(x, y, color, speed, type = 'SHARD') {
        this.x = x; this.y = y; this.color = color;
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0; this.decay = 0.01 + Math.random() * 0.02;
        this.type = type; // 'SHARD', 'EMBER', 'SHOCK'
        this.size = type === 'SHOCK' ? 10 : (1 + Math.random() * 3);
        this.friction = type === 'EMBER' ? 0.95 : 0.98;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.vx *= this.friction; this.vy *= this.friction;
        this.life -= this.decay;
        if (this.type === 'SHOCK') this.size += 15;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        
        if (this.type === 'SHOCK') {
            ctx.strokeStyle = this.color; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.stroke();
        } else if (this.type === 'EMBER') {
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        } else {
            // STREAK / SHARD (White-hot to color)
            const grad = ctx.createLinearGradient(this.x, this.y, this.x - this.vx * 2, this.y - this.vy * 2);
            grad.addColorStop(0, '#fff'); grad.addColorStop(1, this.color);
            ctx.strokeStyle = grad; ctx.lineWidth = this.size;
            ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x - this.vx * 2, this.y - this.vy * 2); ctx.stroke();
        }
        ctx.restore();
    }
}

export class Emitter {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.beamSegments = [];
    }
    draw(ctx, frame = 0) {
        ctx.save(); 
        
        const pulse = Math.sin(frame / 6) * 0.2;
        const size = 22; // Increased from 16
        
        // 1. HARDWARE SHROUD (Octagonal Frame)
        ctx.strokeStyle = '#222'; ctx.lineWidth = 12;
        ctx.beginPath();
        [0, 1, 2, 3].forEach(i => {
            const angle = i * Math.PI / 2;
            const x1 = this.x + Math.cos(angle - 0.5) * size;
            const y1 = this.y + Math.sin(angle - 0.5) * size;
            const x2 = this.x + Math.cos(angle + 0.5) * size;
            const y2 = this.y + Math.sin(angle + 0.5) * size;
            if (i === 0) ctx.moveTo(x1, y1); else ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
        });
        ctx.closePath(); ctx.stroke();
        
        ctx.strokeStyle = '#444'; ctx.lineWidth = 4;
        ctx.stroke();

        // 2. MAGNETIC PULSE BRACKETS (Shimmering Corners)
        ctx.save();
        ctx.strokeStyle = this.color; ctx.lineWidth = 3;
        ctx.shadowBlur = 15 + pulse * 20; ctx.shadowColor = this.color;
        [ -1, 1 ].forEach(sx => {
            [ -1, 1 ].forEach(sy => {
                const px = this.x + sx * 26; const py = this.y + sy * 26; // Increased from 18
                ctx.save(); ctx.translate(px, py); ctx.rotate(pulse * 0.2);
                ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(0, 0); ctx.lineTo(0, -8); ctx.stroke();
                ctx.restore();
            });
        });
        ctx.restore();
        
        // 3. IONIZED RADIANT CORE (Pulsing Energy Lens)
        const coreSize = 14 + pulse * 6; // Increased from 10
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, coreSize);
        grad.addColorStop(0, '#fff'); grad.addColorStop(0.4, this.color); grad.addColorStop(1, 'transparent');
        
        ctx.shadowBlur = 30 + pulse * 15; ctx.shadowColor = this.color;
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(this.x, this.y, coreSize, 0, Math.PI * 2); ctx.fill();
        
        // 4. SIGNAL APERTURE (White Center Point)
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(this.x, this.y, 5, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
    }
}

export class Core {
    constructor(x, y, radius, color) {
        this.x = x; this.y = y; this.radius = radius; this.color = color;
        this.progress = 0; this.isHit = false;
        this.hudElement = null;
    }
    update(delta) {
        if (this.isHit) {
            this.progress = Math.min(1, this.progress + delta);
        } else {
            this.progress = Math.max(0, this.progress - delta / 2);
        }
    }
    draw(ctx, frame) {
        ctx.save();
        
        const pulse = Math.sin(frame / 8) * 0.2;
        const mainGlow = 30 + this.progress * 40 + (this.isHit ? 20 : 0);
        const hitAnim = this.isHit ? (1 + Math.sin(frame / 3) * 0.15) : 1;
        
        // 1. HEX-GRID CONTAINMENT SHROUD (Structural Frame)
        ctx.save();
        ctx.strokeStyle = this.isHit ? this.color : '#444';
        ctx.lineWidth = 3; ctx.shadowBlur = this.isHit ? 20 : 0; ctx.shadowColor = this.color;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const hx = this.x + Math.cos(angle) * (this.radius + 12);
            const hy = this.y + Math.sin(angle) * (this.radius + 12);
            if (i === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
        }
        ctx.closePath(); ctx.stroke();
        
        // Shroud Brackets (Corner Reinforcements)
        ctx.lineWidth = 6;
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            ctx.beginPath();
            ctx.arc(this.x + Math.cos(angle) * (this.radius + 12), this.y + Math.sin(angle) * (this.radius + 12), 4, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();

        // 2. COUNTER-ROTATING SYNC RINGS (Data Telemetry)
        [ { dir: 1, r: 1.25, dash: [10, 20], speed: 40 }, { dir: -1, r: 1.4, dash: [5, 15], speed: 60 } ].forEach(ring => {
            ctx.save();
            ctx.strokeStyle = this.isHit ? this.color : this.color + '44';
            ctx.lineWidth = 2;
            ctx.setLineDash(ring.dash);
            ctx.lineDashOffset = (frame / ring.speed) * ring.dir * 50;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * ring.r, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        });

        // 3. ACTIVE INTAKE FINS (Kinetic Hardware)
        const finExt = this.isHit ? 15 : 0;
        ctx.strokeStyle = this.isHit ? '#fff' : this.color + '88'; ctx.lineWidth = 4;
        [0, 1, 2, 3].forEach(i => {
            const angle = (i * Math.PI / 2) + Math.PI / 4;
            const fx = this.x + Math.cos(angle) * (this.radius + 5 + finExt);
            const fy = this.y + Math.sin(angle) * (this.radius + 5 + finExt);
            ctx.save(); ctx.translate(fx, fy); ctx.rotate(angle);
            ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(12, 0); ctx.lineTo(0, 8); ctx.stroke();
            ctx.restore();
        });

        // 4. CORE LIQUID PROCESSING (Original Slosh Logic + Digital Overlay)
        ctx.save();
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.clip();
        
        const fillHeight = this.radius * 2 * this.progress;
        const baseY = this.y + this.radius - fillHeight;
        
        // Fill Body
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.2 + this.progress * 0.5;
        ctx.shadowBlur = mainGlow; ctx.shadowColor = this.color;
        
        ctx.beginPath();
        ctx.moveTo(this.x - this.radius, this.y + this.radius);
        ctx.lineTo(this.x - this.radius, baseY);
        for(let i = 0; i <= this.radius * 2; i += 8) {
            const wx = this.x - this.radius + i;
            const wy = baseY + Math.sin((frame / 15) + (i / 30)) * (4 + this.progress * 10);
            ctx.lineTo(wx, wy);
        }
        ctx.lineTo(this.x + this.radius, this.y + this.radius);
        ctx.closePath(); ctx.fill();
        
        // Digital Grid Overlay (Matrix Scan)
        if (this.progress > 0) {
            ctx.strokeStyle = '#fff'; ctx.globalAlpha = 0.1 * this.progress; ctx.lineWidth = 1;
            for(let i = -this.radius; i < this.radius; i += 15) {
                ctx.beginPath(); ctx.moveTo(this.x + i, this.y - this.radius); ctx.lineTo(this.x + i, this.y + this.radius); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(this.x - this.radius, this.y + i); ctx.lineTo(this.x + this.radius, this.y + i); ctx.stroke();
            }
        }
        ctx.restore();

        // 5. TACTICAL TELEMETRY (Internal Readout)
        if (this.progress > 0) {
            ctx.save();
            ctx.fillStyle = '#fff'; 
            ctx.font = 'bold 16px monospace'; 
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
            ctx.globalAlpha = 0.4 + this.progress * 0.6;
            
            const pct = Math.floor(this.progress * 100);
            ctx.fillText(`${pct}%`, this.x, this.y);
            ctx.restore();
        }

        // PHYSICAL CORE BORDER (Inner Frame)
        ctx.strokeStyle = this.isHit ? '#fff' : this.color + '66';
        ctx.lineWidth = this.isHit ? 4 : 2;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.stroke();
        
        ctx.restore();
    }
}

export class Mirror {
    constructor(id, x, y, angle, length) {
        this.id = id;
        this.x = x; this.y = y; this.angle = angle; this.length = length;
        this.isMoved = false;
        this.inDock = true;
        this.isHit = false;
        this.wasHit = false;
        this.hitColor = '#fff';
    }
    draw(ctx, frame) {
        const glowColor = this.isHit ? this.hitColor : '#fff';
        const mx = Math.cos(this.angle) * this.length / 2; 
        const my = Math.sin(this.angle) * this.length / 2;

        ctx.save();
        // Outer Glow Pulse
        ctx.shadowBlur = this.isHit ? (30 + Math.sin(frame / 5) * 15) : 15;
        ctx.shadowColor = glowColor;
        
        // Hardware Frame (Chunky Base)
        ctx.strokeStyle = '#222'; ctx.lineWidth = 12;
        ctx.beginPath(); ctx.moveTo(this.x - mx, this.y - my); ctx.lineTo(this.x + mx, this.y + my); ctx.stroke();
        
        ctx.strokeStyle = '#444'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(this.x - mx, this.y - my); ctx.lineTo(this.x + mx, this.y + my); ctx.stroke();

        // Energy Core (Wavelength Specific)
        ctx.strokeStyle = this.isHit ? glowColor : COLORS.SOLAR; 
        ctx.lineWidth = this.isHit ? 8 : 4;
        ctx.beginPath(); ctx.moveTo(this.x - mx, this.y - my); ctx.lineTo(this.x + mx, this.y + my); ctx.stroke();
        
        // Inner Photon Flow (White Hot-Spot)
        if (this.isHit) {
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(this.x - mx, this.y - my); ctx.lineTo(this.x + mx, this.y + my); ctx.stroke();
        }

        // End Caps (Hardware Detail) - Polished Milled Aluminum Look
        ctx.fillStyle = '#333'; ctx.strokeStyle = '#666'; ctx.lineWidth = 1;
        [ -1, 1 ].forEach(side => {
            const cx = this.x + mx * side; const cy = this.y + my * side;
            ctx.save(); ctx.translate(cx, cy); ctx.rotate(this.angle);
            ctx.fillRect(-3, -7, 6, 14); ctx.strokeRect(-3, -7, 6, 14); 
            ctx.fillStyle = '#888'; ctx.fillRect(-1, -5, 2, 10); // Detail line
            ctx.restore();
        });

        if (this.isHit) {
            ctx.globalAlpha = 0.2; ctx.lineWidth = 25; ctx.strokeStyle = glowColor;
            ctx.beginPath(); ctx.moveTo(this.x - mx, this.y - my); ctx.lineTo(this.x + mx, this.y + my); ctx.stroke();
        }
        
        ctx.restore();
    }
}

export class Obstacle {
    constructor(x, y, radius, type) {
        this.x = x; this.y = y; this.radius = radius; this.type = type; // 'BOMB' or 'VOID'
    }
    draw(ctx, frame) {
        ctx.save(); ctx.shadowBlur = this.type === 'BOMB' ? (20 + Math.sin(frame / 10) * 10) : 0; ctx.shadowColor = COLORS.DANGER;
        ctx.strokeStyle = this.type === 'BOMB' ? COLORS.DANGER + '99' : COLORS.VOID_STROKE; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }
}
