'use client';

import React from 'react';


interface VideoBackgroundProps {
    videoUrl?: string;
    posterUrl?: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
    videoUrl = "https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-network-background-3166-large.mp4", // Placeholder tech video
    posterUrl
}) => {
    return (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover opacity-60 mix-blend-screen"
                poster={posterUrl}
            >
                <source src={videoUrl} type="video/mp4" />
            </video>
            <div className="absolute top-0 left-0 w-full h-full bg-black/60 z-10" />
            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:50px_50px] z-20 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] z-20 pointer-events-none" />
        </div>
    );
};
