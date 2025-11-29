'use client';

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

type Scale = 'xxs' | 'xs' | 'sm' | 'md';

type SegmentMap = Record<number, boolean[]>;
const SEGMENTS: SegmentMap = {
    0: [true, true, true, true, true, true, false],
    1: [false, true, true, false, false, false, false],
    2: [true, true, false, true, true, false, true],
    3: [true, true, true, true, false, false, true],
    4: [false, true, true, false, false, true, true],
    5: [true, false, true, true, false, true, true],
    6: [true, false, true, true, true, true, true],
    7: [true, true, true, false, false, false, false],
    8: [true, true, true, true, true, true, true],
    9: [true, true, true, true, false, true, true],
};

const SegmentDigit: React.FC<{ digit: string; size?: string; colorClass?: string }> = ({ digit, size, colorClass = "bg-[#ff4d00]" }) => {
    const value = Number.isFinite(Number(digit)) ? Number(digit) : 8;
    const active = SEGMENTS[value] || SEGMENTS[8];
    const base = clsx("absolute", colorClass);
    // Sloped chamfers on segment ends to mimic a physical LED display.
    const horiz = { clipPath: 'polygon(8% 0, 92% 0, 100% 20%, 92% 100%, 8% 100%, 0 80%)' };
    const vert = { clipPath: 'polygon(0 8%, 20% 0, 80% 0, 100% 8%, 100% 92%, 80% 100%, 20% 100%, 0 92%)' };
    const dim = "opacity-10";
    return (
        <div className={clsx("relative w-16 h-28 md:w-20 md:h-32", size)}>
            <div className={clsx(base, "top-0 left-2 right-2 h-3", active[0] ? "opacity-100" : dim)} style={horiz} />
            <div className={clsx(base, "top-3 right-0 w-3 h-12", active[1] ? "opacity-100" : dim)} style={vert} />
            <div className={clsx(base, "bottom-3 right-0 w-3 h-12", active[2] ? "opacity-100" : dim)} style={vert} />
            <div className={clsx(base, "bottom-0 left-2 right-2 h-3", active[3] ? "opacity-100" : dim)} style={horiz} />
            <div className={clsx(base, "bottom-3 left-0 w-3 h-12", active[4] ? "opacity-100" : dim)} style={vert} />
            <div className={clsx(base, "top-3 left-0 w-3 h-12", active[5] ? "opacity-100" : dim)} style={vert} />
            <div className={clsx(base, "top-1/2 left-2 right-2 h-3 -translate-y-1/2", active[6] ? "opacity-100" : dim)} style={horiz} />
        </div>
    );
};

const DigitalClockFace: React.FC<{ hours: string; minutes: string; scale?: Scale; colorClass?: string }> = ({ hours, minutes, scale = 'md', colorClass = "bg-[#ff4d00]" }) => {
    const safeHours = hours.padStart(2, '0').slice(-2);
    const safeMinutes = minutes.padStart(2, '0').slice(-2);
    const digitSize =
        scale === 'xxs'
            ? "w-[12px] h-[22px] md:w-[14px] md:h-[26px]"
            : scale === 'xs'
                ? "w-6 h-10 md:w-7 md:h-12"
                : scale === 'sm'
                    ? "w-8 h-14 md:w-10 md:h-16"
                    : "w-16 h-28 md:w-20 md:h-32";
    const colonSize =
        scale === 'xxs'
            ? "w-[12px] h-[12px]"
            : scale === 'xs'
                ? "w-[14px] h-[14px]"
                : scale === 'sm'
                    ? "w-[14px] h-[14px]"
                    : "w-6 h-6";
    const gap = scale === 'xxs' ? "gap-1" : scale === 'xs' ? "gap-1.5" : scale === 'sm' ? "gap-2" : "gap-6";
    const gapDigits = scale === 'xxs' ? "gap-[2px]" : scale === 'xs' ? "gap-0.5" : scale === 'sm' ? "gap-0.5" : "gap-2";
    const colonGap = scale === 'xxs' ? "gap-[10px]" : scale === 'xs' ? "gap-[12px]" : scale === 'sm' ? "gap-[12px]" : "gap-4";
    return (
        <div className={`flex items-center ${gap} text-[#ff4d00]`}>
            <div className={`flex ${gapDigits}`}>
                <SegmentDigit digit={safeHours[0]} size={digitSize} colorClass={colorClass} />
                <SegmentDigit digit={safeHours[1]} size={digitSize} colorClass={colorClass} />
            </div>
            <div className={`flex flex-col ${colonGap}`}>
                <span className={`${colonSize} ${colorClass}`} />
                <span className={`${colonSize} ${colorClass}`} />
            </div>
            <div className={`flex ${gapDigits}`}>
                <SegmentDigit digit={safeMinutes[0]} size={digitSize} colorClass={colorClass} />
                <SegmentDigit digit={safeMinutes[1]} size={digitSize} colorClass={colorClass} />
            </div>
        </div>
    );
};

type DigitalClockProps = {
    timeZone?: string;
    scale?: Scale;
    className?: string;
};

export function DigitalClock({ timeZone = 'UTC', scale = 'xs', className }: DigitalClockProps) {
    const [clockString, setClockString] = useState(() => {
        try {
            return new Date().toLocaleTimeString('en-US', {
                timeZone,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        }
    });

    useEffect(() => {
        const formatClock = () => {
            try {
                setClockString(new Date().toLocaleTimeString('en-US', {
                    timeZone,
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                }));
            } catch {
                setClockString(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
            }
        };

        formatClock();
        const interval = setInterval(formatClock, 15_000);
        return () => clearInterval(interval);
    }, [timeZone]);

    const [hours, minutes] = clockString.split(':');

    return (
        <div className={clsx("flex items-center", className)}>
            <DigitalClockFace hours={hours ?? '--'} minutes={minutes ?? '--'} scale={scale} />
        </div>
    );
}
