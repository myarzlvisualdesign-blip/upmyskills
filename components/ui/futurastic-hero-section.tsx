"use client";

import { Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { useEffect } from "react";
import { FiArrowRight } from "react-icons/fi";
import { animate, motion, useMotionTemplate, useMotionValue } from "framer-motion";

const COLORS_TOP = ["#13FFAA", "#1E67C6", "#CE84CF", "#DD335C"];

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
  const color = useMotionValue(COLORS_TOP[0]);

  useEffect(() => {
    const controls = animate(color, COLORS_TOP, {
      ease: "easeInOut",
      duration: 10,
      repeat: Infinity,
      repeatType: "mirror"
    });

    return controls.stop;
  }, [color]);

  const backgroundImage = useMotionTemplate`radial-gradient(125% 125% at 50% 0%, #020617 50%, ${color})`;
  const border = useMotionTemplate`1px solid ${color}`;
  const boxShadow = useMotionTemplate`0px 4px 24px ${color}`;

  return (
    <motion.section
      style={{
        backgroundImage
      }}
      className="relative grid min-h-[calc(100vh-7rem)] place-content-center overflow-hidden rounded-lg bg-gray-950 px-4 py-24 text-gray-200 shadow-premium"
    >
      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center">
        <span className="mb-1.5 inline-block rounded-full bg-gray-600/50 px-3 py-1.5 text-sm font-semibold">
          {eyebrow}
        </span>
        <h1 className="max-w-4xl bg-gradient-to-br from-white to-gray-400 bg-clip-text text-center text-4xl font-medium leading-tight text-transparent sm:text-5xl sm:leading-tight md:text-7xl md:leading-tight">
          {title}
        </h1>
        <p className="my-6 max-w-2xl text-center text-base leading-relaxed text-gray-300 md:text-lg md:leading-relaxed">
          {description}
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <motion.a
            href={ctaHref}
            style={{
              border,
              boxShadow
            }}
            whileHover={{
              scale: 1.015
            }}
            whileTap={{
              scale: 0.985
            }}
            className="group relative flex w-fit items-center gap-1.5 rounded-full bg-gray-950/10 px-4 py-2 font-semibold text-gray-50 transition-colors hover:bg-gray-950/50"
          >
            {ctaLabel}
            <FiArrowRight className="transition-transform group-hover:-rotate-45 group-active:-rotate-12" />
          </motion.a>
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

      <div className="absolute inset-0 z-0">
        <Canvas>
          <Stars radius={50} count={2500} factor={4} fade speed={2} />
        </Canvas>
      </div>
    </motion.section>
  );
};
