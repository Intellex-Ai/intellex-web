'use client';

import { Card } from '@/components/ui/Card';
import { Zap, Shield, BarChart3, Globe, Cpu, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
    {
        icon: <Zap size={24} />,
        title: "REAL_TIME_ANALYSIS",
        description: "PROCESS DATA STREAMS INSTANTLY WITH OUR LOW-LATENCY ENGINE DESIGNED FOR SCALE."
    },
    {
        icon: <Shield size={24} />,
        title: "ENTERPRISE_SECURITY",
        description: "BANK-GRADE ENCRYPTION AND COMPLIANCE STANDARDS BUILT INTO EVERY LAYER OF THE PLATFORM."
    },
    {
        icon: <BarChart3 size={24} />,
        title: "ADVANCED_ANALYTICS",
        description: "GAIN DEEP INSIGHTS WITH OUR POWERFUL VISUALIZATION TOOLS AND CUSTOM REPORTING."
    },
    {
        icon: <Globe size={24} />,
        title: "GLOBAL_INFRASTRUCTURE",
        description: "DEPLOYED ACROSS 30+ REGIONS TO ENSURE YOUR DATA IS ALWAYS CLOSE TO YOUR USERS."
    },
    {
        icon: <Cpu size={24} />,
        title: "AI_POWERED",
        description: "LEVERAGE STATE-OF-THE-ART MACHINE LEARNING MODELS TO AUTOMATE COMPLEX TASKS."
    },
    {
        icon: <Layers size={24} />,
        title: "SEAMLESS_INTEGRATION",
        description: "CONNECT WITH YOUR EXISTING TOOLS VIA OUR ROBUST API AND PRE-BUILT CONNECTORS."
    }
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function Features() {
    return (
        <section id="features" className="py-32 relative bg-black border-t border-white/10 lg:py-24 sm:py-16 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:50px_50px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_80%)] pointer-events-none" />
            <div className="container mx-auto px-6 relative z-10 max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <h2 className="font-mono text-3xl md:text-4xl lg:text-5xl font-black mb-4 tracking-tighter uppercase text-white">SYSTEM_CAPABILITIES</h2>
                    <p className="font-mono text-muted text-sm md:text-base uppercase tracking-wider">
                        COMPLETE_TOOL_SUITE. BUILD. DEPLOY. SCALE.
                    </p>
                </motion.div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {features.map((feature, index) => (
                        <motion.div key={index} variants={item}>
                            <Card hoverEffect className="h-full group bg-black/50 backdrop-blur-sm p-8">
                                <div className="w-14 h-14 rounded bg-black flex items-center justify-center text-primary mb-6 border border-white/10 transition-colors duration-300 group-hover:border-primary group-hover:text-white group-hover:bg-primary">
                                    {feature.icon}
                                </div>
                                <h3 className="font-mono text-lg md:text-xl font-black mb-4 uppercase text-white">{feature.title}</h3>
                                <p className="text-muted leading-relaxed font-mono text-sm">{feature.description}</p>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
