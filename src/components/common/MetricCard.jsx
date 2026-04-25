import React from 'react';
import './Common.css';
import { ArrowUp, ArrowDown } from 'lucide-react';

const MetricCard = ({
    title,
    value,
    trend, // { value: string, isPositive: boolean }
    isPrimary = false, // if true, use purple background
    icon: Icon
}) => {
    return (
        <div className={`metric-card ${isPrimary ? 'primary' : 'secondary'}`}>
            <div className="metric-header">
                <h3 className="metric-title">{title}</h3>
                {Icon && <Icon className="metric-icon" size={20} />}
            </div>

            <div className="metric-value">{value}</div>

            {trend && (
                <div className="metric-trend">
                    <span className="trend-icon">
                        {trend.isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    </span>
                    <span className="trend-value">{trend.value}</span>
                    <span className="trend-label">{trend.label || 'vs last month'}</span>
                </div>
            )}
        </div>
    );
};

export default MetricCard;
