import { useState, useEffect, useRef, memo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set PDF.js worker source - use local worker from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// Extract Google Drive file ID from URL
function extractGoogleDriveFileId(url) {
  if (!url) return null;

  // Format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  const fileMatch = url.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) return fileMatch[1];

  // Format: https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/[?&]id=([^&]+)/);
  if (openMatch) return openMatch[1];

  return null;
}

// Cache for thumbnail data URLs to avoid re-rendering
const thumbnailCache = new Map();

function PdfThumbnail({ fileUrl, googleFileId, thumbnailUrl: providedThumbnailUrl, className = '' }) {
  const canvasRef = useRef(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(providedThumbnailUrl || null);
  const [loading, setLoading] = useState(!providedThumbnailUrl);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const generateThumbnail = async () => {
      // If we already have a provided thumbnail URL, use it
      if (providedThumbnailUrl) {
        setThumbnailUrl(providedThumbnailUrl);
        setLoading(false);
        return;
      }

      // Determine the PDF URL
      let pdfUrl = null;
      let cacheKey = null;

      if (fileUrl) {
        if (fileUrl.includes('drive.google.com')) {
          const extractedFileId = extractGoogleDriveFileId(fileUrl);
          if (extractedFileId) {
            pdfUrl = `/api/works/proxy-pdf/${extractedFileId}`;
            cacheKey = extractedFileId;
          }
        } else {
          pdfUrl = fileUrl;
          cacheKey = fileUrl;
        }
      }

      if (!pdfUrl && googleFileId) {
        pdfUrl = `/api/works/proxy-pdf/${googleFileId}`;
        cacheKey = googleFileId;
      }

      if (!pdfUrl || !cacheKey) {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
        return;
      }

      // Check cache first
      if (thumbnailCache.has(cacheKey)) {
        if (isMounted) {
          setThumbnailUrl(thumbnailCache.get(cacheKey));
          setLoading(false);
        }
        return;
      }

      try {
        // Load only the first page of the PDF
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          // Disable features we don't need for thumbnails
          disableFontFace: true,
          disableRange: true,
          disableStream: true,
        });

        const pdfDoc = await loadingTask.promise;
        const page = await pdfDoc.getPage(1);

        // Create an off-screen canvas for rendering
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        // Calculate scale to fit a reasonable thumbnail size (max 400px width)
        const originalViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(400 / originalViewport.width, 300 / originalViewport.height);
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render the page
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

        // Cache the result
        thumbnailCache.set(cacheKey, dataUrl);

        if (isMounted) {
          setThumbnailUrl(dataUrl);
          setLoading(false);
        }

        // Clean up PDF document
        pdfDoc.destroy();
      } catch (err) {
        console.error('Error generating PDF thumbnail:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    generateThumbnail();

    return () => {
      isMounted = false;
    };
  }, [fileUrl, googleFileId, providedThumbnailUrl]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 ${className}`}>
        <div className="animate-pulse flex flex-col items-center gap-2">
          <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs text-blue-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !thumbnailUrl) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 ${className}`}>
        <div className="flex flex-col items-center gap-2">
          <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs text-slate-500 font-medium">PDF Document</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-muted ${className}`}>
      <img
        src={thumbnailUrl}
        alt="PDF cover"
        className="w-full h-full object-cover object-top"
        loading="lazy"
      />
    </div>
  );
}

export default memo(PdfThumbnail);
