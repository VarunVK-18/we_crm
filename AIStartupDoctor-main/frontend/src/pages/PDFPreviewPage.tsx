import React, { useState, useMemo } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { testPDFData } from '../utils/pdfTestData';
import { generatePDF } from '../utils/pdfGenerator';
import { PDFReportTemplate } from '../components/PDFReportTemplate';
import { PDFDocument } from '../components/PDFDocument';





const PDFPreviewPage: React.FC = () => {
    const [data, setData] = useState(testPDFData);
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewMode, setPreviewMode] = useState<'html' | 'pdf'>('pdf');

    const handleGeneratePDF = async () => {
        setIsGenerating(true);
        try {
            await generatePDF(data);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Check console for details.');
        } finally {
            setIsGenerating(false);
        }
    };

    const updateData = (field: string, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    // Create a unique key based on data to force PDFViewer re-render
    const pdfKey = useMemo(() => {
        return JSON.stringify(data);
    }, [data]);

    // Memoize the PDFDocument to prevent unnecessary re-renders
    const pdfDocument = useMemo(() => {
        return <PDFDocument data={data} />;
    }, [data]);

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">PDF Report Preview</h1>
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={handleGeneratePDF}
                            disabled={isGenerating}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            {isGenerating ? 'Generating...' : 'Generate PDF'}
                        </button>
                        <button
                            onClick={() => setData(testPDFData)}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            Reset to Test Data
                        </button>
                        <div className="flex bg-gray-200 rounded-lg p-1">
                            <button
                                onClick={() => setPreviewMode('html')}
                                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                                    previewMode === 'html'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                HTML Template
                            </button>
                            <button
                                onClick={() => setPreviewMode('pdf')}
                                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                                    previewMode === 'pdf'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                React-PDF Preview
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-8">
                    {/* Controls Panel */}
                    {/* <div className="w-80 bg-white rounded-lg shadow-lg p-6 h-fit">
                        <h2 className="text-xl font-semibold mb-4">Edit Report Data</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                <input
                                    type="text"
                                    value={data.companyName}
                                    onChange={(e) => updateData('companyName', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Overall Score</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={data.overallScore}
                                    onChange={(e) => updateData('overallScore', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Report Date</label>
                                <input
                                    type="text"
                                    value={data.reportDate}
                                    onChange={(e) => updateData('reportDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category Scores</label>
                                {data.categoryScores.map((category, index) => (
                                    <div key={index} className="mb-3 p-3 border border-gray-200 rounded">
                                        <input
                                            type="text"
                                            value={category.category}
                                            onChange={(e) => {
                                                const newCategories = [...data.categoryScores];
                                                newCategories[index].category = e.target.value;
                                                updateData('categoryScores', newCategories);
                                            }}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-1"
                                            placeholder="Category name"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={category.score}
                                            onChange={(e) => {
                                                const newCategories = [...data.categoryScores];
                                                newCategories[index].score = parseInt(e.target.value) || 0;
                                                updateData('categoryScores', newCategories);
                                            }}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-1"
                                            placeholder="Score"
                                        />
                                        <input
                                            type="text"
                                            value={category.insights}
                                            onChange={(e) => {
                                                const newCategories = [...data.categoryScores];
                                                newCategories[index].insights = e.target.value;
                                                updateData('categoryScores', newCategories);
                                            }}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                            placeholder="Insights"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div> */}

                    {/* Preview Panel */}
                    <div className="flex-1">
                        <div className="bg-white rounded-lg shadow-lg p-8">
                            <h2 className="text-xl font-semibold mb-6">
                                {previewMode === 'html' ? 'HTML Template Preview' : 'React-PDF Preview'}
                            </h2>
                            
                            {previewMode === 'html' ? (
                                <div>
                                    <div style={{ transform: 'scale(0.6)', transformOrigin: 'top left' }}>
                                        <PDFReportTemplate data={data} className="shadow-2xl mx-auto" />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-[800px] border border-gray-300 rounded-lg overflow-hidden">
                                    <PDFViewer 
                                        width="100%" 
                                        height="100%"
                                        showToolbar={true}
                                    >
                                        <PDFDocument data={data} />
                                    </PDFViewer>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PDFPreviewPage;