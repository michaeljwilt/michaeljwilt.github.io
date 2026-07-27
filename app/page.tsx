import Cursor from '@/components/Cursor';
import NeuralBackground from '@/components/NeuralBackground';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import About from '@/components/About';
import ObsessionChart from '@/components/ObsessionChart';
import Services from '@/components/Services';
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
      <Marquee items="DATA ✦ CODE ✦ AI ✦ DASHBOARDS ✦ AUTOMATION ✦ " direction={1} />
      <About />
      <ObsessionChart />
      <Services />
      <NeuralProjects />
      <Studio />
      <Contact />
      <Footer />
      <Terminal />
      <MotionRoot />
    </>
  );
}
