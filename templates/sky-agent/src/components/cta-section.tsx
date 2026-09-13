import Image from "next/image";
import Link from "next/link";

export function CtaSection() {
  return (
    <section id="cta" className="flex flex-col items-center justify-center w-full">
      <div className="w-full px-6 max-w-7xl mx-auto">
        <div className="h-[400px] md:h-[400px] overflow-hidden shadow-xl w-full border border-border rounded-xl bg-secondary relative z-20">
          <Image
            alt="Agent CTA Background"
            src="/agent-cta-background.png"
            fill
            className="absolute inset-0 w-full h-full object-cover object-right md:object-center"
            sizes="100vw"
            priority={false}
          />
          <div className="absolute inset-0 -top-32 md:-top-40 flex flex-col items-center justify-center">
            <h2 className="text-white text-4xl md:text-7xl font-medium tracking-tighter max-w-xs md:max-w-xl text-center">
              Automate. Simplify. Thrive
            </h2>
            <div className="absolute bottom-10 flex flex-col items-center justify-center gap-2">
              <Link
                className="bg-white text-black font-semibold text-sm h-10 w-fit px-4 rounded-full flex items-center justify-center shadow-md"
                href="#"
              >
                Start Your 30-Day Free Trial Today
              </Link>
              <span className="text-white text-sm">
                Cancel anytime, no questions asked
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
