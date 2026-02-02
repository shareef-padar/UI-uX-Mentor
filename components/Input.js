
import React from 'react';

export function Input({ className = '', ...props }) {
    return (
        <input
            className={`glass-panel ${className}`}
            style={{
                width: '100%',
                padding: '0.75rem 1rem',
                color: 'inherit',
                outline: 'none',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius)'
            }}
            {...props}
        />
    );
}
