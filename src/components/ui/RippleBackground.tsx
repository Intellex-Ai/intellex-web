'use client';

import React, { useEffect, useRef } from 'react';

export const RippleBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        // Configuration
        const primaryColor = '255, 77, 0'; // Neon Orange
        const separation = 35;
        const amountX = 80; // High density (optimized)
        const amountY = 40; // High density (optimized)

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const width = canvas.width;
            const height = canvas.height;
            const cx = width / 2;
            const cy = height / 2;

            time += 0.03;

            ctx.lineWidth = 1;

            // 3D Projection Parameters
            const fov = 350;
            const cameraY = 0;
            const cameraZ = 150;

            // Render lines along X axis (rows)
            for (let y = 0; y < amountY; y++) {
                ctx.beginPath();
                let firstPoint = true;

                // Optimize: Calculate base opacity for the entire row based on Z-depth
                // This avoids changing strokeStyle 100 times per row
                const baseZ = (y - amountY / 2) * separation + 600;
                const rowAlpha = Math.min(1, Math.max(0, (1 - (baseZ - cameraZ) / 2500)));

                if (rowAlpha <= 0) continue; // Skip invisible rows

                ctx.strokeStyle = `rgba(${primaryColor}, ${rowAlpha * 0.8})`;

                for (let x = 0; x < amountX; x++) {
                    // 3D Coordinates
                    // Center the grid
                    const px = (x - amountX / 2) * separation;
                    const pz = (y - amountY / 2) * separation + 600;

                    // More complex wave function for "choppy sea" look
                    const py = Math.sin(x * 0.15 + time) * 50 +
                        Math.sin(y * 0.2 + time * 0.5) * 50 +
                        Math.sin((x + y) * 0.1 + time * 1.5) * 20;

                    // Apply Camera Transform
                    const worldY = py + cameraY;
                    const worldZ = pz - cameraZ;

                    // Perspective Projection
                    if (worldZ > 0) {
                        const scale = fov / worldZ;
                        const screenX = cx + px * scale;
                        const screenY = cy + worldY * scale;

                        if (firstPoint) {
                            ctx.moveTo(screenX, screenY);
                            firstPoint = false;
                        } else {
                            ctx.lineTo(screenX, screenY);
                        }
                    }
                }
                ctx.stroke();
            }

            // Render lines along Y axis (columns)
            // Optimize: Use a single style for vertical lines or a gradient if needed
            // For performance, we'll use a fixed subtle style
            ctx.strokeStyle = `rgba(${primaryColor}, 0.15)`;

            for (let x = 0; x < amountX; x++) {
                ctx.beginPath();
                let firstPoint = true;

                for (let y = 0; y < amountY; y++) {
                    const px = (x - amountX / 2) * separation;
                    const pz = (y - amountY / 2) * separation + 600;

                    const py = Math.sin(x * 0.15 + time) * 50 +
                        Math.sin(y * 0.2 + time * 0.5) * 50 +
                        Math.sin((x + y) * 0.1 + time * 1.5) * 20;

                    const worldY = py + cameraY;
                    const worldZ = pz - cameraZ;

                    if (worldZ > 0) {
                        const scale = fov / worldZ;
                        const screenX = cx + px * scale;
                        const screenY = cy + worldY * scale;

                        if (firstPoint) {
                            ctx.moveTo(screenX, screenY);
                            firstPoint = false;
                        } else {
                            ctx.lineTo(screenX, screenY);
                        }
                    }
                }
                ctx.stroke();
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        const handleResize = () => {
            resize();
        };

        window.addEventListener('resize', handleResize);
        resize();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden bg-black pointer-events-none">
            {/* Base Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,10,0,0.3)_0%,rgba(0,0,0,1)_100%)]" />

            {/* Canvas Layer */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_90%)] z-20" />
        </div>
    );
};
