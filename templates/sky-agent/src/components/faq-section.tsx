import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqItems } from "@/lib/site-config";

export function FaqSection() {
  return (
    <section
      id="faq"
      className="flex flex-col items-center justify-center gap-10 pb-10 w-full relative"
    >
      <div className="border-b w-full h-full p-10 md:p-14">
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center gap-2">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-center text-balance font-medium">
            Answers to common questions about SkyAgent and its features. If you
            have any other questions, please don&apos;t hesitate to contact us.
          </p>
        </div>
      </div>
      <div className="max-w-3xl w-full mx-auto px-10">
        <Accordion
          type="single"
          collapsible
          className="w-full border-b-0 grid gap-2"
        >
          {faqItems.map((item, index) => (
            <AccordionItem key={item.question} value={`item-${index}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
