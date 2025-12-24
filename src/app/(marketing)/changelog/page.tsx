import { MarketingPanel } from '@/components/marketing/MarketingPanel';
import PageHeader from '@/components/ui/PageHeader';

const ENTRY_STAGGER_DELAY = 0.05;

export default function ChangelogPage() {
    return (
        <>
            <PageHeader
                title="System Updates"
                description="Tracking the evolution of the Intellex platform."
                badge="Changelog"
            />
            <div className="container mx-auto px-6 py-20 max-w-3xl">
                <div className="relative border-l border-white/10 ml-3 space-y-12">
                    {[
                        { version: 'v1.0.0', date: '2024-05-20', title: 'Initial Launch', items: ['Core intelligence engine online', 'Neural network integration', 'Secure data vaults'] },
                        { version: 'v0.9.0', date: '2024-04-15', title: 'Beta Access', items: ['Early access for enterprise partners', 'Performance optimization'] }
                    ].map((release, idx) => (
                        <MarketingPanel key={release.version} delay={ENTRY_STAGGER_DELAY * idx} className="pl-8 overflow-visible">
                            <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_10px_rgba(255,100,0,0.5)]" />
                            <div className="mb-2 flex items-center gap-4">
                                <span className="font-mono text-primary text-sm font-bold">{release.version}</span>
                                <span className="font-mono text-muted text-xs">{release.date}</span>
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase mb-4">{release.title}</h3>
                            <ul className="space-y-2">
                                {release.items.map((item) => (
                                    <li key={item} className="text-muted font-mono text-sm flex items-start gap-2">
                                        <span className="text-primary mt-1">-&gt;</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </MarketingPanel>
                    ))}
                </div>
            </div>
        </>
    );
}
