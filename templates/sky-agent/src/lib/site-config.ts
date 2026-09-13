export const siteMetadata = {
  title: "SkyAgent",
  description:
    "Your template for building AI-powered agents with Magic UI.",
};

export const navLinks = [
  { href: "#hero", label: "Home", active: true },
  { href: "#bento", label: "How it Works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
] as const;

export const featureSteps = [
  {
    id: "ask",
    title: "Ask Your AI Agent Directly",
    description:
      "Speak or type your command—let SkyAgent capture your intent. Your request instantly sets the process in motion.",
  },
  {
    id: "process",
    title: "Let SkyAgent Process It",
    description:
      "We prioritize the needs and preferences of our users in our design process.",
  },
  {
    id: "results",
    title: "Receive Instant, Actionable Results",
    description:
      "Our features seamlessly integrate with your existing systems for a smooth experience.",
  },
  {
    id: "improve",
    title: "Continuous Improvement",
    description:
      "We are constantly updating and improving our features to provide the best experience.",
  },
] as const;

export type BentoChatMessage =
  | {
      role: "user";
      text: string;
      avatar: string;
    }
  | {
      role: "agent";
      text: string;
    };

export const bentoChatMessages: BentoChatMessage[] = [
  {
    role: "user",
    text: "Hey, I need help scheduling a team meeting that works well for everyone. Any suggestions for finding an optimal time slot?",
    avatar: "https://randomuser.me/api/portraits/women/79.jpg",
  },
  {
    role: "agent",
    text: "I'll analyze everyone's calendars and suggest three optimal meeting windows for tomorrow. Would you like me to send invites once you pick one?",
  },
  {
    role: "user",
    text: "Yes, please prioritize afternoon slots in Eastern Time.",
    avatar: "https://randomuser.me/api/portraits/women/79.jpg",
  },
];

export const pricingPlans = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Perfect for individual users",
    cta: "Start Free",
    ctaClass:
      "bg-accent text-primary shadow-[0px_1px_2px_0px_rgba(255,255,255,0.16)_inset,0px_3px_3px_-1.5px_rgba(16,24,40,0.24),0px_1px_1px_-0.5px_rgba(16,24,40,0.20)]",
    featuresHeader: "Everything in Pro +",
    features: [
      "Custom domain",
      "SEO-optimizations",
      "Auto-generated API docs",
      "Built-in components library",
    ],
    cardClass:
      "bg-[#F3F4F6] dark:bg-[#F9FAFB]/[0.02] border border-border",
  },
  {
    id: "startup",
    name: "Startup",
    badge: "Popular",
    monthlyPrice: 12,
    yearlyPrice: 10,
    description: "Ideal for professionals and small teams",
    cta: "Upgrade to Pro",
    ctaClass:
      "bg-secondary text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)]",
    featuresHeader: "Everything in Pro +",
    features: [
      "Custom domain",
      "SEO-optimizations",
      "Auto-generated API docs",
      "Built-in components library",
      "E-commerce integration",
      "User authentication system",
      "Multi-language support",
      "Real-time collaboration tools",
    ],
    cardClass:
      "md:shadow-[0px_61px_24px_-10px_rgba(0,0,0,0.01),0px_34px_20px_-8px_rgba(0,0,0,0.05),0px_15px_15px_-6px_rgba(0,0,0,0.09),0px_4px_8px_-2px_rgba(0,0,0,0.10),0px_0px_0px_1px_rgba(0,0,0,0.08)] bg-accent",
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 24,
    yearlyPrice: 19,
    description: "Best for large teams and enterprise-level organizations",
    cta: "Contact Sales",
    ctaClass:
      "bg-primary text-primary-foreground shadow-[0px_1px_2px_0px_rgba(255,255,255,0.16)_inset,0px_3px_3px_-1.5px_rgba(16,24,40,0.24),0px_1px_1px_-0.5px_rgba(16,24,40,0.20)]",
    featuresHeader: "Everything in Pro +",
    features: [
      "Custom domain",
      "SEO-optimizations",
      "Auto-generated API docs",
      "Built-in components librarys",
      "Real-time collaboration tools",
    ],
    cardClass:
      "bg-[#F3F4F6] dark:bg-[#F9FAFB]/[0.02] border border-border",
  },
] as const;

export type Testimonial = {
  id: string;
  quote: string;
  highlight: string;
  suffix?: string;
  name: string;
  role: string;
  avatar: string;
};

export const testimonials: Testimonial[] = [
  {
    id: "1",
    quote:
      "The AI-driven analytics from #QuantumInsights have revolutionized our product development cycle.",
    highlight: "Insights are now more accurate and faster than ever.",
    suffix: "A game-changer for tech companies.",
    name: "Alex Rivera",
    role: "CTO at InnovateTech",
    avatar: "https://randomuser.me/api/portraits/men/91.jpg",
  },
  {
    id: "2",
    quote:
      "Implementing #AIStream's customer prediction model has drastically improved our targeting strategy.",
    highlight: "Seeing a 50% increase in conversion rates!",
    suffix: "Highly recommend their solutions.",
    name: "Samantha Lee",
    role: "Marketing Director at NextGen Solutions",
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
  },
  {
    id: "3",
    quote:
      "As a startup, we need to move fast and stay ahead. #CodeAI's automated coding assistant helps us do just that.",
    highlight: "Our development speed has doubled.",
    suffix: "Essential tool for any startup.",
    name: "Raj Patel",
    role: "Founder & CEO at StartUp Grid",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
  },
  {
    id: "4",
    quote:
      "#VoiceGen's AI-driven voice synthesis has made creating global products a breeze.",
    highlight: "Localization is now seamless and efficient.",
    suffix: "A must-have for global product teams.",
    name: "Emily Chen",
    role: "Product Manager at Digital Wave",
    avatar: "https://randomuser.me/api/portraits/women/83.jpg",
  },
  {
    id: "5",
    quote:
      "Leveraging #DataCrunch's AI for our financial models has given us an edge in predictive accuracy.",
    highlight:
      "Our investment strategies are now powered by real-time data analytics.",
    suffix: "Transformative for the finance industry.",
    name: "Michael Brown",
    role: "Data Scientist at FinTech Innovations",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
  },
  {
    id: "6",
    quote:
      "#LogiTech's supply chain optimization tools have drastically reduced our operational costs.",
    highlight: "Efficiency and accuracy in logistics have never been better.",
    name: "Linda Wu",
    role: "VP of Operations at LogiChain Solutions",
    avatar: "https://randomuser.me/api/portraits/women/5.jpg",
  },
  {
    id: "7",
    quote:
      "By integrating #GreenTech's sustainable energy solutions, we've seen a significant reduction in carbon footprint.",
    highlight: "Leading the way in eco-friendly business practices.",
    suffix: "Pioneering change in the industry.",
    name: "Carlos Gomez",
    role: "Head of R&D at EcoInnovate",
    avatar: "https://randomuser.me/api/portraits/men/14.jpg",
  },
  {
    id: "8",
    quote:
      "#TrendSetter's market analysis AI has transformed how we approach fashion trends.",
    highlight:
      "Our campaigns are now data-driven with higher customer engagement.",
    suffix: "Revolutionizing fashion marketing.",
    name: "Aisha Khan",
    role: "Chief Marketing Officer at Fashion Forward",
    avatar: "https://randomuser.me/api/portraits/women/56.jpg",
  },
  {
    id: "9",
    quote:
      "Implementing #MediCareAI in our patient care systems has improved patient outcomes significantly.",
    highlight:
      "Technology and healthcare working hand in hand for better health.",
    suffix: "A milestone in medical technology.",
    name: "Tom Chen",
    role: "Director of IT at HealthTech Solutions",
    avatar: "https://randomuser.me/api/portraits/men/18.jpg",
  },
  {
    id: "10",
    quote:
      "#LearnSmart's AI-driven personalized learning plans have doubled student performance metrics.",
    highlight: "Education tailored to every learner's needs.",
    suffix: "Transforming the educational landscape.",
    name: "Sofia Patel",
    role: "CEO at EduTech Innovations",
    avatar: "https://randomuser.me/api/portraits/women/73.jpg",
  },
  {
    id: "11",
    quote:
      "With #CyberShield's AI-powered security systems, our data protection levels are unmatched.",
    highlight: "Ensuring safety and trust in digital spaces.",
    suffix: "Redefining cybersecurity standards.",
    name: "Jake Morrison",
    role: "CTO at SecureNet Tech",
    avatar: "https://randomuser.me/api/portraits/men/25.jpg",
  },
  {
    id: "12",
    quote:
      "#DesignPro's AI has streamlined our creative process, enhancing productivity and innovation.",
    highlight: "Bringing creativity and technology together.",
    suffix: "A game-changer for creative industries.",
    name: "Nadia Ali",
    role: "Product Manager at Creative Solutions",
    avatar: "https://randomuser.me/api/portraits/women/78.jpg",
  },
  {
    id: "13",
    quote:
      "#VentureAI's insights into startup ecosystems have been invaluable for our growth and funding strategies.",
    highlight: "Empowering startups with data-driven decisions.",
    suffix: "A catalyst for startup success.",
    name: "Omar Farooq",
    role: "Founder at Startup Hub",
    avatar: "https://randomuser.me/api/portraits/men/54.jpg",
  },
];

export const faqItems = [
  {
    question: "What is an AI Agent?",
    answer:
      "An AI agent is software that understands your goals, plans steps, and executes tasks on your behalf—using tools, data, and integrations to deliver results with minimal manual work.",
  },
  {
    question: "How does SkyAgent work?",
    answer:
      "You ask SkyAgent in natural language. It interprets intent, connects to your tools, runs the workflow, and returns actionable output—while keeping context for follow-up requests.",
  },
  {
    question: "How secure is my data?",
    answer:
      "SkyAgent is built with encryption in transit and at rest, scoped access controls, and audit-friendly logging so teams can automate workflows without sacrificing security.",
  },
  {
    question: "Can I integrate my existing tools?",
    answer:
      "Yes. SkyAgent connects with popular productivity, CRM, and developer tools so your agent can orchestrate work across the stack you already use.",
  },
  {
    question: "Is there a free trial available?",
    answer:
      "Every plan starts free until you're happy with your setup. Upgrade when you need advanced automation, team features, or enterprise controls.",
  },
  {
    question: "How does SkyAgent save me time?",
    answer:
      "By handling repetitive coordination—scheduling, summaries, reporting, and handoffs—SkyAgent frees hours each week so you can focus on high-impact work.",
  },
] as const;

export const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Support", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
] as const;
