const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { renderToBuffer } = require("./pdfHelpers");

const COLOR = {
  navy: "#163B70",
  blue: "#2468B4",
  paleBlue: "#EAF2FB",
  softBlue: "#F5F8FC",
  line: "#CCD7E5",
  text: "#26364A",
  muted: "#65758A",
  green: "#278255",
  white: "#FFFFFF",
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
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

const addressLines = (address) => {
  const parts = String(address || "")
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= 2) return parts;
  return [parts[0], parts.slice(1).join(", ")];
};

const renderReceipt = (doc, d) => {
  const { college, student, receipt, item } = d;
  const fit = (value, width, font, size) => {
    let result = String(value ?? "");
    doc.font(font).fontSize(size);
    if (doc.widthOfString(result) <= width) return result;
    while (result.length > 1 && doc.widthOfString(`${result}...`) > width) result = result.slice(0, -1);
    return `${result}...`;
  };
  const text = (value, x, y, width, options = {}) => {
    const { font = "Helvetica", size = 9, color = COLOR.text, align = "left" } = options;
    doc.font(font).fontSize(size).fillColor(color)
      .text(fit(value, width, font, size), x, y, { width, align, lineBreak: false });
  };
  const hline = (x1, x2, y, color = COLOR.line, weight = 0.6) =>
    doc.lineWidth(weight).strokeColor(color).moveTo(x1, y).lineTo(x2, y).stroke();
  const sectionTitle = (label, x, y) =>
    text(label.toUpperCase(), x, y, CW, { font: "Helvetica-Bold", size: 8, color: COLOR.blue });
  const labelValue = (label, value, x, y, width, labelWidth = 84) => {
    text(label, x, y, labelWidth, { font: "Helvetica-Bold", size: 8, color: COLOR.muted });
    text(value || "-", x + labelWidth, y, width - labelWidth, { size: 8.5 });
  };

  doc.rect(0, 0, PAGE_W, 8).fill(COLOR.navy);

  if (college.logo) {
    try {
      doc.image(college.logo, MX, 28, { fit: [58, 58] });
    } catch {
      // An unsupported logo should not prevent a receipt from being generated.
    }
  }

  const identityX = college.logo ? MX + 72 : MX;
  const identityW = 300 - (identityX - MX);
  text(college.name || "College", identityX, 31, identityW, {
    font: "Helvetica-Bold",
    size: 15,
    color: COLOR.navy,
  });
  addressLines(college.address).forEach((line, i) =>
    text(line, identityX, 52 + i * 12, identityW, { size: 8, color: COLOR.muted })
  );
  const contact = [college.phone, college.email].filter(Boolean).join("  |  ");
  if (contact) text(contact, identityX, 77, identityW, { size: 7.5, color: COLOR.muted });

  const receiptX = MX + CW - 174;
  doc.roundedRect(receiptX, 26, 174, 66, 5).fillAndStroke(COLOR.paleBlue, COLOR.line);
  text("FEE RECEIPT", receiptX + 12, 35, 150, {
    font: "Helvetica-Bold",
    size: 12,
    color: COLOR.navy,
  });
  text("RECEIPT NO.", receiptX + 12, 56, 55, { font: "Helvetica-Bold", size: 6.5, color: COLOR.muted });
  text(receipt.number, receiptX + 68, 55, 94, { font: "Helvetica-Bold", size: 7.5, color: COLOR.text });
  text("DATE", receiptX + 12, 70, 55, { font: "Helvetica-Bold", size: 6.5, color: COLOR.muted });
  text(formatDateTime(receipt.date), receiptX + 68, 69, 94, { size: 7.5 });

  hline(MX, MX + CW, 106, COLOR.navy, 1.2);

  sectionTitle("Student details", MX, 124);
  const studentY = 140;
  const studentH = 94;
  doc.roundedRect(MX, studentY, CW, studentH, 4).fillAndStroke(COLOR.white, COLOR.line);
  doc.rect(MX, studentY, CW, 20).fill(COLOR.paleBlue);
  const midX = MX + CW / 2;
  hline(MX, MX + CW, studentY + 20);
  hline(MX, MX + CW, studentY + 57);
  doc.lineWidth(0.6).strokeColor(COLOR.line).moveTo(midX, studentY + 20).lineTo(midX, studentY + studentH).stroke();
  text("STUDENT INFORMATION", MX + 10, studentY + 6, CW / 2 - 16, {
    font: "Helvetica-Bold",
    size: 7,
    color: COLOR.navy,
  });
  text("ACADEMIC INFORMATION", midX + 10, studentY + 6, CW / 2 - 16, {
    font: "Helvetica-Bold",
    size: 7,
    color: COLOR.navy,
  });

  labelValue("Student Name", student.name, MX + 10, studentY + 30, CW / 2 - 20);
  labelValue("Roll Number", student.rollNumber, MX + 10, studentY + 68, CW / 2 - 20);
  labelValue("Branch", student.branch, midX + 10, studentY + 30, CW / 2 - 20);
  const yearSem = `Year ${student.year ?? "-"} / Sem ${student.semester ?? "-"}${student.section ? ` / Sec ${student.section}` : ""}`;
  labelValue("Year / Semester", yearSem, midX + 10, studentY + 68, CW / 2 - 20, 94);

  sectionTitle("Fee breakdown", MX, 258);
  const tableY = 274;
  const headH = 25;
  const rowH = 36;
  const cols = [207, 48, 88, 88, 84];
  const colX = cols.reduce((acc, width, i) => {
    acc.push(i === 0 ? MX : acc[i - 1] + cols[i - 1]);
    return acc;
  }, []);
  const headers = ["DESCRIPTION", "QTY", "FEE AMOUNT", "AMOUNT PAID", "BALANCE"];
  doc.rect(MX, tableY, CW, headH).fillAndStroke(COLOR.paleBlue, COLOR.line);
  headers.forEach((header, i) => {
    text(header, colX[i] + 5, tableY + 9, cols[i] - 10, {
      font: "Helvetica-Bold",
      size: 7,
      color: COLOR.navy,
      align: i === 0 ? "left" : "center",
    });
  });
  doc.rect(MX, tableY + headH, CW, rowH).fillAndStroke(COLOR.white, COLOR.line);
  for (let i = 1; i < cols.length; i++) {
    doc.lineWidth(0.6).strokeColor(COLOR.line).moveTo(colX[i], tableY).lineTo(colX[i], tableY + headH + rowH).stroke();
  }

  const hasFigures = item.feeAmount !== null && item.feeAmount !== undefined;
  const rowTextY = tableY + headH + 12;
  text(item.label, colX[0] + 7, rowTextY, cols[0] - 14, { font: "Helvetica-Bold", size: 8.5 });
  text("1", colX[1] + 5, rowTextY, cols[1] - 10, { size: 8.5, align: "center" });
  text(hasFigures ? money(item.feeAmount) : "-", colX[2] + 4, rowTextY, cols[2] - 8, { size: 7.5, align: "right" });
  text(money(item.paid), colX[3] + 4, rowTextY, cols[3] - 8, { font: "Helvetica-Bold", size: 7.5, align: "right" });
  text(hasFigures ? money(item.balance) : "-", colX[4] + 4, rowTextY, cols[4] - 8, { size: 7.5, align: "right" });

  const infoY = 364;
  const infoH = hasFigures ? 104 : 68;
  const infoW = 282;
  doc.roundedRect(MX, infoY, infoW, infoH, 4).fillAndStroke(COLOR.softBlue, COLOR.line);
  text("TRANSACTION DETAILS", MX + 12, infoY + 11, infoW - 24, {
    font: "Helvetica-Bold",
    size: 7.5,
    color: COLOR.navy,
  });
  hline(MX + 12, MX + infoW - 12, infoY + 25);
  const transactionRows = [
    ["Academic Year", receipt.academicYear],
    ["Transaction Ref.", receipt.transactionId],
    ["Payment Method", receipt.mode],
  ].filter(([, value]) => value);
  transactionRows.forEach(([label, value], i) =>
    labelValue(label, value, MX + 12, infoY + 34 + i * 15, infoW - 24, 87)
  );
  if (hasFigures) {
    const status = Number(item.balance) <= 0 ? "Paid in full" : "Partially paid";
    text(`Payment status: ${status}`, MX + 12, infoY + 82, infoW - 24, {
      font: "Helvetica-Bold",
      size: 8,
      color: Number(item.balance) <= 0 ? COLOR.green : COLOR.blue,
    });
  }

  const totals = hasFigures
    ? [["Fee Amount", item.feeAmount], ["Amount Paid", item.paid], ["Balance Due", item.balance]]
    : [["Amount Paid", item.paid]];
  const totalsW = 204;
  const totalsX = MX + CW - totalsW;
  const totalsY = infoY + 5;
  const totalRowH = 25;
  doc.roundedRect(totalsX, totalsY, totalsW, totals.length * totalRowH, 4).fillAndStroke(COLOR.white, COLOR.line);
  totals.forEach(([label, value], i) => {
    if (i > 0) hline(totalsX, totalsX + totalsW, totalsY + i * totalRowH);
    const isBalance = label === "Balance Due";
    const isPaid = label === "Amount Paid";
    text(label, totalsX + 10, totalsY + i * totalRowH + 8, 82, {
      font: "Helvetica-Bold",
      size: 8,
      color: isBalance ? COLOR.muted : COLOR.navy,
    });
    text(money(value), totalsX + 91, totalsY + i * totalRowH + 7, totalsW - 101, {
      font: isPaid ? "Helvetica-Bold" : "Helvetica",
      size: 8,
      color: isBalance && Number(value) <= 0 ? COLOR.green : COLOR.text,
      align: "right",
    });
  });

  const sigY = 665;
  const sigW = 190;
  text(d.collectedBy || "", MX, sigY - 17, sigW, { size: 8.5, align: "center" });
  hline(MX, MX + sigW, sigY);
  text("Collected by", MX, sigY + 8, sigW, { font: "Helvetica-Bold", size: 7.5, color: COLOR.navy, align: "center" });
  hline(MX + CW - sigW, MX + CW, sigY);
  text("Authorized Signature", MX + CW - sigW, sigY + 8, sigW, {
    font: "Helvetica-Bold",
    size: 7.5,
    color: COLOR.navy,
    align: "center",
  });

  hline(MX, MX + CW, 728);
  text("Thank you for your payment", MX, 744, CW, {
    font: "Helvetica-Bold",
    size: 10,
    color: COLOR.blue,
    align: "center",
  });
};

const buildReceiptPdf = async (data) => {
  const doc = new PDFDocument({ size: "A4", margin: 0 });
  renderReceipt(doc, data);
  return renderToBuffer(doc);
};

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
