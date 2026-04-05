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
    draw(ctx) {
        ctx.save(); ctx.shadowBlur = 25; ctx.shadowColor = this.color; ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.rect(this.x - 14, this.y - 14, 28, 28); ctx.fill();
        ctx.strokeStyle = this.color; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
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

        // Energy Core
        ctx.strokeStyle = this.isHit ? glowColor : COLORS.SOLAR; 
        ctx.lineWidth = this.isHit ? 6 : 4;
        ctx.beginPath(); ctx.moveTo(this.x - mx, this.y - my); ctx.lineTo(this.x + mx, this.y + my); ctx.stroke();
        
        // Inner Bright Wire
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(this.x - mx, this.y - my); ctx.lineTo(this.x + mx, this.y + my); ctx.stroke();

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
