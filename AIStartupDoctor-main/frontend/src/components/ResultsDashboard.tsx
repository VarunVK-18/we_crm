import React from 'react';
import { Download, CheckCircle, AlertTriangle, TrendingUp, Loader2, Share2 } from 'lucide-react';
import generatePDF from '../utils/pdfGenerator';
import { calculateScores } from '../utils/scoringSystem';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '../contexts/AuthContext';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { API_ENDPOINTS } from '../config/api';
import { formatDate } from '../utils/dateFormatter';

interface ResultsDashboardProps {
  companyData?: {
    data: {
      company_info: Array<{
        Attribute: string;
        Value: string;
      }>;
    };
  } | null;
  answers: Record<number, string>;
  followUpAnswers: Record<number, string>;
  complianceData?: ReturnType<typeof calculateScores>; // Optional pre-calculated data
}

export default function ResultsDashboard({ companyData, answers, followUpAnswers, complianceData: providedComplianceData }: ResultsDashboardProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  const [isCreatingShareableReport, setIsCreatingShareableReport] = React.useState(false);
  const { profile } = useUserProfile();
  const { getIdToken } = useAuth();
  const { history } = useHealthCheck();

  // Use provided compliance data if available, otherwise calculate it
  const complianceData = React.useMemo(() => {
    if (providedComplianceData) {
      return providedComplianceData;
    }
    return calculateScores(answers, followUpAnswers);
  }, [providedComplianceData, answers, followUpAnswers]);

  const generatePDFReport = async () => {
    try {
      setIsGeneratingPDF(true);

      // Use user's startup name from profile, fallback to MCA data, then default
      const companyName = profile?.startupName ||
        companyData?.data?.company_info?.find(
          info => info.Attribute === 'Company Name'
        )?.Value ||
        'Your Company Name';

      const reportData = {
        companyName,
        reportDate: formatDate(new Date(), 'medium'),
        overallScore: complianceData.overallScore,
        categoryScores: complianceData.categoryScores,
        strengths: complianceData.strengths,
        redFlags: complianceData.redFlags,
        riskForecast: complianceData.riskForecast
      };

      await generatePDF(reportData);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const shareReport = async () => {
    try {
      setIsCreatingShareableReport(true);

      // Get the latest health check report to create a shareable link
      const latestReport = history && history.length > 0 ? history[0] : null;

      if (!latestReport) {
        alert('No report found to share. Please complete a health check assessment first.');
        return;
      }

      const token = await getIdToken();
      const response = await fetch(API_ENDPOINTS.SHAREABLE_REPORTS_CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          healthCheckId: latestReport.id,
          expiresInDays: 30
        })
      });

      const result = await response.json();

      if (response.ok) {
        const companyName = profile?.startupName || 'My Company';
        const shareData = {
          title: `${companyName} - Compliance Health Report`,
          text: `Check out ${companyName}'s compliance health report (Score: ${complianceData.overallScore}/100)`,
          url: result.data.shareableUrl
        };

        try {
          if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
          } else {
            await navigator.clipboard.writeText(result.data.shareableUrl);
            alert(`Shareable link copied to clipboard!\n\n${result.data.shareableUrl}`);
          }
        } catch (shareError) {
          console.error('Error sharing:', shareError);
          alert(`Shareable link created:\n\n${result.data.shareableUrl}`);
        }
      } else {
        alert(result.message || 'Failed to create shareable report');
      }
    } catch (error) {
      console.error('Error creating shareable report:', error);
      alert('Failed to create shareable report. Please try again.');
    } finally {
      setIsCreatingShareableReport(false);
    }
  };

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="animate-fade-in">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
              Your <span className="text-gray-400 gap-2"> Results</span>
            </h2>
            <p className="text-xs font-medium tracking-widest uppercase text-gray-500 mb-4">
              STARTUP COMPLIANCE REPORT
            </p>
            {/* Results saved indicator */}
            <div className="flex items-center justify-center gap-2 text-sm text-green-600 mb-4">
              <CheckCircle size={16} />
              Results saved to your dashboard
            </div>
          </div>

        </div>

        {/* Overall Score and PDF Download */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 text-white flex flex-col justify-between lg:col-span-1">
            <div>
              <div className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-6">
                OVERALL COMPLIANCE SCORE
              </div>
              <div className="text-6xl sm:text-7xl font-bold mb-2">{complianceData.overallScore}</div>
              <div className="text-lg text-gray-400">out of 100</div>

              {/* Score Status Badge */}
              <div className="mt-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${complianceData.overallScore >= 80
                  ? 'bg-green-100 text-green-800'
                  : complianceData.overallScore >= 60
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                  }`}>
                  {complianceData.overallScore >= 80
                    ? 'EXCELLENT'
                    : complianceData.overallScore >= 60
                      ? 'GOOD'
                      : 'NEEDS IMPROVEMENT'}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={generatePDFReport}
                disabled={isGeneratingPDF}
                className="flex items-center justify-center gap-2 bg-white text-gray-900 px-4 py-3 rounded-full hover:bg-gray-100 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex-1"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Download
                  </>
                )}
              </button>

              <button
                onClick={shareReport}
                disabled={isCreatingShareableReport}
                className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-3 rounded-full hover:bg-white/30 transition-all text-sm font-medium flex-1 disabled:opacity-50"
              >
                {isCreatingShareableReport ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Share2 size={18} />
                )}
                Share
              </button>
            </div>
          </div>

          {/* Category Scores */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {complianceData.categoryScores.map((category) => (
              <div
                key={category.category}
                className={`${category.bgColor} rounded-xl p-4 sm:p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300 min-h-[160px] sm:min-h-[180px] flex flex-col`}
              >
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <div className={`w-3 h-3 rounded-full ${category.status === 'excellent' ? 'bg-green-500' :
                      category.status === 'good' ? 'bg-blue-500' :
                        category.status === 'needs-attention' ? 'bg-orange-500' :
                          'bg-red-500'
                    }`}></div>
                </div>

                {/* Category Header */}
                <div className="text-xs font-medium tracking-widest uppercase text-gray-600 mb-3 leading-tight">
                  {category.category}
                </div>

                {/* Score Display */}
                <div className="flex-1 flex flex-col justify-center items-center mb-4">
                  <div className={`text-3xl sm:text-4xl font-bold ${category.color} mb-2 leading-none`}>
                    {category.score}
                  </div>
                  <div className="text-xs text-gray-500 mb-3">out of 100</div>

                  {/* Status Label */}
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${category.status === 'excellent' ? 'bg-green-200 text-green-800' :
                      category.status === 'good' ? 'bg-blue-200 text-blue-800' :
                        category.status === 'needs-attention' ? 'bg-orange-200 text-orange-800' :
                          'bg-red-200 text-red-800'
                    }`}>
                    {category.status === 'excellent' ? 'EXCELLENT' :
                      category.status === 'good' ? 'GOOD' :
                        category.status === 'needs-attention' ? 'NEEDS ATTENTION' :
                          'CRITICAL'}
                  </div>
                </div>

                {/* Highlighted Reason */}
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/40">
                  <div className="text-xs font-medium text-gray-800 leading-tight text-center">
                    <span className="inline-flex items-center gap-1">
                      {category.status === 'excellent' && <CheckCircle className="w-3 h-3 text-green-600" />}
                      {category.status === 'critical' && <AlertTriangle className="w-3 h-3 text-red-600" />}
                      {category.status === 'needs-attention' && <AlertTriangle className="w-3 h-3 text-orange-600" />}
                      {category.status === 'good' && <CheckCircle className="w-3 h-3 text-blue-600" />}
                      <span className="font-semibold">
                        {category.insights}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths and Red Flags */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <div className="bg-green-50 rounded-2xl p-6 sm:p-8 border border-green-200">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold text-green-900">Strengths</h3>
            </div>
            <div className="space-y-3">
              {complianceData.strengths.length > 0 ? (
                complianceData.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-green-800">{strength}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-green-700 italic">
                  Complete more compliance items to build your strengths
                </div>
              )}
            </div>
          </div>

          {/* Red Flags */}
          <div className="bg-red-50 rounded-2xl p-6 sm:p-8 border border-red-200">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-bold text-red-900">Red Flags</h3>
            </div>
            <div className="space-y-3">
              {complianceData.redFlags.length > 0 ? (
                complianceData.redFlags.map((flag, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-red-800">{flag}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-red-700 italic">
                  Great! No critical compliance issues identified
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6-Month Risk Forecast */}
        <div className="bg-orange-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-orange-200 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 flex-shrink-0" />
            <h3 className="text-lg sm:text-xl font-bold text-orange-900">{complianceData.riskForecast.period}</h3>
          </div>

          {complianceData.riskForecast.risks.length > 0 ? (
            <>
              {/* Total Penalty Risk Alert */}
              <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="flex-1">
                    <h4 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">Total Penalty Risk</h4>
                    <p className="text-xs sm:text-sm opacity-90">Potential financial impact if issues remain unaddressed</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold break-words">
                      {complianceData.riskForecast.totalPenaltyRisk.formattedRange}
                    </div>
                    <div className="text-xs opacity-75">Estimated Range</div>
                  </div>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-xs sm:text-sm font-medium">
                    <strong>Take Action Now:</strong> Address these compliance gaps to avoid penalties and protect your business.
                    Every day of delay increases your risk exposure.
                  </p>
                </div>
              </div>

              {/* Individual Risk Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {complianceData.riskForecast.risks.map((risk, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 sm:p-4 border border-orange-200 hover:shadow-md transition-shadow">
                    <div className={`inline-block px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 ${risk.probability === 'high' ? 'bg-red-100 text-red-800' :
                      risk.probability === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                      {risk.probability.toUpperCase()} RISK
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-xs sm:text-sm">{risk.type}</h4>
                    <p className="text-[11px] sm:text-xs text-gray-600 mb-2 leading-relaxed">{risk.penalty}</p>
                    {risk.estimatedAmount > 0 && (
                      <div className="text-[11px] sm:text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">
                        Est. Impact: ₹{(risk.estimatedAmount / 100000).toFixed(1)}L
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Call to Action */}
              <div className="mt-4 sm:mt-6 bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border-2 border-orange-300">
                <div className="text-center">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">Ready to Secure Your Business?</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 px-2">
                    Don't let compliance issues drain your resources. Take proactive steps to protect your startup's future.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                    <button className="px-4 sm:px-6 py-2.5 sm:py-3 bg-orange-600 text-white text-sm sm:text-base rounded-lg hover:bg-orange-700 transition-colors font-medium">
                      Get Compliance Help
                    </button>
                    <button className="px-4 sm:px-6 py-2.5 sm:py-3 border border-orange-600 text-orange-600 text-sm sm:text-base rounded-lg hover:bg-orange-50 transition-colors font-medium">
                      Download Action Plan
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-orange-200 text-center">
              <div className="text-xs sm:text-sm text-orange-700">
                Excellent! No significant compliance risks identified for the next 6 months.
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}