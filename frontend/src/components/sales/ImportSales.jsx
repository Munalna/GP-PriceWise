import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function ImportSales({ userId, onSuccess }) {
    const navigate = useNavigate();
    const [rawData, setRawData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [productCol, setProductCol] = useState('');
    const [quantityCol, setQuantityCol] = useState('');
    const [fileName, setFileName] = useState('');
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [alertMessage, setAlertMessage] = useState('');

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);
        setAlertMessage('');
        setImportResult(null);

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
            }
        };

        reader.readAsBinaryString(file);
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

        const mappedData = rawData.map(row => ({
            productName: row[productCol],
            quantity: Number(row[quantityCol]) || 0
        }));

        try {
            setImporting(true);
            setAlertMessage('');
            setImportResult(null);
            const response = await axios.post('/api/salesData/import', {
                mappedData,
                userId
            });

            setImportResult(response.data);

            if (response.data.newProductsAdded) {
                setAlertMessage(
                    'Import successful. Some new products were detected and added to your list. Please go to the Products page to set their costs for accurate profit analysis.'
                );
            } else {
                setAlertMessage('Data imported and processed successfully!');
            }

            if (onSuccess) onSuccess();
        } catch (error) {
            const backendMessage = error.response?.data?.error || error.response?.data || error.message;
            console.error('Import error:', backendMessage, error);
            setAlertMessage(`Import failed: ${backendMessage}`);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="sales-import">
            {alertMessage && (
                <Alert 
                    variant={alertMessage.includes('failed') ? 'danger' : alertMessage.includes('new product') ? 'info' : 'success'}
                    dismissible
                    onClose={() => setAlertMessage('')}
                    className="mb-3"
                >
                    <Alert.Heading>
                        {alertMessage.includes('failed') ? '⚠️ Import Failed' : alertMessage.includes('new product') ? 'ℹ️ New Products Detected' : '✅ Import Successful'}
                    </Alert.Heading>
                    <p className="mb-2">{alertMessage}</p>
                    {importResult?.newProductsAdded && (
                        <div className="mt-3">
                            <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                    setAlertMessage('');
                                    setImportResult(null);
                                    navigate('/products');
                                }}
                            >
                                Go to Products Page
                            </button>
                            <button 
                                className="btn btn-sm btn-secondary ms-2"
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
                </Alert>
            )}

            <div className="sales-section-heading">
                <div className="sales-section-icon">
                    <i className="bi bi-cloud-arrow-up" />
                </div>
                <div>
                    <h3>Import POS Sales Data</h3>
                    <p>Upload an Excel or CSV file, then map the product and quantity columns.</p>
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
                            <p>{rawData.length} rows detected. Select the columns that match your data.</p>
                        </div>
                        <span className="sales-count-pill">{columns.length} columns</span>
                    </div>

                    <div className="sales-mapping-grid">
                        <label className="sales-field">
                            <span>Product Name Column</span>
                            <select onChange={(e) => setProductCol(e.target.value)} value={productCol}>
                                <option value="">Select column...</option>
                                {columns.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>
                        </label>

                        <label className="sales-field">
                            <span>Quantity Sold Column</span>
                            <select onChange={(e) => setQuantityCol(e.target.value)} value={quantityCol}>
                                <option value="">Select column...</option>
                                {columns.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>
                        </label>
                    </div>

                    <button
                        onClick={handleImport}
                        className="sales-primary-btn"
                        disabled={importing || !productCol || !quantityCol}
                    >
                        <i className="bi bi-database-add" />
                        {importing ? 'Importing...' : 'Import Data'}
                    </button>
                </div>
            )}
        </div>
    );
}
