import JSZip from "jszip";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import React from 'react';
import { createRoot } from 'react-dom/client';
import { CertificateRenderer } from '../modules/operations/certificates/components/CertificateRenderer';

// Render a React component into the off-screen container, wait for fonts + paint,
// then snapshot to PDF and return the ArrayBuffer.
async function renderAndSnapshot(template, row, assets, container) {
  const root = createRoot(container);
  const ref = React.createRef();

  root.render(
    <CertificateRenderer template={template} rowData={row} assets={assets} ref={ref} scale={1} />
  );

  // Wait for React to paint AND for any @import Google Fonts to finish loading.
  // 2 s cap prevents hanging if a font URL is unreachable.
  await Promise.race([
    document.fonts.ready,
    new Promise((r) => setTimeout(r, 2000)),
  ]);
  // Extra buffer to ensure the final paint is flushed before html2canvas reads.
  await new Promise((r) => setTimeout(r, 50));

  if (!ref.current) {
    root.unmount();
    throw new Error('Failed to render certificate layout via React.');
  }

  try {
    const canvas = await html2canvas(ref.current, {
      useCORS: true,
      allowTaint: true,
      logging: false,
      scale: 2, // 2x for print quality
    });

    const orientation = canvas.width > canvas.height ? 'l' : 'p';
    const doc = new jsPDF({
      orientation,
      unit: 'px',
      format: [canvas.width, canvas.height],
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    doc.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);

    const arrayBuffer = doc.output('arraybuffer');
    root.unmount();
    return arrayBuffer;
  } catch (err) {
    root.unmount();
    throw err;
  }
}

/**
 * Generates a zip file containing individual PDFs for each row in the CSV data.
 * @param template The AI-mapped saved template.
 * @param csvData Array of row data matching the csv_schema.
 * @param assets Record of base64 image strings mapped to required_assets keys.
 * @param onProgress Callback to update UI with generation progress.
 * @returns A Blob representing the compressed zip archive.
 */
export async function generateCertificates(template, csvData, assets, onProgress) {
  const zip = new JSZip();

  // Create an off-screen container to render the React component into
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);

  try {
    for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        
        // Report progress back to the UI
        if (onProgress) onProgress(i + 1, csvData.length);

        // Generate the PDF directly from the rendered HTML
        const pdfBytes = await renderAndSnapshot(template, row, assets, container);
        
        // Make a safe filename using the first header if available, or just index
        const firstNameVal = template.layout.csv_schema[0]
          ? row[template.layout.csv_schema[0]]
          : `cert_${i}`;
        const safeName = (firstNameVal || `cert_${i}`)
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase();
          
        zip.file(`${safeName}.pdf`, pdfBytes);
    }
  } finally {
      // Always cleanup the hidden container
      document.body.removeChild(container);
  }

  // Generate the ZIP blob
  return await zip.generateAsync({ type: "blob" });
}

/**
 * Same as generateCertificates but also returns individual base64-encoded PDFs
 * so they can be sent to each recipient via the backend.
 * @returns {{ zipBlob: Blob, individuals: Array<{filename: string, pdfBase64: string}> }}
 */
export async function generateCertificatesWithFiles(template, csvData, assets, onProgress) {
  const zip         = new JSZip();
  const individuals = [];

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top  = '-9999px';
  document.body.appendChild(container);

  try {
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      if (onProgress) onProgress(i + 1, csvData.length);

      const pdfBytes = await renderAndSnapshot(template, row, assets, container);

      const firstVal = template.layout.csv_schema[0]
        ? row[template.layout.csv_schema[0]]
        : `cert_${i}`;
      const safeName = (firstVal || `cert_${i}`)
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      const filename = `${safeName}.pdf`;

      zip.file(filename, pdfBytes);

      // Convert ArrayBuffer → base64 without spread (safe for large files)
      const bytes  = new Uint8Array(pdfBytes);
      let   binary = '';
      for (let b = 0; b < bytes.byteLength; b++) binary += String.fromCharCode(bytes[b]);
      individuals.push({ filename, pdfBase64: btoa(binary) });
    }
  } finally {
    document.body.removeChild(container);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return { zipBlob, individuals };
}
