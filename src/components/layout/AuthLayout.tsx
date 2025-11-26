
import Link from 'next/link';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen bg-black">
            <div className="flex-1 flex flex-col p-16 max-w-[600px] border-r-2 border-primary bg-black/90 relative z-20 lg:max-w-full lg:border-r-0 lg:p-8">
                <div className="mb-24">
                    <Link href="/" className="font-mono text-2xl font-black text-primary uppercase tracking-tighter border-2 border-primary px-4 py-2 bg-[rgba(255,51,0,0.1)]">
                        Intellex
                    </Link>
                </div>
                <div className="flex-1 flex flex-col justify-center max-w-[400px] w-full mx-auto">
                    <h1 className="font-sans text-5xl font-black mb-2 tracking-tighter uppercase text-foreground">{title}</h1>
                    <p className="font-mono text-muted mb-12 text-sm uppercase tracking-wider">{subtitle}</p>
                    {children}
                </div>
                <div className="mt-auto border-t-2 border-border pt-4">
                    <p className="font-mono text-xs text-muted uppercase">© {new Date().getFullYear()} Intellex Inc.</p>
                </div>
            </div>
            <div className="flex-[1.5] bg-black relative flex items-center justify-center overflow-hidden lg:hidden bg-[linear-gradient(rgba(255,51,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,51,0,0.1)_1px,transparent_1px)] bg-[length:50px_50px]">
                <div className="relative z-10 text-left max-w-[600px] p-16 border-2 border-primary bg-black/80 backdrop-blur-md">
                    <h2 className="font-mono text-6xl font-black mb-4 text-primary uppercase leading-[0.9]">Intelligence at Scale</h2>
                    <p className="font-mono text-xl text-foreground leading-relaxed uppercase">
                        Join thousands of developers building the future of intelligence gathering.
                    </p>
                </div>
            </div>
        </div>
    );
}
