import { GovBanner } from '@components/layout/GovBanner';
import { SearchInput } from '@components/layout/SearchInput';
import { navConfig } from '@config/navigation';
import bdcLogo from '@images/bdc-logo.svg';
import {
  Header,
  Menu,
  NavDropDownButton,
  NavMenuButton,
  PrimaryNav,
  Title,
} from '@trussworks/react-uswds';
import { useCallback, useEffect, useRef, useState } from 'react';
import classes from './layout.module.css';

export function SiteHeader() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(
    null,
  );
  const headerRef = useRef<HTMLDivElement>(null);

  const toggleMobileNav = () => setMobileNavOpen((prev) => !prev);

  const closeAll = useCallback(() => {
    setMobileNavOpen(false);
    setOpenDropdownIndex(null);
  }, []);

  const toggleDropdown = (index: number) => {
    setOpenDropdownIndex((prev) => (prev === index ? null : index));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        closeAll();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAll();
      }
    };

    const handleNavigation = () => {
      closeAll();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('astro:after-swap', handleNavigation);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('astro:after-swap', handleNavigation);
    };
  }, [closeAll]);

  const primaryNavItems = navConfig.map((item, index) => {
    if (item.items) {
      const menuId = `nav-menu-${index}`;
      const isOpen = openDropdownIndex === index;

      return (
        <div key={item.label}>
          <NavDropDownButton
            menuId={menuId}
            onToggle={() => toggleDropdown(index)}
            isOpen={isOpen}
            label={item.label}
          />
          <Menu
            id={menuId}
            items={item.items.map((subItem) => (
              <a
                href={subItem.href}
                key={subItem.label}
                className={subItem.external ? 'usa-link--external' : ''}
                {...(subItem.external
                  ? { rel: 'noopener noreferrer', target: '_blank' }
                  : {})}
              >
                {subItem.label}
              </a>
            ))}
            isOpen={isOpen}
          />
        </div>
      );
    }

    return (
      <a href={item.href} key={item.label} className="usa-nav__link">
        <span>{item.label}</span>
      </a>
    );
  });

  return (
    <div ref={headerRef} className={classes.siteHeaderContainer}>
      <GovBanner />
      <Header basic showMobileOverlay={mobileNavOpen}>
        <div className="usa-nav-container height-full">
          <div className="usa-navbar flex-align-center flex-justify padding-1 height-full">
            <Title style={{ display: 'none' }}>BioData Catalyst</Title>
            <a href="/" className="display-flex">
              <img src={bdcLogo.src} height="50" alt="BioData Catalyst home" />
            </a>
            <NavMenuButton onClick={toggleMobileNav} label="Menu" />
          </div>
          <PrimaryNav
            items={primaryNavItems}
            mobileExpanded={mobileNavOpen}
            onToggleMobileNav={toggleMobileNav}
          >
            <SearchInput />
          </PrimaryNav>
        </div>
      </Header>
    </div>
  );
}
