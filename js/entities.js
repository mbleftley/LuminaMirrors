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
        ctx.save(); ctx.shadowBlur = 20 + this.progress * 20; ctx.shadowColor = this.color;
        ctx.strokeStyle = this.isHit ? this.color : this.color + '44'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.stroke();
        
        // Liquid Fill
        ctx.save(); ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 0.85, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = this.color + '22';
        const fillH = this.radius * 2 * this.progress;
        ctx.fillRect(this.x - this.radius, this.y + this.radius - fillH, this.radius * 2, fillH);
        ctx.restore();

        // Resonance Ring
        ctx.setLineDash([10, 15]); ctx.lineDashOffset = -frame * (1 + this.progress * 3);
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2); ctx.stroke();
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
