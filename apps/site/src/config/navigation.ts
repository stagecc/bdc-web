export interface NavItem {
  label: string;
  href?: string;
  items?: { label: string; href: string; external?: boolean }[];
}

export const navConfig: NavItem[] = [
  {
    label: 'Data',
    items: [
      { label: 'Explore Data', href: '/data/explore' },
      { label: 'Analyze Data', href: '/data/analyze' },
      { label: 'Share Data', href: '/data/share' },
      {
        label: 'Impute Genotypes',
        href: 'https://imputation.biodatacatalyst.nhlbi.nih.gov/#!',
        external: true,
      },
    ],
  },
  {
    label: 'Resources',
    items: [
      { label: 'User FAQs', href: '/resources/faqs' },
      { label: 'Usage Costs', href: '/resources/costs' },
      {
        label: 'Documentation',
        href: 'https://bdcatalyst.gitbook.io/biodata-catalyst-documentation',
        external: true,
      },
      { label: 'Terms of Use', href: '/resources/terms' },
    ],
  },
  {
    label: 'Updates',
    items: [
      { label: 'News', href: '/updates/news' },
      { label: 'Events', href: '/updates/events' },
      { label: 'Publications', href: '/updates/publications' },
      { label: 'News Coverage', href: '/updates/news-coverage' },
    ],
  },
  {
    label: 'About',
    items: [
      { label: 'Overview', href: '/about/overview' },
      { label: 'Research Communities', href: '/about/research-communities' },
      { label: 'Key Collaborations', href: '/about/key-collaborations' },
      { label: 'Studies', href: '/about/studies' },
    ],
  },
  {
    label: 'Support',
    items: [
      { label: 'Contact', href: '/support/contact' },
      { label: 'Guidance', href: '/support/guidance' },
    ],
  },
];
