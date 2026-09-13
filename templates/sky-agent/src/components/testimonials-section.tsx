import Image from "next/image";

import { testimonials, type Testimonial } from "@/lib/site-config";
import { cn } from "@/lib/utils";

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <div className="flex w-full cursor-pointer break-inside-avoid flex-col items-center justify-between gap-6 rounded-xl p-4 bg-accent shadow-[0px_0px_0px_1px_rgba(0,0,0,0.04),0px_8px_12px_-4px_rgba(15,12,12,0.08),0px_1px_2px_0px_rgba(15,12,12,0.10)] dark:shadow-[0px_0px_0px_1px_rgba(250,250,250,0.1),0px_0px_0px_1px_#18181B,0px_8px_12px_-4px_rgba(15,12,12,0.3),0px_1px_2px_0px_rgba(15,12,12,0.3)]">
      <div className="select-none leading-relaxed font-normal text-primary/90">
        <p>
          {item.quote}{" "}
          <span className="p-1 py-0.5 font-medium dark:font-semibold text-secondary">
            {item.highlight}
          </span>{" "}
          {item.suffix}
        </p>
      </div>
      <div className="flex w-full select-none items-center justify-start gap-3.5">
        <Image
          src={item.avatar}
          alt={item.name}
          width={32}
          height={32}
          className="size-8 rounded-full"
        />
        <div>
          <p className="font-medium text-primary/90">{item.name}</p>
          <p className="text-xs font-normal text-primary/50">{item.role}</p>
        </div>
      </div>
    </div>
  );
}

function MarqueeColumn({
  items,
  duration,
  reverse,
}: {
  items: Testimonial[];
  duration: string;
  reverse?: boolean;
}) {
  const loop = [...items, ...items];

  return (
    <div
      className="group flex overflow-hidden p-2 [--gap:1rem] [gap:var(--gap)] flex-col hover:[&_*]:[animation-play-state:paused]"
      style={{ "--duration": duration } as React.CSSProperties}
    >
      <div
        className={cn(
          "flex shrink-0 justify-around [gap:var(--gap)] animate-marquee-vertical flex-col",
          reverse && "[animation-direction:reverse]",
        )}
      >
        {loop.map((item, index) => (
          <TestimonialCard key={`${item.id}-${index}`} item={item} />
        ))}
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  const col1 = testimonials.slice(0, 3);
  const col2 = testimonials.slice(3, 6);
  const col3 = testimonials.slice(6, 9);
  const col4 = testimonials.slice(9, 12);
  const col5 = testimonials.slice(12, 13);

  return (
    <section
      id="testimonials"
      className="flex flex-col items-center justify-center w-full"
    >
      <div className="border-b w-full h-full p-10 md:p-14">
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center gap-2">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
            Empower Your Workflow with AI
          </h2>
          <p className="text-muted-foreground text-center text-balance font-medium">
            Ask your AI Agent for real-time collaboration, seamless
            integrations, and actionable insights to streamline your operations.
          </p>
        </div>
      </div>
      <div className="h-full w-full">
        <div className="px-10">
          <div className="relative max-h-[750px] overflow-hidden">
            <div className="gap-0 md:columns-2 xl:columns-3">
              <MarqueeColumn items={col1} duration="40s" />
              <MarqueeColumn items={col2} duration="60s" reverse />
              <MarqueeColumn items={col3} duration="30s" />
              <MarqueeColumn items={col4} duration="70s" reverse />
              <MarqueeColumn items={col5} duration="40s" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/6 md:h-1/5 w-full bg-gradient-to-t from-background from-20%" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/6 md:h-1/5 w-full bg-gradient-to-b from-background from-20%" />
          </div>
        </div>
      </div>
    </section>
  );
}
