
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';

export default function AnalyzePage() {
    const router = useRouter();
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyze = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Redirect to the report page immediately.
        router.push('/report?url=' + encodeURIComponent(url));
    };

    return (
        <div className="container" style={{
            maxWidth: '800px',
            padding: '4rem 1rem',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            <h1 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', lineHeight: '1.2' }}>Start Analysis</h1>
            <p style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', marginBottom: '3rem', fontSize: 'clamp(0.9rem, 3vw, 1rem)' }}>
                Enter a website URL or upload a screenshot to get instant AI feedback.
            </p>

            <Card>
                <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ fontWeight: '500', marginLeft: '0.25rem' }}>Website URL</label>
                        <Input
                            placeholder="https://example.com"
                            type="url"
                            required
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    </div>

                    <div style={{ textAlign: 'center', position: 'relative' }}>
                        <span style={{ background: 'hsl(var(--card))', padding: '0 1rem', color: 'hsl(var(--muted-foreground))', position: 'relative', zIndex: 1 }}>OR</span>
                        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'hsl(var(--border))' }}></div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ fontWeight: '500', marginLeft: '0.25rem' }}>Upload Screenshot</label>
                        <div style={{
                            border: '2px dashed hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                            padding: '3rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                            onMouseEnter={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                            onMouseLeave={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                        >
                            <p style={{ color: 'hsl(var(--muted-foreground))' }}>Drag & drop or click to upload</p>
                            {/* Hidden input for future implementation */}
                            <input type="file" style={{ display: 'none' }} />
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        type="submit"
                        style={{ marginTop: '1rem', width: '100%' }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Analyzing...' : 'Run Analysis'}
                    </Button>
                </form>
            </Card>

            {isLoading && (
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p className="animate-pulse">AI is examining the interface...</p>
                </div>
            )}
        </div>
    );
}
