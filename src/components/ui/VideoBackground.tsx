'use client';

import React from 'react';


interface VideoBackgroundProps {
    videoUrl?: string;
    posterUrl?: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
    videoUrl = "https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4", // Pexels: Abstract Black and White Lines
    posterUrl
}) => {
    return (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 bg-black">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover opacity-50 grayscale"
                poster={posterUrl}
            >
                <source src={videoUrl} type="video/mp4" />
            </video>

            {/* Minimal Overlay for text readability */}
            <div className="absolute inset-0 bg-black/30 z-10" />

            {/* Subtle Dot Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:30px_30px] opacity-20 z-20 pointer-events-none" />

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] z-20 pointer-events-none" />
        </div>
    );
};
