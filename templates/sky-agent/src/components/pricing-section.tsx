"use client";

import { useState } from "react";

import { CheckIcon } from "@/components/icons";
import { pricingPlans } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section
      id="pricing"
      className="flex flex-col items-center justify-center gap-10 pb-10 w-full relative"
    >
      <div className="border-b w-full h-full p-10 md:p-14">
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center gap-2">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
            Pricing that scales with you
          </h2>
          <p className="text-muted-foreground text-center text-balance font-medium">
            Whichever plan you pick, it&apos;s free until you love your docs.
            That&apos;s our promise.
          </p>
        </div>
      </div>
      <div className="relative w-full h-full">
        <div className="absolute -top-14 left-1/2 -translate-x-1/2">
          <div className="relative flex w-fit items-center rounded-full border p-0.5 backdrop-blur-sm cursor-pointer h-9 flex-row bg-muted mx-auto">
            <button
              type="button"
              className="relative px-2 h-8 flex items-center justify-center cursor-pointer z-[1]"
              onClick={() => setYearly(false)}
            >
              {!yearly ? (
                <div className="absolute inset-0 rounded-full bg-white dark:bg-[#3F3F46] shadow-md border border-border" />
              ) : null}
              <span
                className={cn(
                  "relative block text-sm font-medium duration-200 shrink-0",
                  !yearly ? "text-primary" : "text-muted-foreground",
                )}
              >
                Monthly
              </span>
            </button>
            <button
              type="button"
              className="relative z-[1] px-2 h-8 flex items-center justify-center cursor-pointer"
              onClick={() => setYearly(true)}
            >
              {yearly ? (
                <div className="absolute inset-0 rounded-full bg-white dark:bg-[#3F3F46] shadow-md border border-border" />
              ) : null}
              <span
                className={cn(
                  "relative block text-sm font-medium duration-200 shrink-0",
                  yearly ? "text-primary" : "text-muted-foreground",
                )}
              >
                Yearly
                <span className="ml-2 text-xs font-semibold text-secondary bg-secondary/15 py-0.5 w-[calc(100%+1rem)] px-1 rounded-full">
                  -20%
                </span>
              </span>
            </button>
          </div>
        </div>

        <div className="grid min-[650px]:grid-cols-2 min-[900px]:grid-cols-3 gap-4 w-full max-w-6xl mx-auto px-6 pt-8">
          {pricingPlans.map((plan) => {
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
            return (
              <div
                key={plan.id}
                className={cn(
                  "rounded-xl grid grid-rows-[180px_auto_1fr] relative h-fit min-[650px]:h-full min-[900px]:h-fit",
                  plan.cardClass,
                )}
              >
                <div className="flex flex-col gap-4 p-4">
                  <p className="text-sm">
                    {plan.name}
                    {"badge" in plan && plan.badge ? (
                      <span className="bg-gradient-to-b from-secondary/50 from-[1.92%] to-secondary to-[100%] text-white h-6 inline-flex w-fit items-center justify-center px-2 rounded-full text-sm ml-2 shadow-[0px_6px_6px_-3px_rgba(0,0,0,0.08),0px_3px_3px_-1.5px_rgba(0,0,0,0.08),0px_1px_1px_-0.5px_rgba(0,0,0,0.08),0px_0px_0px_1px_rgba(255,255,255,0.12)_inset,0px_1px_0px_0px_rgba(255,255,255,0.12)_inset]">
                        {plan.badge}
                      </span>
                    ) : null}
                  </p>
                  <div className="flex items-baseline mt-2">
                    <span className="text-4xl font-semibold">${price}</span>
                    <span className="ml-2">/month</span>
                  </div>
                  <p className="text-sm mt-2">{plan.description}</p>
                </div>
                <div className="flex flex-col gap-2 p-4">
                  <button
                    type="button"
                    className={cn(
                      "h-10 w-full flex items-center justify-center text-sm font-normal tracking-wide rounded-full px-4 cursor-pointer transition-all ease-out active:scale-95",
                      plan.ctaClass,
                    )}
                  >
                    {plan.cta}
                  </button>
                </div>
                <hr className="border-border dark:border-white/20" />
                <div className="p-4">
                  <p className="text-sm mb-4">{plan.featuresHeader}</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <div
                          className={cn(
                            "size-5 rounded-full border flex items-center justify-center",
                            "highlighted" in plan && plan.highlighted
                              ? "bg-muted-foreground/40 border-border"
                              : "border-primary/20",
                          )}
                        >
                          <div className="size-3 flex items-center justify-center">
                            <CheckIcon />
                            <CheckIcon dark />
                          </div>
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
