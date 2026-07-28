import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register Space Grotesk font
Font.register({
  family: 'Space Grotesk',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mQQoyeyHLkMX7Mq-HNsXswZRtaRjSsVQNO.woff2',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mLQoyeyHLkMX7Mq-HNsXswZRtaRjSsVS5K0Q.woff2',
      fontWeight: 500,
    },
    {
      src: 'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mLQoyeyHLkMX7Mq-HNsXswZRtaRjSsVWpL0Q.woff2',
      fontWeight: 600,
    },
    {
      src: 'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mLQoyeyHLkMX7Mq-HNsXswZRtaRjSsVQNL0Q.woff2',
      fontWeight: 700,
    },
  ],
});

// Register Manrope font for body text
Font.register({
  family: 'Manrope',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/manrope/v15/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk59FO_F87jxeN7B.woff2',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/manrope/v15/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk6jFO_F87jxeN7B.woff2',
      fontWeight: 500,
    },
    {
      src: 'https://fonts.gstatic.com/s/manrope/v15/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk7PFO_F87jxeN7B.woff2',
      fontWeight: 600,
    },
    {
      src: 'https://fonts.gstatic.com/s/manrope/v15/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FO_F87jxeN7B.woff2',
      fontWeight: 700,
    },
  ],
});

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

interface PDFDocumentProps {
  data: ComplianceData;
}

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Manrope',
    fontSize: 10,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
    fontFamily: 'Space Grotesk',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#6b7280',
  },
  headerRight: {
    textAlign: 'right',
  },
  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 3,
  },
  reportDate: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  dayOfWeek: {
    fontSize: 8,
    color: '#9ca3af',
    textTransform: 'uppercase',
  },

  // Main content styles
  mainContent: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },

  // Overall score card
  scoreCard: {
    width: '35%',
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 15,
    color: 'white',
    textAlign: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  scoreLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    color: '#9ca3af',
    marginBottom: 10,
    letterSpacing: 1,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scoreOutOf: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 15,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  scoreBadgeExcellent: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  scoreBadgeGood: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  scoreBadgeNeeds: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },

  // Category grid
  categoryGrid: {
    width: '65%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '48%',
    borderRadius: 6,
    padding: 10,
    minHeight: 90,
    position: 'relative',
  },
  categoryCardGreen: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  categoryCardBlue: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  categoryCardOrange: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  categoryCardRed: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  categoryHeader: {
    fontSize: 7,
    textTransform: 'uppercase',
    color: '#6b7280',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  categoryScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 3,
  },
  categoryScore: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  categoryScoreGreen: { color: '#166534' },
  categoryScoreBlue: { color: '#1e40af' },
  categoryScoreOrange: { color: '#ea580c' },
  categoryScoreRed: { color: '#dc2626' },
  categoryBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    fontSize: 6,
    fontWeight: 'bold',
  },
  categoryOutOf: {
    fontSize: 6,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 6,
  },
  categoryInsights: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 4,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  categoryInsightsText: {
    fontSize: 6,
    color: '#374151',
    textAlign: 'center',
  },

  // Strengths and Red Flags
  strengthsRedFlags: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  strengthsCard: {
    width: '50%',
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 15,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  redFlagsCard: {
    width: '50%',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 15,
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'Space Grotesk',
  },
  strengthsTitle: { color: '#065f46' },
  redFlagsTitle: { color: '#991b1b' },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 6,
  },
  listBullet: {
    fontSize: 10,
    marginTop: 1,
  },
  strengthsBullet: { color: '#065f46' },
  redFlagsBullet: { color: '#991b1b' },
  listText: {
    fontSize: 10,
    flex: 1,
  },
  strengthsText: { color: '#065f46' },
  redFlagsText: { color: '#991b1b' },

  // Risk Forecast
  riskForecast: {
    backgroundColor: '#fff7ed',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginBottom: 15,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  riskTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9a3412',
    fontFamily: 'Space Grotesk',
  },
  riskAlert: {
    backgroundColor: '#dc2626',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    color: 'white',
  },
  riskAlertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  riskAlertTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Space Grotesk',
  },
  riskAlertSubtitle: {
    fontSize: 7,
    opacity: 0.9,
  },
  riskAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  riskAmountLabel: {
    fontSize: 6,
    opacity: 0.75,
    textAlign: 'right',
  },
  riskCallout: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    padding: 6,
  },
  riskCalloutText: {
    fontSize: 7,
  },
  riskCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  riskCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  riskBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    fontSize: 5,
    fontWeight: 'bold',
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  riskBadgeHigh: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  riskBadgeMedium: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  riskBadgeLow: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  logoImage: {
    width: 52,
    height: 52,
  },
  riskCardTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 3,
    fontFamily: 'Space Grotesk',
  },
  riskCardText: {
    fontSize: 6,
    color: '#6b7280',
  },

  // Footer
  footer: {
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
    paddingTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerLeft: {
    flexDirection: 'column',
  },
  footerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Space Grotesk',
  },
  footerSubtitle: {
    fontSize: 9,
    color: '#6b7280',
  },
  footerRight: {
    textAlign: 'right',
  },
  footerContact: {
    fontSize: 9,
    color: '#6b7280',
  },
  footerEmail: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
  },
  confidential: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 8,
    color: '#9ca3af',
  },
});

export const PDFDocument: React.FC<PDFDocumentProps> = ({ data }) => {
  const getScoreBadgeStyle = (score: number) => {
    if (score >= 80) return [styles.scoreBadge, styles.scoreBadgeExcellent];
    if (score >= 60) return [styles.scoreBadge, styles.scoreBadgeGood];
    return [styles.scoreBadge, styles.scoreBadgeNeeds];
  };

  const getScoreBadgeText = (score: number) => {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    return 'NEEDS IMPROVEMENT';
  };

  const getCategoryCardStyle = (score: number) => {
    if (score >= 80) return [styles.categoryCard, styles.categoryCardGreen];
    if (score >= 60) return [styles.categoryCard, styles.categoryCardBlue];
    if (score >= 40) return [styles.categoryCard, styles.categoryCardOrange];
    return [styles.categoryCard, styles.categoryCardRed];
  };

  const getCategoryScoreStyle = (score: number) => {
    if (score >= 80) return [styles.categoryScore, styles.categoryScoreGreen];
    if (score >= 60) return [styles.categoryScore, styles.categoryScoreBlue];
    if (score >= 40) return [styles.categoryScore, styles.categoryScoreOrange];
    return [styles.categoryScore, styles.categoryScoreRed];
  };

  const getCategoryBadgeStyle = (score: number) => {
    const baseStyle = styles.categoryBadge;
    if (score >= 80) return { ...baseStyle, backgroundColor: '#dcfce7', color: '#166534' };
    if (score >= 60) return { ...baseStyle, backgroundColor: '#dbeafe', color: '#1e40af' };
    if (score >= 40) return { ...baseStyle, backgroundColor: '#fed7aa', color: '#ea580c' };
    return { ...baseStyle, backgroundColor: '#fee2e2', color: '#dc2626' };
  };

  const getCategoryBadgeText = (score: number) => {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'NEEDS ATTENTION';
    return 'CRITICAL';
  };

  const getRiskBadgeStyle = (probability: string) => {
    if (probability === 'high') return [styles.riskBadge, styles.riskBadgeHigh];
    if (probability === 'medium') return [styles.riskBadge, styles.riskBadgeMedium];
    return [styles.riskBadge, styles.riskBadgeLow];
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Logo */}
            <Image
              src="/sdlogo.png"
              style={styles.logoImage}
            />
            <View>
              <Text style={styles.headerTitle}>Startup Doctor</Text>
              <Text style={styles.headerSubtitle}>AI Startup Compliance Report</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.companyName}>{data.companyName}</Text>
            <Text style={styles.reportDate}>{data.reportDate}</Text>
            <Text style={styles.dayOfWeek}>{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Overall Score Card */}
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>OVERALL COMPLIANCE SCORE</Text>
            <Text style={styles.scoreNumber}>{data.overallScore}</Text>
            <Text style={styles.scoreOutOf}>out of 100</Text>
            <View style={getScoreBadgeStyle(data.overallScore)}>
              <Text>{getScoreBadgeText(data.overallScore)}</Text>
            </View>
          </View>

          {/* Category Grid */}
          <View style={styles.categoryGrid}>
            {data.categoryScores.map((category, index) => (
              <View key={index} style={getCategoryCardStyle(category.score)}>
                <Text style={styles.categoryHeader}>{category.category}</Text>
                <View style={styles.categoryScoreRow}>
                  <Text style={getCategoryScoreStyle(category.score)}>{category.score}</Text>
                  <View style={getCategoryBadgeStyle(category.score)}>
                    <Text>{getCategoryBadgeText(category.score)}</Text>
                  </View>
                </View>
                <Text style={styles.categoryOutOf}>out of 100</Text>
                <View style={styles.categoryInsights}>
                  <Text style={styles.categoryInsightsText}>
                    {category.score >= 80 ? '✓' : '⚠'} {category.insights}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Strengths and Red Flags */}
        <View style={styles.strengthsRedFlags}>
          <View style={styles.strengthsCard}>
            <Text style={[styles.sectionTitle, styles.strengthsTitle]}>Strengths</Text>
            {data.strengths.length > 0 ? (
              data.strengths.slice(0, 5).map((strength, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={[styles.listBullet, styles.strengthsBullet]}>●</Text>
                  <Text style={[styles.listText, styles.strengthsText]}>● {strength}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.listText, styles.strengthsText, { fontStyle: 'italic' }]}>
                Complete more compliance items to build your strengths
              </Text>
            )}
          </View>

          <View style={styles.redFlagsCard}>
            <Text style={[styles.sectionTitle, styles.redFlagsTitle]}>⚠ Red Flags</Text>
            {data.redFlags.length > 0 ? (
              data.redFlags.slice(0, 5).map((flag, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={[styles.listBullet, styles.redFlagsBullet]}>●</Text>
                  <Text style={[styles.listText, styles.redFlagsText]}>{flag}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.listText, styles.redFlagsText, { fontStyle: 'italic' }]}>
                Great! No critical compliance issues identified
              </Text>
            )}
          </View>
        </View>

        {/* Risk Forecast */}
        <View style={styles.riskForecast}>
          <View style={styles.riskHeader}>
            <Text style={{ fontSize: 12 }}>📈</Text>
            <Text style={styles.riskTitle}>{data.riskForecast.period}</Text>
          </View>

          {data.riskForecast.risks.length > 0 ? (
            <View>
              {/* Total Penalty Risk Alert */}
              <View style={styles.riskAlert}>
                <View style={styles.riskAlertHeader}>
                  <View>
                    <Text style={styles.riskAlertTitle}>Total Penalty Risk</Text>
                    <Text style={styles.riskAlertSubtitle}>Potential financial impact if issues remain unaddressed</Text>
                  </View>
                  <View>
                    <Text style={styles.riskAmount}>₹12.9L - ₹18.5L</Text>
                    <Text style={styles.riskAmountLabel}>Estimated Range</Text>
                  </View>
                </View>
                <View style={styles.riskCallout}>
                  <Text style={styles.riskCalloutText}>
                    <Text style={{ fontWeight: 'bold' }}>Take Action Now:</Text> Address these compliance gaps to avoid penalties and protect your business.
                  </Text>
                </View>
              </View>

              {/* Individual Risk Cards */}
              <View style={styles.riskCards}>
                {data.riskForecast.risks.slice(0, 4).map((risk, index) => (
                  <View key={index} style={styles.riskCard}>
                    <View style={getRiskBadgeStyle(risk.probability)}>
                      <Text>{risk.probability.toUpperCase()} RISK</Text>
                    </View>
                    <Text style={styles.riskCardTitle}>{risk.type}</Text>
                    <Text style={styles.riskCardText}>{risk.penalty}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={{ backgroundColor: 'white', borderRadius: 4, padding: 10, borderWidth: 1, borderColor: '#fed7aa', textAlign: 'center' }}>
              <Text style={{ fontSize: 8, color: '#9a3412' }}>
                Excellent! No significant compliance risks identified for the next 6 months.
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerTitle}>Startup Doctor</Text>
            <Text style={styles.footerSubtitle}>Startup Compliance Health Check</Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.footerContact}>For support contact:</Text>
            <Text style={styles.footerEmail}>support@wealthempire.com</Text>
          </View>
        </View>

        <Text style={styles.confidential}>
          This report is confidential and intended solely for {data.companyName}.
          Generated on {data.reportDate} by Startup Doctor Compliance Platform.
        </Text>
      </Page>
    </Document>
  );
};

export default PDFDocument;