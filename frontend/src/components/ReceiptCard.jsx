import React from "react";

const money = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const ReceiptCard = ({ payment, onOpen, showStudent = false }) => {
  const studentName = payment.student?.user?.name;
  const rollNumber = payment.student?.rollNumber;

  return (
    <article className="receipt-card">
      <div className="receipt-card-header">
        <strong className="receipt-card-number">{payment.receiptNumber}</strong>
        <span className="receipt-card-badge">Paid</span>
      </div>
      <div className="receipt-card-person">
        {showStudent && (studentName || rollNumber)
          ? <>{studentName || "Student"}{rollNumber ? ` · ${rollNumber}` : ""}</>
          : payment.feeHeadLabel}
      </div>
      <div className="receipt-card-details">
        <span><span className="receipt-card-label">Fee:</span> {money(payment.amount)}</span>
        <time dateTime={new Date(payment.paymentDate).toISOString()}>
          {new Date(payment.paymentDate).toLocaleDateString()}
        </time>
      </div>
      <button type="button" className="btn btn-secondary btn-sm receipt-card-action" onClick={onOpen}>
        View / Print receipt
      </button>
    </article>
  );
};

export default ReceiptCard;
