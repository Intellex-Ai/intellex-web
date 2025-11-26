import PageHeader from '@/components/ui/PageHeader';

export default function AboutPage() {
    return (
        <>
            <PageHeader
                title="About Intellex"
                description="We are building the intelligence layer for the next generation of data-driven enterprises."
                badge="Mission"
            />
            <div className="container mx-auto px-6 py-20 max-w-4xl">
                <div className="prose prose-invert prose-lg max-w-none font-mono">
                    <p>
                        Intellex was founded on a simple premise: <strong>Intelligence should be accessible, actionable, and beautiful.</strong>
                    </p>
                    <p>
                        In a world drowning in data, clarity is power. We provide the tools to cut through the noise, analyze complex datasets, and deploy insights with surgical precision.
                    </p>
                    <h3>Our Philosophy</h3>
                    <p>
                        We believe in &quot;Cinematic Intelligence&quot;. Data tools shouldn&apos;t just work; they should feel powerful. Every interaction with Intellex is designed to make you feel like you&apos;re operating at the cutting edge of technology.
                    </p>
                </div>
            </div>
        </>
    );
}
