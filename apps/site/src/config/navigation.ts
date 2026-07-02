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
      { label: 'Latest Updates', href: '/news/latest-updates' },
      { label: 'News Coverage', href: '/news/news-coverage' },
      { label: 'BDC-Enabled Research', href: '/news/bdc-enabled-research' },
      { label: 'Events', href: '/news/events' },
    ],
  },
  {
    label: 'Help',
    items: [
      {
        label: 'Documentation',
        href: 'https://bdcatalyst.gitbook.io/biodata-catalyst-documentation',
        external: true,
      },
      { label: 'Contact & Support', href: '/help/contact-and-support' },
      { label: 'Usage Costs', href: '/help/costs' },
      { label: 'Terms of Use', href: '/help/terms' },
      { label: 'FAQs', href: '/help/faqs' },
    ],
  },
];
