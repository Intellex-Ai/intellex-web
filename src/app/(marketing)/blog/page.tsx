import { MarketingPanel } from '@/components/marketing/MarketingPanel';
import PageHeader from '@/components/ui/PageHeader';

const CARD_STAGGER_DELAY = 0.05;

export default function BlogPage() {
    return (
        <>
            <PageHeader
                title="Transmission Log"
                description="Updates, insights, and intelligence reports from the Intellex HQ."
                badge="Blog"
            />
            <div className="container mx-auto px-6 py-20 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                        <MarketingPanel
                            key={i}
                            delay={CARD_STAGGER_DELAY * i}
                            hoverEffect
                            spotlight
                            className="cursor-pointer"
                        >
                            <div className="h-48 bg-white/5 border-b border-white/10 mb-6 group-hover:bg-primary/5 transition-colors" />
                            <div className="px-6 pb-6">
                                <span className="text-primary text-xs font-mono uppercase mb-2 block">Intelligence Report #{i}</span>
                                <h3 className="text-xl font-black text-white mb-3 uppercase">The Future of Data Analysis</h3>
                                <p className="text-muted text-sm font-mono mb-4">
                                    Exploring how AI agents are reshaping the landscape of corporate intelligence gathering.
                                </p>
                                <span className="text-white text-xs font-mono uppercase group-hover:text-primary transition-colors">Read Transmission -&gt;</span>
                            </div>
                        </MarketingPanel>
                    ))}
                </div>
            </div>
        </>
    );
}
