'use client';
import React, { useEffect, useRef, useState } from 'react';

export const CinematicBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [shouldAnimate, setShouldAnimate] = useState(false);

    // Decide whether to run the expensive canvas effect (skip for low-end or reduced-motion contexts).
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const compute = () => {
            const isMobile = window.innerWidth < 768;
            setShouldAnimate(!mediaQuery.matches && !isMobile);
        };
        compute();
        const onResize = () => compute();
        mediaQuery.addEventListener('change', compute);
        window.addEventListener('resize', onResize);
        return () => {
            mediaQuery.removeEventListener('change', compute);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    useEffect(() => {
        if (!shouldAnimate) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap DPI at 2 for performance

        // Handle resizing with DPI support
        const handleResize = () => {
            if (!canvas || !ctx) return;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.scale(dpr, dpr);
        };

        handleResize();

        // Configuration
        const gridSize = 60; // Restored high density
        const spacing = 60; // Restored spacing
        const fov = 600;
        const waveSpeed = 0.04; // Slightly slower for elegance
        const waveHeight = 50;
        const waveFrequency = 0.015;

        let time = 0;
        let animationFrameId: number;

        // Generate Grid Points
        interface Point3D {
            x: number;
            y: number;
            z: number;
            ox: number; // Original X
            oz: number; // Original Z
        }

        const points: Point3D[] = [];
        const rows = gridSize;
        const cols = gridSize;

        // Center the grid
        const xOffset = (cols * spacing) / 2;
        const zOffset = (rows * spacing) / 2;

        for (let z = 0; z < rows; z++) {
            for (let x = 0; x < cols; x++) {
                points.push({
                    x: x * spacing - xOffset,
                    y: 0,
                    z: z * spacing - zOffset,
                    ox: x * spacing - xOffset,
                    oz: z * spacing - zOffset
                });
            }
        }

        const animate = () => {
            if (!canvas || !ctx) return;

            // Clear with correct dimensions
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight); // Use window dims, not canvas dims (which are scaled)

            const width = window.innerWidth;
            const height = window.innerHeight;
            const cx = width / 2;
            const cy = height / 2;

            time += waveSpeed;

            // Pre-calculate rotation constants
            const tiltAngle = 0.5; // Lower tilt for more "landscape" view
            const cosT = Math.cos(tiltAngle);
            const sinT = Math.sin(tiltAngle);

            // Batching Arrays (Quantized Opacity)
            // 0: 0.1-0.3, 1: 0.3-0.5, 2: 0.5-0.7, 3: 0.7-0.9, 4: 0.9-1.0
            const lineBatches: number[][] = [[], [], [], [], []];
            const dotBatches: { x: number, y: number, s: number }[][] = [[], [], [], [], []];

            // Update Points & Project
            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                const dist = Math.sqrt(p.ox * p.ox + p.oz * p.oz);
                p.y = Math.sin(dist * waveFrequency - time) * waveHeight;

                // Projection
                const ry = p.y * cosT - p.z * sinT;
                const rz = p.y * sinT + p.z * cosT + 900;
                const scale = fov / (fov + rz);

                if (scale > 0) {
                    const px = cx + p.x * scale;
                    const py = cy + ry * scale;

                    // Culling: Skip if way off screen
                    if (px < -100 || px > width + 100 || py < -100 || py > height + 100) continue;

                    // Calculate Alpha
                    const alphaDepth = Math.max(0, 1 - (rz / 3000));
                    const maxDist = (gridSize * spacing) / 2;
                    const radialAlpha = Math.max(0, 1 - (dist / maxDist) * 0.6);
                    const finalAlpha = alphaDepth * radialAlpha;

                    if (finalAlpha > 0.1) {
                        // Quantize Alpha for Batching
                        const batchIdx = Math.min(4, Math.floor((finalAlpha - 0.1) / 0.18));
                        if (batchIdx >= 0) {
                            dotBatches[batchIdx].push({ x: px, y: py, s: 1.5 * scale });
                        }
                    }

                    // Store projected coords for lines
                    // We can't easily store them back on 'p' without dirtying the type or using a parallel array
                    // But we need them for the next point. 
                    // Let's just re-project for lines? It's cheap math.
                    // Or better: Horizontal Line
                    const x = i % cols;
                    const z = Math.floor(i / cols);

                    if (x < cols - 1) {
                        const nextP = points[i + 1];
                        const nry = nextP.y * cosT - nextP.z * sinT;
                        const nrz = nextP.y * sinT + nextP.z * cosT + 900;
                        const nScale = fov / (fov + nrz);

                        if (nScale > 0) {
                            const npx = cx + nextP.x * nScale;
                            const npy = cy + nry * nScale;

                            // Average alpha for line
                            const lineAlpha = finalAlpha; // Simplified
                            if (lineAlpha > 0.05) {
                                const batchIdx = Math.min(4, Math.floor((lineAlpha - 0.05) / 0.19));
                                if (batchIdx >= 0) {
                                    lineBatches[batchIdx].push(px, py, npx, npy);
                                }
                            }
                        }
                    }

                    // Vertical Line
                    if (z < rows - 1) {
                        const nextP = points[i + cols];
                        const nry = nextP.y * cosT - nextP.z * sinT;
                        const nrz = nextP.y * sinT + nextP.z * cosT + 900;
                        const nScale = fov / (fov + nrz);

                        if (nScale > 0) {
                            const npx = cx + nextP.x * nScale;
                            const npy = cy + nry * nScale;

                            const lineAlpha = finalAlpha;
                            if (lineAlpha > 0.05) {
                                const batchIdx = Math.min(4, Math.floor((lineAlpha - 0.05) / 0.19));
                                if (batchIdx >= 0) {
                                    lineBatches[batchIdx].push(px, py, npx, npy);
                                }
                            }
                        }
                    }
                }
            }

            // Render Batches
            // Lines
            ctx.lineWidth = 1;
            const opacities = [0.2, 0.4, 0.6, 0.8, 1.0];

            for (let i = 0; i < 5; i++) {
                const batch = lineBatches[i];
                if (batch.length === 0) continue;

                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 77, 0, ${opacities[i] * 0.4})`; // 0.4 multiplier for subtlety

                for (let j = 0; j < batch.length; j += 4) {
                    ctx.moveTo(batch[j], batch[j + 1]);
                    ctx.lineTo(batch[j + 2], batch[j + 3]);
                }
                ctx.stroke();
            }

            // Dots
            for (let i = 0; i < 5; i++) {
                const batch = dotBatches[i];
                if (batch.length === 0) continue;

                ctx.fillStyle = `rgba(255, 77, 0, ${opacities[i]})`;
                ctx.beginPath();
                for (let j = 0; j < batch.length; j++) {
                    const dot = batch[j];
                    ctx.moveTo(dot.x + dot.s, dot.y);
                    ctx.arc(dot.x, dot.y, dot.s, 0, Math.PI * 2);
                }
                ctx.fill();
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', handleResize);
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [shouldAnimate]);

    // Static fallback for reduced motion or small screens.
    if (!shouldAnimate) {
        return (
            <div className="absolute inset-0 overflow-hidden bg-black pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,77,0,0.08)_0%,rgba(0,0,0,0.9)_65%,#000_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:80px_80px]" />
            </div>
        );
    }

    return (
        <div className="absolute inset-0 overflow-hidden bg-black pointer-events-none">
            {/* Base Background - Pure Black */}
            <div className="absolute inset-0 bg-black" />

            {/* Canvas Layer */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />

            {/* Vignette for depth */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] z-20" />
        </div>
    );
};
