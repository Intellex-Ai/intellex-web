'use client';

import dynamic from 'next/dynamic';

const WRAPPER_CLASSNAME = 'absolute inset-0 overflow-hidden bg-black pointer-events-none';
const BASE_GRADIENT_CLASSNAME =
    'absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,10,0,0.3)_0%,rgba(0,0,0,1)_100%)]';
const VIGNETTE_CLASSNAME =
    'absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_90%)] z-20';

const RippleBackgroundCanvas = dynamic(
    () =>
        import('@/components/ui/RippleBackgroundCanvas').then(
            (mod) => mod.RippleBackgroundCanvas
        ),
    { ssr: false }
);

export const RippleBackground = () => (
    <div className={WRAPPER_CLASSNAME}>
        <div className={BASE_GRADIENT_CLASSNAME} />
        <RippleBackgroundCanvas />
        <div className={VIGNETTE_CLASSNAME} />
    </div>
);
