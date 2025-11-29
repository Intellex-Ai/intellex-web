'use client';

import { QRCodeCanvas } from 'qrcode.react';
import Image from 'next/image';

const TARGET_URL = 'https://intellex-web.vercel.app';

export default function QrPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black px-6">
            <div className="w-full max-w-md space-y-6 bg-white/5 border border-white/10 p-8 rounded-sm text-center">
                <p className="text-xs font-mono uppercase text-primary tracking-wide">Share Intellex</p>
                <h1 className="text-2xl font-mono font-bold text-white">Scan to Open</h1>
                <p className="text-sm text-muted">
                    Point your camera at the QR to open Intellex in the browser.
                </p>
                <div className="bg-white p-4 inline-flex border border-white/10 mx-auto">
                    <QRCodeCanvas value={TARGET_URL} size={240} includeMargin bgColor="#ffffff" fgColor="#0f0f0f" />
                </div>
                <div className="text-xs text-muted font-mono break-all">
                    <a href={TARGET_URL} className="text-primary hover:underline" target="_blank" rel="noreferrer">
                        {TARGET_URL}
                    </a>
                </div>
                <div className="text-xs text-muted font-mono">If the canvas doesn&apos;t show, use the fallback image below:</div>
                <div className="bg-white p-4 inline-flex border border-white/10 mx-auto">
                    <Image src="/qr-intellex-web.png" alt="Intellex QR fallback" width={240} height={240} priority />
                </div>
            </div>
        </div>
    );
}
