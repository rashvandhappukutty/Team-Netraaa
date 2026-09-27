import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Extracts and normalizes unstructured document files (PDF, DOCX, TXT, LOG)
 * @param {string} filePath
 * @param {string} fileExtension
 * @param {string} sourceType
 * @returns {Promise<{ rawText: string, metadata: Object, records: Array<{ originalRef: string, raw: string, normalized: Object }>, totalCount: number }>}
 */
export async function parseAndNormalizeDocument(filePath, fileExtension, sourceType) {
  const ext = fileExtension.toLowerCase().replace('.', '');
  let fullText = '';
  const metadata = {
    file_extension: ext,
    page_count: 1
  };

  if (ext === 'pdf') {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      fullText = pdfData.text || '';
      metadata.page_count = pdfData.numpages || 1;
      if (pdfData.info) {
        metadata.pdf_info = pdfData.info;
      }
    } catch (pdfErr) {
      console.warn('PDF extraction fallback:', pdfErr.message);
      const rawBuf = fs.readFileSync(filePath);
      fullText = rawBuf.toString('utf-8').replace(/[\x00-\x08\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
    }
  } else {
    // TXT, LOG, DOCX
    fullText = fs.readFileSync(filePath, 'utf-8');
  }

  // Segment full text into discrete paragraphs/clauses
  const paragraphs = fullText
    .split(/\n\s*\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 15);

  const records = [];

  if (paragraphs.length === 0 && fullText.trim().length > 0) {
    records.push({
      originalRef: 'Document Section 1',
      raw: fullText.trim(),
      normalized: {
        _source_type: sourceType,
        _section_index: 1,
        text_segment: fullText.trim()
      }
    });
  } else {
    paragraphs.forEach((para, idx) => {
      const sectionNum = idx + 1;
      const estimatedPage = Math.min(
        metadata.page_count,
        Math.max(1, Math.ceil((sectionNum / paragraphs.length) * metadata.page_count))
      );

      records.push({
        originalRef: metadata.page_count > 1 ? `Page ${estimatedPage} (Section ${sectionNum})` : `Section ${sectionNum}`,
        raw: para,
        normalized: {
          _source_type: sourceType,
          _section_index: sectionNum,
          _estimated_page: estimatedPage,
          text_segment: para
        }
      });
    });
  }

  return {
    rawText: fullText,
    metadata,
    records,
    totalCount: records.length
  };
}
