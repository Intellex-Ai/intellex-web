'use client';

import { useEffect, useMemo, useRef } from 'react';
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
        targetFps: 45,
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

const WAVE_HEIGHT = 50;
const WAVE_FREQUENCY = 0.015;
const TILT_ANGLE = 0.5;
const Z_OFFSET = 900;
const FOV = 600;
const DOT_SCALE_MULTIPLIER = 1.5;
const DEPTH_FADE_DISTANCE = 3000;
const RADIAL_ALPHA_MULTIPLIER = 0.6;
const DOT_ALPHA_THRESHOLD = 0.15;
const DOT_ALPHA_STEP = 0.28;
const LINE_ALPHA_THRESHOLD = 0.1;
const LINE_ALPHA_STEP = 0.3;
const CULL_PADDING = 50;
const LINE_WIDTH = 1;
const LINE_OPACITY_MULTIPLIER = 0.4;
const OPACITY_STEPS = [0.25, 0.5, 0.8] as const;
const BATCH_COUNT = 3;
const MAX_BATCH_INDEX = BATCH_COUNT - 1;
const MS_PER_SECOND = 1000;
const DEFAULT_DPR = 1;
const DPR_HIGH = 2;
const DPR_MEDIUM = 1.5;
const START_IDLE_TIMEOUT_MS = 800;
const START_IDLE_FALLBACK_MS = 200;
const IN_VIEW_THRESHOLD = 0.1;
const ACTIVE_WINDOW_MS = 9000;
const ACTIVITY_THROTTLE_MS = 500;
const PASSIVE_ACTIVITY_EVENTS: Array<keyof WindowEventMap> = ['scroll', 'touchstart'];
const ACTIVE_ACTIVITY_EVENTS: Array<keyof WindowEventMap> = ['pointermove', 'keydown'];

const CANVAS_CLASSNAME = 'absolute inset-0 w-full h-full';
const CANVAS_STYLE = { willChange: 'transform' } as const;

export const CinematicBackgroundCanvas = () => {
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
        const idleWindow = window as Window & {
            requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
            cancelIdleCallback?: (handle: number) => void;
        };
        const supportsIdleCallback = typeof idleWindow.requestIdleCallback === 'function';
        const dprCap = level === 'high' ? DPR_HIGH : DPR_MEDIUM;
        const dpr = Math.min(window.devicePixelRatio || DEFAULT_DPR, dprCap);
        let canvasWidth = window.innerWidth;
        let canvasHeight = window.innerHeight;
        let centerX = canvasWidth / 2;
        let centerY = canvasHeight / 2;
        let cullMinX = -CULL_PADDING;
        let cullMaxX = canvasWidth + CULL_PADDING;
        let cullMinY = -CULL_PADDING;
        let cullMaxY = canvasHeight + CULL_PADDING;

        const handleResize = () => {
            if (!canvas || !ctx) return;
            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight;
            centerX = canvasWidth / 2;
            centerY = canvasHeight / 2;
            canvas.width = canvasWidth * dpr;
            canvas.height = canvasHeight * dpr;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
            cullMinX = -CULL_PADDING;
            cullMaxX = canvasWidth + CULL_PADDING;
            cullMinY = -CULL_PADDING;
            cullMaxY = canvasHeight + CULL_PADDING;
        };

        handleResize();

        const { gridSize, spacing, targetFps, waveSpeed } = config;
        const frameInterval = MS_PER_SECOND / targetFps;
        const maxDist = (gridSize * spacing) / 2;
        const maxDistScale = maxDist > 0 ? 1 / maxDist : 0;
        const cosTilt = Math.cos(TILT_ANGLE);
        const sinTilt = Math.sin(TILT_ANGLE);

        let time = 0;
        let animationFrameId: number;
        let lastFrameTime = 0;
        let isActive = true;
        let isInView = true;
        let isDocumentVisible = !document.hidden;
        let isIdlePaused = false;
        let idlePauseTimeoutId: number | null = null;
        let lastActivityTime = 0;
        let startTimeoutId: number | null = null;
        let idleCallbackId: number | null = null;

        interface Point3D {
            x: number;
            y: number;
            z: number;
            ox: number;
            oz: number;
            dist: number;
            row: number;
            col: number;
        }

        const points: Point3D[] = [];
        const rows = gridSize;
        const cols = gridSize;
        const xOffset = (cols * spacing) / 2;
        const zOffset = (rows * spacing) / 2;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const ox = col * spacing - xOffset;
                const oz = row * spacing - zOffset;
                const dist = Math.sqrt(ox * ox + oz * oz);
                points.push({
                    x: ox,
                    y: 0,
                    z: oz,
                    ox,
                    oz,
                    dist,
                    row,
                    col,
                });
            }
        }

        const lineBatches: number[][] = Array.from({ length: BATCH_COUNT }, () => []);
        const dotBatches: { x: number; y: number; s: number }[][] = Array.from(
            { length: BATCH_COUNT },
            () => []
        );

        const resetBatches = () => {
            for (let i = 0; i < BATCH_COUNT; i++) {
                lineBatches[i].length = 0;
                dotBatches[i].length = 0;
            }
        };

        const animate = (currentTime: number) => {
            if (!canvas || !ctx || !isActive) return;

            // Frame rate throttling
            const deltaTime = currentTime - lastFrameTime;
            if (deltaTime < frameInterval) {
                animationFrameId = requestAnimationFrame(animate);
                return;
            }
            lastFrameTime = currentTime - (deltaTime % frameInterval);

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            time += waveSpeed;

            // Simplified batching - only 3 opacity levels for performance
            resetBatches();

            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                p.y = Math.sin(p.dist * WAVE_FREQUENCY - time) * WAVE_HEIGHT;

                const ry = p.y * cosTilt - p.z * sinTilt;
                const rz = p.y * sinTilt + p.z * cosTilt + Z_OFFSET;
                const scale = FOV / (FOV + rz);

                if (scale <= 0) continue;

                const px = centerX + p.x * scale;
                const py = centerY + ry * scale;

                // Aggressive culling
                if (px < cullMinX || px > cullMaxX || py < cullMinY || py > cullMaxY) continue;

                const alphaDepth = Math.max(0, 1 - (rz / DEPTH_FADE_DISTANCE));
                const radialAlpha = Math.max(0, 1 - p.dist * maxDistScale * RADIAL_ALPHA_MULTIPLIER);
                const finalAlpha = alphaDepth * radialAlpha;

                if (finalAlpha > DOT_ALPHA_THRESHOLD) {
                    const batchIdx = Math.min(
                        MAX_BATCH_INDEX,
                        Math.floor((finalAlpha - DOT_ALPHA_THRESHOLD) / DOT_ALPHA_STEP)
                    );
                    if (batchIdx >= 0) {
                        dotBatches[batchIdx].push({ x: px, y: py, s: DOT_SCALE_MULTIPLIER * scale });
                    }
                }

                // Horizontal lines
                if (p.col < cols - 1 && finalAlpha > LINE_ALPHA_THRESHOLD) {
                    const nextP = points[i + 1];
                    const nry = nextP.y * cosTilt - nextP.z * sinTilt;
                    const nrz = nextP.y * sinTilt + nextP.z * cosTilt + Z_OFFSET;
                    const nScale = FOV / (FOV + nrz);

                    if (nScale > 0) {
                        const npx = centerX + nextP.x * nScale;
                        const npy = centerY + nry * nScale;
                        const batchIdx = Math.min(
                            MAX_BATCH_INDEX,
                            Math.floor((finalAlpha - LINE_ALPHA_THRESHOLD) / LINE_ALPHA_STEP)
                        );
                        if (batchIdx >= 0) {
                            lineBatches[batchIdx].push(px, py, npx, npy);
                        }
                    }
                }

                // Vertical lines
                if (p.row < rows - 1 && finalAlpha > LINE_ALPHA_THRESHOLD) {
                    const nextP = points[i + cols];
                    const nry = nextP.y * cosTilt - nextP.z * sinTilt;
                    const nrz = nextP.y * sinTilt + nextP.z * cosTilt + Z_OFFSET;
                    const nScale = FOV / (FOV + nrz);

                    if (nScale > 0) {
                        const npx = centerX + nextP.x * nScale;
                        const npy = centerY + nry * nScale;
                        const batchIdx = Math.min(
                            MAX_BATCH_INDEX,
                            Math.floor((finalAlpha - LINE_ALPHA_THRESHOLD) / LINE_ALPHA_STEP)
                        );
                        if (batchIdx >= 0) {
                            lineBatches[batchIdx].push(px, py, npx, npy);
                        }
                    }
                }
            }

            // Render lines
            ctx.lineWidth = LINE_WIDTH;

            for (let i = 0; i < BATCH_COUNT; i++) {
                const batch = lineBatches[i];
                if (batch.length === 0) continue;

                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 77, 0, ${OPACITY_STEPS[i] * LINE_OPACITY_MULTIPLIER})`;

                for (let j = 0; j < batch.length; j += 4) {
                    ctx.moveTo(batch[j], batch[j + 1]);
                    ctx.lineTo(batch[j + 2], batch[j + 3]);
                }
                ctx.stroke();
            }

            // Render dots
            for (let i = 0; i < BATCH_COUNT; i++) {
                const batch = dotBatches[i];
                if (batch.length === 0) continue;

                ctx.fillStyle = `rgba(255, 77, 0, ${OPACITY_STEPS[i]})`;
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

        const updateActivityState = () => {
            const shouldBeActive = isDocumentVisible && isInView && !isIdlePaused;
            if (shouldBeActive === isActive) return;

            isActive = shouldBeActive;
            if (!isActive) {
                stopAnimation();
                return;
            }
            lastFrameTime = 0;
            scheduleStart();
        };

        const scheduleIdlePause = () => {
            if (idlePauseTimeoutId !== null) {
                window.clearTimeout(idlePauseTimeoutId);
            }
            idlePauseTimeoutId = window.setTimeout(() => {
                isIdlePaused = true;
                updateActivityState();
            }, ACTIVE_WINDOW_MS);
        };

        const handleUserActivity = () => {
            const now = Date.now();
            if (now - lastActivityTime < ACTIVITY_THROTTLE_MS) return;
            lastActivityTime = now;

            if (isIdlePaused) {
                isIdlePaused = false;
                updateActivityState();
            }
            scheduleIdlePause();
        };

        const handleVisibilityChange = () => {
            isDocumentVisible = !document.hidden;
            updateActivityState();
        };

        const handleIntersection: IntersectionObserverCallback = (entries) => {
            isInView = Boolean(entries[0]?.isIntersecting);
            updateActivityState();
        };

        window.addEventListener('resize', handleResize);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        PASSIVE_ACTIVITY_EVENTS.forEach((eventName) => {
            window.addEventListener(eventName, handleUserActivity, { passive: true });
        });
        ACTIVE_ACTIVITY_EVENTS.forEach((eventName) => {
            window.addEventListener(eventName, handleUserActivity);
        });
        const intersectionObserver =
            typeof IntersectionObserver !== 'undefined'
                ? new IntersectionObserver(handleIntersection, { threshold: IN_VIEW_THRESHOLD })
                : null;
        if (intersectionObserver) {
            intersectionObserver.observe(canvas);
        }
        scheduleStart();
        scheduleIdlePause();

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            PASSIVE_ACTIVITY_EVENTS.forEach((eventName) => {
                window.removeEventListener(eventName, handleUserActivity);
            });
            ACTIVE_ACTIVITY_EVENTS.forEach((eventName) => {
                window.removeEventListener(eventName, handleUserActivity);
            });
            if (intersectionObserver) {
                intersectionObserver.disconnect();
            }
            if (idleCallbackId !== null && idleWindow.cancelIdleCallback) {
                idleWindow.cancelIdleCallback(idleCallbackId);
            }
            if (startTimeoutId !== null) {
                window.clearTimeout(startTimeoutId);
            }
            if (idlePauseTimeoutId !== null) {
                window.clearTimeout(idlePauseTimeoutId);
            }
            stopAnimation();
        };
    }, [config, prefersReducedMotion, isLowEnd, level]);

    if (prefersReducedMotion || isLowEnd) {
        return null;
    }

    return <canvas ref={canvasRef} className={CANVAS_CLASSNAME} style={CANVAS_STYLE} />;
};
