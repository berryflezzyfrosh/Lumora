import Footer from '@/components/Footer';
import AiTools from '@/components/landing/AiTools';
import Community from '@/components/landing/Community';
import Creators from '@/components/landing/Creators';
import Faq from '@/components/landing/Faq';
import Hero from '@/components/landing/Hero';
import Pricing from '@/components/landing/Pricing';
import Templates from '@/components/landing/Templates';
import WorkspacePreview from '@/components/landing/WorkspacePreview';

export default function LandingPage() {
  return (
    <>
      <Hero />
      <WorkspacePreview />
      <AiTools />
      <Templates />
      <Community />
      <Creators />
      <Pricing />
      <Faq />
      <Footer />
    </>
  );
}
