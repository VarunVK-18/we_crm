import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    User,
    Building,
    MapPin,
    Globe,
    Phone,
    Mail,
    Edit3,
    TrendingUp,
    Calendar,
    Award,
    AlertTriangle,
    CheckCircle,
    BarChart3,
    FileText,
    Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import Navigation from '../components/Navigation';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { formatDate } from '../utils/dateFormatter';

interface UserProfile {
    id: string;
    email: string;
    startupName: string;
    city: string;
    state: string;
    country: string;
    website: string;
    founderName: string;
    contactNumber: string;
    subscription: {
        type: string;
        isActive: boolean;
        startDate: string;
        endDate?: string;
    };
    memberSince: string;
}

interface DashboardStats {
    totalHealthChecks: number;
    averageScore: number;
    lastAssessment: string | null;
    lastScore: number | null;
}



const DashboardPage: React.FC = () => {
    const { currentUser, getIdToken } = useAuth();
    const { latestResult: latestHealthCheck, stats: healthStats } = useHealthCheck();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const token = await getIdToken();

            const response = await fetch(API_ENDPOINTS.USER_DASHBOARD, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                setProfile(result.data.user);
            } else {
                setError('Failed to load dashboard data');
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navigation />
                <div className="flex items-center mt-20 justify-center py-20">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-4" />
                        <p className="text-gray-600">Loading dashboard...</p>
                    </div>
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
                            onClick={fetchDashboardData}
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

            <section className="relative pt-20 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Welcome Header */}
                    <div className="text-center mb-12 sm:mb-16">
                        <p className="text-xs font-medium tracking-widest uppercase text-gray-500 mb-4 sm:mb-6">
                            DASHBOARD
                        </p>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-2 sm:px-0">
                            Welcome back,
                            <br />
                            <span className="text-gray-400 break-words">{profile?.founderName || currentUser?.displayName}</span>
                        </h1>
                        <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8 lg:mb-10 px-4 sm:px-0 leading-relaxed">
                            Here's what's happening with <span className="break-words">{profile?.startupName || 'your startup'}</span> today.
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12 px-2 sm:px-0">
                        <div className="bg-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white min-h-[180px] sm:aspect-square flex flex-col justify-between">
                            <div>
                                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 mb-3 sm:mb-4" />
                                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 leading-none">
                                    {healthStats?.totalAssessments || 0}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-300 leading-relaxed">Health Checks Completed</div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl sm:rounded-3xl p-6 sm:p-8 min-h-[180px] sm:aspect-square flex flex-col justify-between overflow-hidden relative">
                            <div className="relative z-10">
                                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900 mb-3 sm:mb-4" />
                                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 leading-none">
                                    {Math.round(healthStats?.averageScore || 0)}%
                                </div>
                                <div className="text-xs sm:text-sm text-gray-700 leading-relaxed">Average Score</div>
                            </div>
                            <div className="absolute bottom-0 right-0 w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-blue-200/50 rounded-full blur-2xl"></div>
                        </div>

                        <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 min-h-[180px] sm:aspect-square flex flex-col justify-between">
                            <div>
                                <Award className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900 mb-3 sm:mb-4" />
                                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 leading-none">
                                    {latestHealthCheck?.score || 0}%
                                </div>
                                <div className="text-xs sm:text-sm text-gray-700 leading-relaxed">Latest Score</div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl sm:rounded-3xl p-6 sm:p-8 min-h-[180px] sm:aspect-square flex flex-col justify-between">
                            <div>
                                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900 mb-3 sm:mb-4" />
                                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 leading-none">
                                    {healthStats?.lastAssessment ? formatDate(healthStats.lastAssessment) : 'Never'}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-700 leading-relaxed">Last Assessment</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Profile Card */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                                    <Link
                                        to="/profile/edit"
                                        className="text-gray-700 hover:text-gray-900 flex items-center text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-all duration-300"
                                    >
                                        <Edit3 className="h-4 w-4 mr-2" />
                                        Edit Profile
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                                    <div className="space-y-4 sm:space-y-6">
                                        <div className="flex items-start">
                                            <div className="bg-gray-100 rounded-2xl p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                                                <Building className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Startup Name</p>
                                                <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 break-words">{profile?.startupName || 'Not provided'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <div className="bg-gray-100 rounded-2xl p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                                                <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Founder Name</p>
                                                <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 break-words">{profile?.founderName || 'Not provided'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <div className="bg-gray-100 rounded-2xl p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                                                <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Email</p>
                                                <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 break-all">{profile?.email || currentUser?.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 sm:space-y-6">
                                        <div className="flex items-start">
                                            <div className="bg-gray-100 rounded-2xl p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                                                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Location</p>
                                                <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 break-words">
                                                    {profile ? `${profile.city}, ${profile.state}, ${profile.country}` : 'Not provided'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <div className="bg-gray-100 rounded-2xl p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                                                <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Contact Number</p>
                                                <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 break-words">{profile?.contactNumber || 'Not provided'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <div className="bg-gray-100 rounded-2xl p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                                                <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Website</p>
                                                {profile?.website ? (
                                                    <a
                                                        href={profile.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors break-all"
                                                    >
                                                        {profile.website}
                                                    </a>
                                                ) : (
                                                    <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Not provided</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Member Since */}
                                <div className="mt-8 pt-8 border-t border-gray-200">
                                    <p className="text-sm text-gray-500">
                                        Member since {profile?.memberSince ? formatDate(profile.memberSince, 'medium') : 'Unknown'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions & Latest Assessment */}
                        <div className="space-y-8">
                            {/* Quick Actions */}
                            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
                                <div className="space-y-4">
                                    <Link
                                        to="/health-check"
                                        className="w-full flex items-center justify-center px-6 py-4 text-white bg-gray-900 rounded-2xl hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        <BarChart3 className="h-5 w-5 mr-3" />
                                        Start Health Check
                                    </Link>

                                    <Link
                                        to="/reports"
                                        className="w-full flex items-center justify-center px-6 py-4 text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all duration-300"
                                    >
                                        <FileText className="h-5 w-5 mr-3" />
                                        View Reports
                                    </Link>
                                </div>
                            </div>

                            {/* Subscription Status */}
                            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Subscription</h3>
                                <div className="flex items-center mb-4">
                                    <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                                    <span className="text-lg font-semibold text-gray-900 capitalize">
                                        {profile?.subscription?.type || 'Free'} Plan
                                    </span>
                                </div>
                                {profile?.subscription?.isActive && (
                                    <p className="text-sm text-gray-600 mb-4">
                                        Active since {formatDate(profile.subscription.startDate)}
                                    </p>
                                )}
                                <Link
                                    to="/subscription"
                                    className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                                >
                                    Manage subscription →
                                </Link>
                            </div>

                            {/* Latest Health Check */}
                            {latestHealthCheck && (
                                <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">Latest Assessment</h3>
                                    <div className="text-center mb-6">
                                        <div className="text-4xl font-bold text-gray-900 mb-2">
                                            {latestHealthCheck.score}%
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {formatDate(latestHealthCheck.assessmentDate)}
                                        </p>
                                    </div>
                                    {latestHealthCheck.recommendations && latestHealthCheck.recommendations.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 mb-3">Top Recommendations:</p>
                                            <ul className="space-y-2">
                                                {latestHealthCheck.recommendations.slice(0, 3).map((rec, index) => (
                                                    <li key={index} className="text-sm text-gray-600 flex items-start">
                                                        <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                                        {rec}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Background Elements */}
                <div className="absolute top-1/4 left-0 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute top-1/3 right-0 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-gray-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            </section>
        </div>
    );
};

export default DashboardPage;