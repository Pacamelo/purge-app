/**
 * Session Summary PDF Generator
 *
 * IMPORTANT: This is a SESSION SUMMARY, NOT a proof certificate.
 * The PDF must include disclaimers that this is self-reported data.
 * For genuine proof, users should use Airplane Mode or DevTools.
 */

import { jsPDF } from 'jspdf';
import { generatePrefixedId } from '@/core/utils/secureRandom';

export interface SessionSummaryData {
  sessionId: string;
  timestamp: string;
  files: Array<{
    name: string;
    originalHash: string;
    processedHash: string;
    originalSize: number;
    processedSize: number;
    detectionsRemoved: number;
  }>;
  selfReportedMetrics: {
    networkRequestsDetected: number;
    storageChangesDetected: boolean;
    memoryWipeCompleted: boolean;
    wasOfflineDuringProcessing: boolean;
  };
  environment: {
    browser: string;
    platform: string;
    userAgent: string;
  };
}

/**
 * Required disclaimer text - MUST be included in PDF
 */
const DISCLAIMER = `
IMPORTANT DISCLAIMER

This document is a SESSION SUMMARY, NOT a proof certificate.
All metrics shown are SELF-REPORTED by the PURGE application.

For INDEPENDENT VERIFICATION, please:
1. Enable Airplane Mode before processing files (strongest privacy indicator)
2. Check your browser's Developer Tools > Network tab during processing
3. Review the open-source code at github.com/Pacamelo/forge

This summary cannot prove that files were not copied or uploaded.
It only records what our monitoring detected during the session.
`;

/**
 * Generate session ID using cryptographically secure random
 */
export function generateSessionId(): string {
  return generatePrefixedId('PURGE');
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 bytes';
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Truncate hash for display
 */
function truncateHash(hash: string): string {
  if (!hash || hash.length <= 20) return hash || 'N/A';
  return `${hash.slice(0, 12)}...${hash.slice(-12)}`;
}

/**
 * Generate PDF session summary
 */
export function generateSessionSummaryPDF(data: SessionSummaryData): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;
  const margin = 15;
  const lineHeight = 6;

  // Helper function to add text
  const addText = (text: string, fontSize: number = 10, bold: boolean = false) => {
    doc.setFontSize(fontSize);
    if (bold) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    doc.text(text, margin, yPos);
    yPos += lineHeight;
  };

  // Helper function to add section header
  const addSection = (title: string) => {
    yPos += 4;
    doc.setDrawColor(0, 255, 0); // Green
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;
    addText(title, 12, true);
    yPos += 2;
  };

  // Check if we need a new page
  const checkPage = () => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
  };

  // ===== HEADER =====
  doc.setTextColor(0, 255, 0); // Green text
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PURGE SESSION SUMMARY', margin, yPos);
  yPos += 8;

  // WARNING BANNER
  doc.setFillColor(255, 200, 0); // Yellow background
  doc.rect(margin, yPos, pageWidth - margin * 2, 12, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('NOT A PROOF CERTIFICATE - SELF-REPORTED DATA ONLY', pageWidth / 2, yPos + 8, {
    align: 'center',
  });
  yPos += 18;

  doc.setTextColor(50, 50, 50);

  // ===== SESSION INFO =====
  addSection('SESSION INFORMATION');
  addText(`Session ID: ${data.sessionId}`);
  addText(`Timestamp: ${new Date(data.timestamp).toLocaleString()}`);
  addText(`Browser: ${data.environment.browser}`);
  addText(`Platform: ${data.environment.platform}`);

  // ===== FILES PROCESSED =====
  checkPage();
  addSection('FILES PROCESSED');

  if (data.files.length === 0) {
    addText('No files were processed in this session.');
  } else {
    data.files.forEach((file, index) => {
      checkPage();
      addText(`${index + 1}. ${file.name}`, 10, true);
      addText(`   Original Size: ${formatBytes(file.originalSize)}`);
      addText(`   Processed Size: ${formatBytes(file.processedSize)}`);
      addText(`   Detections Removed: ${file.detectionsRemoved}`);
      addText(`   Original Hash: ${truncateHash(file.originalHash)}`);
      addText(`   Processed Hash: ${truncateHash(file.processedHash)}`);
      yPos += 2;
    });
  }

  // ===== SELF-REPORTED METRICS =====
  checkPage();
  addSection('SELF-REPORTED METRICS');

  const { selfReportedMetrics } = data;

  // Network requests
  const networkStatus = selfReportedMetrics.networkRequestsDetected === 0 ? '✓' : '⚠';
  addText(
    `${networkStatus} Network Requests Detected: ${selfReportedMetrics.networkRequestsDetected}`
  );

  // Storage changes
  const storageStatus = !selfReportedMetrics.storageChangesDetected ? '✓' : '⚠';
  addText(
    `${storageStatus} Storage Changes: ${selfReportedMetrics.storageChangesDetected ? 'Detected' : 'None detected'}`
  );

  // Buffer cleanup (visual indication only - not true secure wiping)
  const memoryStatus = selfReportedMetrics.memoryWipeCompleted ? '✓' : '○';
  addText(
    `${memoryStatus} Buffer Cleanup: ${selfReportedMetrics.memoryWipeCompleted ? 'Completed (visual only)' : 'Not completed'}`
  );

  // Offline processing
  const offlineStatus = selfReportedMetrics.wasOfflineDuringProcessing ? '✓' : '○';
  addText(
    `${offlineStatus} Offline Processing: ${selfReportedMetrics.wasOfflineDuringProcessing ? 'YES - Processed with no internet' : 'No - Was online during processing'}`
  );

  if (selfReportedMetrics.wasOfflineDuringProcessing) {
    yPos += 2;
    doc.setTextColor(0, 150, 0);
    addText('   → Offline processing provides the strongest privacy indication.', 9);
    doc.setTextColor(50, 50, 50);
  }

  // ===== HOW TO VERIFY INDEPENDENTLY =====
  checkPage();
  addSection('HOW TO VERIFY INDEPENDENTLY');

  addText('For stronger assurance that files never left your browser:', 10, true);
  yPos += 2;
  addText('1. AIRPLANE MODE CHALLENGE');
  addText('   Enable Airplane Mode before dropping files into PURGE.');
  addText('   Offline processing provides the strongest privacy assurance.');
  yPos += 2;
  addText('2. BROWSER DEVTOOLS');
  addText('   Open Developer Tools (F12) → Network tab before processing.');
  addText('   Watch for any requests containing your file data.');
  yPos += 2;
  addText('3. SOURCE CODE AUDIT');
  addText('   Review the open-source code at github.com/Pacamelo/forge');
  addText('   Verify there are no hidden network calls in the processing logic.');

  // ===== DISCLAIMER =====
  checkPage();
  addSection('DISCLAIMER');

  doc.setFontSize(8);
  const disclaimerLines = DISCLAIMER.trim().split('\n');
  disclaimerLines.forEach((line) => {
    if (yPos > 280) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(line.trim(), margin, yPos);
    yPos += 4;
  });

  // ===== FOOTER =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated by PURGE | Page ${i} of ${pageCount}`, pageWidth / 2, 290, {
      align: 'center',
    });
  }

  return doc.output('blob');
}

/**
 * Download the session summary PDF
 */
export function downloadSessionSummary(data: SessionSummaryData): void {
  const blob = generateSessionSummaryPDF(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PURGE-Session-${data.sessionId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
