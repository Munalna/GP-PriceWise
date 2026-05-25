import React, { useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import ImportSales from '../components/sales/ImportSales';
import Analytics from '../components/sales/Analytics';
import { useAuth } from '../context/AuthContext';
import '../components/sales/SalesDashboard.css';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [latestFileUnits, setLatestFileUnits] = useState(() => {
        const savedUnits = window.localStorage.getItem('pricewise:lastFileUnits');
        const parsedUnits = Number(savedUnits);
        return Number.isFinite(parsedUnits) && parsedUnits > 0 ? parsedUnits : null;
    });

    const handleUploadSuccess = (importResult) => {
        const fileUnits = Number(importResult?.totalFileUnits ?? importResult?.importedUnits);
        if (Number.isFinite(fileUnits) && fileUnits >= 0) {
            setLatestFileUnits(fileUnits);
            window.localStorage.setItem('pricewise:lastFileUnits', String(fileUnits));
        }
        setRefreshTrigger(prev => prev + 1);
    };

    if (loading) {
        return (
            <div className="dashboard-state">
                <Spinner animation="border" size="sm" />
                <span>Loading account data...</span>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="dashboard-page">
                <Alert variant="danger" className="dashboard-alert">
                    Sorry, you must login first to access this page.
                </Alert>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div>
                    <h2 className="dashboard-title">Dashboard & Sales</h2>
                    <p className="dashboard-subtitle">
                        Import POS files and review product movement in one place.
                    </p>
                </div>
            </div>

            <section className="dashboard-card dashboard-import-card">
                <ImportSales
                    userId={user.id}
                    onSuccess={handleUploadSuccess}
                />
            </section>

            <section className="dashboard-card">
                <Analytics
                    key={refreshTrigger}
                    userId={user.id}
                    refreshToken={refreshTrigger}
                    importedUnitsOverride={latestFileUnits}
                />
            </section>
        </div>
    );
}
