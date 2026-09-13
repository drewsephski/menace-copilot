"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { useEffect, useState } from "react";

import { featureSteps } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const STEP_DURATION_MS = 6000;

function FeaturePreview({ stepId }: { stepId: string }) {
  const labels: Record<string, string> = {
    ask: "Voice & chat command capture",
    process: "Workflow orchestration",
    results: "Instant actionable output",
    improve: "Feedback & learning loop",
  };

  return (
    <div className="aspect-auto h-full w-full rounded-xl border border-neutral-300/50 bg-gradient-to-br from-muted/40 to-secondary/10 p-8 flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Preview
        </p>
        <p className="text-2xl font-semibold tracking-tight text-primary">
          {labels[stepId]}
        </p>
      </div>
    </div>
  );
}

function ProgressBar({ active }: { active: boolean }) {
  const [width, setWidth] = useState(active ? "0%" : "0%");

  useEffect(() => {
    if (!active) {
      setWidth("0%");
      return;
    }
    setWidth("0%");
    const raf = requestAnimationFrame(() => setWidth("100%"));
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <div
      className={cn(
        "absolute overflow-hidden rounded-lg transition-opacity bg-neutral-300/50 dark:bg-neutral-300/30 left-0 right-0 bottom-0 h-0.5 w-full",
        active ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className="absolute transition-all ease-linear bg-secondary left-0 top-0 h-full"
        style={{
          width,
          transitionDuration: active ? `${STEP_DURATION_MS}ms` : "0s",
        }}
      />
    </div>
  );
}

export function FeaturesSection() {
  const [openStep, setOpenStep] = useState<string>(featureSteps[0].id);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setOpenStep((current) => {
        const index = featureSteps.findIndex((step) => step.id === current);
        const next = featureSteps[(index + 1) % featureSteps.length];
        return next.id;
      });
    }, STEP_DURATION_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      id="features"
      className="flex flex-col items-center justify-center gap-5 w-full relative"
    >
      <div className="border-b w-full h-full p-10 md:p-14">
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center gap-2">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
            Simple. Seamless. Smart.
          </h2>
          <p className="text-muted-foreground text-center text-balance font-medium">
            Discover how SkyAgent transforms your commands into action in four
            easy steps
          </p>
        </div>
      </div>
      <div className="w-full h-full lg:h-[450px] flex items-center justify-center">
        <div className="w-full">
          <div className="flex w-full flex-col items-center justify-center max-w-7xl mx-auto">
            <div className="grid h-full grid-cols-5 gap-x-10 px-10 md:px-20 items-center w-full">
              <div className="col-span-2 w-full h-full hidden lg:flex md:items-center justify-start">
                <Accordion.Root
                  type="single"
                  collapsible
                  value={openStep}
                  onValueChange={(value) => value && setOpenStep(value)}
                  className="w-full h-full flex flex-col gap-8"
                  orientation="vertical"
                >
                  {featureSteps.map((step) => {
                    const isOpen = openStep === step.id;
                    return (
                      <Accordion.Item
                        key={step.id}
                        value={step.id}
                        className="mt-px overflow-hidden focus-within:relative focus-within:z-10 relative data-[state=open]:bg-white dark:data-[state=open]:bg-[#27272A] rounded-lg data-[state=closed]:rounded-none data-[state=closed]:border-0 dark:data-[state=open]:shadow-[0px_0px_0px_1px_rgba(249,250,251,0.06),0px_0px_0px_1px_var(--color-zinc-800,#27272A),0px_1px_2px_-0.5px_rgba(0,0,0,0.24),0px_2px_4px_-1px_rgba(0,0,0,0.24)] data-[state=open]:shadow-[0px_0px_1px_0px_rgba(0,0,0,0.16),0px_1px_2px_-0.5px_rgba(0,0,0,0.16)]"
                      >
                        <ProgressBar active={isOpen} />
                        <Accordion.Header className="flex">
                          <Accordion.Trigger className="group flex h-[45px] flex-1 cursor-pointer items-center justify-between p-3 outline-none font-semibold text-lg tracking-tight text-left">
                            {step.title}
                          </Accordion.Trigger>
                        </Accordion.Header>
                        <Accordion.Content className="overflow-hidden data-[state=closed]:animate-slide-up data-[state=open]:animate-slide-down text-sm font-medium">
                          <p className="px-3 pb-3 text-muted-foreground">
                            {step.description}
                          </p>
                        </Accordion.Content>
                      </Accordion.Item>
                    );
                  })}
                </Accordion.Root>
              </div>

              <div className="col-span-5 h-[350px] min-h-[200px] w-auto lg:col-span-3">
                <FeaturePreview stepId={openStep} />
              </div>

              <ul className="col-span-5 flex snap-x flex-nowrap overflow-x-auto [-ms-overflow-style:none] [-webkit-mask-image:linear-gradient(90deg,transparent,black_10%,white_90%,transparent)] [mask-image:linear-gradient(90deg,transparent,black_10%,white_90%,transparent)] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden snap-mandatory py-12 px-[50%] gap-0">
                {featureSteps.map((step) => (
                  <li
                    key={step.id}
                    className="card relative grid h-full max-w-64 shrink-0 items-start justify-center p-3 bg-background border-l last:border-r border-t border-b first:rounded-tl-xl last:rounded-tr-xl snap-center list-none"
                  >
                    <ProgressBar active={openStep === step.id} />
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => setOpenStep(step.id)}
                    >
                      <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-bold">{step.title}</h2>
                        <p className="mx-0 max-w-sm text-balance text-sm font-medium leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
