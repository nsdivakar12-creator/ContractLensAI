// Pure Node.js document parser supporting .txt, .md, .docx (ZIP + XML), and .pdf (stream extraction)
import zlib from 'node:zlib';

function extractDocxText(buffer) {
  const entries = [];
  let offset = 0;

  while (offset + 30 < buffer.length) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) {
      offset++;
      continue;
    }
    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const fileName = buffer.toString('utf8', offset + 30, offset + 30 + fileNameLen);
    const dataStart = offset + 30 + fileNameLen + extraLen;

    let dataEnd = dataStart + compressedSize;
    if (compressedSize === 0) {
      const nextSig = buffer.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]), dataStart);
      const centralSig = buffer.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]), dataStart);
      const candidates = [nextSig, centralSig].filter((i) => i > dataStart);
      dataEnd = candidates.length > 0 ? Math.min(...candidates) : buffer.length;
    }

    entries.push({ fileName, compressionMethod, data: buffer.subarray(dataStart, dataEnd) });
    offset = Math.max(dataEnd, offset + 30 + fileNameLen + extraLen);
  }

  const docEntry = entries.find((e) => e.fileName === 'word/document.xml' || e.fileName.endsWith('/document.xml'));
  if (!docEntry) throw new Error('Could not find word/document.xml inside the DOCX file.');

  let xml;
  if (docEntry.compressionMethod === 0) {
    xml = docEntry.data.toString('utf8');
  } else if (docEntry.compressionMethod === 8) {
    try {
      xml = zlib.inflateRawSync(docEntry.data).toString('utf8');
    } catch {
      for (let trim = 4; trim <= 24; trim += 4) {
        try {
          xml = zlib.inflateRawSync(docEntry.data.subarray(0, docEntry.data.length - trim)).toString('utf8');
          break;
        } catch {
          // try next trim
        }
      }
      if (!xml) throw new Error('Failed to decompress DOCX content.');
    }
  } else {
    throw new Error(`Unsupported DOCX compression method: ${docEntry.compressionMethod}`);
  }

  return xml
    .replace(/<\/w:p>/g, '\n\n')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<w:tab[^>]*\/>/g, '\t')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function unescapePdfString(str) {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

function extractTextFromPdfStream(streamStr) {
  const chunks = [];
  const tjRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(streamStr)) !== null) {
    chunks.push(unescapePdfString(match[1]));
  }
  const tjArrayRegex = /\[((?:[^[\]]|\n)*?)\]\s*TJ/g;
  while ((match = tjArrayRegex.exec(streamStr)) !== null) {
    const inner = match[1];
    const parts = [];
    const strRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)|(-?\d+(?:\.\d+)?)/g;
    let m2;
    while ((m2 = strRegex.exec(inner)) !== null) {
      if (m2[1] !== undefined) parts.push(unescapePdfString(m2[1]));
      else if (m2[2] !== undefined && Number(m2[2]) < -120) parts.push(' ');
    }
    if (parts.length) chunks.push(parts.join(''));
  }
  return chunks.join(' ').replace(/\s+/g, ' ').trim();
}

function extractPdfText(buffer) {
  const raw = buffer.toString('latin1');
  const extractedSegments = [];
  let pos = 0;

  while (pos < raw.length) {
    const streamIdx = raw.indexOf('stream', pos);
    if (streamIdx === -1) break;
    let dataStart = streamIdx + 6;
    if (raw[dataStart] === '\r' && raw[dataStart + 1] === '\n') dataStart += 2;
    else if (raw[dataStart] === '\n' || raw[dataStart] === '\r') dataStart += 1;

    const endStreamIdx = raw.indexOf('endstream', dataStart);
    if (endStreamIdx === -1) break;

    const streamBuf = buffer.subarray(dataStart, endStreamIdx);
    let decoded = null;
    try {
      decoded = zlib.inflateSync(streamBuf).toString('latin1');
    } catch {
      try {
        decoded = zlib.inflateRawSync(streamBuf).toString('latin1');
      } catch {
        decoded = streamBuf.toString('latin1');
      }
    }

    if (decoded && (decoded.includes('Tj') || decoded.includes('TJ'))) {
      const segment = extractTextFromPdfStream(decoded);
      if (segment.length > 2) extractedSegments.push(segment);
    }
    pos = endStreamIdx + 9;
  }

  if (extractedSegments.length === 0) {
    const fallback = extractTextFromPdfStream(raw);
    if (fallback.length > 10) extractedSegments.push(fallback);
  }

  const combined = extractedSegments
    .join('\n\n')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u024F\u20B9]/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (combined.length < 25) {
    throw new Error(
      'This PDF appears to be a scanned image or uses custom font encoding. Please copy-paste the contract text directly or upload a searchable PDF / DOCX / TXT file.'
    );
  }
  return combined;
}

export function parseUploadedDocument({ fileName = 'contract.txt', contentBase64, text }) {
  if (typeof text === 'string' && text.trim().length > 0) {
    return { text: text.trim(), fileName, format: 'text' };
  }
  if (!contentBase64) throw new Error('No file content or contract text provided.');

  const cleanBase64 = contentBase64.includes(',') ? contentBase64.split(',').pop() : contentBase64;
  const buffer = Buffer.from(cleanBase64, 'base64');
  const ext = (fileName.split('.').pop() || '').toLowerCase();

  if (ext === 'docx') return { text: extractDocxText(buffer), fileName, format: 'docx' };
  if (ext === 'pdf') return { text: extractPdfText(buffer), fileName, format: 'pdf' };

  let decoded = buffer.toString('utf8');
  if (ext === 'rtf') {
    decoded = decoded
      .replace(/\\par[d]?/g, '\n')
      .replace(/\\[a-z]+\d* ?/gi, '')
      .replace(/[{}]/g, '')
      .trim();
  }
  return { text: decoded.trim(), fileName, format: ext || 'txt' };
}
