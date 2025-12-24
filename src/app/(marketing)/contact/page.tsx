import { MarketingPanel } from '@/components/marketing/MarketingPanel';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';

export default function ContactPage() {
    return (
        <>
            <PageHeader
                title="Establish Comms"
                description="Secure channel open. Send us your queries, feedback, or intelligence reports."
                badge="Contact"
            />
            <div className="container mx-auto px-6 py-20 max-w-2xl">
                <MarketingPanel>
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-primary uppercase">Codename / Name</label>
                                <input type="text" className="w-full bg-black border border-white/10 px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-primary transition-colors" placeholder="JANE DOE" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-primary uppercase">Frequency / Email</label>
                                <input type="email" className="w-full bg-black border border-white/10 px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-primary transition-colors" placeholder="JANE@EXAMPLE.COM" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-primary uppercase">Transmission / Message</label>
                            <textarea rows={6} className="w-full bg-black border border-white/10 px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-primary transition-colors" placeholder="ENTER_MESSAGE..." />
                        </div>
                        <Button variant="primary" className="w-full">Send Transmission</Button>
                    </form>
                </MarketingPanel>
            </div>
        </>
    );
}
