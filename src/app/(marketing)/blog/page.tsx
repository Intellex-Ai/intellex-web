import PageHeader from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Reveal } from '@/components/ui/Reveal';

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
                        <Reveal key={i} delay={0.05 * i}>
                            <Card className="group cursor-pointer border border-white/10 bg-black/50 hover:border-primary/50 transition-colors">
                                <div className="h-48 bg-white/5 border-b border-white/10 mb-6 group-hover:bg-primary/5 transition-colors" />
                                <div className="px-6 pb-6">
                                    <span className="text-primary text-xs font-mono uppercase mb-2 block">Intelligence Report #{i}</span>
                                    <h3 className="text-xl font-black text-white mb-3 uppercase">The Future of Data Analysis</h3>
                                    <p className="text-muted text-sm font-mono mb-4">
                                        Exploring how AI agents are reshaping the landscape of corporate intelligence gathering.
                                    </p>
                                    <span className="text-white text-xs font-mono uppercase group-hover:text-primary transition-colors">Read Transmission -&gt;</span>
                                </div>
                            </Card>
                        </Reveal>
                    ))}
                </div>
            </div>
        </>
    );
}
