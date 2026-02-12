import React from "react";
import { Modal, Button } from "react-bootstrap";

const ConfirmModal = ({ show, title, message, onCancel, onConfirm, confirmText = "Delete" }) => {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>{confirmText}</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmModal;
