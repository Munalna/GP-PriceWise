import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ImportSales({ userId, onSuccess }) {
    const navigate = useNavigate();
    const [rawData, setRawData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [productCol, setProductCol] = useState('');
    const [quantityCol, setQuantityCol] = useState('');
    const [dateCol, setDateCol] = useState('');
    const [filePeriod, setFilePeriod] = useState('monthly');
    const [fileName, setFileName] = useState('');
    const [importing, setImporting] = useState(false);
    const [drafting, setDrafting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [alertMessage, setAlertMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [missingProducts, setMissingProducts] = useState([]);
    const [pendingMappedData, setPendingMappedData] = useState([]);
    const [showMissingModal, setShowMissingModal] = useState(false);

    const buildMappedData = () => rawData.map((row) => ({
        productName: row[productCol],
        quantity: Number(row[quantityCol]) || 0,
        totalPrice: Number(row.Total ?? row.total ?? row.total_price ?? row.TotalPrice) || 0,
        saleDate: dateCol
            ? row[dateCol]
            : row.Date ?? row.date ?? row.sale_date ?? row.SaleDate,
    }));

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);
        setAlertMessage('');
        setSuccessMessage('');
        setImportResult(null);
        setMissingProducts([]);
        setPendingMappedData([]);
        setShowMissingModal(false);

        const reader = new FileReader();

        reader.onload = (event) => {
            const workbook = XLSX.read(event.target.result, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const parsedData = XLSX.utils.sheet_to_json(sheet);

            if (parsedData.length > 0) {
                setRawData(parsedData);
                setColumns(Object.keys(parsedData[0]));
                setProductCol('');
                setQuantityCol('');
                setDateCol('');
            }
        };

        reader.readAsBinaryString(file);
    };

    const submitImport = async (mappedData) => {
        const response = await api.post('/salesData/import', {
            mappedData,
            importPeriod: dateCol ? 'dates' : filePeriod,
        });

        setImportResult(response.data);
        setSuccessMessage('Imported successfully');
        if (onSuccess) onSuccess();
    };

    const handleImport = async () => {
        if (!productCol || !quantityCol) {
            alert('Please select both product column and quantity column first!');
            return;
        }

        if (!userId) {
            alert('Sorry, no User ID found. Please make sure you are logged in.');
            return;
        }

        const mappedData = buildMappedData();

        try {
            setImporting(true);
            setAlertMessage('');
            setSuccessMessage('');
            setImportResult(null);

            const validation = await api.post('/salesData/validate-products', {
                mappedData,
            });

            if (validation.data?.hasMissingProducts) {
                setMissingProducts(validation.data.missingProducts || []);
                setPendingMappedData(mappedData);
                setShowMissingModal(true);
                return;
            }

            await submitImport(mappedData);
        } catch (error) {
            const backendMessage = error.response?.data?.error || error.response?.data || error.message;
            console.error('Import error:', backendMessage, error);
            setSuccessMessage('');
            setAlertMessage(`Import failed: ${backendMessage}`);
        } finally {
            setImporting(false);
        }
    };

    const handleDraftAndImport = async () => {
        try {
            setDrafting(true);
            setAlertMessage('');
            setSuccessMessage('');

            await api.post('/salesData/draft-products', {
                productNames: missingProducts.map((product) => product.name),
            });

            await submitImport(pendingMappedData);
            setAlertMessage(
                'Import successful. Draft products were added to Products. Please complete their components and details.'
            );
            setShowMissingModal(false);
            setMissingProducts([]);
            setPendingMappedData([]);
        } catch (error) {
            const backendMessage = error.response?.data?.error || error.response?.data || error.message;
            console.error('Draft/import error:', backendMessage, error);
            setSuccessMessage('');
            setAlertMessage(`Import failed: ${backendMessage}`);
        } finally {
            setDrafting(false);
        }
    };

    const handleCancelMissingProducts = () => {
        setShowMissingModal(false);
        setSuccessMessage('');
        setAlertMessage('Import cancelled. No draft products were created.');
    };

    const alertType = alertMessage.includes('cancelled')
        ? 'cancelled'
        : alertMessage.includes('failed')
        ? 'failed'
        : alertMessage.includes('Draft') || alertMessage.includes('draft')
        ? 'draft'
        : 'success';

    const alertTitle = alertType === 'failed'
        ? 'Import Failed'
        : alertType === 'draft'
        ? 'Draft Products Added'
        : alertType === 'cancelled'
        ? 'Import Cancelled'
        : 'Import Successful';

    return (
        <div className="sales-import">
            {alertMessage && (
                <div className={`sales-feedback sales-feedback-${alertType}`} role="status">
                    <div className="sales-feedback-content">
                        <strong>{alertTitle}</strong>
                        <span>{alertMessage}</span>
                    </div>
                    {importResult && alertType === 'draft' && (
                        <div className="sales-feedback-actions">
                            <button
                                className="sales-feedback-primary"
                                onClick={() => {
                                    setAlertMessage('');
                                    setImportResult(null);
                                    navigate('/products');
                                }}
                            >
                                Go to Products Page
                            </button>
                            <button
                                className="sales-feedback-secondary"
                                onClick={() => {
                                    setAlertMessage('');
                                    setImportResult(null);
                                    if (onSuccess) onSuccess();
                                }}
                            >
                                Continue Reviewing Data
                            </button>
                        </div>
                    )}
                    <button
                        className="sales-feedback-close"
                        onClick={() => setAlertMessage('')}
                        type="button"
                        aria-label="Dismiss message"
                    >
                        x
                    </button>
                </div>
            )}

            <div className="sales-section-heading">
                <div>
                    <h3>Import POS Sales Data</h3>
                </div>
            </div>

            <div className="sales-import-steps" aria-label="Import steps">
                <div className={`sales-import-step ${fileName ? 'is-complete' : 'is-active'}`}>
                    <span className="sales-step-number">1</span>
                    <span>Choose file</span>
                </div>
                <div className={`sales-import-step ${columns.length > 0 ? 'is-active' : ''}`}>
                    <span className="sales-step-number">2</span>
                    <span>Mapping</span>
                </div>
            </div>

            <label className="sales-file-drop">
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                <span className="sales-file-button">
                    <i className="bi bi-file-earmark-arrow-up" />
                    Choose file
                </span>
                <span className="sales-file-name">{fileName || 'No file chosen'}</span>
            </label>

            {columns.length > 0 && (
                <div className="sales-mapping-panel">
                    <div className="sales-mapping-header">
                        <div>
                            <h4>Column Mapping</h4>
                            <p>Select the columns that match your data.</p>
                        </div>
                        <span className="sales-count-pill">{columns.length} columns</span>
                    </div>

                    <div className="sales-mapping-grid">
                        <label className="sales-field">
                            <span>Product Name Column <span className="sales-required">*</span></span>
                            <select
                                onChange={(e) => setProductCol(e.target.value)}
                                value={productCol}
                                required
                            >
                                <option value="">Select column...</option>
                                {columns.map((col) => <option key={col} value={col}>{col}</option>)}
                            </select>
                        </label>

                        <label className="sales-field">
                            <span>Quantity Sold Column <span className="sales-required">*</span></span>
                            <select
                                onChange={(e) => setQuantityCol(e.target.value)}
                                value={quantityCol}
                                required
                            >
                                <option value="">Select column...</option>
                                {columns.map((col) => <option key={col} value={col}>{col}</option>)}
                            </select>
                        </label>

                        <label className="sales-field">
                            <span>Date Column</span>
                            <select
                                onChange={(e) => setDateCol(e.target.value)}
                                value={dateCol}
                            >
                                <option value="">No date column</option>
                                {columns.map((col) => <option key={col} value={col}>{col}</option>)}
                            </select>
                        </label>

                        {!dateCol && (
                            <label className="sales-field">
                                <span>File Period <span className="sales-required">*</span></span>
                                <select
                                    onChange={(e) => setFilePeriod(e.target.value)}
                                    value={filePeriod}
                                >
                                    <option value="daily">Daily sales</option>
                                    <option value="weekly">Weekly sales</option>
                                    <option value="monthly">Monthly sales</option>
                                </select>
                            </label>
                        )}
                    </div>

                    <button
                        onClick={handleImport}
                        className="sales-primary-btn"
                        disabled={importing || !productCol || !quantityCol}
                    >
                        <i className="bi bi-database-add" />
                        {importing ? 'Checking products...' : 'Import Data'}
                    </button>

                    {successMessage && (
                        <p className="sales-import-success" role="status">{successMessage}</p>
                    )}
                </div>
            )}

            <Modal show={showMissingModal} onHide={handleCancelMissingProducts} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Unregistered Products</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-3">
                        Unregistered products detected in the file. Would you like to add them as drafts to proceed with the import?
                    </p>
                    <div className="sales-missing-products">
                        {missingProducts.map((product) => (
                            <span key={product.name} className="sales-missing-product">
                                {product.name}
                            </span>
                        ))}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCancelMissingProducts} disabled={drafting}>
                        Cancel Import
                    </Button>
                    <Button variant="primary" onClick={handleDraftAndImport} disabled={drafting}>
                        {drafting ? 'Adding Drafts...' : 'Add Drafts & Import'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
