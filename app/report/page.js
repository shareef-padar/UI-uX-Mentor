
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
                <div className="animate-pulse" style={{ fontSize: '3rem' }}>✨</div>
                <h2 className="animate-pulse" style={{ fontSize: '1.5rem', marginTop: '1rem' }}>Generating Intelligence...</h2>
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                    <div className="animate-spin" style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        border: '4px solid hsl(var(--primary) / 0.1)',
                        borderTop: '4px solid hsl(var(--primary))',
                        borderRadius: '50%'
                    }}></div>
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '2rem'
                    }}>🧠</div>
                </div>
                <h2 style={{ marginTop: '2rem', fontSize: '1.5rem', color: 'white' }}>Analyzing {new URL(url).hostname}</h2>
                <p style={{ color: 'hsl(var(--muted-foreground))', marginTop: '0.5rem' }}>Our AI models are auditing your user experience...</p>
            </div>
        );
    }

    if (!data) return <div style={{ textAlign: 'center', padding: '4rem' }}>Error loading report. Please try again.</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', padding: '2rem 0' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <span style={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.2em',
                        fontSize: '0.75rem',
                        color: 'hsl(var(--primary))',
                        fontWeight: 'bold'
                    }}>Audit Result</span>
                    <h1 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>Senior UX Audit</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
                            <span style={{ fontSize: '1rem' }}>🌐</span>
                            <span style={{ fontSize: '0.9rem' }}>{data.url}</span>
                        </div>
                        {data.status && (
                            <span style={{
                                fontSize: '0.65rem',
                                background: data.status.includes('Error') || data.status.includes('Failed') ? 'rgba(248, 113, 113, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                color: data.status.includes('Error') || data.status.includes('Failed') ? '#f87171' : 'hsl(var(--muted-foreground))',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '100px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                Status: {data.status}
                            </span>
                        )}
                    </div>
                </div>
                <Link href="/analyze">
                    <Button variant="secondary" style={{ borderRadius: '100px', padding: '0.75rem 1.5rem' }}>
                        <span>←</span> Analyze Another Site
                    </Button>
                </Link>
            </div>

            {/* Score Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <ScoreCard label="User Experience" score={data.scores.ux} />
                <ScoreCard label="Visual Design" score={data.scores.ui} />
                <ScoreCard label="Accessibility" score={data.scores.accessibility} />
                <ScoreCard label="Hierarchy Grade" value={data.improvements[0]?.split(': ')[1] || 'N/A'} isText />
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

                {/* 100% AI Good/Bad Sections */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <SectionBox title="What's Working Well" color="#4ade80" icon="✅">
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {data.good.map((item, i) => (
                                <li key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '1rem' }}>
                                    <span style={{ color: '#4ade80', flexShrink: 0 }}>✦</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </SectionBox>

                    <SectionBox title="Critical Friction Points" color="#f87171" icon="🚨">
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {data.bad.map((item, i) => (
                                <li key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '1rem' }}>
                                    <span style={{ color: '#f87171', flexShrink: 0 }}>⚠</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </SectionBox>
                </div>

                {/* Conversion Strategy */}
                <Card style={{
                    border: '1px solid hsl(var(--primary) / 0.2)',
                    background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1), transparent)'
                }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span>🚀</span> Conversion Optimization Strategy
                    </h3>
                    <p style={{ fontSize: '1.1rem', color: 'white', lineHeight: '1.7' }}>
                        {data.flowAnalysis}
                    </p>
                </Card>

                {/* Detailed Action Items */}
                <div>
                    <h3 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Professional Recommendations</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {data.actionItems.map((item, i) => (
                            <DetailCard key={i} item={item} />
                        ))}
                    </div>
                </div>

                {/* UX Laws Breakdown */}
                {data.lawsObservation && data.lawsObservation.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Laws of UX Audit</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {data.lawsObservation.map((obs, i) => (
                                <LawCard key={i} obs={obs} />
                            ))}
                        </div>
                    </div>
                )}

                {/* DEBUG SECTION */}
                <div style={{ marginTop: '4rem', opacity: 0.5 }}>
                    <h4 style={{ fontSize: '0.8rem', color: 'hsl(var(--primary))', marginBottom: '1rem', textTransform: 'uppercase' }}>🔧 Debug Intelligence State</h4>
                    <pre style={{
                        background: 'rgba(0,0,0,0.5)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        overflow: 'auto',
                        border: '1px solid rgba(255,255,255,0.05)',
                        color: '#4ade80'
                    }}>
                        {JSON.stringify({
                            status: data.status || 'UNDEFINED',
                            aiEnabled: data.aiEnabled,
                            scores: data.scores,
                            goodCount: data.good?.length,
                            badCount: data.bad?.length,
                            actionItemsCount: data.actionItems?.length,
                            debugError: data.debugError
                        }, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
}

function SectionBox({ title, children, color, icon }) {
    return (
        <Card style={{ borderTop: `4px solid ${color}` }}>
            <h3 style={{ color: color, fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{icon}</span> {title}
            </h3>
            {children}
        </Card>
    );
}

function DetailCard({ item }) {
    const isCritical = item.severity.toLowerCase().includes('critical');
    const isWarning = item.severity.toLowerCase().includes('warning');
    const color = isCritical ? '#f87171' : isWarning ? '#fbbf24' : '#60a5fa';

    return (
        <div style={{
            padding: '2rem',
            borderRadius: 'var(--radius)',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            background: `${color}20`,
                            color: color,
                            border: `1px solid ${color}40`
                        }}>{item.severity}</span>
                        <h4 style={{ fontSize: '1.25rem' }}>{item.element}</h4>
                    </div>
                    <p style={{ fontSize: '1rem', color: 'hsl(var(--muted-foreground))' }}>{item.issue}</p>
                </div>
            </div>

            <div style={{
                padding: '1.25rem',
                background: 'rgba(74, 222, 128, 0.03)',
                borderRadius: '8px',
                borderLeft: '4px solid #4ade80'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#4ade80', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    <span>🛠</span> RECOMMENDED FIX
                </div>
                <p style={{ color: 'white', lineHeight: '1.6' }}>{item.fix}</p>
            </div>
        </div>
    );
}

function LawCard({ obs }) {
    const isViolated = obs.status === 'violated';
    const color = isViolated ? '#f87171' : '#60a5fa';

    return (
        <Card style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                padding: '0.5rem 1rem',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                background: isViolated ? '#f8717120' : '#60a5fa20',
                color: color,
                textTransform: 'uppercase',
                borderBottomLeftRadius: '12px'
            }}>{obs.status}</div>

            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>{obs.law.name}</h4>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{obs.observation}</p>
            <div style={{
                fontSize: '0.8rem',
                color: 'hsl(var(--primary))',
                fontStyle: 'italic',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255,255,255,0.05)'
            }}>
                "{obs.law.summary}"
            </div>
        </Card>
    );
}

function ScoreCard({ label, score, value, isText }) {
    let color = 'white';
    if (!isText) {
        if (score < 50) color = '#f87171';
        else if (score < 80) color = '#fbbf24';
        else color = '#4ade80';
    }

    return (
        <Card style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem' }}>
            <div style={{
                fontSize: isText ? '2.5rem' : '3.5rem',
                fontWeight: '900',
                color: isText ? 'hsl(var(--primary))' : color,
                lineHeight: 1
            }}>
                {isText ? value : score}
            </div>
            <div style={{
                marginTop: '0.75rem',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'hsl(var(--muted-foreground))'
            }}>{label}</div>
        </Card>
    );
}
