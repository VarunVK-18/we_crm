import React, { useState } from 'react';
import { generateCompliancePDF } from '../utils/pdfGenerator';

const PDFDownloadButton = ({ reportData, fileName, className, children }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      await generateCompliancePDF(reportData, fileName || 'compliance-report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={className || 'btn-primary'}
    >
      {isGenerating ? 'Generating PDF...' : children || 'Download PDF Report'}
    </button>
  );
};

export default PDFDownloadButton;
