import React from "react";
import Modal from "./Modal";

const ConfirmDialog = ({ title = "Are you sure?", message, confirmLabel = "Delete", onConfirm, onCancel, danger = true }) => {
  return (
    <Modal title={title} onClose={onCancel} width="420px">
      <p>{message}</p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
        <button className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className={danger ? "btn btn-danger" : "btn btn-primary"} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
