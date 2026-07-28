import { ArrowRight, CheckCircle, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const ProductDemo = () => {
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

  const demoSteps = [
    {
      step: 1,
      title: "Founder enters startup name →",
      description: "MCA data auto-fetch."
    },
    {
      step: 2,
      title: "15-question AI compliance check.",
      description: ""
    },
    {
      step: 3,
      title: "AI scoring + category-wise analysis.",
      description: ""
    },
    {
      step: 4,
      title: "Actionable report with \"Fix Now\" buttons",
      description: "(Trademark, GST, ITR, etc.)."
    },
    {
      step: 5,
      title: "Downloadable PDF / Share with investors.",
      description: ""
    }
  ];

  return (
    <section id="product-demo" className="py-12 sm:py-20 lg:py-24 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-1 items-center">
          {/* Left Side - Content */}
          <div className="text-white mb-8 lg:mb-0">
            <h2 
              id="demo-title"
              data-animate
              className={`text-3xl sm:text-5xl lg:text-6xl font-bold mb-6 lg:mb-12 leading-tight ${getAnimationClass('demo-title')}`}
              style={{ transitionDelay: '0.1s' }}
            >
              Product
              <br />
              Demo
            </h2>
            
            <div className="space-y-4 lg:space-y-8">
              {demoSteps.map((item) => (
                <div 
                  key={item.step} 
                  id={`demo-step-${item.step}`}
                  data-animate
                  className={`flex items-start gap-4 ${getAnimationClass(`demo-step-${item.step}`)}`}
                  style={{ transitionDelay: `${0.1 + item.step * 0.1}s` }}
                >
                  <div className="flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                      <span className="text-xs sm:text-sm font-bold text-white">
                        {item.step}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm sm:text-lg font-semibold mb-1 leading-relaxed">
                      <span className="text-white">Step {item.step}:</span>{" "}
                      <span className="text-emerald-200">{item.title}</span>
                    </div>
                    {item.description && (
                      <p className="text-xs sm:text-base text-emerald-100 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="mt-6 lg:mt-12">
              <button
                id="demo-cta"
                data-animate
                onClick={() => window.open('/health-check', '_self')}
                className={`group inline-flex items-center gap-2 sm:gap-3 bg-white text-emerald-900 px-4 sm:px-6 lg:px-8 py-3 lg:py-4 rounded-xl hover:bg-emerald-50 transition-all duration-300 font-semibold shadow-lg text-sm sm:text-base lg:text-lg mobile-touch-target ${getAnimationClass('demo-cta')}`}
                style={{ transitionDelay: '0.7s' }}
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                Try Health Check
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Side - Dashboard Screenshots */}
          <div className="relative mt-8 lg:mt-0">
            {/* Main Dashboard Screenshot */}
            <div 
              id="main-dashboard"
              data-animate
              className={`relative bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden border border-gray-200 ${getAnimationClass('main-dashboard')}`}
              style={{ transitionDelay: '0.8s' }}
            >
              {/* Browser Header */}
              <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="flex-1 text-center">
                  <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-600 inline-block">
                    startupdoctor.in/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-white">
                {/* Welcome Header */}
                <div 
                  id="dashboard-header"
                  data-animate
                  className={`mb-4 sm:mb-6 ${getAnimationClass('dashboard-header')}`}
                  style={{ transitionDelay: '0.9s' }}
                >
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                    Welcome back,
                  </h3>
                  <p className="text-base sm:text-lg lg:text-xl text-gray-500">Balaji Rajendran</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Here's your AI-powered compliance overview
                  </p>
                </div>

                {/* Metrics Cards */}
                <div 
                  id="metrics-cards"
                  data-animate
                  className={`grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 ${getAnimationClass('metrics-cards')}`}
                  style={{ transitionDelay: '1.0s' }}
                >
                  {/* Card 1 */}
                  <div className="bg-slate-800 text-white p-2 sm:p-4 rounded-lg sm:rounded-xl">
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold mb-1">1</div>
                    <div className="text-xs lg:text-sm text-slate-300">Total Checks</div>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-blue-100 text-blue-900 p-2 sm:p-4 rounded-lg sm:rounded-xl">
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold mb-1">97%</div>
                    <div className="text-xs lg:text-sm text-blue-700">Compliance</div>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-pink-100 text-pink-900 p-2 sm:p-4 rounded-lg sm:rounded-xl">
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold mb-1">97%</div>
                    <div className="text-xs lg:text-sm text-pink-700">Risk Score</div>
                  </div>

                  {/* Card 4 */}
                  <div className="bg-green-100 text-green-900 p-2 sm:p-4 rounded-lg sm:rounded-xl">
                    <div className="text-sm sm:text-lg lg:text-xl font-bold mb-1">18/10/25</div>
                    <div className="text-xs lg:text-sm text-green-700">Last Check</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div 
                  id="action-buttons"
                  data-animate
                  className={`flex flex-wrap gap-1 sm:gap-2 lg:gap-3 ${getAnimationClass('action-buttons')}`}
                  style={{ transitionDelay: '1.1s' }}
                >
                  <button className="bg-blue-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors">
                    New Check
                  </button>
                  <button className="bg-gray-100 text-gray-700 px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition-colors">
                    Reports
                  </button>
                  <button className="bg-gray-100 text-gray-700 px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition-colors">
                    PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Secondary Screenshot - Floating */}
            <div 
              id="floating-dashboard"
              data-animate
              className={`absolute -bottom-4 -right-2 sm:-bottom-6 sm:-right-4 lg:-bottom-12 lg:-right-2 w-40 sm:w-48 lg:w-64 bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-xl border border-gray-200 overflow-hidden ${getAnimationClass('floating-dashboard')}`}
              style={{ transitionDelay: '1.2s' }}
            >
              {/* Mini Browser Header */}
              <div className="bg-gray-100 px-3 py-2 flex items-center gap-1.5 border-b border-gray-200">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
              </div>

              {/* Health Check Report Content */}
              <div className="p-2 sm:p-4 lg:p-5">
                <div className="mb-2 sm:mb-4">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 hidden sm:inline">Back to Dashboard</span>
                  </div>
                  <h4 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-1">
                    Reports
                  </h4>
                  <p className="text-xs text-gray-500 hidden sm:block">
                    View and download your compliance assessment history
                  </p>
                </div>

                {/* Mini Metrics */}
                <div className="grid grid-cols-2 gap-1 sm:gap-2 mb-2 sm:mb-4">
                  <div className="bg-blue-50 p-1 sm:p-2 rounded-md sm:rounded-lg text-center">
                    <div className="text-sm sm:text-lg font-bold text-blue-900">1</div>
                    <div className="text-xs text-blue-700">Total</div>
                  </div>
                  <div className="bg-green-50 p-1 sm:p-2 rounded-md sm:rounded-lg text-center">
                    <div className="text-sm sm:text-lg font-bold text-green-900">97%</div>
                    <div className="text-xs text-green-700">Average</div>
                  </div>
                  <div className="bg-purple-50 p-1 sm:p-2 rounded-md sm:rounded-lg text-center">
                    <div className="text-sm sm:text-lg font-bold text-purple-900">97%</div>
                    <div className="text-xs text-purple-700">Highest</div>
                  </div>
                  <div className="bg-orange-50 p-1 sm:p-2 rounded-md sm:rounded-lg text-center">
                    <div className="text-xs sm:text-lg font-bold text-orange-900">18/10</div>
                    <div className="text-xs text-orange-700">Last</div>
                  </div>
                </div>

                {/* Assessment History */}
                <div className="mb-2 sm:mb-4">
                  <h5 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 sm:mb-2">History</h5>
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-md sm:rounded-lg">
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <span className="text-xs font-medium text-gray-700">18 OCT</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded">MEDIUM</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                      <span className="text-xs text-gray-600">97% Score</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1 sm:mb-2 hidden sm:block">
                      Strengths: 8 | Recommendations: 5
                    </div>
                    <div className="flex gap-1 sm:gap-2">
                      <button className="bg-blue-600 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs hover:bg-blue-700 transition-colors">
                        View
                      </button>
                      <button className="bg-gray-600 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs hover:bg-gray-700 transition-colors">
                        PDF
                      </button>
                    </div>
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

export default ProductDemo;