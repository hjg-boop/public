const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { renderToBuffer } = require("./pdfHelpers");

/**
 * Fee receipt in the "invoice" layout: title, SELLER band, CUSTOMER block with
 * receipt number/date/method on the right, a ruled items table, totals box,
 * signature lines and a thank-you footer.
 *
 * - renderReceipt(doc, data) only DRAWS onto a pdfkit-like document, so it can
 *   be tested without producing a file.
 * - buildReceiptPdf(data) creates the A4 document and returns a Buffer.
 * - loadLogo(url) fetches the college logo (Admin > Settings) if there is one.
 *   No logo is drawn until one is uploaded - the slot is simply left empty.
 *
 * Built-in Helvetica cannot draw the rupee sign, so amounts use "Rs.".
 */

const COLOR = {
  blue: "#1F4E96",
  navy: "#1F3864",
  yellow: "#FFFFCC",
  head: "#DCE6F1",
  line: "#BFBFBF",
  text: "#333333",
  muted: "#666666",
};

const PAGE_W = 595.28;
const MX = 40;
const CW = PAGE_W - MX * 2;

const money = (n) =>
  `Rs. ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDateTime = (d) =>
  new Date(d || Date.now()).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: process.env.TZ || undefined,
  });

// Up to three short lines for the SELLER address row.
const addressLines = (address) => {
  const parts = String(address || "")
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= 3) return parts;
  return [parts[0], parts[1], parts.slice(2).join(", ")];
};

const renderReceipt = (doc, d) => {
  const { college, student, receipt, item } = d;

  const fit = (str, width, font, size) => {
    let s = String(str ?? "");
    doc.font(font).fontSize(size);
    if (doc.widthOfString(s) <= width) return s;
    while (s.length > 1 && doc.widthOfString(`${s}...`) > width) s = s.slice(0, -1);
    return `${s}...`;
  };
  const text = (str, x, y, width, { font = "Helvetica", size = 9, color = COLOR.text, align = "left" } = {}) => {
    const s = fit(str, width, font, size);
    doc.font(font).fontSize(size).fillColor(color).text(s, x, y, { width, align, lineBreak: false });
  };
  const hline = (x1, x2, y) => doc.lineWidth(0.5).strokeColor(COLOR.line).moveTo(x1, y).lineTo(x2, y).stroke();
  const vline = (x, y1, y2) => doc.lineWidth(0.5).strokeColor(COLOR.line).moveTo(x, y1).lineTo(x, y2).stroke();

  // ---- Logo slot (left) + title -------------------------------------------
  if (college.logo) {
    try {
      doc.image(college.logo, MX, 28, { fit: [130, 46] });
    } catch {
      /* unsupported image format: leave the slot empty */
    }
  }
  text("Fee Receipt", MX, 58, CW, { font: "Helvetica-Bold", size: 24, color: COLOR.blue, align: "center" });

  // ---- SELLER band ----------------------------------------------------------
  const bandY = 108;
  doc.rect(MX, bandY, CW, 66).fillAndStroke(COLOR.yellow, COLOR.line);
  text("SELLER", MX, bandY + 7, CW, { font: "Helvetica-Bold", size: 8, color: COLOR.navy, align: "center" });
  // Wider first column: college names are the longest thing in this band.
  const bandCols = [CW * 0.42, CW * 0.31, CW * 0.27];
  const bandX = [MX, MX + bandCols[0], MX + bandCols[0] + bandCols[1]];
  const row1 = [college.name, college.email, college.phone];
  const addr = addressLines(college.address);
  row1.forEach((v, i) => text(v || "", bandX[i] + 4, bandY + 26, bandCols[i] - 8, { size: 8.5, align: "center" }));
  addr.forEach((v, i) => text(v, bandX[i] + 4, bandY + 44, bandCols[i] - 8, { size: 8.5, align: "center" }));

  // ---- CUSTOMER block ---------------------------------------------------------
  const custY = 196;
  text("CUSTOMER", MX, custY, 120, { font: "Helvetica-Bold", size: 8, color: COLOR.navy });
  const yearSem = `Year ${student.year ?? "-"} / Sem ${student.semester ?? "-"}${student.section ? `  -  Sec ${student.section}` : ""}`;
  [
    ["Student Name", student.name],
    ["Roll Number", student.rollNumber],
    ["Branch", student.branch],
    ["Year / Semester", yearSem],
  ].forEach(([label, value], i) => {
    const y = custY + 20 + i * 16;
    text(label, MX, y, 90, { size: 8.5 });
    text(value || "-", MX + 95, y, 230, { size: 8.5, color: COLOR.muted });
  });

  const rx = MX + CW - 200;
  [
    ["Receipt Number", receipt.number],
    ["Receipt Date", formatDateTime(receipt.date)],
    ["Payment Method", receipt.mode],
  ].forEach(([label, value], i) => {
    const y = custY + i * 30;
    text(label, rx, y, 200, { font: "Helvetica-Bold", size: 8, color: COLOR.navy, align: "right" });
    text(value || "-", rx, y + 13, 200, { size: 8.5, color: COLOR.muted, align: "right" });
  });

  // ---- Items table ------------------------------------------------------------
  const cols = [215, 60, 80, 80, 80]; // sums to 515 = CW
  const colX = cols.reduce((acc, w, i) => (acc.push(i === 0 ? MX : acc[i - 1] + cols[i - 1]), acc), []);
  const tableY = 306;
  const headH = 22;
  const rowH = 17.5;
  const rows = 14;
  const bodyEnd = tableY + headH + rows * rowH;

  doc.rect(MX, tableY, CW, headH).fillAndStroke(COLOR.head, COLOR.line);
  ["DESCRIPTION", "QUANTITY", "FEE AMOUNT", "AMOUNT PAID", "BALANCE"].forEach((h, i) =>
    text(h, colX[i] + 5, tableY + 7, cols[i] - 10, {
      font: "Helvetica-Bold", size: 8, color: COLOR.navy, align: i === 0 ? "left" : "center",
    })
  );
  doc.rect(MX, tableY + headH, CW, rows * rowH).lineWidth(0.5).strokeColor(COLOR.line).stroke();
  for (let r = 1; r < rows; r++) hline(MX, MX + CW, tableY + headH + r * rowH);
  for (let c = 1; c < cols.length; c++) vline(colX[c], tableY + headH, bodyEnd);

  const hasFigures = item.feeAmount !== null && item.feeAmount !== undefined;
  const ry = tableY + headH + 5;
  text(item.label, colX[0] + 5, ry, cols[0] - 10, { size: 8.5 });
  text("1", colX[1] + 5, ry, cols[1] - 10, { size: 8.5, align: "center" });
  text(hasFigures ? money(item.feeAmount) : "-", colX[2] + 5, ry, cols[2] - 10, { size: 8.5, align: "right" });
  text(money(item.paid), colX[3] + 5, ry, cols[3] - 10, { size: 8.5, align: "right" });
  text(hasFigures ? money(item.balance) : "-", colX[4] + 5, ry, cols[4] - 10, { size: 8.5, align: "right" });

  // ---- Notes (left) + totals box (right) --------------------------------------
  const notes = [
    receipt.academicYear ? `Academic Year: ${receipt.academicYear}` : null,
    receipt.transactionId ? `Transaction Ref: ${receipt.transactionId}` : null,
  ].filter(Boolean);
  notes.forEach((n, i) => text(n, MX, bodyEnd + 10 + i * 12, 280, { font: "Helvetica-Oblique", size: 8, color: COLOR.muted }));

  const totals = hasFigures
    ? [["Fee Amount", item.feeAmount, false], ["Amount Paid", item.paid, true], ["Balance Due", item.balance, false]]
    : [["Amount Paid", item.paid, true]];
  const boxW = 170;
  const boxX = MX + CW - boxW;
  const boxY = bodyEnd + 6;
  const boxRowH = 20;
  doc.rect(boxX, boxY, boxW, totals.length * boxRowH).fillAndStroke(COLOR.yellow, COLOR.line);
  totals.forEach(([label, value, strong], i) => {
    const y = boxY + i * boxRowH + 6;
    if (i > 0) hline(boxX, boxX + boxW, boxY + i * boxRowH);
    text(label, boxX + 8, y, 80, { font: "Helvetica-Bold", size: 8.5, color: COLOR.navy });
    text(money(value), boxX + 88, y, boxW - 96, {
      font: strong ? "Helvetica-Bold" : "Helvetica", size: 8.5, color: strong ? COLOR.navy : COLOR.text, align: "right",
    });
  });

  // ---- Signatures + footer ------------------------------------------------------
  const sigY = 722;
  const sigW = 190;
  text(d.collectedBy || "", MX, sigY - 14, sigW, { size: 9, align: "center" });
  hline(MX, MX + sigW, sigY);
  text("Collected by", MX, sigY + 6, sigW, { font: "Helvetica-Bold", size: 8, color: COLOR.navy, align: "center" });
  hline(MX + CW - sigW, MX + CW, sigY);
  text("Authorized Signature", MX + CW - sigW, sigY + 6, sigW, { font: "Helvetica-Bold", size: 8, color: COLOR.navy, align: "center" });

  text("Thank you for the payment!", MX, 772, CW, { font: "Helvetica-Bold", size: 11, color: COLOR.blue, align: "center" });
};

const buildReceiptPdf = async (data) => {
  const doc = new PDFDocument({ size: "A4", margin: 0 });
  renderReceipt(doc, data);
  return renderToBuffer(doc);
};

// Reads the logo uploaded in Admin > Settings. Returns a Buffer (PNG/JPEG only)
// or null; never throws, so a missing/broken logo can't block a receipt.
const loadLogo = async (logo) => {
  try {
    const url = logo?.url;
    if (!url) return null;
    let buf;
    if (url.includes("/uploads/")) {
      const { UPLOAD_DIR } = require("../services/fileStorage");
      buf = await fs.promises.readFile(path.join(UPLOAD_DIR, path.basename(url.split("/uploads/")[1])));
    } else if (url.startsWith("https://res.cloudinary.com/")) {
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) return null;
      buf = Buffer.from(await res.arrayBuffer());
    } else {
      return null;
    }
    const isPng = buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50;
    const isJpg = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8;
    return isPng || isJpg ? buf : null;
  } catch {
    return null;
  }
};

module.exports = { renderReceipt, buildReceiptPdf, loadLogo, money };
