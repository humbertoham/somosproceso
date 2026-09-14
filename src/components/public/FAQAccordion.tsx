import { Plus } from "lucide-react";

export function FAQAccordion({ items }: { items: ReadonlyArray<{ question: string; answer: string }> }) {
  return <div className="faq-list">{items.map((item) => (
    <details key={item.question}><summary>{item.question}<Plus aria-hidden="true" /></summary><p>{item.answer}</p></details>
  ))}</div>;
}
