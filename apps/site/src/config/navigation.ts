export interface NavItem {
  label: string;
  href?: string;
  items?: { label: string; href: string; external?: boolean }[];
}

export const navConfig: NavItem[] = [
  {
    label: 'About',
    items: [
      { label: 'BDC', href: '/about/bdc' },
      { label: 'Key Collaborations', href: '/about/key-collaborations' },
      { label: 'Research Communities', href: '/about/research-communities' },
      { label: 'Studies', href: '/about/studies' },
    ],
  },
  {
    label: 'Data',
    items: [
      { label: 'Explore', href: '/data/explore' },
      { label: 'Share', href: '/data/share' },
      {
        label: 'Impute',
        href: 'https://imputation.biodatacatalyst.nhlbi.nih.gov/#!',
        external: true,
      },
      { label: 'Analyze', href: '/data/analyze' },
    ],
  },
  {
    label: 'News',
    items: [
      { label: 'Latest Updates', href: '/updates/latest-updates' },
      { label: 'News Coverage', href: '/updates/news-coverage' },
      { label: 'BDC-Enabled Research', href: '/updates/bdc-enabled-research' },
      { label: 'Events', href: '/updates/events' },
    ],
  },
  {
    label: 'Resources',
    items: [
      {
        label: 'Documentation',
        href: 'https://bdcatalyst.gitbook.io/biodata-catalyst-documentation',
        external: true,
      },
      { label: 'Contact & Support', href: '/support/contact-and-support' },
      { label: 'Usage Costs', href: '/resources/costs' },
      { label: 'Terms of Use', href: '/resources/terms' },
      { label: 'FAQs', href: '/resources/faqs' },
    ],
  },
];
