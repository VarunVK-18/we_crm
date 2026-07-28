import { useEffect } from 'react';
import Navigation from '../components/Navigation';
import Hero from '../components/Hero';
import ProductDemo from '../components/ProductDemo';
import PricingPlans from '../components/PricingPlans';
import Footer from '../components/Footer';

export default function HomePage() {
  // Mobile viewport optimization
  useEffect(() => {
    // Set viewport meta tag for better mobile experience
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
    }

    // Prevent horizontal scroll on mobile
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowX = 'hidden';

    // Cleanup
    return () => {
      document.body.style.overflowX = '';
      document.documentElement.style.overflowX = '';
    };
  }, []);

  return (
    <div className="min-h-screen bg-white homepage-mobile-optimized">
      {/* Mobile-optimized container with proper spacing and overflow handling */}
      <div className="w-full max-w-full overflow-x-hidden mobile-scroll-smooth">
        <Navigation />
        
        {/* Main content with mobile-first approach and proper spacing */}
        <main className="w-full max-w-full mobile-layout-stable">
          {/* Hero section with mobile padding */}
          <section className="w-full mobile-section-spacing">
            <Hero />
          </section>
          
          {/* Product demo with mobile spacing */}
          <section className="w-full mobile-section-spacing">
            <ProductDemo />
          </section>
          
          {/* Pricing section with mobile optimization */}
          <section className="w-full mobile-section-spacing">
            <PricingPlans />
          </section>
        </main>
        
        {/* Footer with mobile spacing */}
        <footer className="w-full">
          <Footer />
        </footer>
      </div>
    </div>
  );
}