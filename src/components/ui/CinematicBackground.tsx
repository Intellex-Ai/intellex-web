'use client';

import React, { useEffect, useRef } from 'react';

export const CinematicBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let points: Point[] = [];
        let rotation = 0;

        // Configuration
        const sphereRadius = 400;
        const pointCount = 500;
        const connectionDistance = 90;
        const primaryColor = '255, 77, 0'; // Neon Orange

        class Point {
            x: number;
            y: number;
            z: number;
            baseX: number;
            baseY: number;
            baseZ: number;

            constructor() {
                // Distribute points on a sphere using Fibonacci sphere algorithm for even distribution
                // But let's use random for a more "organic/glitchy" data look
                const theta = Math.random() * 2 * Math.PI;
                const phi = Math.acos((Math.random() * 2) - 1);

                this.baseX = sphereRadius * Math.sin(phi) * Math.cos(theta);
                this.baseY = sphereRadius * Math.sin(phi) * Math.sin(theta);
                this.baseZ = sphereRadius * Math.cos(phi);

                this.x = this.baseX;
                this.y = this.baseY;
                this.z = this.baseZ;
            }

            rotate(angle: number) {
                // Rotate around Y axis
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);

                const x = this.baseX * cos - this.baseZ * sin;
                const z = this.baseX * sin + this.baseZ * cos;

                this.x = x;
                this.z = z;

                // Optional: slight X axis rotation for tilt
                const tilt = 0.2;
                const y = this.baseY * Math.cos(tilt) - this.z * Math.sin(tilt);
                const z2 = this.baseY * Math.sin(tilt) + this.z * Math.cos(tilt);
                this.y = y;
                this.z = z2;
            }

            project(width: number, height: number, fov: number) {
                const scale = fov / (fov + this.z);
                const x2d = (this.x * scale) + width / 2;
                const y2d = (this.y * scale) + height / 2;
                return { x: x2d, y: y2d, scale: scale };
            }
        }

        const init = () => {
            resize();
            points = [];
            for (let i = 0; i < pointCount; i++) {
                points.push(new Point());
            }
        };

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Center of screen
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            rotation += 0.0015; // Slow rotation

            // Update and project points
            const projectedPoints = points.map(p => {
                p.rotate(rotation);
                return p.project(canvas.width, canvas.height, 500); // 400 is FOV/Distance
            });

            // Draw connections
            ctx.lineWidth = 1;
            for (let i = 0; i < points.length; i++) {
                const p1 = projectedPoints[i];
                // Only draw if point is in front (z > -radius roughly, but scale handles size)
                // Actually, let's draw everything but fade back points

                // Find nearby points to connect
                // Optimization: Only check a subset or use spatial hashing? 
                // For 400 points, N^2 is 160,000 checks. A bit heavy for JS.
                // Let's just connect to the next few in the array (random connections)
                // Or better: connect to points that are physically close in 3D space? No, 2D space is cooler for "constellation" look.

                // Let's try connecting to random neighbors for performance, or just N closest.
                // Simple distance check in 2D:

                let connections = 0;
                for (let j = i + 1; j < points.length; j++) {
                    const p2 = projectedPoints[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectionDistance) {
                        // Alpha based on distance and Z-depth (scale)
                        // Higher scale = closer = brighter
                        const alpha = (1 - dist / connectionDistance);

                        if (alpha > 0) {
                            ctx.beginPath();
                            ctx.moveTo(p1.x, p1.y);
                            ctx.lineTo(p2.x, p2.y);

                            // Color: Mostly grey, occasional orange
                            if (i % 25 === 0) {
                                ctx.strokeStyle = `rgba(${primaryColor}, ${alpha * 0.8})`;
                            } else {
                                ctx.strokeStyle = `rgba(40, 40, 40, ${alpha * 0.3})`; // Much darker grey
                            }
                            ctx.stroke();
                            connections++;
                        }
                    }
                    if (connections > 4) break; // Limit connections per point
                }

                // Draw Point
                const alpha = 0.8; // Fade distant points
                ctx.beginPath();
                ctx.arc(p1.x, p1.y, 1.2 * p1.scale, 0, Math.PI * 2);
                ctx.fillStyle = i % 25 === 0 ? `rgba(${primaryColor}, ${alpha})` : `rgba(60, 60, 60, ${alpha})`; // Darker points
                ctx.fill();
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        const handleResize = () => {
            resize();
        };

        window.addEventListener('resize', handleResize);
        init();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden bg-black pointer-events-none">
            {/* Base Background - Pure Black */}
            <div className="absolute inset-0 bg-black" />

            {/* Canvas Layer */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />



            {/* Very Subtle Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)] z-20" />
        </div>
    );
};
