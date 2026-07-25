const escapePdfText = (value = '') => `${value}`
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)')
  .replace(/\r/g, '')
  .replace(/\n/g, ' ');

const wrapText = (text = '', maxChars = 88) => {
  const words = `${text}`.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });

  if (current) lines.push(current);
  return lines.length ? lines : [''];
};

export const createSimplePdfBlob = ({ title, sections }) => {
  const contentLines = [];
  let y = 800;

  const pushLine = (line, fontSize = 12) => {
    if (y < 60) return;
    contentLines.push(`BT /F1 ${fontSize} Tf 56 ${y} Td (${escapePdfText(line)}) Tj ET`);
    y -= fontSize + 8;
  };

  pushLine(title || 'Lecture Export', 18);
  y -= 4;

  (sections || []).forEach((section) => {
    pushLine(section.heading || '', 14);
    (section.lines || []).forEach((line) => {
      wrapText(line).forEach((wrapped) => pushLine(wrapped, 11));
    });
    y -= 8;
  });

  const stream = contentLines.join('\n');
  const objects = [];

  objects.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj');
  objects.push('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj');
  objects.push('3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj');
  objects.push(`4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`);
  objects.push('5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj');

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
};

export const downloadPdfBlob = ({ blob, filename }) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};
