"use client";

import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Check } from 'lucide-react';

const plans = [
    {
        name: "Starter",
        price: "$0",
        description: "Perfect for hobbyists and side projects.",
        features: [
            "Up to 3 projects",
            "Basic analytics",
            "Community support",
            "1GB storage"
        ],
        cta: "Start for Free",
        variant: "ghost" as const
    },
    {
        name: "Pro",
        price: "$29",
        description: "For growing teams and businesses.",
        popular: true,
        features: [
            "Unlimited projects",
            "Advanced analytics",
            "Priority support",
            "10GB storage",
            "API access"
        ],
        cta: "Get Started",
        variant: "primary" as const
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "For large-scale organizations.",
        features: [
            "Unlimited everything",
            "Custom contracts",
            "Dedicated account manager",
            "SSO & Audit logs",
            "SLA guarantee"
        ],
        cta: "Contact Sales",
        variant: "secondary" as const
    }
];

export default function Pricing() {
    return (
        <section id="pricing" className="py-24 bg-black border-t border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:50px_50px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_80%)] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10 max-w-7xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="font-mono text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 tracking-tight sm:tracking-tighter uppercase text-white break-words">
                        SIMPLE_TRANSPARENT_<br className="block sm:hidden" />PRICING
                    </h2>
                    <p className="font-mono text-muted text-sm md:text-base uppercase tracking-wider">
                        CHOOSE_YOUR_PROTOCOL. NO_HIDDEN_FEES.
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="grid md:grid-cols-3 sm:grid-cols-1 gap-6">
                    {plans.map((plan, index) => (
                        <div key={index} className="transition-transform duration-300 will-change-transform hover:-translate-y-1">
                            <div
                                className={clsx(
                                    "relative h-full bg-black/50 backdrop-blur-sm border border-white/10",
                                    plan.popular && "border-2 border-primary shadow-[0_0_40px_-10px_rgba(255,77,0,0.3)]"
                                )}
                            >
                                {plan.popular && (
                                    <div className="absolute top-4 right-4 z-20">
                                        <Badge variant="neutral">POPULAR</Badge>
                                    </div>
                                )}

                                <div className="p-6 md:p-8 border-b border-white/10">
                                    <h3 className="font-mono text-2xl font-black mb-2 uppercase text-primary">
                                        {plan.name}
                                    </h3>
                                    <div className="flex items-baseline gap-2 mb-4">
                                        <span className="font-sans text-5xl md:text-6xl font-black text-white leading-none tracking-tighter">
                                            {plan.price}
                                        </span>
                                        {plan.price !== "Custom" && (
                                            <span className="font-mono text-muted text-sm uppercase">/MO</span>
                                        )}
                                    </div>
                                    <p className="font-mono text-muted text-sm leading-relaxed">
                                        {plan.description}
                                    </p>
                                </div>

                                <ul className="p-6 md:p-8 space-y-3 md:space-y-4 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-white font-mono text-sm">
                                            <Check size={16} className="text-primary shrink-0 w-4 h-4 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="p-6 md:p-8 pt-0">
                                    <Button
                                        variant={plan.variant}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {plan.cta.toUpperCase()}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
