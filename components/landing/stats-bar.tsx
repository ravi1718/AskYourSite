"use client";

import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";

const STATS = [
  { value: 2400, suffix: "+", label: "Companies using AskYourSite" },
  { value: 60, prefix: "< ", suffix: " sec", label: "Average deploy time" },
  { value: 99.9, suffix: "%", decimals: 1, label: "Platform uptime" },
  { value: 5, prefix: "< ", suffix: " min", label: "Average handoff time" },
];

export function StatsBar() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <div ref={ref} className="border-y border-[#1C1C1C] bg-black">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {STATS.map((stat, i) => (
          <div key={i} className="flex flex-col items-start gap-1">
            <div className="text-3xl font-display font-bold text-white tabular-nums">
              {stat.prefix && <span className="text-[#888]">{stat.prefix}</span>}
              {inView ? (
                <CountUp
                  start={0}
                  end={stat.value}
                  duration={1.6}
                  delay={i * 0.1}
                  decimals={stat.decimals ?? 0}
                  preserveValue
                />
              ) : (
                <span>0</span>
              )}
              {stat.suffix && <span className="text-[#888]">{stat.suffix}</span>}
            </div>
            <p className="text-xs text-[#555] leading-snug">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
