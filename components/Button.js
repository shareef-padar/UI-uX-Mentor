
import React from 'react';



export function Button({ children, variant = 'primary', className = '', ...props }) {
    // Using global classes defined in globals.css
    return (
        <button
            className={`btn btn-${variant} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
