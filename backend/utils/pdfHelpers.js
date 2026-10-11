const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

// Renders a PDFDocument to a Buffer (pdfkit streams by default).
const renderToBuffer = (doc) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });

// A small PNG data-buffer QR code encoding the given text/URL.
const generateQrBuffer = async (text) => {
  const dataUrl = await QRCode.toDataURL(text, { margin: 1, width: 200 });
  return Buffer.from(dataUrl.split(",")[1], "base64");
};

module.exports = { renderToBuffer, generateQrBuffer };
