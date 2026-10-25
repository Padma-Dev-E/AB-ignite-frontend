import { PortalBrand } from "../layout/portal-shell";

type BrandLoadingProps = {
  label?: string;
  detail?: string;
  className?: string;
};

export function BrandLoading({
  label = "AB Ignite is getting ready",
  detail = "Getting your workspace ready…",
  className = "",
}: BrandLoadingProps) {
  return (
    <main
      className={`ignite-loading ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="ignite-loading__glow" aria-hidden="true" />
      <div className="ignite-loading__content">
        <div className="ignite-loading__mark">
          <span className="ignite-loading__orbit" aria-hidden="true" />
          <div className="ignite-loading__brand">
            <PortalBrand className="items-center [&_.brand-wordmark]:text-center" />
          </div>
        </div>
        <h1 className="ignite-loading__title">{label}</h1>
        <p className="ignite-loading__detail">{detail}</p>
        <div className="ignite-loading__track" aria-hidden="true">
          <span />
        </div>
        <span className="sr-only">Please wait</span>
      </div>
    </main>
  );
}
