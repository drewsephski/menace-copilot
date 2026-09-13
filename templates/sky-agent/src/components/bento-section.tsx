"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

import { SkyAgentLogo } from "@/components/icons";
import { bentoChatMessages } from "@/lib/site-config";

const orbitIcons = ["G", "N", "S", "T", "V", "Z"];

function BentoChatMock() {
  const [index, setIndex] = useState(0);
  const messages = bentoChatMessages;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [messages.length]);

  const visible = messages.slice(0, index + 1);

  return (
    <div className="max-w-md mx-auto w-full flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {visible.map((message, messageIndex) =>
          message.role === "user" ? (
            <motion.div
              key={`user-${messageIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-end justify-end gap-3"
            >
              <div className="max-w-[280px] bg-secondary text-white p-4 rounded-2xl ml-auto shadow-[0_0_10px_rgba(0,0,0,0.05)]">
                <p className="text-sm">{message.text}</p>
              </div>
              <div className="flex items-center bg-background rounded-full w-fit border border-border flex-shrink-0">
                <Image
                  src={message.avatar}
                  alt="User Avatar"
                  width={32}
                  height={32}
                  className="size-8 rounded-full flex-shrink-0"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`agent-${messageIndex}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-2"
            >
              <div className="flex items-center bg-background rounded-full size-10 flex-shrink-0 justify-center shadow-[0_0_10px_rgba(0,0,0,0.05)] border border-border">
                <SkyAgentLogo className="size-4" />
              </div>
              <div className="bg-background p-4 rounded-2xl border border-border max-w-[280px]">
                <p className="text-sm">{message.text}</p>
              </div>
            </motion.div>
          ),
        )}
      </AnimatePresence>
    </div>
  );
}

function OrbitIntegrations() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 size-16 bg-secondary p-2 rounded-full z-30 md:bottom-0 md:top-auto">
        <SkyAgentLogo className="fill-white size-10" />
      </div>
      <div className="relative flex h-[220px] w-[220px] md:h-[280px] md:w-[280px] items-center justify-center">
        {orbitIcons.map((label, i) => (
          <div
            key={label}
            className="absolute flex size-10 animate-orbit items-center justify-center rounded-full border border-border bg-background text-xs font-semibold shadow-sm"
            style={
              {
                "--angle": (360 / orbitIcons.length) * i,
                "--radius": 110,
                "--duration": 18,
              } as React.CSSProperties
            }
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartCounter() {
  const [value, setValue] = useState(1234);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setValue((v) => v + Math.floor(Math.random() * 9));
    }, 1200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className="relative flex size-full items-center justify-center h-[300px] pt-10 overflow-hidden"
      style={{ "--color": "var(--secondary)" } as React.CSSProperties}
    >
      <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-[2px] h-32 bg-gradient-to-b from-secondary to-transparent opacity-80" />
      <div className="absolute top-32 left-[42%] -translate-x-1/2 text-sm bg-[#1A1B25] border border-white/[0.07] text-white px-4 py-1 rounded-full h-8 flex items-center justify-center font-mono shadow-[0px_1.1px_0px_0px_rgba(255,255,255,0.20)_inset,0px_4.4px_6.6px_0px_rgba(255,255,255,0.01)_inset,0px_2.2px_6.6px_0px_rgba(18,43,105,0.04),0px_1.1px_2.2px_0px_rgba(18,43,105,0.08),0px_0px_0px_1.1px_rgba(18,43,105,0.08)]">
        {value.toLocaleString()}
      </div>
      <svg
        width="600"
        height="200"
        viewBox="0 0 600 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-md opacity-90"
      >
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--secondary)" />
            <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M 0 157 C 20,153 60,138 100,136 C 120,138 160,153 200,147 C 220,138 260,110 300,104 C 320,106 360,119 400,115 C 420,108 460,98 500,83 L 600 40 L 600,200 L 0,200 Z"
          fill="url(#lineGradient)"
          opacity="0.35"
        />
        <path
          d="M 0 157 C 20,153 60,138 100,136 C 120,138 160,153 200,147 C 220,138 260,110 300,104 C 320,106 360,119 400,115 C 420,108 460,98 500,83"
          stroke="var(--secondary)"
          strokeWidth="3"
          fill="none"
        />
      </svg>
    </div>
  );
}

function AutomationUI() {
  return (
    <div className="relative flex h-full w-full flex-col gap-3 p-6 justify-center">
      {["Inbox triage", "Weekly report", "CRM sync"].map((task, i) => (
        <div
          key={task}
          className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 shadow-sm"
        >
          <span className="text-sm font-medium">{task}</span>
          <span
            className={`text-xs rounded-full px-2 py-0.5 ${i === 0 ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground"}`}
          >
            {i === 0 ? "Running" : "Scheduled"}
          </span>
        </div>
      ))}
    </div>
  );
}

const cards = [
  {
    title: "Real-time AI Collaboration",
    description:
      "Experience real-time assistance. Ask your AI Agent to coordinate tasks, answer questions, and maintain team alignment.",
    visual: <BentoChatMock />,
  },
  {
    title: "Seamless Integrations",
    description:
      "Unite your favorite tools for effortless connectivity. Boost productivity through interconnected workflows.",
    visual: <OrbitIntegrations />,
  },
  {
    title: "Instant Insight Reporting",
    description:
      "Transform raw data into clear insights in seconds. Empower smarter decisions with always-learning intelligence.",
    visual: <ChartCounter />,
  },
  {
    title: "Smart Automation",
    description:
      "Set it, forget it. Your AI Agent tackles repetitive tasks so you can focus on strategy, innovation, and growth.",
    visual: <AutomationUI />,
  },
];

export function BentoSection() {
  return (
    <section
      id="bento"
      className="flex flex-col items-center justify-center w-full relative px-5 md:px-10"
    >
      <div className="border-x mx-5 md:mx-10 relative w-full max-w-7xl">
        <div className="absolute top-0 -left-4 md:-left-14 h-full w-4 md:w-14 text-primary/5 bg-[size:10px_10px] [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)]" />
        <div className="absolute top-0 -right-4 md:-right-14 h-full w-4 md:w-14 text-primary/5 bg-[size:10px_10px] [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)]" />
        <div className="border-b w-full h-full p-10 md:p-14">
          <div className="max-w-xl mx-auto flex flex-col items-center justify-center gap-2">
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
              Empower Your Workflow with AI
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium">
              Ask your AI Agent for real-time collaboration, seamless
              integrations, and actionable insights to streamline your
              operations.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 overflow-hidden">
          {cards.map((card) => (
            <div
              key={card.title}
              className="flex flex-col items-start justify-end min-h-[600px] md:min-h-[500px] p-0.5 relative before:absolute before:-left-0.5 before:top-0 before:z-10 before:h-screen before:w-px before:bg-border before:content-[''] after:absolute after:-top-0.5 after:left-0 after:z-10 after:h-px after:w-screen after:bg-border after:content-[''] group cursor-pointer max-h-[400px]"
            >
              <div className="relative flex size-full items-center justify-center h-full overflow-hidden">
                <div className="pointer-events-none absolute bottom-0 left-0 h-20 w-full bg-gradient-to-t from-background to-transparent z-20" />
                <div className="w-full h-full p-4 flex flex-col items-center justify-center gap-5">
                  {card.visual}
                </div>
              </div>
              <div className="flex-1 flex-col gap-2 p-6">
                <h3 className="text-lg tracking-tighter font-semibold">
                  {card.title}
                </h3>
                <p className="text-muted-foreground">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
