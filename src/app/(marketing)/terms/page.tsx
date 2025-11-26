import PageHeader from '@/components/ui/PageHeader';

export default function TermsPage() {
    return (
        <>
            <PageHeader
                title="Terms of Service"
                description="The rules of engagement for using the Intellex platform."
                badge="Legal"
            />
            <div className="container mx-auto px-6 py-20 max-w-4xl">
                <div className="prose prose-invert prose-lg max-w-none font-mono">
                    <h3>1. Acceptance</h3>
                    <p>
                        By accessing Intellex, you agree to be bound by these Terms of Service. If you do not agree, you are unauthorized to use the platform.
                    </p>
                    <h3>2. License</h3>
                    <p>
                        We grant you a limited, non-exclusive, non-transferable license to use Intellex for your internal business purposes, subject to these Terms.
                    </p>
                    <h3>3. Restrictions</h3>
                    <p>
                        You may not reverse engineer, decompile, or attempt to extract the source code of the platform. Any attempt to do so will result in immediate termination of access.
                    </p>
                </div>
            </div>
        </>
    );
}
