type HeroSectionProps = {
  brand?: string;
  eyebrowYear?: string;
  eyebrow?: string;
  titleTop?: string;
  titleBottom?: string;
  descriptionTop?: string;
  descriptionBottom?: string;
  primaryCta?: string;
  primaryHref?: string;
  secondaryCta?: string;
  secondaryHref?: string;
  marqueeItems?: string[];
};

const HeroSection = ({
  brand = "UpMySkills",
  eyebrowYear = "2026",
  eyebrow = "Executable AI Skills Studio",
  titleTop = "AI Skills, Ready to Run.",
  titleBottom = "Built for Real Workflows.",
  descriptionTop = "Convert Claude and AI skill repositories into usable tools with forms, outputs, history, and exports.",
  descriptionBottom = "Search, run, copy, and reuse thousands of workflows without a heavy landing payload.",
  primaryCta = "Open Dashboard",
  primaryHref = "/dashboard",
  secondaryCta = "Browse Tools",
  secondaryHref = "/tools",
  marqueeItems = ["SEO & GEO", "MARKETING", "DESIGN", "AGENTS", "RESEARCH", "ADVISORY"]
}: HeroSectionProps) => {
  return (
    <div className="relative w-full max-w-screen overflow-x-hidden rounded-lg border border-white/10 bg-[linear-gradient(145deg,#000_0%,#10051f_58%,#30105b_100%)] text-white font-sans shadow-[0_22px_70px_rgba(0,0,0,0.34)]">
      <nav className="relative z-10 flex items-center justify-between px-5 py-6 sm:px-10">
        <a href="/" className="flex items-center">
          <span className="text-xl font-semibold">{brand}</span>
        </a>
        <ul className="hidden rounded-full bg-purple-500/10 px-3 py-1 text-sm sm:flex sm:space-x-2">
          {["Home", "Dashboard", "Tools", "Sources", "History"].map((item) => (
            <li key={item}>
              <a
                href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                className="block rounded-full p-2 px-3 font-thin transition hover:bg-purple-700"
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
        <a href={primaryHref} className="rounded-md bg-purple-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-purple-500">
          Get Started
        </a>
      </nav>

      <div className="relative z-10 flex min-h-[620px] flex-col items-center justify-center px-5 py-16 text-center sm:px-10">
        <div className="mb-8 flex items-center rounded-full border border-purple-600/50 bg-purple-900/20 py-1 pl-2 pr-4 text-xs font-light tracking-wider text-purple-300">
          <span className="mr-2 rounded-full bg-purple-600 px-3 py-1 text-xs font-light text-white">{eyebrowYear}</span>
          {eyebrow}
        </div>
        <h1 className="text-5xl font-light leading-tight sm:text-6xl lg:text-7xl">{titleTop}</h1>
        <h2 className="mb-6 text-5xl font-light leading-tight sm:text-6xl lg:text-7xl">{titleBottom}</h2>
        <p className="mb-2 max-w-xl text-sm font-light text-zinc-300">{descriptionTop}</p>
        <p className="mb-8 max-w-xl text-sm font-light text-zinc-300">{descriptionBottom}</p>
        <div className="mb-16 flex flex-col gap-3 sm:flex-row">
          <a href={primaryHref} className="rounded-md bg-white px-5 py-2 text-sm text-black transition hover:bg-purple-200">
            {primaryCta}
          </a>
          <a href={secondaryHref} className="rounded-md bg-white/20 px-5 py-2 text-sm text-white transition hover:bg-purple-600">
            {secondaryCta}
          </a>
        </div>

        <div className="relative z-10 mx-auto mb-8 w-full max-w-2xl">
          <div className="flex flex-wrap justify-center gap-3 text-sm font-medium text-gray-300">
            {marqueeItems.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
