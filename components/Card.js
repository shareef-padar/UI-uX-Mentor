
import React from 'react';

export function Card({ children, className = '', ...props }) {
    return (
        <div
            className={`glass-panel p-6 ${className}`}
            style={{ padding: '1.5rem' }} // Inline padding to ensure it applies if util classes miss
            {...props}
        >
            {children}
        </div>
    );
}
