import { useEffect, useRef } from 'react';

const FloatingParticles = ({ colors = ['#39FF14', '#10b981', '#059669'], count = 40, activeWorldId = 'arrays' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement.clientHeight || window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * canvas.width;
        
        // Binary Search is snowflake falling; others float upward
        const isSnow = activeWorldId === 'binary-search';
        this.y = init 
          ? Math.random() * canvas.height 
          : (isSnow ? -20 : canvas.height + 20);

        this.size = Math.random() * 3 + 1;
        
        // Dynamics based on theme
        if (isSnow) {
          this.speedY = Math.random() * 0.8 + 0.5; // fall down
          this.speedX = Math.random() * 0.6 - 0.3; // drift left/right
        } else if (activeWorldId === 'two-pointers' || activeWorldId === 'linked-lists') {
          // Volcanic/fiery embers rise faster
          this.speedY = -(Math.random() * 0.9 + 0.4);
          this.speedX = Math.random() * 0.8 - 0.4;
        } else {
          // Standard slow drift upward
          this.speedY = -(Math.random() * 0.4 + 0.2);
          this.speedX = Math.random() * 0.4 - 0.2;
        }

        this.opacity = Math.random() * 0.5 + 0.15;
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;

        const isSnow = activeWorldId === 'binary-search';
        // Reset check based on direction of movement
        if (isSnow) {
          if (this.y > canvas.height + 10 || this.x < -10 || this.x > canvas.width + 10) {
            this.reset(false);
          }
        } else {
          if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
            this.reset(false);
          }
        }
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.shadowBlur = this.size * 1.5;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        ctx.beginPath();
        if (activeWorldId === 'binary-search') {
          // Draw a small custom cross snowflake
          ctx.strokeStyle = this.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(this.x - this.size, this.y);
          ctx.lineTo(this.x + this.size, this.y);
          ctx.moveTo(this.x, this.y - this.size);
          ctx.lineTo(this.x, this.y + this.size);
          ctx.stroke();
        } else if (activeWorldId === 'advanced') {
          // Draw diamond crystal shards
          ctx.beginPath();
          ctx.moveTo(this.x, this.y - this.size);
          ctx.lineTo(this.x + this.size / 2, this.y);
          ctx.lineTo(this.x, this.y + this.size);
          ctx.lineTo(this.x - this.size / 2, this.y);
          ctx.closePath();
          ctx.fill();
        } else if (activeWorldId === 'sliding-window' || activeWorldId === 'trees') {
          // Draw small leaf shapes
          ctx.beginPath();
          ctx.ellipse(this.x, this.y, this.size, this.size / 2, Math.PI / 4, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
        } else {
          // Standard glowing bubble/ember
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    };

    initParticles();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [colors, count, activeWorldId]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 transition-all duration-1000"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default FloatingParticles;
