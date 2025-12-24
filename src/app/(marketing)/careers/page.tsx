import { MarketingPanel } from '@/components/marketing/MarketingPanel';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';

const ROLE_STAGGER_DELAY = 0.05;

export default function CareersPage() {
    return (
        <>
            <PageHeader
                title="Join the Resistance"
                description="We are looking for operatives to help us build the future of intelligence."
                badge="Careers"
            />
            <div className="container mx-auto px-6 py-20 max-w-4xl">
                <div className="space-y-6">
                    {['Senior Frontend Engineer', 'AI Research Scientist', 'Product Designer'].map((role, idx) => (
                        <MarketingPanel key={role} delay={ROLE_STAGGER_DELAY * idx} hoverEffect spotlight>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase mb-2">{role}</h3>
                                    <div className="flex gap-4 text-xs font-mono text-muted uppercase">
                                        <span>Remote</span>
                                        <span>•</span>
                                        <span>Full-time</span>
                                        <span>•</span>
                                        <span>Engineering</span>
                                    </div>
                                </div>
                                <Button variant="secondary">Apply Now</Button>
                            </div>
                        </MarketingPanel>
                    ))}
                </div>
            </div>
        </>
    );
}
