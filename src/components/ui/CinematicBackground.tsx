'use client';

import dynamic from 'next/dynamic';

const WRAPPER_CLASSNAME = 'absolute inset-0 overflow-hidden bg-black pointer-events-none';
const GLOW_LAYER_CLASSNAME =
    'absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,77,0,0.08)_0%,rgba(0,0,0,0.9)_65%,#000_100%)]';
const GRID_LAYER_CLASSNAME =
    'absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:80px_80px]';
const VIGNETTE_LAYER_CLASSNAME =
    'absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] z-20';

const CinematicBackgroundCanvas = dynamic(
    () =>
        import('@/components/ui/CinematicBackgroundCanvas').then(
            (mod) => mod.CinematicBackgroundCanvas
        ),
    { ssr: false }
);

export const CinematicBackground = () => (
    <div className={WRAPPER_CLASSNAME}>
        <div className={GLOW_LAYER_CLASSNAME} />
        <div className={GRID_LAYER_CLASSNAME} />
        <CinematicBackgroundCanvas />
        <div className={VIGNETTE_LAYER_CLASSNAME} />
    </div>
);
