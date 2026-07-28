import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BarChart3,
    Calendar,
    Download,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    CheckCircle,
    FileText,
    ArrowLeft,
    RefreshCw,
    Share2
} from 'lucide-react';
import Navigation from '../components/Navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import generatePDF from '../utils/pdfGenerator';
import { formatDate } from '../utils/dateFormatter';

const ReportsPage: React.FC = () => {
    const { history, stats, loading, error, fetchHistory } = useHealthCheck();
    const { profile } = useUserProfile();
    const { getIdToken } = useAuth();
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [currentPage] = useState(1);
    const reportsPerPage = 10;

    useEffect(() => {
        fetchHistory(reportsPerPage, currentPage);
    }, [currentPage]);

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



    const generateReportPDF = async (report: any) => {
        try {
            setIsGeneratingPDF(true);

            // Use stored category scores if available (for new reports)
            let categoryScores = report.categoryScores;

            // If no category scores stored, use a simple distribution based on overall score
            if (!categoryScores || categoryScores.length === 0) {
                // For old reports without stored category scores, create a balanced distribution
                const baseScore = report.score;

                categoryScores = [
                    {
                        category: 'Company & Legal Structure',
                        score: baseScore,
                        insights: baseScore >= 70 ? 'On track' : 'Needs attention',
                        status: baseScore >= 80 ? 'excellent' : baseScore >= 60 ? 'good' : 'needs-improvement'
                    },
                    {
                        category: 'Taxation & GST',
                        score: baseScore,
                        insights: baseScore >= 70 ? 'Compliant' : 'Action required',
                        status: baseScore >= 80 ? 'excellent' : baseScore >= 60 ? 'good' : 'needs-improvement'
                    },
                    {
                        category: 'Intellectual Property',
                        score: baseScore,
                        insights: baseScore >= 70 ? 'Protected' : 'Requires attention',
                        status: baseScore >= 80 ? 'excellent' : baseScore >= 60 ? 'good' : 'needs-improvement'
                    },
                    {
                        category: 'Financial Health & Risk',
                        score: baseScore,
                        insights: baseScore >= 70 ? 'Healthy' : 'Needs improvement',
                        status: baseScore >= 80 ? 'excellent' : baseScore >= 60 ? 'good' : 'needs-improvement'
                    }
                ];
            }

            const reportData = {
                companyName: profile?.startupName || 'Your Company',
                reportDate: formatDate(report.assessmentDate),
                overallScore: report.score,
                categoryScores: categoryScores,
                strengths: report.strengths || [],
                redFlags: report.redFlags || [],
                riskForecast: {
                    period: '6-Month Risk Forecast',
                    risks: report.risks?.map((risk: string) => ({
                        type: risk.split(':')[0] || 'Risk',
                        penalty: risk.split(':')[1] || 'Assessment required',
                        probability: report.riskLevel === 'critical' ? 'high' : report.riskLevel === 'high' ? 'medium' : 'low'
                    })) || []
                }
            };

            await generatePDF(reportData);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF report. Please try again.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const createShareableReport = async (report: any) => {
        try {
            const token = await getIdToken();
            const response = await fetch(API_ENDPOINTS.SHAREABLE_REPORTS_CREATE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    healthCheckId: report.id,
                    expiresInDays: 30
                })
            });

            const result = await response.json();

            if (response.ok) {
                const shareData = {
                    title: `${profile?.startupName || 'Company'} - Compliance Health Report`,
                    text: `Check out our compliance health report (Score: ${report.score}/100)`,
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
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navigation />
                <div className="flex items-center mt-20 justify-center py-20">
                    <LoadingSpinner size="lg" text="Loading reports..." />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white">
                <Navigation />
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={() => fetchHistory(reportsPerPage, currentPage)}
                            className="px-6 py-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-300"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            <section className="relative pt-20 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                        <div className="min-w-0 flex-1">
                            <Link
                                to="/dashboard"
                                className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 transition-colors text-sm sm:text-base"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2 flex-shrink-0" />
                                Back to Dashboard
                            </Link>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-4 leading-tight">
                                Health Check Reports
                            </h1>
                            <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                                View and download your compliance assessment history
                            </p>
                        </div>
                        <button
                            onClick={() => fetchHistory(reportsPerPage, currentPage)}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300 text-sm font-medium whitespace-nowrap self-start sm:self-auto"
                        >
                            <RefreshCw className="w-4 h-4 flex-shrink-0" />
                            Refresh
                        </button>
                    </div>

                    {/* Stats Overview - Hero Style Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
                        <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 min-h-[160px] flex flex-col justify-between overflow-hidden relative">
                            <div className="relative z-10">
                                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-none text-gray-900">
                                    {stats?.totalAssessments || 0}
                                </div>
                                <div className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Total Assessments</div>
                                <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                    Complete health check reports generated
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl sm:rounded-3xl p-6 sm:p-8 min-h-[160px] flex flex-col justify-between overflow-hidden relative">
                            <div className="relative z-10">
                                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-none text-gray-900">
                                    {Math.round(stats?.averageScore || 0)}%
                                </div>
                                <div className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Average Score</div>
                                <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                    Your compliance performance average
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 min-h-[160px] flex flex-col justify-between overflow-hidden relative">
                            <div className="relative z-10">
                                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-none text-gray-900">
                                    {stats?.highestScore || 0}%
                                </div>
                                <div className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Highest Score</div>
                                <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                    Your best compliance achievement
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white min-h-[160px] flex flex-col justify-between">
                            <div>
                                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-400 mb-3 sm:mb-4 leading-none">
                                    {stats?.lastAssessment ? formatDate(stats.lastAssessment).split(' ')[0] : 'Never'}
                                </div>
                                <div className="text-base sm:text-lg font-semibold mb-2">Last Assessment</div>
                                <div className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                                    Most recent health check date
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reports List */}
                    {history && history.length > 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">Assessment History</h2>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {history.map((report, index) => (
                                    <div key={report.id || index} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                                                            {formatDate(report.assessmentDate)}
                                                        </span>
                                                    </div>

                                                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border ${getRiskLevelColor(report.riskLevel || 'medium')} whitespace-nowrap`}>
                                                        {(report.riskLevel || 'medium').toUpperCase()} RISK
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 sm:gap-6 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <BarChart3 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                        <span className={`text-xl sm:text-2xl font-bold ${getScoreColor(report.score)} leading-none`}>
                                                            {report.score}%
                                                        </span>
                                                        <span className="text-xs sm:text-sm text-gray-500">Overall Score</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-gray-500">Strengths:</span>
                                                        <span className="font-medium text-green-600">
                                                            {report.strengths?.length || 0}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-gray-500">Red Flags:</span>
                                                        <span className="font-medium text-red-600">
                                                            {report.redFlags?.length || 0}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-gray-500">Recommendations:</span>
                                                        <span className="font-medium text-blue-600">
                                                            {report.recommendations?.length || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-4 sm:mt-0 sm:ml-6">
                                                <button
                                                    onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                                                    className="px-3 sm:px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-300 text-xs sm:text-sm font-medium whitespace-nowrap"
                                                >
                                                    {selectedReport?.id === report.id ? 'Hide Details' : 'View Details'}
                                                </button>

                                                <button
                                                    onClick={() => createShareableReport(report)}
                                                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 text-xs sm:text-sm font-medium"
                                                >
                                                    <Share2 className="w-4 h-4 flex-shrink-0" />
                                                    <span>Share</span>
                                                </button>

                                                <button
                                                    onClick={() => generateReportPDF(report)}
                                                    disabled={isGeneratingPDF}
                                                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-300 text-xs sm:text-sm font-medium disabled:opacity-50"
                                                >
                                                    {isGeneratingPDF ? (
                                                        <LoadingSpinner size="sm" variant="white" />
                                                    ) : (
                                                        <Download className="w-4 h-4 flex-shrink-0" />
                                                    )}
                                                    <span>PDF</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {selectedReport?.id === report.id && (
                                            <div className="mt-6 pt-6 border-t border-gray-200 animate-fade-in">
                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                    {/* Strengths */}
                                                    {report.strengths && report.strengths.length > 0 && (
                                                        <div className="bg-green-50 rounded-lg p-4">
                                                            <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                                                <CheckCircle className="w-4 h-4" />
                                                                Strengths
                                                            </h4>
                                                            <ul className="space-y-2">
                                                                {report.strengths.slice(0, 5).map((strength: string, idx: number) => (
                                                                    <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                                                                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                                                                        {strength}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Red Flags */}
                                                    {report.redFlags && report.redFlags.length > 0 && (
                                                        <div className="bg-red-50 rounded-lg p-4">
                                                            <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                                                                <AlertTriangle className="w-4 h-4" />
                                                                Red Flags
                                                            </h4>
                                                            <ul className="space-y-2">
                                                                {report.redFlags.slice(0, 5).map((flag: string, idx: number) => (
                                                                    <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                                                                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                                                                        {flag}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Recommendations */}
                                                    {report.recommendations && report.recommendations.length > 0 && (
                                                        <div className="bg-blue-50 rounded-lg p-4">
                                                            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                                                <FileText className="w-4 h-4" />
                                                                Recommendations
                                                            </h4>
                                                            <ul className="space-y-2">
                                                                {report.recommendations.slice(0, 5).map((rec: string, idx: number) => (
                                                                    <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                                                                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                                                                        {rec}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Yet</h3>
                            <p className="text-gray-600 mb-6">
                                You haven't completed any health check assessments yet.
                            </p>
                            <Link
                                to="/health-check"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-300"
                            >
                                <BarChart3 className="w-5 h-5" />
                                Start Your First Assessment
                            </Link>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default ReportsPage;