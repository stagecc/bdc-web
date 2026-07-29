import Accordion from '@bdc/ui-react/accordion/Accordion';

interface FaqItem {
  id: string;
  title: string;
  description: string;
}

interface Props {
  items: FaqItem[];
}

export default function FaqList({ items }: Props) {
  const accordionItems = items.map((faq) => ({
    id: faq.id,
    title: faq.title,
    expanded: false,
    headingLevel: 'h2' as const,
    content: <div className="usa-prose" dangerouslySetInnerHTML={{ __html: faq.description }} />,
  }));

  return <Accordion bordered multiselectable items={accordionItems} />;
}
