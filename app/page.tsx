import Cursor from '@/components/Cursor';
import Background from '@/components/Background';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import About from '@/components/About';
import ObsessionChart from '@/components/ObsessionChart';
import Services from '@/components/Services';
import Projects from '@/components/Projects';
import Studio from '@/components/Studio';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import MotionRoot from '@/components/MotionRoot';

export default function Home() {
  return (
    <>
      <Cursor />
      <Background />
      <Nav />
      <Hero />
      <Marquee items="DATA ✦ CODE ✦ AI ✦ DASHBOARDS ✦ AUTOMATION ✦ " direction={1} />
      <About />
      <ObsessionChart />
      <Services />
      <Marquee items="WEBSITES ✦ DASHBOARDS ✦ AUTOMATIONS ✦ AI TOOLS ✦ " direction={-1} />
      <Projects />
      <Studio />
      <Contact />
      <Footer />
      <MotionRoot />
    </>
  );
}
