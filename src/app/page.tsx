import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/marketing/Hero';
import Features from '@/components/marketing/Features';
import Pricing from '@/components/marketing/Pricing';
import Footer from '@/components/layout/Footer';

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </main>
  );
}
