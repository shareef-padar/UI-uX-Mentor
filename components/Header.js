
import React from 'react';
import Link from 'next/link';
import { Button } from './Button';

export function Header() {
    return (
        <header className="glass-panel" style={{
            position: 'sticky',
            top: '0.5rem',
            zIndex: 50,
            margin: '0.5rem 1rem',
            maxWidth: 'calc(100% - 2rem)',
            borderRadius: 'var(--radius)'
        }}>
            <div className="container" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 1rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <Link href="/" style={{ textDecoration: 'none', fontWeight: 'bold', fontSize: '1.25rem', color: 'white' }}>
                    UI/UX Mentor
                </Link>
                <nav className="desktop-only" style={{ display: 'flex', gap: '2rem' }}>
                    <Link href="/" style={{ color: 'hsl(var(--muted-foreground))', textDecoration: 'none' }}>Home</Link>
                    <Link href="/analyze" style={{ color: 'hsl(var(--muted-foreground))', textDecoration: 'none' }}>Analyze</Link>
                </nav>
                <div style={{ marginLeft: 'auto' }}>
                    <Link href="/analyze">
                        <Button variant="primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Get Started</Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
