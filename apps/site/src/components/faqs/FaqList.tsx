import Accordion from '@bdc/ui-react/accordion/Accordion';
import { sanitizeHtml } from '../../util/sanitizeHtml';

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
    content: (
      <div
        className="usa-prose"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is sanitized with a strict allowlist before render.
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(faq.description) }}
      />
    ),
  }));

  return <Accordion bordered multiselectable items={accordionItems} />;
}
