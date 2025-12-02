/**
 * Public Routes Layout
 * Phase 4.3: Dynamic Page Runtime
 *
 * Layout for public-facing pages (no auth required).
 */

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-layout">
      {children}
    </div>
  );
}
