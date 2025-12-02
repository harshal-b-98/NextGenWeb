import Link from 'next/link';
import { Button } from '@/components/ui';
import {
  FileText,
  Users,
  Zap,
  ArrowRight,
  MessageSquare,
  BarChart3,
  Sparkles,
  Target,
  Layers,
  Globe,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-background)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
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
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 via-transparent to-[var(--color-accent)]/5" />
        <div className="absolute top-1/4 -right-64 w-[500px] h-[500px] rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
        <div className="absolute bottom-0 -left-64 w-[500px] h-[500px] rounded-full bg-[var(--color-accent)]/10 blur-3xl" />

        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Website Generation
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[var(--color-foreground)] leading-tight mb-6">
              Transform Documents into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]">
                Conversational Websites
              </span>
            </h1>

            <p className="text-xl text-[var(--color-muted-foreground)] mb-8 max-w-2xl mx-auto leading-relaxed">
              Upload your documents and let AI create personalized, adaptive marketing websites
              that engage visitors through natural conversation.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="xl" className="group">
                  Start Building Free
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/sites/bevgenietest">
                <Button variant="outline" size="xl">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Try Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[var(--color-muted)]/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-foreground)] mb-4">
              Everything You Need for AI Websites
            </h2>
            <p className="text-lg text-[var(--color-muted-foreground)] max-w-2xl mx-auto">
              From document upload to live website in minutes, not weeks.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:shadow-lg transition-shadow group">
              <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                Document to Knowledge
              </h3>
              <p className="text-[var(--color-muted-foreground)]">
                Upload PDFs, DOCX, or images. AI extracts knowledge and builds a semantic
                database for accurate, grounded content.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:shadow-lg transition-shadow group">
              <div className="w-12 h-12 bg-[var(--color-accent)]/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6 text-[var(--color-accent)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                Conversational Interface
              </h3>
              <p className="text-[var(--color-muted-foreground)]">
                Replace static pages with dynamic conversations. CTAs generate new sections
                in real-time from your knowledge base.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:shadow-lg transition-shadow group">
              <div className="w-12 h-12 bg-[var(--color-success)]/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-[var(--color-success)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                Persona Detection
              </h3>
              <p className="text-[var(--color-muted-foreground)]">
                Identify visitor personas in real-time and dynamically adapt content,
                messaging, and CTAs for each audience segment.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:shadow-lg transition-shadow group">
              <div className="w-12 h-12 bg-[var(--color-warning)]/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-[var(--color-warning)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                Instant Generation
              </h3>
              <p className="text-[var(--color-muted-foreground)]">
                Generate complete sections in seconds with streaming responses. Watch
                content appear component-by-component.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:shadow-lg transition-shadow group">
              <div className="w-12 h-12 bg-[var(--color-error)]/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-[var(--color-error)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                Conversion Optimization
              </h3>
              <p className="text-[var(--color-muted-foreground)]">
                Built-in lead capture, intent tracking, and journey analytics to maximize
                conversions at every touchpoint.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:shadow-lg transition-shadow group">
              <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                Multi-Section Types
              </h3>
              <p className="text-[var(--color-muted-foreground)]">
                Features, FAQs, pricing, testimonials, timelines, and more. AI selects the
                optimal format for each response.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-foreground)] mb-4">
              How It Works
            </h2>
            <p className="text-lg text-[var(--color-muted-foreground)] max-w-2xl mx-auto">
              Three simple steps to your AI-powered website.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Connector line */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-[var(--color-border)]" />

              {/* Step 1 */}
              <div className="relative flex items-center gap-8 mb-12">
                <div className="flex-1 text-right hidden md:block">
                  <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                    Upload Documents
                  </h3>
                  <p className="text-[var(--color-muted-foreground)]">
                    Drop your PDFs, docs, or images. Our AI extracts and indexes all knowledge.
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xl font-bold z-10 shrink-0">
                  1
                </div>
                <div className="flex-1 md:hidden">
                  <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                    Upload Documents
                  </h3>
                  <p className="text-[var(--color-muted-foreground)]">
                    Drop your PDFs, docs, or images. Our AI extracts and indexes all knowledge.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex items-center gap-8 mb-12">
                <div className="flex-1 text-right md:text-left hidden md:block" />
                <div className="w-16 h-16 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-xl font-bold z-10 shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                    Customize & Brand
                  </h3>
                  <p className="text-[var(--color-muted-foreground)]">
                    Set your colors, logo, and CTAs. AI generates personalized options.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex items-center gap-8">
                <div className="flex-1 text-right hidden md:block">
                  <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                    Launch & Engage
                  </h3>
                  <p className="text-[var(--color-muted-foreground)]">
                    Deploy your conversational website. Watch it adapt to every visitor.
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full bg-[var(--color-success)] text-white flex items-center justify-center text-xl font-bold z-10 shrink-0">
                  3
                </div>
                <div className="flex-1 md:hidden">
                  <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                    Launch & Engage
                  </h3>
                  <p className="text-[var(--color-muted-foreground)]">
                    Deploy your conversational website. Watch it adapt to every visitor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] rounded-2xl p-12 text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Marketing?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                Join businesses using AI to create high-converting conversational websites.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button
                    size="xl"
                    className="bg-white text-[var(--color-primary)] hover:bg-white/90"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/sites/bevgenietest">
                  <Button
                    size="xl"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10"
                  >
                    See Live Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-lg">NextGenWeb</span>
              </div>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                AI-powered conversational marketing websites that adapt to every visitor.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-[var(--color-foreground)] mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-[var(--color-muted-foreground)]">
                <li><Link href="#features" className="hover:text-[var(--color-foreground)]">Features</Link></li>
                <li><Link href="/sites/bevgenietest" className="hover:text-[var(--color-foreground)]">Demo</Link></li>
                <li><Link href="/signup" className="hover:text-[var(--color-foreground)]">Pricing</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-[var(--color-foreground)] mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-[var(--color-muted-foreground)]">
                <li><Link href="#" className="hover:text-[var(--color-foreground)]">Documentation</Link></li>
                <li><Link href="#" className="hover:text-[var(--color-foreground)]">API Reference</Link></li>
                <li><Link href="#" className="hover:text-[var(--color-foreground)]">Blog</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-[var(--color-foreground)] mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-[var(--color-muted-foreground)]">
                <li><Link href="#" className="hover:text-[var(--color-foreground)]">About</Link></li>
                <li><Link href="#" className="hover:text-[var(--color-foreground)]">Contact</Link></li>
                <li><Link href="#" className="hover:text-[var(--color-foreground)]">Privacy</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[var(--color-border)] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              &copy; {new Date().getFullYear()} NextGenWeb. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Globe className="w-4 h-4 text-[var(--color-muted-foreground)]" />
              <span className="text-sm text-[var(--color-muted-foreground)]">English</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
