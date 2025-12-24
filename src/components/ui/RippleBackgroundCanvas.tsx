'use client';

import { useEffect, useRef } from 'react';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';

const PRIMARY_COLOR = '255, 77, 0';
const BASE_COLOR = '#000000';
const SEPARATION = 35;
const GRID_COLUMNS = 80;
const GRID_ROWS = 40;
const GRID_COLUMNS_HALF = GRID_COLUMNS / 2;
const GRID_ROWS_HALF = GRID_ROWS / 2;
const WAVE_SPEED = 0.03;
const WAVE_X_FREQUENCY = 0.15;
const WAVE_Y_FREQUENCY = 0.2;
const WAVE_MIX_FREQUENCY = 0.1;
const WAVE_Y_SPEED_MULTIPLIER = 0.5;
const WAVE_MIX_SPEED_MULTIPLIER = 1.5;
const WAVE_PRIMARY_AMPLITUDE = 50;
const WAVE_SECONDARY_AMPLITUDE = 50;
const WAVE_TERTIARY_AMPLITUDE = 20;
const FOV = 350;
const CAMERA_Y = 0;
const CAMERA_Z = 150;
const GRID_DEPTH_OFFSET = 600;
const DEPTH_FADE_DISTANCE = 2500;
const ROW_ALPHA_MULTIPLIER = 0.8;
const COLUMN_ALPHA = 0.15;
const LINE_WIDTH = 1;
const MS_PER_SECOND = 1000;
const DPR_HIGH = 2;
const DPR_MEDIUM = 1.5;
const FALLBACK_DPR = 1;
const START_IDLE_TIMEOUT_MS = 800;
const START_IDLE_FALLBACK_MS = 200;
const CANVAS_CLASSNAME = 'absolute inset-0 w-full h-full';
const CANVAS_STYLE = { willChange: 'transform' } as const;

const FRAME_RATES_BY_LEVEL = {
    high: 45,
    medium: 30,
    low: 20,
} as const;

export const RippleBackgroundCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { prefersReducedMotion, isLowEnd, level } = useDevicePerformance();

    useEffect(() => {
        if (prefersReducedMotion || isLowEnd) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const idleWindow = window as Window & {
            requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
            cancelIdleCallback?: (handle: number) => void;
        };
        const supportsIdleCallback = typeof idleWindow.requestIdleCallback === 'function';
        const targetFps = FRAME_RATES_BY_LEVEL[level] ?? FRAME_RATES_BY_LEVEL.medium;
        const frameInterval = MS_PER_SECOND / targetFps;

        let animationFrameId: number;
        let time = 0;
        let lastFrameTime = 0;
        let isActive = true;
        let startTimeoutId: number | null = null;
        let idleCallbackId: number | null = null;

        const dprCap = level === 'high' ? DPR_HIGH : DPR_MEDIUM;
        const dpr = Math.min(window.devicePixelRatio || FALLBACK_DPR, dprCap);
        let canvasWidth = window.innerWidth;
        let canvasHeight = window.innerHeight;
        let centerX = canvasWidth / 2;
        let centerY = canvasHeight / 2;

        const resize = () => {
            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight;
            centerX = canvasWidth / 2;
            centerY = canvasHeight / 2;
            canvas.width = canvasWidth * dpr;
            canvas.height = canvasHeight * dpr;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
        };

        const xOffsets = Array.from(
            { length: GRID_COLUMNS },
            (_, column) => (column - GRID_COLUMNS_HALF) * SEPARATION
        );
        const zOffsets = Array.from(
            { length: GRID_ROWS },
            (_, row) => (row - GRID_ROWS_HALF) * SEPARATION + GRID_DEPTH_OFFSET
        );
        const rowAlphaValues = zOffsets.map((zOffset) =>
            Math.min(1, Math.max(0, 1 - (zOffset - CAMERA_Z) / DEPTH_FADE_DISTANCE))
        );

        const getWaveHeight = (x: number, y: number) =>
            Math.sin(x * WAVE_X_FREQUENCY + time) * WAVE_PRIMARY_AMPLITUDE +
            Math.sin(y * WAVE_Y_FREQUENCY + time * WAVE_Y_SPEED_MULTIPLIER) * WAVE_SECONDARY_AMPLITUDE +
            Math.sin((x + y) * WAVE_MIX_FREQUENCY + time * WAVE_MIX_SPEED_MULTIPLIER) * WAVE_TERTIARY_AMPLITUDE;

        const animate = (currentTime: number) => {
            if (!canvas || !ctx || !isActive) return;

            const deltaTime = currentTime - lastFrameTime;
            if (deltaTime < frameInterval) {
                animationFrameId = requestAnimationFrame(animate);
                return;
            }
            lastFrameTime = currentTime - (deltaTime % frameInterval);

            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.fillStyle = BASE_COLOR;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            time += WAVE_SPEED;

            ctx.lineWidth = LINE_WIDTH;

            // Render lines along X axis (rows)
            for (let y = 0; y < GRID_ROWS; y++) {
                ctx.beginPath();
                let firstPoint = true;

                const rowAlpha = rowAlphaValues[y];

                if (rowAlpha <= 0) continue;

                ctx.strokeStyle = `rgba(${PRIMARY_COLOR}, ${rowAlpha * ROW_ALPHA_MULTIPLIER})`;

                for (let x = 0; x < GRID_COLUMNS; x++) {
                    const px = xOffsets[x];
                    const pz = zOffsets[y];
                    const py = getWaveHeight(x, y);

                    const worldY = py + CAMERA_Y;
                    const worldZ = pz - CAMERA_Z;

                    if (worldZ > 0) {
                        const scale = FOV / worldZ;
                        const screenX = centerX + px * scale;
                        const screenY = centerY + worldY * scale;

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
            ctx.strokeStyle = `rgba(${PRIMARY_COLOR}, ${COLUMN_ALPHA})`;

            for (let x = 0; x < GRID_COLUMNS; x++) {
                ctx.beginPath();
                let firstPoint = true;

                for (let y = 0; y < GRID_ROWS; y++) {
                    const px = xOffsets[x];
                    const pz = zOffsets[y];
                    const py = getWaveHeight(x, y);

                    const worldY = py + CAMERA_Y;
                    const worldZ = pz - CAMERA_Z;

                    if (worldZ > 0) {
                        const scale = FOV / worldZ;
                        const screenX = centerX + px * scale;
                        const screenY = centerY + worldY * scale;

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

        const startAnimation = () => {
            if (!isActive) return;
            animationFrameId = requestAnimationFrame(animate);
        };

        const scheduleStart = () => {
            if (supportsIdleCallback && idleWindow.requestIdleCallback) {
                idleCallbackId = idleWindow.requestIdleCallback(startAnimation, {
                    timeout: START_IDLE_TIMEOUT_MS,
                });
            } else {
                startTimeoutId = window.setTimeout(startAnimation, START_IDLE_FALLBACK_MS);
            }
        };

        const stopAnimation = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            animationFrameId = 0;
        };

        const handleResize = () => {
            resize();
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                isActive = false;
                stopAnimation();
                return;
            }
            if (!isActive) {
                isActive = true;
                lastFrameTime = 0;
                scheduleStart();
            }
        };

        window.addEventListener('resize', handleResize);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        resize();
        scheduleStart();

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (idleCallbackId !== null && idleWindow.cancelIdleCallback) {
                idleWindow.cancelIdleCallback(idleCallbackId);
            }
            if (startTimeoutId !== null) {
                window.clearTimeout(startTimeoutId);
            }
            stopAnimation();
        };
    }, [prefersReducedMotion, isLowEnd, level]);

    if (prefersReducedMotion || isLowEnd) {
        return null;
    }

    return <canvas ref={canvasRef} className={CANVAS_CLASSNAME} style={CANVAS_STYLE} />;
};
