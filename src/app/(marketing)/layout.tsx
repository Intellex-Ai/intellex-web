import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import { RevealOnScrollController } from '@/components/marketing/RevealOnScrollController';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-primary selection:text-black">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <RevealOnScrollController />
    </div>
  );
}
