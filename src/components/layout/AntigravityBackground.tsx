"use client";

import { useEffect, useRef } from 'react';
import styles from './AntigravityBackground.module.css';

export default function AntigravityBackground() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const trailRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Cursor Logic
        const cursor = cursorRef.current;
        const trail = trailRef.current;
        let mx = 0, my = 0, tx = 0, ty = 0;
        let animationFrameId: number;

        const handleMouseMove = (e: MouseEvent) => {
            mx = e.clientX;
            my = e.clientY;
            if (cursor) {
                cursor.style.left = mx + 'px';
                cursor.style.top = my + 'px';
            }
        };

        const animTrail = () => {
            tx += (mx - tx) * 0.12;
            ty += (my - ty) * 0.12;
            if (trail) {
                trail.style.left = tx + 'px';
                trail.style.top = ty + 'px';
            }
            animationFrameId = requestAnimationFrame(animTrail);
        };

        document.addEventListener('mousemove', handleMouseMove);
        animTrail();

        // Particles Logic
        const container = particlesRef.current;
        if (container && container.childNodes.length === 0) {
            const colors = ['#FFB800', '#00e5ff', '#ffffff', '#ffd040'];
            for (let i = 0; i < 35; i++) {
                const p = document.createElement('div');
                p.className = styles.particle;
                const size = Math.random() * 3 + 1;
                const color = colors[Math.floor(Math.random() * colors.length)];
                p.style.cssText = `
                    left: ${Math.random() * 100}%;
                    width: ${size}px; height: ${size}px;
                    background: ${color};
                    opacity: 0;
                    animation-duration: ${Math.random() * 15 + 8}s;
                    animation-delay: ${Math.random() * 10}s;
                    box-shadow: 0 0 ${size * 2}px ${color};
                `;
                container.appendChild(p);
            }
        }

        // Hover expansion for custom cursor (We attach to body and delegate to avoid React strict mode issues)
        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('a, button, .step, .sidebarItem, [class*="navBtn"], [class*="ctaBtn"], input, textarea, select')) {
                if (cursor) {
                    cursor.style.width = '20px';
                    cursor.style.height = '20px';
                    cursor.style.opacity = '0.7';
                }
            }
        };
        const handleMouseOut = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('a, button, .step, .sidebarItem, [class*="navBtn"], [class*="ctaBtn"], input, textarea, select')) {
                if (cursor) {
                    cursor.style.width = '12px';
                    cursor.style.height = '12px';
                    cursor.style.opacity = '1';
                }
            }
        };

        document.body.addEventListener('mouseover', handleMouseOver);
        document.body.addEventListener('mouseout', handleMouseOut);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.body.removeEventListener('mouseover', handleMouseOver);
            document.body.removeEventListener('mouseout', handleMouseOut);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <>
            {/* Custom Cursor HTML */}
            <div
                ref={cursorRef}
                style={{
                    position: 'fixed', width: '12px', height: '12px',
                    background: '#FFB800', borderRadius: '50%',
                    pointerEvents: 'none', zIndex: 9999,
                    transform: 'translate(-50%,-50%)',
                    transition: 'transform 0.1s, width 0.2s, height 0.2s, opacity 0.2s',
                    mixBlendMode: 'difference'
                }}
            />
            <div
                ref={trailRef}
                style={{
                    position: 'fixed', width: '32px', height: '32px',
                    border: '1px solid rgba(255,184,0,0.4)',
                    borderRadius: '50%', pointerEvents: 'none', zIndex: 9998,
                    transform: 'translate(-50%,-50%)',
                    transition: 'transform 0.15s ease, left 0.08s, top 0.08s'
                }}
            />

            {/* Background elements */}
            <div className={styles.spaceBg}></div>
            <div className={styles.gridOverlay}></div>
            <div className={styles.particles} ref={particlesRef}></div>

            {/* Floating Tech Labels */}
            <div className={`${styles.techFloat} ${styles.tf1}`}>SYS::OPTIMIZE<br />v16.7.0</div>
            <div className={`${styles.techFloat} ${styles.tf2}`}>KERNEL::BOOST<br />ACTIVE</div>
            <div className={`${styles.techFloat} ${styles.tf3}`}>WIN::REGISTRY<br />UNLOCKED</div>

            {/* Orbit Decoration */}
            <div className={styles.orbitWrap}>
                <div className={styles.orbitRing}></div>
                <div className={styles.orbitDot}></div>
            </div>
        </>
    );
}
