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

interface PDFTemplateProps {
    data: ComplianceData;
}

export const PDFTemplate: React.FC<PDFTemplateProps> = ({ data }) => {
    return (
        <div className="pdf-template bg-white" style={{
            width: '210mm',
            height: '297mm',
            padding: '15mm',
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            lineHeight: '1.4',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '15px',
                borderBottom: '3px solid #1f2937'
            }}>
                <div>
                    <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#1f2937',
                        marginBottom: '5px'
                    }}>
                        Startup Doctor
                    </div>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#374151'
                    }}>
                        Compliance Health Report
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Report Date</div>
                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>{data.reportDate}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Company</div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{data.companyName}</div>
                </div>
            </div>

            {/* Executive Summary & Category Scores */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                {/* Overall Score */}
                <div style={{
                    flex: '1',
                    background: '#1f2937',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', opacity: '0.8' }}>
                        OVERALL COMPLIANCE SCORE
                    </div>
                    <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '5px' }}>
                        {data.overallScore}
                    </div>
                    <div style={{ fontSize: '14px', opacity: '0.8' }}>out of 100</div>
                    <div style={{
                        marginTop: '15px',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: data.overallScore >= 80 ? '#dcfce7' : data.overallScore >= 60 ? '#fef3c7' : '#fee2e2',
                        color: data.overallScore >= 80 ? '#166534' : data.overallScore >= 60 ? '#92400e' : '#991b1b'
                    }}>
                        {data.overallScore >= 80 ? 'EXCELLENT' : data.overallScore >= 60 ? 'GOOD' : 'NEEDS IMPROVEMENT'}
                    </div>
                </div>

                {/* Category Breakdown */}
                <div style={{ flex: '2' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#1f2937' }}>
                        Category Breakdown
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        {data.categoryScores.map((category, index) => (
                            <div key={index} style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '12px',
                                textAlign: 'center',
                                background: '#f9fafb'
                            }}>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>
                                    {category.category}
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                                    {category.score}
                                </div>
                                <div style={{ fontSize: '9px', color: '#6b7280', lineHeight: '1.3' }}>
                                    {category.insights}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Strengths, Red Flags, and Risk Forecast */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flex: '1' }}>
                {/* Strengths */}
                <div style={{ flex: '1', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '15px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        ✓ Strengths
                    </h3>
                    <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
                        {data.strengths.slice(0, 4).map((strength, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', marginBottom: '4px' }}>
                                <span style={{ color: '#16a34a', marginTop: '1px' }}>✓</span>
                                <span style={{ color: '#166534' }}>{strength}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Red Flags */}
                <div style={{ flex: '1', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '15px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#991b1b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        ⚠ Red Flags
                    </h3>
                    <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
                        {data.redFlags.slice(0, 4).map((flag, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', marginBottom: '4px' }}>
                                <span style={{ color: '#dc2626', marginTop: '1px' }}>⚠</span>
                                <span style={{ color: '#991b1b' }}>{flag}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Risk Forecast */}
                <div style={{ flex: '1', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '15px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#ea580c', marginBottom: '10px' }}>
                        📈 6-Month Risks
                    </h3>
                    <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
                        {data.riskForecast.risks.map((risk, index) => (
                            <div key={index} style={{
                                background: 'white',
                                border: '1px solid #fed7aa',
                                borderRadius: '6px',
                                padding: '8px',
                                marginBottom: '6px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
                                    <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '10px' }}>{risk.type}</div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '8px',
                                        fontSize: '8px',
                                        fontWeight: '600',
                                        background: risk.probability === 'high' ? '#fee2e2' : risk.probability === 'medium' ? '#fef3c7' : '#dcfce7',
                                        color: risk.probability === 'high' ? '#991b1b' : risk.probability === 'medium' ? '#92400e' : '#166534'
                                    }}>
                                        {risk.probability.toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ color: '#6b7280', fontSize: '9px' }}>{risk.penalty}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#1f2937' }}>
                    Recommended Actions
                </h3>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{
                        flex: '1',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        padding: '12px',
                        background: '#eff6ff'
                    }}>
                        <h4 style={{ fontWeight: '600', color: '#1e40af', marginBottom: '6px', fontSize: '11px' }}>
                            High Priority Actions
                        </h4>
                        <ul style={{ fontSize: '10px', color: '#1e40af', margin: '0', paddingLeft: '15px', lineHeight: '1.4' }}>
                            <li>File trademark application</li>
                            <li>Complete industry certifications</li>
                            <li>Update director KYC</li>
                        </ul>
                    </div>
                    <div style={{
                        flex: '1',
                        border: '1px solid #fde68a',
                        borderRadius: '8px',
                        padding: '12px',
                        background: '#fffbeb'
                    }}>
                        <h4 style={{ fontWeight: '600', color: '#92400e', marginBottom: '6px', fontSize: '11px' }}>
                            Medium Priority Actions
                        </h4>
                        <ul style={{ fontSize: '10px', color: '#92400e', margin: '0', paddingLeft: '15px', lineHeight: '1.4' }}>
                            <li>Obtain ISO 9001 certification</li>
                            <li>Implement compliance monitoring</li>
                            <li>Review governance policies</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                borderTop: '2px solid #e5e7eb',
                paddingTop: '15px',
                marginTop: 'auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '12px' }}>Startup Doctor</div>
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>Startup Compliance Health Check</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>For support contact:</div>
                    <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '11px' }}>support@wealthempire.com</div>
                </div>
            </div>

            <div style={{
                textAlign: 'center',
                marginTop: '10px',
                fontSize: '9px',
                color: '#9ca3af',
                lineHeight: '1.3'
            }}>
                This report is confidential and intended solely for {data.companyName}.
                Generated on {data.reportDate} by Startup Doctor Compliance Platform.
            </div>
        </div>
    );
};

export default PDFTemplate;