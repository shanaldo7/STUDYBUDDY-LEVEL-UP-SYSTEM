/**
 * Client-Side PDF & Document Text Extractor
 * Supports PDF, Markdown, Text, and Document formats.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Set up worker source
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
  } catch {
    // Fallback if workerSrc property assignment fails
  }
}

/**
 * Extracts all textual content from a PDF File or ArrayBuffer
 */
export async function extractTextFromPDF(file: File | ArrayBuffer): Promise<string> {
  try {
    let arrayBuffer: ArrayBuffer;
    if (file instanceof File) {
      arrayBuffer = await file.arrayBuffer();
    } else {
      arrayBuffer = file;
    }

    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      fullText += `--- Page ${pageNum} ---\n` + pageText + '\n\n';
    }

    return fullText.trim();
  } catch (err: any) {
    console.error('PDF parsing error:', err);
    // If PDF parser fails, try fallback plain text reading
    if (file instanceof File) {
      return await file.text();
    }
    throw new Error(`Failed to parse PDF document: ${err?.message || 'Invalid format'}`);
  }
}

/**
 * Universal text extractor for uploaded syllabus files (.pdf, .txt, .md, .json, .csv)
 */
export async function extractTextFromFile(file: File): Promise<{ text: string; fileName: string; fileType: string }> {
  const fileName = file.name;
  const lower = fileName.toLowerCase();

  if (lower.endsWith('.pdf') || file.type === 'application/pdf') {
    const text = await extractTextFromPDF(file);
    return { text, fileName, fileType: 'pdf' };
  }

  // Plain text, markdown, or JSON
  const text = await file.text();
  return { text, fileName, fileType: lower.split('.').pop() || 'txt' };
}
