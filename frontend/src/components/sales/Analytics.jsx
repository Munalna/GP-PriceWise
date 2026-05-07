import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function Analytics({ userId }) {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        axios.get(`/api/salesData/analytics?userId=${userId}`)
            .then(res => {
                const normalizedData = Array.isArray(res.data)
                    ? res.data
                        .map(item => {
                            const rawName = String(item.name ?? item.product_name ?? item.productName ?? '').trim();
                            const name = ['undefined', 'null', 'nan', ''].includes(rawName.toLowerCase())
                                ? 'Unknown Product'
                                : rawName;

                            return {
                                name,
                                quantity: Number(item.quantity) || 0
                            };
                        })
                        .filter(item => item.quantity > 0)
                    : [];

                setChartData(normalizedData);
            })
            .catch(err => {
                console.error('Analytics fetch error:', err.response?.data || err.message);
                setError('Unable to load sales analytics right now.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [userId]);

    const bestSelling = useMemo(() => chartData.slice(0, 5), [chartData]);
    const lowSelling = useMemo(() => [...chartData].slice(-5).reverse(), [chartData]);
    const totalUnits = useMemo(
        () => chartData.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
        [chartData]
    );
    const topProduct = bestSelling[0];
    const lowProduct = lowSelling[0];

    if (loading) {
        return (
            <div className="dashboard-state dashboard-state-compact">
                <span className="dashboard-spinner" />
                <span>Loading sales analytics...</span>
            </div>
        );
    }

    if (error) {
        return <div className="sales-alert">{error}</div>;
    }

    if (chartData.length === 0) {
        return (
            <div className="sales-empty-state">
                <i className="bi bi-bar-chart" />
                <h3>No sales data yet</h3>
                <p>Import a POS file above to populate the analytics dashboard.</p>
            </div>
        );
    }

    return (
        <div className="sales-analytics">
            <div className="sales-section-heading">
                <div className="sales-section-icon">
                    <i className="bi bi-graph-up-arrow" />
                </div>
                <div>
                    <h3>Sales Analytics Dashboard</h3>
                    <p>Track best movers, slower sellers, and total imported volume.</p>
                </div>
            </div>

            <div className="sales-kpi-grid">
                <div className="sales-kpi-card">
                    <span>Total units</span>
                    <strong>{totalUnits.toLocaleString()}</strong>
                </div>
                <div className="sales-kpi-card">
                    <span>Products tracked</span>
                    <strong>{chartData.length}</strong>
                </div>
                <div className="sales-kpi-card">
                    <span>Top seller</span>
                    <strong>{topProduct?.name || '-'}</strong>
                </div>
                <div className="sales-kpi-card">
                    <span>Needs attention</span>
                    <strong>{lowProduct?.name || '-'}</strong>
                </div>
            </div>

            <div className="sales-chart-grid">
                <div className="sales-chart-card">
                    <div className="sales-chart-header">
                        <div>
                            <h4>Top Selling Products</h4>
                            <p>Highest quantities sold</p>
                        </div>
                        <span className="sales-chart-badge success">Top 5</span>
                    </div>
                    <div className="sales-chart-frame">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bestSelling} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} height={54} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="quantity" fill="#7B4B94" name="Quantity Sold" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="sales-chart-card">
                    <div className="sales-chart-header">
                        <div>
                            <h4>Lowest Selling Products</h4>
                            <p>Lowest quantities sold</p>
                        </div>
                        <span className="sales-chart-badge warning">Review</span>
                    </div>
                    <div className="sales-chart-frame">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={lowSelling} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} height={54} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="quantity" fill="#6f7478" name="Quantity Sold" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
