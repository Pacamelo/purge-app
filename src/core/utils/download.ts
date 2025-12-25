/**
 * Download Utilities
 *
 * Provides file download functionality including ZIP bundling
 * for multiple processed files.
 */

import type { ProcessedFile } from '@/core/types';

/**
 * Download a single file by creating a temporary link
 * @param file - The processed file to download
 */
export function downloadFile(file: ProcessedFile): void {
  const url = URL.createObjectURL(file.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.purgedName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download multiple files bundled as a ZIP archive
 * Uses the fflate library for fast, pure-JS compression
 *
 * @param files - Array of processed files to bundle
 * @param zipName - Name of the output ZIP file (default: 'purged_files.zip')
 */
export async function downloadFilesAsZip(
  files: ProcessedFile[],
  zipName: string = 'purged_files.zip'
): Promise<void> {
  if (files.length === 0) return;

  // For single file, just download directly
  if (files.length === 1) {
    downloadFile(files[0]);
    return;
  }

  try {
    // Dynamically import fflate for ZIP creation
    // This keeps the bundle smaller when ZIP isn't needed
    const { zipSync, strToU8 } = await import('fflate');

    // Build the ZIP contents
    const zipContents: Record<string, Uint8Array> = {};

    for (const file of files) {
      const arrayBuffer = await file.blob.arrayBuffer();
      zipContents[file.purgedName] = new Uint8Array(arrayBuffer);
    }

    // Add a manifest file with processing metadata
    const manifest = {
      generatedAt: new Date().toISOString(),
      files: files.map((f) => ({
        originalName: f.originalName,
        purgedName: f.purgedName,
        originalSize: f.originalSize,
        purgedSize: f.purgedSize,
        detectionsRemoved: f.detectionsRemoved,
      })),
      notice:
        'Files processed locally with PURGE. No data was transmitted to any server.',
    };
    zipContents['_purge_manifest.json'] = strToU8(
      JSON.stringify(manifest, null, 2)
    );

    // Create the ZIP
    const zipped = zipSync(zipContents, {
      level: 6, // Balanced compression
    });

    // Download the ZIP
    const blob = new Blob([new Uint8Array(zipped)], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.warn('ZIP creation failed, falling back to individual downloads:', error);
    // Fallback to individual downloads if ZIP fails
    await downloadFilesSequentially(files);
  }
}

/**
 * Download files one at a time with a delay
 * Used as fallback when ZIP creation fails
 *
 * @param files - Array of files to download
 * @param delayMs - Delay between downloads in milliseconds
 */
async function downloadFilesSequentially(
  files: ProcessedFile[],
  delayMs: number = 500
): Promise<void> {
  for (const file of files) {
    downloadFile(file);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
