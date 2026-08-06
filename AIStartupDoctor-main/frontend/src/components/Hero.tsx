import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Hero() {
  const { currentUser } = useAuth();
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set(['hero-subtitle', 'hero-title', 'hero-description']));
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

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(el => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  const getAnimationClass = (elementId: string) => {
    const baseClasses = 'transition-all duration-700 ease-out';
    const visibleClasses = 'opacity-100 translate-y-0';
    const hiddenClasses = 'opacity-0 translate-y-8';

    return `${baseClasses} ${visibleElements.has(elementId) ? visibleClasses : hiddenClasses}`;
  };
  return (
    <section className="relative pt-8 sm:pt-16 pb-18 sm:pb-24 px-3 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <p
            id="hero-subtitle"
            data-animate
            className={`text-lg sm:text-3xl lg:text-4xl text-amber-800 max-w-2xl mx-auto mb-2 sm:mb-2 lg:mb-2 px-2 sm:px-0 leading-relaxed ${getAnimationClass('hero-subtitle')}`}
            style={{ fontFamily: 'Allura, cursive', transitionDelay: '0.1s' }}
          >
            The World's 1st
          </p>

          <h1
            id="hero-title"
            data-animate
            className={`text-3xl sm:text-3xl md:text-3xl lg:text-8xl xl:text-7xl font-bold text-gray-900 mb-3 sm:mb-6 leading-tight px-2 sm:px-0 ${getAnimationClass('hero-title')}`}
            style={{ transitionDelay: '0.2s' }}
          >
            Startup Doctor
            <br />
          </h1>
          <p
            id="hero-description"
            data-animate
            className={`text-base sm:text-2xl lg:text-2xl text-gray-600 max-w-3xl mx-auto px-2 sm:px-0 leading-relaxed ${getAnimationClass('hero-description')}`}
            style={{ transitionDelay: '0.3s' }}
          >
            The world's first Al-powered Startup Health Check Platform that scans your legal and financial health in 5 minutes.

          </p>
          <p
            id="hero-tagline"
            data-animate
            className={`text-sm sm:text-base lg:text-base text-gray-600 mb-4 lg:mb-4 mx-auto px-2 sm:px-0 leading-relaxed ${getAnimationClass('hero-tagline')}`}
            style={{ transitionDelay: '0.4s' }}
          >
            <br />
            Think of it as a health report for your startup — smart, automated, and investor-ready
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0 max-w-md sm:max-w-none mx-auto">
            <Link
              to="/health-check"
              className="bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:bg-gray-800 transition-all text-sm sm:text-base font-medium inline-block shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto text-center min-w-0"
            >
              Start Health Check
            </Link>
            {!currentUser && (
              <Link
                to="/login"
                className="border-2 border-gray-900 text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:bg-gray-900 hover:text-white transition-all text-sm font-medium inline-block w-full sm:w-auto text-center min-w-0"
              >
                Sign Up Free
              </Link>
            )}
          </div>
        </div>

        {/* Mobile-optimized grid layout */}
        <div className="block lg:grid lg:grid-cols-5 lg:gap-6 px-2 sm:px-0">

          {/* Mobile: Stack cards vertically, Desktop: Absolute positioned left cards */}
          <div className="lg:absolute lg:-bottom-0 lg:-left-2 lg:w-60 grid grid-cols-1 gap-3 sm:gap-6 mb-6 lg:mb-0">
            <div
              id="card-left-1"
              data-animate
              className={`bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl sm:rounded-3xl p-4 sm:p-8 min-h-[200px] lg:min-h-[280px] flex flex-col justify-between overflow-hidden relative ${getAnimationClass('card-left-1')}`}
              style={{ transitionDelay: '0.5s' }}
            >
              <div className="relative z-10">
                <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 sm:mb-4 leading-none">3-5</div>
                <div className="text-sm sm:text-lg lg:text-l font-semibold text-gray-900 mb-1 sm:mb-2">Action Items</div>
                <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Get focused recommendations to improve compliance quickly.
                </div>
              </div>
            </div>

            <div
              id="card-left-2"
              data-animate
              className={`bg-gray-900 rounded-xl sm:rounded-3xl p-4 sm:p-8 text-white min-h-[120px] lg:min-h-[100px] flex flex-col justify-between ${getAnimationClass('card-left-2')}`}
              style={{ transitionDelay: '0.6s' }}
            >
              <div>
                <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-green-600 font-bold mb-2 sm:mb-4 leading-none">5<span className="text-xl sm:text-lg lg:text-3xl font-semibold mb-2"> min</span></div>
                <div className="text-xs sm:text-s lg:text-s font-semibold mb-2">Powerful Health Report in no time</div>
              </div>
            </div>
          </div>


          {/* Mobile: Center content, Desktop: Spacer */}
          <div className="hidden lg:block lg:min-h-[200px]">
          </div>

          {/* Mobile: Center cards, Desktop: Grid layout */}
          <div className="grid grid-cols-1 gap-3 sm:gap-6 mb-6 lg:mb-0">
            <div className="hidden lg:block lg:min-h-[50px]">
            </div>

            <div
              id="card-center"
              data-animate
              className={`bg-gradient-to-br from-gray-900 to-gray-900 rounded-xl sm:rounded-3xl p-4 sm:p-8 min-h-[200px] lg:min-h-[280px] flex flex-col justify-between ${getAnimationClass('card-center')}`}
              style={{ transitionDelay: '0.7s' }}
            >
              <div>
                <div className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-2 sm:mb-4 leading-none">87%</div>
                <div className="text-sm sm:text-lg lg:text-xl font-semibold text-white mb-1 sm:mb-2">Average Score</div>
                <div className="text-xs sm:text-sm text-white leading-relaxed">
                  Startups pass with strong compliance foundations.
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Logo section, Desktop: Grid layout */}
          <div className="grid grid-cols-1 gap-3 sm:gap-6 mb-6 lg:mb-0">
            <div className="hidden lg:block lg:min-h-[200px]">
            </div>

            <div className="flex justify-center items-center py-4 lg:py-0">
              <img
                id="logo"
                data-animate
                src="/sdlogo-light.svg"
                alt="Startup Doctor"
                className={`h-40 sm:h-42 w-auto mx-auto ${getAnimationClass('logo')}`}
                style={{ transitionDelay: '0.8s' }}
              />
            </div>
          </div>

          {/* Mobile: Additional cards, Desktop: Grid layout */}
          <div className="grid grid-cols-1 gap-3 sm:gap-6 mb-6 lg:mb-0">
            <div className="hidden lg:block lg:min-h-[50px]">
            </div>

            <div
              id="card-center-right"
              data-animate
              className={`bg-gradient-to-br from-amber-100 to-amber-100 rounded-xl sm:rounded-3xl p-4 sm:p-8 min-h-[200px] lg:min-h-[280px] flex flex-col justify-between ${getAnimationClass('card-center-right')}`}
              style={{ transitionDelay: '0.9s' }}
            >
              <div>
                <div className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-2 sm:mb-4 leading-none">3-5</div>
                <div className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">Action Items</div>
                <div className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  Get focused recommendations to improve compliance quickly.
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Right cards stacked, Desktop: Absolute positioned right cards */}
          <div className="lg:absolute lg:-bottom-0 lg:-right-2 lg:w-60 grid grid-cols-1 gap-3 sm:gap-6">
            <div
              id="card-right-1"
              data-animate
              className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-3xl p-4 sm:p-8 min-h-[200px] lg:min-h-[280px] flex flex-col justify-between overflow-hidden relative ${getAnimationClass('card-right-1')}`}
              style={{ transitionDelay: '1.0s' }}
            >
              <div className="relative z-10">
                <div className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-bold mb-2 sm:mb-4 leading-none">5 min</div>
                <div className="text-sm sm:text-lg lg:text-l font-semibold text-gray-900 mb-1 sm:mb-2">Quick Assessment</div>
                <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Complete your health check in under 5 minutes with our guided flow.
                </div>
              </div>
            </div>

            <div
              id="card-right-2"
              data-animate
              className={`bg-gray-900 rounded-xl sm:rounded-3xl p-4 sm:p-8 text-white min-h-[120px] lg:min-h-[100px] flex flex-col justify-between ${getAnimationClass('card-right-2')}`}
              style={{ transitionDelay: '1.1s' }}
            >
              <div>
                <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-green-600 mb-2 sm:mb-4 leading-none">6<span className="text-xl sm:text-lg lg:text-3xl font-semibold mb-2"> months</span></div>
                <div className="text-xs sm:text-s lg:text-s font-semibold mb-2">Compliance & Legal Risk Prediction</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}