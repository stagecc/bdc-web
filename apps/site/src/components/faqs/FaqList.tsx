import Accordion from '@bdc/ui-react/accordion/Accordion';

interface FaqItem {
  id: string;
  title: string;
  description: string;
}

interface Props {
  items: FaqItem[];
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function FaqList({ items }: Props) {
  const accordionItems = items.map((faq) => ({
    id: faq.id,
    title: faq.title,
    expanded: false,
    headingLevel: 'h2' as const,
    content: <p className="usa-prose margin-0">{stripHtml(faq.description)}</p>,
  }));

  return <Accordion bordered multiselectable items={accordionItems} />;
}
