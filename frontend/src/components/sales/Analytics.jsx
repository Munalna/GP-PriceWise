import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Label } from 'recharts';
import api from '../../services/api';

const wrapProductName = (name, maxLineLength = 12) => {
    const words = String(name || '').split(/\s+/).filter(Boolean);
    const lines = [];

    words.forEach((word) => {
        if (word.length > maxLineLength) {
            const chunks = word.match(new RegExp(`.{1,${maxLineLength}}`, 'g')) || [word];
            chunks.forEach((chunk) => lines.push(chunk));
            return;
        }

        const lastLine = lines[lines.length - 1];
        if (lastLine && `${lastLine} ${word}`.length <= maxLineLength) {
            lines[lines.length - 1] = `${lastLine} ${word}`;
        } else {
            lines.push(word);
        }
    });

    return lines.length > 0 ? lines : [''];
};

function ProductAxisTick({ x, y, payload }) {
    const lines = wrapProductName(payload?.value);

    return (
        <g transform={`translate(${x},${y})`}>
            <text textAnchor="middle" fill="#6b7280" fontSize={11}>
                {lines.map((line, index) => (
                    <tspan key={`${line}-${index}`} x={0} dy={index === 0 ? 12 : 13}>
                        {line}
                    </tspan>
                ))}
            </text>
        </g>
    );
};

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

        api.get('/salesData/analytics')
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
                            <BarChart data={bestSelling} margin={{ top: 16, right: 16, left: 10, bottom: 28 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="name"
                                    tick={<ProductAxisTick />}
                                    interval={0}
                                    minTickGap={8}
                                    height={96}
                                >
                                    <Label value="Product" offset={-4} position="insideBottom" />
                                </XAxis>
                                <YAxis tick={{ fontSize: 12 }}>
                                    <Label value="Unit" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                                </YAxis>
                                <Tooltip labelFormatter={(label) => label} />
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
                        <span className="sales-chart-badge warning">Lowest 5</span>
                    </div>
                    <div className="sales-chart-frame">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={lowSelling} margin={{ top: 16, right: 16, left: 10, bottom: 28 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="name"
                                    tick={<ProductAxisTick />}
                                    interval={0}
                                    minTickGap={8}
                                    height={96}
                                >
                                    <Label value="Product" offset={-4} position="insideBottom" />
                                </XAxis>
                                <YAxis tick={{ fontSize: 12 }}>
                                    <Label value="Unit" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                                </YAxis>
                                <Tooltip labelFormatter={(label) => label} />
                                <Bar dataKey="quantity" fill="#6f7478" name="Quantity Sold" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
