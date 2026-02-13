// Synapse Background Animation (Neural Network)
// Creates a connected node graph that reacts to mouse movement

const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let mouse = { x: null, y: null };

// Configuration
const PARTICLE_COUNT = 80; // Adjust for density
const CONNECTION_DISTANCE = 150;
const MOUSE_DISTANCE = 200;
const PARTICLE_SPEED = 0.5;

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * PARTICLE_SPEED;
        this.vy = (Math.random() - 0.5) * PARTICLE_SPEED;
        this.size = Math.random() * 2 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse interaction
        if (mouse.x != null) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < MOUSE_DISTANCE) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (MOUSE_DISTANCE - distance) / MOUSE_DISTANCE;
                const directionX = forceDirectionX * force * 0.5; // push strength
                const directionY = forceDirectionY * force * 0.5;

                this.vx -= directionX;
                this.vy -= directionY;
            }
        }
    }

    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function init() {
    resize();
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        // Connect particles
        for (let j = i; j < particles.length; j++) {
            let dx = particles[i].x - particles[j].x;
            let dy = particles[i].y - particles[j].y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < CONNECTION_DISTANCE) {
                ctx.beginPath();
                let opacity = 1 - (distance / CONNECTION_DISTANCE);
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.15})`;
                ctx.lineWidth = 1;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animate);
}

// Event Listeners
window.addEventListener('resize', () => {
    resize();
    init();
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});

window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});

init();
animate();
