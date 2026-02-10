import { useState } from "react";
import {
  Header,
  Title,
  PrimaryNav,
  NavMenuButton,
  NavDropDownButton,
  Menu,
} from "@trussworks/react-uswds";

const navLinks = [
  { label: "About", href: "/about" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
];

const researchDropdownItems = [
  <a href="/research/studies" key="studies">
    Studies
  </a>,
  <a href="/research/datasets" key="datasets">
    Datasets
  </a>,
  <a href="/research/tools" key="tools">
    Tools &amp; Applications
  </a>,
];

export function SiteHeader() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState([false]);

  const toggleMobileNav = () => setMobileNavOpen((prev) => !prev);

  const toggleDropdown = (index: number) => {
    setDropdownOpen((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const primaryNavItems = [
    <>
      <NavDropDownButton
        menuId="research-menu"
        onToggle={() => toggleDropdown(0)}
        isOpen={dropdownOpen[0]}
        label="Research"
      />
      <Menu
        key="research"
        items={researchDropdownItems}
        isOpen={dropdownOpen[0]}
        id="research-menu"
      />
    </>,
    ...navLinks.map(({ label, href }) => (
      <a href={href} key={label} className="usa-nav__link">
        <span>{label}</span>
      </a>
    )),
  ];

  return (
    <Header basic showMobileOverlay={mobileNavOpen}>
      <div className="usa-nav-container">
        <div className="usa-navbar">
          <Title>
            <a href="/">BioData Catalyst</a>
          </Title>
          <NavMenuButton onClick={toggleMobileNav} label="Menu" />
        </div>
        <PrimaryNav
          items={primaryNavItems}
          mobileExpanded={mobileNavOpen}
          onToggleMobileNav={toggleMobileNav}
        />
      </div>
    </Header>
  );
}
