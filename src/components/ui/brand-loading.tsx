export function BrandLoading({ className = "" }: { className?: string }) {
  return (
    <main
      className={`ignite-loading ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="ignite-loading__content">
        <span className="ignite-loading__spinner" aria-hidden="true" />
        <span className="ignite-loading__text">Loading…</span>
      </div>
    </main>
  );
}
