import React from 'react';

interface ComplianceData {
    companyName: string;
    reportDate: string;
    overallScore: number;
    categoryScores: Array<{
        category: string;
        score: number;
        insights: string;
        status: string;
    }>;
    strengths: string[];
    redFlags: string[];
    riskForecast: {
        period: string;
        risks: Array<{
            type: string;
            penalty: string;
            probability: string;
        }>;
    };
}

interface PDFReportTemplateProps {
    data: ComplianceData;
    className?: string;
}

export const PDFReportTemplate: React.FC<PDFReportTemplateProps> = ({ data, className = '' }) => {
    return (
        <div
            className={`bg-white ${className}`}
            style={{
                width: '210mm',
                minHeight: '297mm',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontSize: '12px',
                lineHeight: '1.5',
                position: 'relative',
                overflow: 'hidden',
                background: 'white',
                padding: '20mm'
            }}
        >
            {/* Header Section - Logo, Title, and Company Info */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                paddingBottom: '20px',
                borderBottom: '2px solid #e5e7eb'
            }}>
                {/* Left: Logo and Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Logo placeholder - you can replace with actual logo */}
                    <img src='./sdlogo.svg' style={{ width: '52px', height: '52px' }} alt="Startup Doctor Logo" />
                    <div>
                        <h1 style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: '#111827',
                            margin: '0',
                            lineHeight: '1.2'
                        }}>
                            Startup Doctor
                        </h1>
                        <p style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#6b7280',
                            margin: '0',
                            marginTop: '2px'
                        }}>
                            AI Startup Compliance Report
                        </p>
                    </div>
                </div>

                {/* Right: Date and Company Info */}
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: '4px'
                    }}>
                        {data.companyName}
                    </div>
                    <div style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        marginBottom: '2px'
                    }}>
                        {data.reportDate}
                    </div>
                    <div style={{
                        fontSize: '10px',
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                    </div>
                </div>
            </div>

            {/* Overall Score and Category Scores - Dashboard Layout */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                {/* Overall Score Card - Dark Theme like Dashboard */}
                <div style={{
                    width: '35%',
                    background: '#111827',
                    borderRadius: '12px',
                    padding: '20px',  
                    color: 'white',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    height: '268px'
                }}>
                    <div>
                        <div style={{
                            fontSize: '10px',
                            fontWeight: '500',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            color: '#9ca3af',
                            marginBottom: '12px'
                        }}>
                            OVERALL COMPLIANCE SCORE
                        </div>
                        <div style={{
                            fontSize: '72px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            lineHeight: '1'
                        }}>
                            {data.overallScore}
                        </div>
                        <div style={{
                            fontSize: '18px',
                            color: '#9ca3af',
                            marginBottom: '20px'
                        }}>
                            out of 100
                        </div>

                        {/* Score Status Badge - Matching Dashboard */}
                        <div style={{
                            display: 'inline-block',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '10px',
                            fontWeight: '600',
                            ...(data.overallScore >= 80
                                ? { background: '#dcfce7', color: '#166534' }
                                : data.overallScore >= 60
                                    ? { background: '#fef3c7', color: '#92400e' }
                                    : { background: '#fee2e2', color: '#991b1b' })
                        }}>
                            {data.overallScore >= 80 ? 'EXCELLENT' : data.overallScore >= 60 ? 'GOOD' : 'NEEDS IMPROVEMENT'}
                        </div>
                    </div>
                </div>

                {/* Category Scores Grid - Dashboard Style */}
                <div style={{ width: '65%' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {data.categoryScores.map((category, index) => {
                            // Determine colors based on score like dashboard
                            const getStatusColor = (score: number) => {
                                if (score >= 80) return { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', dot: '#22c55e' };
                                if (score >= 60) return { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', dot: '#3b82f6' };
                                if (score >= 40) return { bg: '#fff7ed', border: '#fed7aa', text: '#ea580c', dot: '#f97316' };
                                return { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#ef4444' };
                            };

                            const colors = getStatusColor(category.score);

                            return (
                                <div key={index} style={{
                                    background: colors.bg,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '8px',
                                    padding: '12px',
                                    position: 'relative',
                                    minHeight: '120px',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    {/* Status Dot */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: colors.dot
                                    }}></div>

                                    {/* Category Header */}
                                    <div style={{
                                        fontSize: '9px',
                                        fontWeight: '500',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase',
                                        color: '#6b7280',
                                        marginBottom: '8px',
                                        lineHeight: '1.2'
                                    }}>
                                        {category.category}
                                    </div>

                                    {/* Score Display */}
                                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
                                        {/* Score and Status - Horizontal Layout */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <div style={{
                                                fontSize: '28px',
                                                fontWeight: 'bold',
                                                color: colors.text,
                                                lineHeight: '1'
                                            }}>
                                                {category.score}
                                            </div>
                                            {/* Status Label */}
                                            <div style={{
                                                display: 'inline-block',
                                                padding: '2px 6px',
                                                borderRadius: '8px',
                                                fontSize: '7px',
                                                fontWeight: '600',
                                                background: category.score >= 80 ? '#dcfce7' : category.score >= 60 ? '#dbeafe' : category.score >= 40 ? '#fed7aa' : '#fee2e2',
                                                color: category.score >= 80 ? '#166534' : category.score >= 60 ? '#1e40af' : category.score >= 40 ? '#ea580c' : '#dc2626'
                                            }}>
                                                {category.score >= 80 ? 'EXCELLENT' : category.score >= 60 ? 'GOOD' : category.score >= 40 ? 'NEEDS ATTENTION' : 'CRITICAL'}
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: '8px',
                                            color: '#6b7280'
                                        }}>
                                            out of 100
                                        </div>
                                    </div>

                                    {/* Insights Box */}
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.8)',
                                        borderRadius: '6px',
                                        padding: '8px',
                                        border: '1px solid rgba(255, 255, 255, 0.6)'
                                    }}>
                                        <div style={{
                                            fontSize: '8px',
                                            fontWeight: '500',
                                            color: '#374151',
                                            textAlign: 'center',
                                            lineHeight: '1.2'
                                        }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                                {category.score >= 80 ? '✓' : category.score >= 40 ? '⚠' : '⚠'}
                                                <span style={{ fontWeight: '600' }}>{category.insights}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Strengths and Red Flags - Dashboard Style */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                {/* Strengths */}
                <div style={{
                    width: '50%',
                    background: '#f0fdf4',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '2px solid #bbf7d0'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '16px'
                    }}>
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#065f46',
                            margin: '0'
                        }}>✓ Strengths</h3>
                    </div>
                    <div style={{ fontSize: '12px', lineHeight: '1.0' }}>
                        {data.strengths.length > 0 ? (
                            data.strengths.slice(0, 5).map((strength, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px',
                                    marginBottom: '10px'
                                }}>
                                    <span style={{ color: '#065f46' }}>● {strength}</span>
                                </div>
                            ))
                        ) : (
                            <div style={{ color: '#065f46', fontStyle: 'italic' }}>
                                Complete more compliance items to build your strengths
                            </div>
                        )}
                    </div>
                </div>

                {/* Red Flags */}
                <div style={{
                    width: '50%',
                    background: '#fef2f2',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '2px solid #fecaca'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '20px'
                    }}>
                        
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#991b1b',
                            margin: '0'
                        }}>⚠ Red Flags</h3>
                    </div>
                    <div style={{ fontSize: '14px', lineHeight: '1.0' }}>
                        {data.redFlags.length > 0 ? (
                            data.redFlags.slice(0, 5).map((flag, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px',
                                    marginBottom: '10px'
                                }}>
                                    <span style={{ color: '#991b1b' }}>● {flag}</span>
                                </div>
                            ))
                        ) : (
                            <div style={{ color: '#991b1b', fontStyle: 'italic' }}>
                                Great! No critical compliance issues identified
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 6-Month Risk Forecast - Dashboard Style */}
            <div style={{
                background: '#fff7ed',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #fed7aa',
                marginBottom: '20px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                }}>
                    <span style={{ color: '#ea580c', fontSize: '16px' }}>📈</span>
                    <h3 style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#9a3412',
                        margin: '0'
                    }}>{data.riskForecast.period}</h3>
                </div>

                {data.riskForecast.risks.length > 0 ? (
                    <>
                        {/* Total Penalty Risk Alert */}
                        <div style={{
                            background: 'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '12px',
                            color: 'white'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px'
                            }}>
                                <div>
                                    <h4 style={{
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        marginBottom: '4px',
                                        margin: '0 0 4px 0'
                                    }}>Total Penalty Risk</h4>
                                    <p style={{
                                        fontSize: '9px',
                                        opacity: '0.9',
                                        margin: '0'
                                    }}>Potential financial impact if issues remain unaddressed</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        lineHeight: '1'
                                    }}>
                                        ₹12.9L - ₹18.5L
                                    </div>
                                    <div style={{
                                        fontSize: '8px',
                                        opacity: '0.75'
                                    }}>Estimated Range</div>
                                </div>
                            </div>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '6px',
                                padding: '8px'
                            }}>
                                <p style={{
                                    fontSize: '9px',
                                    fontWeight: '500',
                                    margin: '0'
                                }}>
                                    <strong>Take Action Now:</strong> Address these compliance gaps to avoid penalties and protect your business.
                                </p>
                            </div>
                        </div>

                        {/* Individual Risk Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {data.riskForecast.risks.slice(0, 4).map((risk, index) => (
                                <div key={index} style={{
                                    background: 'white',
                                    borderRadius: '6px',
                                    padding: '10px',
                                    border: '1px solid #fed7aa'
                                }}>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '2px 6px',
                                        borderRadius: '8px',
                                        fontSize: '7px',
                                        fontWeight: '600',
                                        marginBottom: '6px',
                                        ...(risk.probability === 'high'
                                            ? { background: '#fee2e2', color: '#991b1b' }
                                            : risk.probability === 'medium'
                                                ? { background: '#fef3c7', color: '#92400e' }
                                                : { background: '#dcfce7', color: '#166534' })
                                    }}>
                                        {risk.probability.toUpperCase()} RISK
                                    </div>
                                    <h4 style={{
                                        fontWeight: '600',
                                        color: '#111827',
                                        marginBottom: '4px',
                                        fontSize: '10px',
                                        margin: '0 0 4px 0'
                                    }}>{risk.type}</h4>
                                    <p style={{
                                        fontSize: '8px',
                                        color: '#6b7280',
                                        margin: '0'
                                    }}>{risk.penalty}</p>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div style={{
                        background: 'white',
                        borderRadius: '6px',
                        padding: '12px',
                        border: '1px solid #fed7aa',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '10px',
                            color: '#9a3412'
                        }}>
                            Excellent! No significant compliance risks identified for the next 6 months.
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{
                borderTop: '2px solid #e5e7eb',
                paddingTop: '20px',
                marginTop: 'auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>Startup Doctor</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Startup Compliance Health Check</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>For support contact:</div>
                    <div style={{ fontWeight: '600', color: '#111827', fontSize: '12px' }}>support@wealthempire.com</div>
                </div>
            </div>

            <div style={{
                textAlign: 'center',
                marginTop: '16px',
                fontSize: '10px',
                color: '#9ca3af',
                lineHeight: '1.4'
            }}>
                This report is confidential and intended solely for {data.companyName}.
                Generated on {data.reportDate} by Startup Doctor Compliance Platform.
            </div>
        </div>
    );
};

export default PDFReportTemplate;