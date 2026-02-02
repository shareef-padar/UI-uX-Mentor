
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem', paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '6rem 1rem',
        background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.2), transparent 70%)'
      }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', background: 'linear-gradient(to right, #fff, #aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Elevate Your User Experience
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'hsl(var(--muted-foreground))', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
          AI-powered design mentorship. Get instant, actionable feedback on your UI/UX with deep analysis of user flows and interface elements.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/analyze">
            <Button variant="primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
              Start Analysis
            </Button>
          </Link>
          <Button variant="secondary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
            Learn More
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container">
        <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2rem' }}>Why use UI/UX Mentor?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <Card>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'hsl(var(--primary))' }}>Design Critique</h3>
            <p>Get honest, constructive feedback on your visual design, spacing, typography, and color harmony.</p>
          </Card>
          <Card>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'hsl(var(--primary))' }}>UX Patterns</h3>
            <p>Analyze user flows and interaction patterns against industry standards and best practices.</p>
          </Card>
          <Card>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'hsl(var(--primary))' }}>Accessibility</h3>
            <p>Ensure your product is usable by everyone with automated contrast and structure checks.</p>
          </Card>
        </div>
      </section>
    </div>
  );
}
