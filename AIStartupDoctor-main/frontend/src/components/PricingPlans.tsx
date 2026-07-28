import { ArrowUpRight, CheckCircle, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const PricingPlans = () => {
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleElements(prev => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const elements = document.querySelectorAll('[data-animate-pricing]');
    elements.forEach(el => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  const getAnimationClass = (elementId: string) => {
    const baseClasses = 'transition-all duration-700 ease-out';
    const visibleClasses = 'opacity-100 translate-y-0 scale-100';
    const hiddenClasses = 'opacity-0 translate-y-8 scale-95';

    return `${baseClasses} ${visibleElements.has(elementId) ? visibleClasses : hiddenClasses}`;
  };

  return (
    <section id="pricing" className="px-3 sm:px-6 lg:px-8 bg-white pricing-container">
      <div className="max-w-7xl mt-8 sm:mt-10 mx-auto container-constrained">
        {/* Header Section */}
        <div className="text-center mb-12 sm:mb-20">
          <p
            id="pricing-subtitle"
            data-animate-pricing
            className={`text-xs font-medium tracking-widest uppercase text-gray-500 mb-4 sm:mb-6 ${getAnimationClass('pricing-subtitle')}`}
            style={{ transitionDelay: '0.1s' }}
          >
            PRICING PLANS
          </p>
          <h2
            id="pricing-title"
            data-animate-pricing
            className={`text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 sm:mb-6 leading-tight px-2 sm:px-0 ${getAnimationClass('pricing-title')}`}
            style={{ transitionDelay: '0.2s' }}
          >
            Choose Your
            <br />
            <span className="text-gray-400">Perfect Plan</span>
          </h2>
          <p
            id="pricing-description"
            data-animate-pricing
            className={`text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8 lg:mb-10 px-3 sm:px-0 leading-relaxed ${getAnimationClass('pricing-description')}`}
            style={{ transitionDelay: '0.3s' }}
          >
            Professional compliance solutions designed for modern businesses. Choose the perfect plan to protect and scale your venture.
          </p>
        </div>

        {/* Startup Doctor Subscription Plans */}
        <div
          id="pricing-container"
          data-animate-pricing
          className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl sm:rounded-3xl p-3 sm:p-6 lg:p-10 xl:p-16 mb-6 sm:mb-12 lg:mb-20 relative overflow-hidden shadow-2xl mx-1 sm:mx-0 ${getAnimationClass('pricing-container')}`}
          style={{ transitionDelay: '0.4s' }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 60%), 
                               radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 60%),
                               radial-gradient(circle at 40% 80%, rgba(255,255,255,0.12) 0%, transparent 60%)`
            }}></div>
          </div>

          <div className="relative z-10">
            <div className="text-center mb-8 sm:mb-16">
              <div
                id="pricing-icon"
                data-animate-pricing
                className={`inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl mb-4 sm:mb-8 border border-white/20 ${getAnimationClass('pricing-icon')}`}
                style={{ transitionDelay: '0.5s' }}
              >
                <Zap className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3
                id="pricing-section-title"
                data-animate-pricing
                className={`text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 sm:mb-6 leading-tight px-3 sm:px-0 ${getAnimationClass('pricing-section-title')}`}
                style={{ transitionDelay: '0.6s' }}
              >
                Subscription Plans
              </h3>
              <p
                id="pricing-section-description"
                data-animate-pricing
                className={`text-gray-300 text-sm sm:text-base lg:text-lg xl:text-xl max-w-2xl mx-auto leading-relaxed px-3 sm:px-0 ${getAnimationClass('pricing-section-description')}`}
                style={{ transitionDelay: '0.7s' }}
              >
                Comprehensive compliance solutions tailored for every stage of your business journey
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 lg:gap-8 mb-4 sm:mb-8 lg:mb-12">
              {/* Essentials Plan */}
              <div
                id="essentials-card"
                data-animate-pricing
                className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-8 lg:p-10 relative group hover:bg-gray-800/70 transition-all duration-300 pricing-card ${getAnimationClass('essentials-card')}`}
                style={{ transitionDelay: '0.8s' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700/20 to-transparent rounded-xl sm:rounded-2xl"></div>
                <div className="relative z-10">
                  <div className="mb-4 sm:mb-8">
                    <div className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-400 mb-1 sm:mb-3">
                      STARTUP DOCTOR
                    </div>
                    <h4 className="text-xl sm:text-3xl font-bold text-white mb-2 sm:mb-4">Essentials</h4>
                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                      Includes all features except the premium additions of #SD Elite. Perfect for startups and small businesses.
                    </p>
                  </div>

                  <div className="mb-4 sm:mb-8 lg:mb-10">
                    <div className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-2 leading-none">Free</div>
                    <div className="text-sm sm:text-base text-gray-400">Forever</div>
                  </div>

                  <button className="w-full bg-white text-gray-900 py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg mobile-touch-target">
                    Get Started
                  </button>
                </div>
              </div>

              {/* #SD Elite Plan */}
              <div
                id="elite-card"
                data-animate-pricing
                className={`bg-gradient-to-br from-gray-800/60 to-gray-900/80 backdrop-blur-sm border border-gray-600/50 rounded-xl sm:rounded-2xl p-4 sm:p-8 lg:p-10 relative group hover:border-gray-500/50 transition-all duration-300 pricing-card ${getAnimationClass('elite-card')}`}
                style={{ transitionDelay: '0.9s' }}
              >
                <div className="absolute top-3 sm:top-6 right-3 sm:right-6">
                  <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                    MOST POPULAR
                  </span>
                </div>

                <div className="relative z-10">
                  <div className="mb-4 sm:mb-8">
                    <div className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-400 mb-1 sm:mb-3">
                      STARTUP DOCTOR
                    </div>
                    <h4 className="text-xl sm:text-3xl font-bold text-white mb-2 sm:mb-4">#SD Elite</h4>
                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-3 sm:mb-6">
                      The ultimate premium experience — built for the relentless founders chasing unicorn status,
                      who refuse to settle for anything less than the absolute best.
                    </p>

                    <div className="space-y-2 sm:space-y-4">
                      <div className="flex items-start gap-2 sm:gap-3 text-gray-300">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-base">The essentials plus...</span>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-3 text-gray-300">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-base break-words">AI Compliance Risk Dashboard (Live Monitoring)</span>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-3 text-gray-300">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-base break-words">Multi-Company Dashboard for serial entrepreneurs</span>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-3 text-gray-300">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-base break-words">Integrated Business Portfolio Report</span>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-3 text-gray-300">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-base break-words">VIP Support: 1:1 Strategy Consultation with Compliance Experts</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 sm:mb-8 lg:mb-10">
                    <div className="flex items-baseline gap-1 sm:gap-2">
                      <span className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white leading-none">₹10,000</span>
                      <span className="text-base sm:text-xl text-gray-400">/year</span>
                    </div>
                    <div className="text-xs sm:text-base text-gray-400 mt-1">Billed annually</div>
                  </div>

                  <a
                    href="mailto:support@aistartupdoctor.com?subject=SD Elite Plan Inquiry"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg text-sm sm:text-base mobile-touch-target"
                  >
                    <span>Contact Sales</span>
                    <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform flex-shrink-0" />
                  </a>
                </div>
              </div>
            </div>

            {/* White Label Plan - Full Width */}
            <div
              id="white-label-card"
              data-animate-pricing
              className={`bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-purple-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-8 lg:p-10 relative overflow-hidden border border-purple-500/20 pricing-card ${getAnimationClass('white-label-card')}`}
              style={{ transitionDelay: '1.0s' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-purple-600/10"></div>
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-8">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold tracking-[0.15em] uppercase text-purple-300 mb-1 sm:mb-3">
                      FOR BUSINESS
                    </div>
                    <h4 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-4 break-words">#SD White Label</h4>
                    <p className="text-sm sm:text-base text-purple-100 mb-3 sm:mb-6 leading-relaxed break-words">
                      Complete white-label compliance platform for agencies, consultants, and enterprises.
                      Scale your business with our proven infrastructure.
                    </p>
                    <div className="mb-3 sm:mb-6">
                      <div className="text-xs sm:text-sm text-purple-200 mb-1 sm:mb-2">Plans Starting</div>
                      <div className="flex items-baseline gap-1 sm:gap-2">
                        <span className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white leading-none">₹1,000</span>
                        <span className="text-base sm:text-xl text-purple-300">/month</span>
                      </div>
                      <div className="text-xs sm:text-sm text-purple-200 mt-1">Custom pricing available</div>
                    </div>
                  </div>

                  <div className="lg:flex-shrink-0 w-full lg:w-auto">
                    <a
                      href="mailto:support@aistartupdoctor.com?subject=SD White Label Plan Inquiry"
                      className="w-full lg:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 bg-white/15 backdrop-blur-sm border border-white/30 text-white py-3 sm:py-4 px-4 sm:px-8 rounded-lg sm:rounded-xl font-semibold hover:bg-white/25 transition-all duration-300 group shadow-lg text-sm sm:text-base mobile-touch-target"
                    >
                      <span>Contact Sales</span>
                      <ArrowUpRight className="w-3 h-3 sm:w-5 sm:h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform flex-shrink-0" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingPlans;