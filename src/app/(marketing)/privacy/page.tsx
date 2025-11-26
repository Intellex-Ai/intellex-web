import PageHeader from '@/components/ui/PageHeader';

export default function PrivacyPage() {
    return (
        <>
            <PageHeader
                title="Privacy Protocol"
                description="How we handle and secure your classified data."
                badge="Legal"
            />
            <div className="container mx-auto px-6 py-20 max-w-4xl">
                <div className="prose prose-invert prose-lg max-w-none font-mono">
                    <h3>1. Data Collection</h3>
                    <p>
                        We collect only the data necessary to provide our intelligence services. All data is encrypted at rest and in transit using military-grade protocols.
                    </p>
                    <h3>2. Usage</h3>
                    <p>
                        Your data is used solely for the purpose of generating insights within your authorized workspace. We do not sell or share your data with third-party entities.
                    </p>
                    <h3>3. Security</h3>
                    <p>
                        Our systems are monitored 24/7 for unauthorized access. We employ zero-trust architecture to ensure maximum security.
                    </p>
                </div>
            </div>
        </>
    );
}
