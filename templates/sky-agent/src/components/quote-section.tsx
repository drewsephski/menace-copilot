import Image from "next/image";

export function QuoteSection() {
  return (
    <section
      id="quote"
      className="flex flex-col items-center justify-center gap-8 w-full p-14 bg-accent z-20"
    >
      <blockquote className="max-w-3xl text-left px-4">
        <p className="text-xl md:text-2xl text-primary leading-relaxed tracking-tighter font-medium mb-6">
          SkyAgent has transformed our daily operations. Tasks that once consumed
          hours now complete in moments, freeing our team to focus on creativity
          and strategic growth.
        </p>
        <footer className="flex items-center gap-3">
          <Image
            src="https://randomuser.me/api/portraits/women/79.jpg"
            alt="Sarah Johnson"
            width={40}
            height={40}
            className="size-10 rounded-full"
          />
          <div>
            <cite className="not-italic font-semibold text-primary">
              Sarah Johnson
            </cite>
            <p className="text-sm text-muted-foreground">
              Operations Lead, Northwind Labs
            </p>
          </div>
        </footer>
      </blockquote>
    </section>
  );
}
