'use client';

import React from 'react';


interface VideoBackgroundProps {
    videoUrl?: string;
    posterUrl?: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
    videoUrl = "https://assets.mixkit.co/videos/preview/mixkit-white-smoke-floating-on-black-background-1563-large.mp4", // Aesthetic Smoke
    posterUrl
}) => {
    return (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 bg-black">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover opacity-60 mix-blend-screen grayscale"
                poster={posterUrl}
            >
                <source src={videoUrl} type="video/mp4" />
            </video>

            {/* Minimal Overlay to ensure text is readable */}
            <div className="absolute inset-0 bg-black/40 z-10" />

            {/* Subtle Dot Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:30px_30px] opacity-20 z-20 pointer-events-none" />

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] z-20 pointer-events-none" />
        </div>
    );
};
