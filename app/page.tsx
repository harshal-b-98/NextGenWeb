import Link from 'next/link';
import { Button } from '@/components/ui';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Navigation */}
      <nav className="border-b border-[var(--color-border)]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-semibold text-lg">NextGenWeb</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-[var(--color-foreground)] leading-tight mb-6">
            Generate Marketing Websites{' '}
            <span className="text-[var(--color-primary)]">from Your Documents</span>
          </h1>
          <p className="text-xl text-[var(--color-muted-foreground)] mb-8 max-w-2xl mx-auto">
            Upload your documents, and let AI create personalized, conversion-optimized
            marketing websites that adapt to each visitor.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="xl">
                Start Building Free
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="xl">
                See How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-foreground)] mb-4">
            AI-Powered Website Generation
          </h2>
          <p className="text-lg text-[var(--color-muted-foreground)] max-w-2xl mx-auto">
            Transform your business documents into stunning websites in minutes, not weeks.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
            <div className="w-12 h-12 bg-[var(--color-primary-light)] rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-[var(--color-primary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
              Document-to-Website
            </h3>
            <p className="text-[var(--color-muted-foreground)]">
              Upload PDFs, DOCX, or images. Our AI extracts knowledge and generates
              complete marketing pages automatically.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
            <div className="w-12 h-12 bg-[var(--color-accent)]/10 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-[var(--color-accent)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
              Persona Detection
            </h3>
            <p className="text-[var(--color-muted-foreground)]">
              Identify visitor personas in real-time and dynamically adapt content,
              messaging, and CTAs for each audience segment.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
            <div className="w-12 h-12 bg-[var(--color-success)]/10 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-[var(--color-success)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
              Instant Generation
            </h3>
            <p className="text-[var(--color-muted-foreground)]">
              Generate complete pages in under 30 seconds. Export as Next.js projects
              or deploy with one click.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="bg-[var(--color-primary)] rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using AI to create high-converting websites.
          </p>
          <Link href="/signup">
            <Button
              size="xl"
              className="bg-white text-[var(--color-primary)] hover:bg-white/90"
            >
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-[var(--color-primary)] rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">N</span>
              </div>
              <span className="text-sm text-[var(--color-muted-foreground)]">
                NextGenWeb - AI Website Generator
              </span>
            </div>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              &copy; {new Date().getFullYear()} NextGenWeb. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
