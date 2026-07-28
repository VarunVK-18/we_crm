import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  Download,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Building,
  MapPin,
  Globe,
  User,
  Share2,
  Eye,
  Clock
} from 'lucide-react';
import Navigation from '../components/Navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import { API_ENDPOINTS } from '../config/api';
import generatePDF from '../utils/pdfGenerator';
import { calculateScores } from '../utils/scoringSystem';
import { formatDate } from '../utils/dateFormatter';

interface SharedReportData {
  companyName: string;
  companyDetails: {
    startupName: string;
    founderName: string;
    location: string;
    website?: string;
  };
  healthCheck: {
    assessmentDate: string;
    score: number;
    riskLevel: string;
    answers: Record<number, string>;
    followUpAnswers: Record<number, string>;
    recommendations: string[];
    strengths: string[];
    redFlags: string[];
    risks: string[];
  };
  reportInfo: {
    createdAt: string;
    expiresAt: string;
    viewCount: number;
  };
}

const SharedReportPage: React.FC = () => {
  const { companySlug, hash } = useParams<{ companySlug: string; hash: string }>();
  const [reportData, setReportData] = useState<SharedReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    fetchSharedReport();
  }, [companySlug, hash]);

  const fetchSharedReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.SHAREABLE_REPORTS_GET(companySlug!, hash!));
      const result = await response.json();

      if (response.ok) {
        setReportData(result.data);
      } else {
        setError(result.message || 'Failed to load report');
      }
    } catch (error) {
      console.error('Error fetching shared report:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const generateReportPDF = async () => {
    if (!reportData) return;

    try {
      setIsGeneratingPDF(true);

      // Calculate scores for PDF generation
      const complianceData = calculateScores(
        reportData.healthCheck.answers,
        reportData.healthCheck.followUpAnswers
      );

      const reportPDFData = {
        companyName: reportData.companyName,
        reportDate: formatDate(reportData.healthCheck.assessmentDate, 'medium'),
        overallScore: reportData.healthCheck.score,
        categoryScores: complianceData.categoryScores,
        strengths: reportData.healthCheck.strengths,
        redFlags: reportData.healthCheck.redFlags,
        riskForecast: complianceData.riskForecast
      };

      await generatePDF(reportPDFData);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const shareReport = async () => {
    const shareData = {
      title: `${reportData?.companyName} - Compliance Health Report`,
      text: `Check out ${reportData?.companyName}'s compliance health report (Score: ${reportData?.healthCheck.score}/100)`,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Report URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Report URL copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        alert('Unable to share. Please copy the URL manually.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="Loading report..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Report Not Available</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-300"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) return null;

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <section className="relative pt-20 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
              <Share2 className="w-4 h-4" />
              Shared Compliance Report
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              {reportData.companyName}
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Compliance Health Assessment Report
            </p>

            {/* Report Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={generateReportPDF}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-300 disabled:opacity-50"
              >
                {isGeneratingPDF ? (
                  <LoadingSpinner size="sm" variant="white" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                Download PDF
              </button>
              <button
                onClick={shareReport}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300"
              >
                <Share2 className="w-5 h-5" />
                Share Report
              </button>
            </div>

            {/* Report Metadata */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Generated: {formatDate(reportData.healthCheck.assessmentDate)}
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Views: {reportData.reportInfo.viewCount}
              </div>
            </div>
          </div>

          {/* Company Information */}
          {reportData.companyDetails && (
            <div className="bg-gray-50 rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Company</div>
                    <div className="font-semibold">{reportData.companyDetails.startupName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Founder</div>
                    <div className="font-semibold">{reportData.companyDetails.founderName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Location</div>
                    <div className="font-semibold">{reportData.companyDetails.location}</div>
                  </div>
                </div>
                {reportData.companyDetails.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Website</div>
                      <a
                        href={reportData.companyDetails.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Visit Website
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Compliance Score */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-1">
              <div className="bg-gray-900 rounded-2xl p-8 text-white text-center">
                <div className="text-sm uppercase tracking-wider text-gray-300 mb-4">
                  Overall Compliance Score
                </div>
                <div className="text-6xl font-bold mb-4">
                  {reportData.healthCheck.score}
                </div>
                <div className="text-gray-300 mb-6">out of 100</div>
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border ${getRiskLevelColor(reportData.healthCheck.riskLevel)}`}>
                  {reportData.healthCheck.riskLevel.toUpperCase()} RISK
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 rounded-xl p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-4" />
                  <div className="text-2xl font-bold text-green-900 mb-2">
                    {reportData.healthCheck.strengths.length}
                  </div>
                  <div className="text-sm text-green-700">Strengths</div>
                </div>
                <div className="bg-red-50 rounded-xl p-6 text-center">
                  <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
                  <div className="text-2xl font-bold text-red-900 mb-2">
                    {reportData.healthCheck.redFlags.length}
                  </div>
                  <div className="text-sm text-red-700">Red Flags</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-4" />
                  <div className="text-2xl font-bold text-orange-900 mb-2">
                    {reportData.healthCheck.risks.length}
                  </div>
                  <div className="text-sm text-orange-700">Risk Areas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Strengths */}
            <div className="bg-green-50 rounded-2xl p-8 border border-green-200">
              <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                Strengths
              </h3>
              <div className="space-y-3">
                {reportData.healthCheck.strengths.length > 0 ? (
                  reportData.healthCheck.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-green-800">{strength}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-green-700 italic">
                    No strengths identified in this assessment
                  </div>
                )}
              </div>
            </div>

            {/* Red Flags */}
            <div className="bg-red-50 rounded-2xl p-8 border border-red-200">
              <h3 className="text-xl font-bold text-red-900 mb-6 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Red Flags
              </h3>
              <div className="space-y-3">
                {reportData.healthCheck.redFlags.length > 0 ? (
                  reportData.healthCheck.redFlags.map((flag, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-red-800">{flag}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-red-700 italic">
                    No critical issues identified
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Recommendations
              </h3>
              <div className="space-y-3">
                {reportData.healthCheck.recommendations.length > 0 ? (
                  reportData.healthCheck.recommendations.slice(0, 8).map((rec, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-blue-800">{rec}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-blue-700 italic">
                    No specific recommendations available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-gray-200 text-center">
            <div className="text-sm text-gray-500 mb-4">
              This report was generated by Startup Doctor Compliance Platform
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your own compliance report
              <TrendingUp className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SharedReportPage;