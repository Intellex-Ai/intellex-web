import Link from 'next/link';
import { RippleBackground } from '@/components/ui/RippleBackground';
import { BackButton } from '@/components/ui/BackButton';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="flex h-screen bg-black overflow-hidden">
            {/* Left Side - Form */}
            <div className="flex-1 flex flex-col p-4 md:p-8 max-w-[600px] border-r border-white/10 bg-black relative z-20 lg:max-w-full lg:w-1/2 xl:w-[40%] h-full">
                {/* Mobile Background - Ripple */}
                <div className="absolute inset-0 z-0 lg:hidden">
                    <RippleBackground />
                    <div className="absolute inset-0 bg-black/60" /> {/* Dark overlay for readability */}
                </div>

                {/* Dot Grid Background */}
                <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px] opacity-20 pointer-events-none" />

                <div className="mb-4 relative z-10 shrink-0">
                    <div className="mb-4">
                        <BackButton />
                    </div>
                    <Link href="/" className="font-mono text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <span className="text-primary">{'///'}</span> INTELLEX
                    </Link>
                </div>

                <div className="flex-1 flex flex-col justify-center max-w-[400px] w-full mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full"
                    >
                        <h1 className="font-mono text-2xl md:text-3xl font-black mb-2 tracking-tighter uppercase text-white">{title}</h1>
                        <p className="font-mono text-muted mb-6 text-xs uppercase tracking-wider leading-relaxed">{subtitle}</p>
                        {children}
                    </motion.div>
                </div>

                <div className="mt-auto pt-4 relative z-10 shrink-0">
                    <p className="font-mono text-[10px] text-muted uppercase">
                        SECURE_CONNECTION_ESTABLISHED<br />
                        © {new Date().getFullYear()} INTELLEX_INC.
                    </p>
                </div>
            </div>

            {/* Right Side - Visuals */}
            <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden bg-black">
                <RippleBackground />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent z-10" />

                <div className="relative z-20 max-w-xl p-12">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="border-l-2 border-primary pl-8 backdrop-blur-sm bg-black/30 p-8 rounded-r-xl border-y border-r border-white/10"
                    >
                        <h2 className="font-mono text-5xl font-black mb-6 text-white uppercase leading-[0.9] tracking-tighter">
                            Intelligence<br />
                            <span className="text-primary">At Scale</span>
                        </h2>
                        <p className="font-mono text-lg text-muted leading-relaxed uppercase">
                            Join the network of operatives building the future of data analysis.
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
