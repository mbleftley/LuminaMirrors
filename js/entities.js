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
        
        // RESONANCE PULSE (v18.1 Heartbeat)
        const pulse = Math.sin(frame / 8) * 0.2;
        const mainGlow = 25 + this.progress * 35 + (this.isHit ? 15 : 0);
        ctx.shadowBlur = mainGlow;
        ctx.shadowColor = this.color;
        
        // OUTER CORONA (Expanding Ring)
        if (this.isHit) {
            const coronaRadius = this.radius + (frame % 40) * 1.5;
            const coronaAlpha = 1 - (frame % 40) / 40;
            ctx.save(); ctx.globalAlpha = coronaAlpha * 0.4;
            ctx.strokeStyle = this.color; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(this.x, this.y, coronaRadius, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }

        // PHYSICAL CORE FRAME (v18.3 Spectrum Sync)
        ctx.strokeStyle = this.isHit ? this.color : this.color + '66';
        ctx.lineWidth = this.isHit ? 6 : 3;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.stroke();
        
        // LIQUID WAVE FILL (v18.1 Slosh Logic)
        ctx.save();
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 0.9, 0, Math.PI * 2); ctx.clip();
        
        const fillHeight = this.radius * 2 * this.progress;
        const waveOffset = Math.sin(frame / 10) * 8;
        const baseY = this.y + this.radius - fillHeight;
        
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.3 + this.progress * 0.4;
        
        ctx.beginPath();
        ctx.moveTo(this.x - this.radius, this.y + this.radius);
        ctx.lineTo(this.x - this.radius, baseY);
        
        // Create Wave Path
        for(let i = 0; i <= this.radius * 2; i += 10) {
            const wx = this.x - this.radius + i;
            const wy = baseY + Math.sin((frame / 15) + (i / 30)) * (5 + this.progress * 5);
            ctx.lineTo(wx, wy);
        }
        
        ctx.lineTo(this.x + this.radius, this.y + this.radius);
        ctx.closePath();
        ctx.fill();
        
        // Inner Radiant Glow
        if (this.progress > 0) {
            const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            grad.addColorStop(0, this.isHit ? '#fff' : this.color);
            grad.addColorStop(1, 'transparent');
            ctx.globalAlpha = 0.15 + this.progress * 0.3;
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2); ctx.fill();
        }
        
        ctx.restore();

        // RESONANCE RING (Orbiting Data Bits)
        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = this.isHit ? '#fff' : this.color + '88';
        ctx.setLineDash([15, 20]);
        ctx.lineDashOffset = -frame * (1 + this.progress * 2);
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 0.75, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        
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
