/* =========================================
   PARTICLE SYSTEM (Rain / Snow)
   ========================================= */
export class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.particles = [];
        this.activeType = 'none'; // 'rain', 'snow', 'none'

        this._resize();
        window.addEventListener('resize', () => this._resize());

        this._animate();
    }

    _resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }

    setType(type) {
        this.activeType = type;
        this.particles = [];
        const count = type === 'rain' ? 300 : (type === 'snow' ? 100 : 0);

        for (let i = 0; i < count; i++) {
            this.particles.push(this._createParticle(type));
        }
    }

    _createParticle(type) {
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            speedY: type === 'rain' ? Math.random() * 15 + 10 : Math.random() * 2 + 1,
            speedX: type === 'rain' ? 0 : Math.random() * 1 - 0.5,
            size: type === 'rain' ? Math.random() * 2 + 1 : Math.random() * 3 + 2,
            opacity: Math.random() * 0.5 + 0.1
        };
    }

    _animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.activeType !== 'none') {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();

            this.particles.forEach(p => {
                // Update
                p.y += p.speedY;
                p.x += p.speedX;

                // Reset if out of bounds
                if (p.y > this.height) {
                    p.y = -10;
                    p.x = Math.random() * this.width;
                }

                // Draw
                this.ctx.moveTo(p.x, p.y);
                if (this.activeType === 'rain') {
                    // Rain drop (line)
                    this.ctx.rect(p.x, p.y, 1, p.size * 5);
                } else {
                    // Snowflake (circle)
                    this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                }
            });

            this.ctx.globalAlpha = 0.6;
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        }

        requestAnimationFrame(() => this._animate());
    }
}
