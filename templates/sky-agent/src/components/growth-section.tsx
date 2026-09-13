import { Shield, Users } from "lucide-react";

const cards = [
  {
    title: "Advanced Task Security",
    description:
      "Safeguard your tasks with state-of-art encryption and secure access to your workflow data.",
    icon: Shield,
  },
  {
    title: "Scalable for Teams",
    description:
      "Grow with your team. Track tasks across multiple workspaces and all team members.",
    icon: Users,
  },
];

export function GrowthSection() {
  return (
    <section
      id="growth"
      className="flex flex-col items-center justify-center w-full relative px-5 md:px-10"
    >
      <div className="border-x mx-5 md:mx-10 relative w-full max-w-7xl">
        <div className="border-b w-full h-full p-10 md:p-14">
          <div className="max-w-xl mx-auto flex flex-col items-center justify-center gap-2">
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
              Built for Secure Growth
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium">
              Where advanced security meets seamless scalability—designed to
              protect your data and empower your growth.
            </p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-0">
          {cards.map((card) => (
            <div
              key={card.title}
              className="p-10 md:p-14 border-b md:border-r border-border flex flex-col gap-4"
            >
              <card.icon className="size-10 text-secondary" />
              <h3 className="text-xl font-semibold tracking-tight">
                {card.title}
              </h3>
              <p className="text-muted-foreground font-medium">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
