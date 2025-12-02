'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { useDevicePerformance, PerformanceLevel } from '@/hooks/useDevicePerformance';

interface GridConfig {
    gridSize: number;
    spacing: number;
    targetFps: number;
    waveSpeed: number;
}

const GRID_CONFIGS: Record<PerformanceLevel, GridConfig> = {
    high: {
        gridSize: 50,
        spacing: 60,
        targetFps: 60,
        waveSpeed: 0.04,
    },
    medium: {
        gridSize: 30,
        spacing: 80,
        targetFps: 30,
        waveSpeed: 0.03,
    },
    low: {
        gridSize: 20,
        spacing: 100,
        targetFps: 20,
        waveSpeed: 0.025,
    },
};

const StaticFallback = () => (
    <div className="absolute inset-0 overflow-hidden bg-black pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,77,0,0.08)_0%,rgba(0,0,0,0.9)_65%,#000_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:80px_80px]" />
    </div>
);

export const CinematicBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { level, prefersReducedMotion, isLowEnd } = useDevicePerformance();

    const config = useMemo(() => GRID_CONFIGS[level], [level]);

    useEffect(() => {
        if (prefersReducedMotion || isLowEnd) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        // Cap DPI for performance
        const dpr = Math.min(window.devicePixelRatio || 1, level === 'high' ? 2 : 1.5);

        const handleResize = () => {
            if (!canvas || !ctx) return;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.scale(dpr, dpr);
        };

        handleResize();

        const { gridSize, spacing, targetFps, waveSpeed } = config;
        const fov = 600;
        const waveHeight = 50;
        const waveFrequency = 0.015;
        const frameInterval = 1000 / targetFps;

        let time = 0;
        let animationFrameId: number;
        let lastFrameTime = 0;

        interface Point3D {
            x: number;
            y: number;
            z: number;
            ox: number;
            oz: number;
        }

        const points: Point3D[] = [];
        const rows = gridSize;
        const cols = gridSize;
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

        const animate = (currentTime: number) => {
            if (!canvas || !ctx) return;

            // Frame rate throttling
            const deltaTime = currentTime - lastFrameTime;
            if (deltaTime < frameInterval) {
                animationFrameId = requestAnimationFrame(animate);
                return;
            }
            lastFrameTime = currentTime - (deltaTime % frameInterval);

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

            const width = window.innerWidth;
            const height = window.innerHeight;
            const cx = width / 2;
            const cy = height / 2;

            time += waveSpeed;

            const tiltAngle = 0.5;
            const cosT = Math.cos(tiltAngle);
            const sinT = Math.sin(tiltAngle);

            // Simplified batching - only 3 opacity levels for performance
            const lineBatches: number[][] = [[], [], []];
            const dotBatches: { x: number; y: number; s: number }[][] = [[], [], []];

            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                const dist = Math.sqrt(p.ox * p.ox + p.oz * p.oz);
                p.y = Math.sin(dist * waveFrequency - time) * waveHeight;

                const ry = p.y * cosT - p.z * sinT;
                const rz = p.y * sinT + p.z * cosT + 900;
                const scale = fov / (fov + rz);

                if (scale <= 0) continue;

                const px = cx + p.x * scale;
                const py = cy + ry * scale;

                // Aggressive culling
                if (px < -50 || px > width + 50 || py < -50 || py > height + 50) continue;

                const alphaDepth = Math.max(0, 1 - (rz / 3000));
                const maxDist = (gridSize * spacing) / 2;
                const radialAlpha = Math.max(0, 1 - (dist / maxDist) * 0.6);
                const finalAlpha = alphaDepth * radialAlpha;

                if (finalAlpha > 0.15) {
                    const batchIdx = Math.min(2, Math.floor((finalAlpha - 0.15) / 0.28));
                    if (batchIdx >= 0) {
                        dotBatches[batchIdx].push({ x: px, y: py, s: 1.5 * scale });
                    }
                }

                const x = i % cols;
                const z = Math.floor(i / cols);

                // Horizontal lines
                if (x < cols - 1 && finalAlpha > 0.1) {
                    const nextP = points[i + 1];
                    const nry = nextP.y * cosT - nextP.z * sinT;
                    const nrz = nextP.y * sinT + nextP.z * cosT + 900;
                    const nScale = fov / (fov + nrz);

                    if (nScale > 0) {
                        const npx = cx + nextP.x * nScale;
                        const npy = cy + nry * nScale;
                        const batchIdx = Math.min(2, Math.floor((finalAlpha - 0.1) / 0.3));
                        if (batchIdx >= 0) {
                            lineBatches[batchIdx].push(px, py, npx, npy);
                        }
                    }
                }

                // Vertical lines
                if (z < rows - 1 && finalAlpha > 0.1) {
                    const nextP = points[i + cols];
                    const nry = nextP.y * cosT - nextP.z * sinT;
                    const nrz = nextP.y * sinT + nextP.z * cosT + 900;
                    const nScale = fov / (fov + nrz);

                    if (nScale > 0) {
                        const npx = cx + nextP.x * nScale;
                        const npy = cy + nry * nScale;
                        const batchIdx = Math.min(2, Math.floor((finalAlpha - 0.1) / 0.3));
                        if (batchIdx >= 0) {
                            lineBatches[batchIdx].push(px, py, npx, npy);
                        }
                    }
                }
            }

            // Render lines
            ctx.lineWidth = 1;
            const opacities = [0.25, 0.5, 0.8];

            for (let i = 0; i < 3; i++) {
                const batch = lineBatches[i];
                if (batch.length === 0) continue;

                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 77, 0, ${opacities[i] * 0.4})`;

                for (let j = 0; j < batch.length; j += 4) {
                    ctx.moveTo(batch[j], batch[j + 1]);
                    ctx.lineTo(batch[j + 2], batch[j + 3]);
                }
                ctx.stroke();
            }

            // Render dots
            for (let i = 0; i < 3; i++) {
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
        animationFrameId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [config, prefersReducedMotion, isLowEnd, level]);

    // Show static fallback for reduced motion or low-end devices
    if (prefersReducedMotion || isLowEnd) {
        return <StaticFallback />;
    }

    return (
        <div className="absolute inset-0 overflow-hidden bg-black pointer-events-none">
            <div className="absolute inset-0 bg-black" />
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ willChange: 'transform' }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] z-20" />
        </div>
    );
};
