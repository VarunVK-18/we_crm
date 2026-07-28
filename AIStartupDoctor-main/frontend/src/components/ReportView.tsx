import { ArrowUpRight, Phone, CheckCircle } from 'lucide-react';
import { calculateScores } from '../utils/scoringSystem';

interface aistartupdoctorervice {
  id: number;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discount: string;
  bgColor: string;
  features: string[];
  priority: 'high' | 'medium';
}

const aistartupdoctorervices: aistartupdoctorervice[] = [
  {
    id: 1,
    title: 'Business Registration',
    description: 'Complete incorporation package with all legal documentation',
    originalPrice: 17999,
    discountedPrice: 11999,
    discount: '25% Lower Than Market Price',
    bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
    features: ['Company Incorporation', 'PAN & TAN Registration', 'Bank Account Opening', 'Digital Signature'],
    priority: 'high'
  },
  {
    id: 2,
    title: 'Trademark Registration',
    description: 'Protect your brand identity with comprehensive trademark services',
    originalPrice: 12999,
    discountedPrice: 5999,
    discount: '73.69% Lower Than Market Price',
    bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
    features: ['Trademark Search', 'Application Filing', 'Response to Objections', 'Registration Certificate'],
    priority: 'high'
  },
  {
    id: 3,
    title: 'ISO Certification',
    description: 'Quality management standards certification for business credibility',
    originalPrice: 15999,
    discountedPrice: 5999,
    discount: '75% Lower Than Market Price',
    bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
    features: ['Gap Analysis', 'Documentation', 'Internal Audit', 'Certification Support'],
    priority: 'medium'
  },
  {
    id: 4,
    title: 'GST Registration & Compliance',
    description: 'Complete GST registration and ongoing compliance management',
    originalPrice: 8999,
    discountedPrice: 4999,
    discount: '44% Lower Than Market Price',
    bgColor: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
    features: ['GST Registration', 'Monthly Returns Filing', 'Input Tax Credit', 'Compliance Support'],
    priority: 'high'
  },
  {
    id: 5,
    title: 'Bookkeeping & Accounting',
    description: 'Professional bookkeeping and financial record maintenance',
    originalPrice: 12999,
    discountedPrice: 7999,
    discount: '38% Lower Than Market Price',
    bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
    features: ['Monthly Bookkeeping', 'Financial Statements', 'Tax Preparation', 'Audit Support'],
    priority: 'medium'
  },
  {
    id: 6,
    title: 'Compliance Officer Service',
    description: 'Dedicated compliance officer for ongoing regulatory management',
    originalPrice: 25999,
    discountedPrice: 15999,
    discount: '38% Lower Than Market Price',
    bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
    features: ['Monthly Compliance Review', 'Regulatory Updates', 'Risk Assessment', 'Legal Advisory'],
    priority: 'medium'
  }
];

interface ReportViewProps {
  answers: Record<number, string>;
  followUpAnswers: Record<number, string>;
}

export default function ReportView({ answers, followUpAnswers }: ReportViewProps) {
  // Calculate scores to determine which services to prioritize
  const complianceData = calculateScores(answers, followUpAnswers);

  // Filter and prioritize services based on user's red flags and low scores
  const getRecommendedServices = (): aistartupdoctorervice[] => {
    const recommended: aistartupdoctorervice[] = [];

    // Check if company is not incorporated
    if (answers[1] === 'No') {
      const service = aistartupdoctorervices.find(s => s.id === 1);
      if (service) recommended.push(service);
    }

    // Check if trademark is missing
    if (answers[7] === 'No') {
      const service = aistartupdoctorervices.find(s => s.id === 2);
      if (service) recommended.push(service);
    }

    // Check if ISO certification is missing
    if (answers[10] === 'No') {
      const service = aistartupdoctorervices.find(s => s.id === 3);
      if (service) recommended.push(service);
    }

    // Check if GST registration is missing
    if (answers[4] === 'No') {
      const service = aistartupdoctorervices.find(s => s.id === 4);
      if (service) recommended.push(service);
    }

    // Check if bookkeeping needs improvement
    if (answers[12] === 'No') {
      const service = aistartupdoctorervices.find(s => s.id === 5);
      if (service) recommended.push(service);
    }

    // Check if compliance officer is needed
    if (answers[15] === 'No') {
      const service = aistartupdoctorervices.find(s => s.id === 6);
      if (service) recommended.push(service);
    }

    return recommended.slice(0, 6); // Show max 6 services
  };

  // Get recommended plan based on compliance score
  const getRecommendedPlan = () => {
    const overallScore = complianceData.overallScore;
    const criticalIssues = recommendedServices.filter(s => s.priority === 'high').length;

    if (overallScore < 50 || criticalIssues >= 3) {
      return {
        plan: 'elite',
        title: '#SD Elite',
        subtitle: 'RECOMMENDED FOR YOU',
        reason: 'Your compliance score indicates significant gaps that require expert guidance and ongoing monitoring.',
        urgency: 'high'
      };
    } else if (overallScore < 75 || criticalIssues >= 1) {
      return {
        plan: 'elite',
        title: '#SD Elite',
        subtitle: 'RECOMMENDED',
        reason: 'Your assessment shows areas for improvement that would benefit from professional compliance management.',
        urgency: 'medium'
      };
    } else {
      return {
        plan: 'essentials',
        title: 'Essentials',
        subtitle: 'GOOD START',
        reason: 'Your compliance foundation is solid. Our free plan will help you maintain and monitor your status.',
        urgency: 'low'
      };
    }
  };

  const recommendedServices = getRecommendedServices();
  const recommendedPlan = getRecommendedPlan();
  return (
    <section className="px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8 shadow-lg">
            <img
              src="/sdlogo.svg"
              alt="WE"
              className="w-8 h-8"
            />
          </div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500 mb-6 letterspacing-wide">
            SOLUTIONS & PRICING
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Startup Doctor
            <br />
            <span className="bg-gradient-to-r from-slate-600 to-slate-400 bg-clip-text text-transparent">Solutions</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Professional compliance solutions designed for modern businesses.
            Choose the perfect plan to protect and scale your venture.
          </p>
        </div>

        {/* Dynamic Service Recommendations */}
        {recommendedServices.length > 0 && (
          <div className="mb-20">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 sm:p-6 lg:p-8 mb-8 sm:mb-12 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <img
                    src="/sdlogo.svg"
                    alt="WE"
                    className="w-5 h-5 sm:w-6 sm:h-6"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2">
                    Personalized Recommendations
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    Based on your assessment, we've identified {recommendedServices.length} key service(s) to address your compliance gaps
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {recommendedServices.map((service) => (
                <div key={service.id} className="group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 relative overflow-hidden min-w-0">
                  {/* Priority Badge */}
                  {service.priority === 'high' && (
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-6 lg:right-6 z-10">
                      <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-sm whitespace-nowrap">
                        HIGH PRIORITY
                      </span>
                    </div>
                  )}
                  {service.priority === 'medium' && (
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-6 lg:right-6 z-10">
                      <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-sm whitespace-nowrap">
                        MEDIUM PRIORITY
                      </span>
                    </div>
                  )}

                  <div className="mb-4 sm:mb-6 pr-16 sm:pr-20 lg:pr-24">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mb-2 sm:mb-3 group-hover:text-slate-700 transition-colors leading-tight break-words">
                      {service.title}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed break-words">
                      {service.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="mb-6 sm:mb-8">
                    <div className="grid grid-cols-1 gap-2 sm:gap-3">
                      {service.features.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-start gap-2 sm:gap-3">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600" />
                          </div>
                          <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col xs:flex-row xs:items-end xs:justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                          <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 leading-none">
                            ₹{service.discountedPrice.toLocaleString()}
                          </span>
                          <span className="text-sm sm:text-base lg:text-lg text-slate-400 line-through leading-none">
                            ₹{service.originalPrice.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-green-600 font-medium leading-tight">
                          {service.discount}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="inline-flex items-center bg-green-500 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm">
                          SAVE ₹{(service.originalPrice - service.discountedPrice).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button className="w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold hover:from-slate-800 hover:to-slate-700 transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg text-sm sm:text-base">
                    Get Started
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personalized Plan Recommendation */}
        <div className="mb-20">

          {/* Recommended Plan Card */}
          <div className={`bg-gradient-to-br ${recommendedPlan.plan === 'elite'
            ? 'from-slate-900 via-slate-800 to-slate-900'
            : 'from-slate-800/50 to-slate-700/50'
            } rounded-3xl p-10 sm:p-16 relative overflow-hidden shadow-2xl`}>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 60%), 
                                 radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 60%),
                                 radial-gradient(circle at 40% 80%, rgba(255,255,255,0.12) 0%, transparent 60%)`
              }}></div>
            </div>

            <div className="relative z-10">
              {/* Recommendation Badge */}
              <div className="flex justify-center mb-8">
                <span className={`px-4 py-2 rounded-full text-xs font-semibold ${recommendedPlan.urgency === 'high'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                  : recommendedPlan.urgency === 'medium'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                    : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                  }`}>
                  {recommendedPlan.subtitle}
                </span>
              </div>

              <div className="text-center mb-12">
                <div className="text-xs font-semibold tracking-[0.15em] uppercase text-slate-400 mb-3">
                  STARTUP DOCTOR
                </div>
                <h3 className="text-5xl sm:text-6xl font-bold text-white mb-6">
                  {recommendedPlan.title}
                </h3>
                <p className="text-slate-300 text-xl max-w-3xl mx-auto leading-relaxed mb-8">
                  {recommendedPlan.reason}
                </p>

                {recommendedPlan.plan === 'elite' ? (
                  <div className="space-y-6 mb-12">
                    <div className="flex items-center justify-center gap-3 text-slate-300">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span>AI Compliance Risk Dashboard (Live Monitoring)</span>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-slate-300">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span>Multi-Company Dashboard for serial entrepreneurs</span>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-slate-300">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span>VIP Support: 1:1 Strategy Consultation with Compliance Experts</span>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-slate-300">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span>Priority access to all individual services</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 mb-12">
                    <div className="flex items-center justify-center gap-3 text-slate-300">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span>Complete health check assessments</span>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-slate-300">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span>Basic compliance monitoring</span>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-slate-300">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span>Email support</span>
                    </div>
                  </div>
                )}

                <div className="mb-12">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-white">
                      {recommendedPlan.plan === 'elite' ? '₹10,000' : 'Free'}
                    </span>
                    {recommendedPlan.plan === 'elite' && (
                      <span className="text-xl text-slate-400">/year</span>
                    )}
                  </div>
                  <div className="text-slate-400 mt-1">
                    {recommendedPlan.plan === 'elite' ? 'Billed annually' : 'Forever'}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <a
                    href={`mailto:support@aistartupdoctor.com?subject=${recommendedPlan.title} Plan Inquiry`}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg"
                  >
                    Get Started
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </a>
                  <a
                    href="mailto:support@aistartupdoctor.com?subject=Free Consultation Request"
                    className="flex-1 bg-white/10 backdrop-blur-sm border border-white/30 text-white py-4 px-8 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2 group"
                  >
                    Free Consultation
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expert Support Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-10 text-white relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700/20 to-transparent"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6 border border-white/20">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Need Expert Guidance?</h3>
              <p className="text-slate-300 mb-8 leading-relaxed">
                Schedule a free consultation with our compliance specialists for personalized advice
                and strategic planning tailored to your business needs.
              </p>
              <a
                href="mailto:support@aistartupdoctor.com?subject=Expert Consultation Request"
                className="inline-flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-xl hover:bg-slate-100 transition-all duration-300 font-semibold shadow-lg group"
              >
                <Phone size={20} />
                Schedule Free Consultation
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-6">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-6">Why Choose Startup Doctor?</h3>
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-slate-700 font-medium">10+ years of compliance expertise</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-slate-700 font-medium">1000+ businesses served successfully</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-slate-700 font-medium">99.9% compliance success rate</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-slate-700 font-medium">24/7 dedicated support</span>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-600 mb-3 font-medium">Contact us:</p>
              <a
                href="mailto:support@aistartupdoctor.com"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors group"
              >
                support@aistartupdoctor.com
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
