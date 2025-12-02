import Hero from '@/components/marketing/Hero';
import Features from '@/components/marketing/Features';
import Pricing from '@/components/marketing/Pricing';
import { LazySection } from '@/components/ui/LazySection';

export default function Home() {
  return (
    <>
      <Hero />
      <LazySection minHeight="600px" rootMargin="100px">
        <Features />
      </LazySection>
      <LazySection minHeight="500px" rootMargin="100px">
        <Pricing />
      </LazySection>
    </>
  );
}
