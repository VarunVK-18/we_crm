import { formatDateForFilename } from './dateFormatter';
import { API_ENDPOINTS } from '../config/api';

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

export const generatePDF = async (data: ComplianceData): Promise<void> => {
  try {
    // Generate filename
    const fileName = `${data.companyName.replace(/\s+/g, '-').toLowerCase()}-Compliance-Health-Report-${formatDateForFilename()}.pdf`;

    // Send data to backend API for PDF generation with Puppeteer
    const response = await fetch(API_ENDPOINTS.GENERATE_PDF, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data,
        fileName
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the PDF blob from the response
    const blob = await response.blob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};

export default generatePDF;