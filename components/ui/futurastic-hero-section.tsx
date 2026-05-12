import { ArrowRight } from "lucide-react";

type AuroraHeroMetric = {
  label: string;
  value: string;
};

type AuroraHeroProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  metrics?: AuroraHeroMetric[];
};

export const AuroraHero = ({
  eyebrow = "Beta Now Live!",
  title = "Decrease your SaaS churn by over 90%",
  description = "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Quae, et, distinctio eum impedit nihil ipsum modi.",
  ctaLabel = "Start free trial",
  ctaHref = "/dashboard",
  secondaryLabel,
  secondaryHref,
  metrics = []
}: AuroraHeroProps) => {
  return (
    <section className="relative grid min-h-[calc(100vh-7rem)] place-content-center overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(125%_125%_at_50%_0%,#020617_48%,#13ffaa_140%)] px-4 py-24 text-gray-200 shadow-premium">
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] opacity-25 [background-size:72px_72px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(206,132,207,0.24),transparent_28rem),radial-gradient(circle_at_80%_74%,rgba(221,51,92,0.22),transparent_24rem),radial-gradient(circle_at_50%_26%,rgba(255,255,255,0.12),transparent_22rem)]" />
      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center text-center">
        <span className="mb-2 inline-flex rounded-full bg-gray-600/50 px-3 py-1.5 text-sm font-semibold">
          {eyebrow}
        </span>
        <h1 className="max-w-4xl bg-gradient-to-br from-white to-gray-400 bg-clip-text text-4xl font-semibold leading-tight text-transparent sm:text-5xl sm:leading-tight md:text-7xl md:leading-tight">
          {title}
        </h1>
        <p className="my-6 max-w-2xl text-base leading-relaxed text-gray-300 md:text-lg md:leading-relaxed">
          {description}
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <a
            href={ctaHref}
            className="group relative flex w-fit items-center gap-1.5 rounded-full border border-emerald-300 bg-slate-950/20 px-4 py-2 font-semibold text-gray-50 shadow-[0_4px_24px_rgba(19,255,170,0.44)] transition hover:bg-slate-950/50"
          >
            {ctaLabel}
            <ArrowRight className="size-4 transition-transform group-hover:-rotate-45" />
          </a>
          {secondaryLabel && secondaryHref ? (
            <a
              href={secondaryHref}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/10"
            >
              {secondaryLabel}
            </a>
          ) : null}
        </div>
        {metrics.length ? (
          <div className="mt-10 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-lg border border-white/10 bg-white/[0.06] p-4 text-center backdrop-blur">
                <div className="text-3xl font-black text-white">{metric.value}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{metric.label}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};
