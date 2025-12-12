'use client';
import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

interface Activity {
  time: string;
  place: string;
  description: string;
  coordinates: [number, number];
  recommendations?: {
    name: string;
    type: string;
    coordinates: [number, number];
  }[];
}

interface Day {
  day: number;
  activities: Activity[];
}

interface Itinerary {
  days: Day[];
}

interface DownloadButtonProps {
  itinerary: Itinerary | null;
  destination?: string;
}

export default function DownloadButton({ itinerary, destination = 'Trip' }: DownloadButtonProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!itinerary) return null;

  // Generate Plain Text
  const generateTextContent = () => {
    let content = `${destination} Itinerary\n${'='.repeat(50)}\n\n`;

    itinerary.days.forEach(day => {
      content += `DAY ${day.day}\n${'-'.repeat(30)}\n`;
      day.activities.forEach(activity => {
        content += `\n${activity.time} - ${activity.place}\n`;
        content += `${activity.description}\n`;
        content += `Location: ${activity.coordinates[0]}, ${activity.coordinates[1]}\n`;
        if (activity.recommendations?.length) {
          content += `\nNearby Recommendations:\n`;
          activity.recommendations.forEach(rec => {
            content += `  * ${rec.name} (${rec.type})\n`;
          });
        }
        content += '\n';
      });
      content += '\n';
    });

    return content;
  };

  // Generate PDF
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPosition = margin;

    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // Blue color
    doc.text(`${destination} Itinerary`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Decorative line
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    itinerary.days.forEach((day, dayIndex) => {
      checkPageBreak(40);

      // Day header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text(`Day ${day.day}`, margin, yPosition);
      yPosition += 10;

      day.activities.forEach((activity, actIndex) => {
        checkPageBreak(50);

        // Time
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text(activity.time, margin + 5, yPosition);
        yPosition += 6;

        // Place
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(activity.place, margin + 5, yPosition);
        yPosition += 6;

        // Description
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);
        const descriptionLines = doc.splitTextToSize(activity.description, maxWidth - 10);
        doc.text(descriptionLines, margin + 5, yPosition);
        yPosition += descriptionLines.length * 5 + 3;

        // Coordinates
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(`📍 ${activity.coordinates[0].toFixed(4)}, ${activity.coordinates[1].toFixed(4)}`, margin + 5, yPosition);
        yPosition += 6;

        // Recommendations
        if (activity.recommendations?.length) {
          checkPageBreak(20 + activity.recommendations.length * 6);

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(34, 197, 94);
          doc.text('Nearby Recommendations:', margin + 5, yPosition);
          yPosition += 5;

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(75, 85, 99);
          activity.recommendations.forEach(rec => {
            doc.text(`• ${rec.name} (${rec.type})`, margin + 10, yPosition);
            yPosition += 5;
          });
        }

        yPosition += 8;
      });

      // Add spacing between days
      yPosition += 5;

      // Separator line between days
      if (dayIndex < itinerary.days.length - 1) {
        checkPageBreak(15);
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
      }
    });

    // Footer on each page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    return doc;
  };

  // Generate DOCX
  const generateDOCX = async () => {
    const children: any[] = [];

    // Title
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `🌍 ${destination} Itinerary`,
            bold: true,
            size: 48,
            color: '2563EB',
          }),
        ],
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 },
      })
    );

    itinerary.days.forEach(day => {
      // Day header
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Day ${day.day}`,
              bold: true,
              size: 32,
              color: '1E40AF',
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          border: {
            bottom: {
              color: '3B82F6',
              space: 4,
              size: 6,
              style: BorderStyle.SINGLE,
            },
          },
        })
      );

      day.activities.forEach(activity => {
        // Time
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `⏰ ${activity.time}`,
                bold: true,
                size: 22,
                color: '3B82F6',
              }),
            ],
            spacing: { before: 200 },
          })
        );

        // Place
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: activity.place,
                bold: true,
                size: 26,
              }),
            ],
            spacing: { before: 100 },
          })
        );

        // Description
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: activity.description,
                size: 22,
                color: '4B5563',
              }),
            ],
            spacing: { before: 100 },
          })
        );

        // Coordinates
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `📍 Location: ${activity.coordinates[0].toFixed(4)}, ${activity.coordinates[1].toFixed(4)}`,
                size: 18,
                color: '6B7280',
                italics: true,
              }),
            ],
            spacing: { before: 100 },
          })
        );

        // Recommendations
        if (activity.recommendations?.length) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: '📌 Nearby Recommendations:',
                  bold: true,
                  size: 22,
                  color: '22C55E',
                }),
              ],
              spacing: { before: 200 },
            })
          );

          activity.recommendations.forEach(rec => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `    • ${rec.name}`,
                    size: 20,
                  }),
                  new TextRun({
                    text: ` (${rec.type})`,
                    size: 20,
                    color: '3B82F6',
                  }),
                ],
                spacing: { before: 50 },
              })
            );
          });
        }

        // Spacing after activity
        children.push(
          new Paragraph({
            children: [],
            spacing: { after: 200 },
          })
        );
      });
    });

    // Footer
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '───────────────────────────────────────',
            color: 'D1D5DB',
          }),
        ],
        spacing: { before: 400 },
      })
    );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: children,
        },
      ],
    });

    return doc;
  };

  // Download handlers
  const downloadTXT = () => {
    const content = generateTextContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${destination}-itinerary.txt`);
    setShowOptions(false);
  };

  const downloadPDF = () => {
    setDownloading(true);
    try {
      const doc = generatePDF();
      doc.save(`${destination}-itinerary.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
      setShowOptions(false);
    }
  };

  const downloadDOCX = async () => {
    setDownloading(true);
    try {
      const doc = await generateDOCX();
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${destination}-itinerary.docx`);
    } catch (error) {
      console.error('Failed to generate DOCX:', error);
      alert('Failed to generate DOCX. Please try again.');
    } finally {
      setDownloading(false);
      setShowOptions(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={downloading}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
      >
        {downloading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <span>⬇️</span>
            <span className="hidden sm:inline">Download Itinerary</span>
            <span className="sm:hidden">Download</span>
          </>
        )}
      </button>

      {showOptions && !downloading && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowOptions(false)}
          />
          
          <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 min-w-[200px]">
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Select Format</p>
            </div>
            
            <button
              onClick={downloadPDF}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-800 dark:text-gray-200 transition-colors"
            >
              <span className="text-xl">📕</span>
              <div>
                <p className="font-medium">PDF Document</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Best for printing</p>
              </div>
            </button>
            
            <button
              onClick={downloadDOCX}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-800 dark:text-gray-200 transition-colors border-t border-gray-100 dark:border-gray-700"
            >
              <span className="text-xl">📘</span>
              <div>
                <p className="font-medium">Word Document</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Editable in Microsoft Word</p>
              </div>
            </button>
            
            <button
              onClick={downloadTXT}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-800 dark:text-gray-200 transition-colors border-t border-gray-100 dark:border-gray-700"
            >
              <span className="text-xl">📄</span>
              <div>
                <p className="font-medium">Plain Text</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Simple, universal format</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}