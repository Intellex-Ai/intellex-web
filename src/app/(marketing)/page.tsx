import Hero from '@/components/marketing/Hero';
import Features from '@/components/marketing/Features';
import Pricing from '@/components/marketing/Pricing';
import { LazySection } from '@/components/ui/LazySection';

export default function Home() {
  return (
    <>
      <Hero />
      <LazySection minHeight="600px">
        <Features />
      </LazySection>
      <LazySection minHeight="500px">
        <Pricing />
      </LazySection>
    </>
  );
}
