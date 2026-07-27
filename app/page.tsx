import Cursor from '@/components/Cursor';
import NeuralBackground from '@/components/NeuralBackground';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import WhoItsFor from '@/components/WhoItsFor';
import Offer from '@/components/Offer';
import Teardown from '@/components/Teardown';
import About from '@/components/About';
import ObsessionChart from '@/components/ObsessionChart';
import NeuralProjects from '@/components/NeuralProjects';
import Studio from '@/components/Studio';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import Terminal from '@/components/Terminal';
import MotionRoot from '@/components/MotionRoot';

export default function Home() {
  return (
    <>
      <Cursor />
      <NeuralBackground />
      <Nav />
      <Hero />
      <Marquee
        items="ONE-WEEK DBT TEARDOWNS ✦ WAREHOUSE COST ANALYSIS ✦ PRIORITIZED FIX LIST ✦ "
        direction={1}
      />
      <WhoItsFor />
      <Offer />
      <Teardown />
      <About />
      <ObsessionChart />
      <NeuralProjects />
      <Studio />
      <Contact />
      <Footer />
      <Terminal />
      <MotionRoot />
    </>
  );
}
