import Navbar from '@/component/Navbar';
import Hero from '@/component/Hero';
import About from '@/component/About';
import Pricing from '@/component/Pricing';
import Faqsection from '@/component/Faqsection';
import Comparison from '@/component/Comparison';
import Testimonial from '@/component/Testimonial';
import MagicBento from '@/component/MagicBento';
import Contact from '@/component/Contactsection';
import Footer from '@/component/Footer';
export default function Page() {
  return (
    <main>
      <Navbar />
      <Hero />
      <About />
       <MagicBento />
      <Pricing />
      <Comparison />
     
      <Testimonial />
      <Faqsection />
      <Contact />
      <Footer />
    </main>
  );
}