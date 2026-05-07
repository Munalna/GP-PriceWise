import React, { useState } from 'react';
import { Alert, Container, Spinner } from 'react-bootstrap';
import ImportSales from '../components/sales/ImportSales';
import Analytics from '../components/sales/Analytics';
import { useAuth } from '../context/AuthContext';
import '../components/sales/SalesDashboard.css';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleUploadSuccess = () => {
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
            <Alert variant="danger">
                Sorry, you must login first to access this page.
            </Alert>
        );
    }

    return (
        <Container fluid className="dashboard-page p-0">
            <div className="dashboard-header">
                <div>
                    <p className="dashboard-eyebrow">Sales workspace</p>
                    <h2 className="page-title mb-1">Dashboard & Sales</h2>
                    <p className="dashboard-subtitle mb-0">
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
                <Analytics key={refreshTrigger} userId={user.id} />
            </section>
        </Container>
    );
}
