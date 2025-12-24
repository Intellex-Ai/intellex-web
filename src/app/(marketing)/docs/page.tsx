import { MarketingPanel } from '@/components/marketing/MarketingPanel';
import PageHeader from '@/components/ui/PageHeader';

const CARD_STAGGER_DELAY = 0.05;

export default function DocsPage() {
    return (
        <>
            <PageHeader
                title="Documentation"
                description="Manuals, protocols, and API references for Intellex operatives."
                badge="Docs"
            />
            <div className="container mx-auto px-6 py-20 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {['Quick Start', 'API Reference', 'Security Protocols', 'Data Integration'].map((doc, idx) => (
                        <MarketingPanel
                            key={doc}
                            delay={CARD_STAGGER_DELAY * idx}
                            hoverEffect
                            spotlight
                            className="cursor-pointer"
                        >
                            <h3 className="text-xl font-black text-white uppercase mb-3 group-hover:text-primary transition-colors">{doc}</h3>
                            <p className="text-muted font-mono text-sm mb-4">
                                Access the classified documentation for {doc.toLowerCase()}.
                            </p>
                            <span className="text-xs font-mono text-white uppercase group-hover:text-primary transition-colors">Access File -&gt;</span>
                        </MarketingPanel>
                    ))}
                </div>
            </div>
        </>
    );
}
