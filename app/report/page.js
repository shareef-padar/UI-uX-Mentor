
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { analyzeUrl } from '@/lib/analyzer';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import Link from 'next/link';

export default function ReportPage() {
    return (
        <Suspense fallback={
            <div style={{ textAlign: 'center', marginTop: '10vh' }}>
                <h2 className="animate-pulse" style={{ fontSize: '2rem' }}>Loading...</h2>
            </div>
        }>
            <ReportContent />
        </Suspense>
    );
}

function ReportContent() {
    const searchParams = useSearchParams();
    const url = searchParams.get('url');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (url) {
            analyzeUrl(url).then(result => {
                setData(result);
                setLoading(false);
            });
        }
    }, [url]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', marginTop: '10vh' }}>
                <h2 className="animate-pulse" style={{ fontSize: '2rem' }}>Analyzing {url}...</h2>
                <p style={{ color: 'hsl(var(--muted-foreground))' }}>Generating UI/UX insights</p>
            </div>
        );
    }

    if (!data) return <div>Error loading report.</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem' }}>Analysis Report</h1>
                    <p style={{ color: 'hsl(var(--muted-foreground))' }}>Source: {data.url}</p>
                </div>
                <Link href="/analyze">
                    <Button variant="secondary">New Analysis</Button>
                </Link>
            </div>

            {/* Scores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <ScoreCard label="UX Score" score={data.scores.ux} />
                <ScoreCard label="UI Score" score={data.scores.ui} />
                <ScoreCard label="Accessibility" score={data.scores.accessibility} />
            </div>

            {/* Actionable Improvements Section */}
            {data.actionItems && data.actionItems.length > 0 && (
                <Card style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1), transparent)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '2rem' }}>🎯</span> Actionable Improvements
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {data.actionItems.map((item, i) => (
                            <div key={i} style={{
                                padding: '1.5rem',
                                background: 'hsl(var(--card))',
                                borderRadius: 'calc(var(--radius) / 2)',
                                borderLeft: `4px solid ${item.severity.toLowerCase().includes('critical') ? '#f87171' : item.severity.toLowerCase().includes('warning') ? '#facc15' : '#60a5fa'}`,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                                    <div>
                                        <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{item.element}</h4>
                                        <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))' }}>{item.issue}</p>
                                    </div>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        background: 'rgba(255,255,255,0.05)',
                                        textTransform: 'uppercase'
                                    }}>{item.severity}</span>
                                </div>
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '1rem',
                                    background: 'rgba(74, 222, 128, 0.05)',
                                    borderRadius: '4px',
                                    border: '1px dashed rgba(74, 222, 128, 0.2)'
                                }}>
                                    <h5 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4ade80', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>🛠️</span> HOW TO FIX:
                                    </h5>
                                    <p style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>{item.fix}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Detailed Analysis */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <Card>
                    <h3 style={{ color: '#4ade80', fontSize: '1.25rem', marginBottom: '1rem' }}>what's Good</h3>
                    <ul style={{ paddingLeft: '1.5rem', color: 'hsl(var(--muted-foreground))' }}>
                        {data.good.map((item, i) => <li key={i} style={{ marginBottom: '0.5rem' }}>{item}</li>)}
                    </ul>
                </Card>

                <Card>
                    <h3 style={{ color: '#f87171', fontSize: '1.25rem', marginBottom: '1rem' }}>Bad Points</h3>
                    <ul style={{ paddingLeft: '1.5rem', color: 'hsl(var(--muted-foreground))' }}>
                        {data.bad.map((item, i) => <li key={i} style={{ marginBottom: '0.5rem' }}>{item}</li>)}
                    </ul>
                </Card>

                <Card style={{ gridColumn: '1 / -1' }}>
                    <h3 style={{ color: '#60a5fa', fontSize: '1.25rem', marginBottom: '1rem' }}>Improvements & Flow</h3>
                    <p style={{ marginBottom: '1rem', color: 'hsl(var(--muted-foreground))' }}>{data.flowAnalysis}</p>
                    <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Recommendations:</h4>
                    <ul style={{ paddingLeft: '1.5rem', color: 'hsl(var(--muted-foreground))' }}>
                        {data.improvements.map((item, i) => <li key={i} style={{ marginBottom: '0.5rem' }}>{item}</li>)}
                    </ul>
                </Card>

                {/* Laws of UX Analysis */}
                {data.lawsObservation && (
                    <Card style={{ gridColumn: '1 / -1' }}>
                        <h3 style={{ color: '#c084fc', fontSize: '1.25rem', marginBottom: '1rem' }}>UX Laws Analysis</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {data.lawsObservation.map((item, i) => (
                                <div key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.law.name}</h4>
                                        <Badge status={item.status} />
                                    </div>
                                    <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
                                        {item.observation}
                                    </p>
                                    <p style={{ fontSize: '0.85rem', color: 'hsl(var(--primary))', fontStyle: 'italic' }}>
                                        "{item.law.summary}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}

function Badge({ status }) {
    let color = '#94a3b8'; // gray
    let bg = 'rgba(148, 163, 184, 0.1)';

    if (status === 'passed') {
        color = '#4ade80'; // green
        bg = 'rgba(74, 222, 128, 0.1)';
    } else if (status === 'violated') {
        color = '#f87171'; // red
        bg = 'rgba(248, 113, 113, 0.1)';
    } else if (status === 'suggestion') {
        color = '#60a5fa'; // blue
        bg = 'rgba(96, 165, 250, 0.1)';
    }

    return (
        <span style={{
            display: 'inline-block',
            padding: '0.25rem 0.5rem',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            color: color,
            backgroundColor: bg,
            textTransform: 'uppercase'
        }}>
            {status}
        </span>
    );
}

function ScoreCard({ label, score }) {
    let color = 'hsl(var(--primary))';
    if (score < 50) color = '#f87171';
    else if (score < 80) color = '#facc15';
    else color = '#4ade80';

    return (
        <Card style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: color }}>
                {score}
            </div>
            <div style={{ color: 'hsl(var(--muted-foreground))', marginTop: '0.5rem' }}>{label}</div>
        </Card>
    );
}
