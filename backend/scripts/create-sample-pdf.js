import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure public directory exists
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream(path.join(publicDir, 'test-sample.pdf')));

doc.fontSize(24).text('Sample PDF Document', { align: 'center' });
doc.moveDown();
doc.fontSize(12).text('This is a test PDF for verifying the PDF viewer functionality.');
doc.moveDown();
doc.text('Page 1 of 2');
doc.addPage();
doc.fontSize(18).text('Second Page', { align: 'center' });
doc.moveDown();
doc.fontSize(12).text('This is the second page of the sample PDF.');
doc.end();

console.log('PDF created successfully at public/test-sample.pdf');
