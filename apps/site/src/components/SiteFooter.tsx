import {
  Footer,
  FooterNav,
  Logo,
  Address,
  SocialLinks,
  SocialLink,
} from "@trussworks/react-uswds";

const returnToTop = (
  <div className="grid-container usa-footer__return-to-top">
    <a href="#">Return to top</a>
  </div>
);

const footerNavLinks = [
  [
    "Research",
    <a href="/research/studies" key="studies">
      Studies
    </a>,
    <a href="/research/datasets" key="datasets">
      Datasets
    </a>,
    <a href="/research/tools" key="tools">
      Tools &amp; Applications
    </a>,
  ],
  [
    "About",
    <a href="/about" key="about">
      About BDC
    </a>,
    <a href="/about/team" key="team">
      Team
    </a>,
    <a href="/about/partners" key="partners">
      Partners
    </a>,
  ],
  [
    "Resources",
    <a href="/resources/documentation" key="docs">
      Documentation
    </a>,
    <a href="/resources/faq" key="faq">
      FAQ
    </a>,
    <a href="/resources/tutorials" key="tutorials">
      Tutorials
    </a>,
  ],
  [
    "Community",
    <a href="/community/events" key="events">
      Events
    </a>,
    <a href="/community/news" key="news">
      News
    </a>,
    <a href="/community/publications" key="publications">
      Publications
    </a>,
  ],
];

const socialLinks = [
  <SocialLink key="twitter" name="Twitter" href="https://twitter.com" />,
  <SocialLink key="youtube" name="YouTube" href="https://youtube.com" />,
];

export function SiteFooter() {
  return (
    <Footer
      size="big"
      returnToTop={returnToTop}
      primary={
        <div className="grid-container">
          <div className="grid-row grid-gap">
            <div className="tablet:grid-col-8">
              <FooterNav size="big" links={footerNavLinks} />
            </div>
            <div className="tablet:grid-col-4">
              <div className="usa-sign-up">
                <h3 className="usa-sign-up__heading">
                  Stay informed
                </h3>
                <p>Sign up for the latest BDC updates and news.</p>
              </div>
            </div>
          </div>
        </div>
      }
      secondary={
        <div className="grid-row grid-gap">
          <Logo
            size="big"
            image={
              <img
                className="usa-footer__logo-img"
                alt="BioData Catalyst logo"
                src="/img/logo-img.png"
              />
            }
            heading={
              <p className="usa-footer__logo-heading">
                BioData Catalyst
              </p>
            }
          />
          <div className="usa-footer__contact-links mobile-lg:grid-col-6">
            <SocialLinks links={socialLinks} />
            <p className="usa-footer__contact-heading">BDC Contact Center</p>
            <Address
              size="big"
              items={[
                <a key="email" href="mailto:biodatacatalyst@nhlbi.nih.gov">
                  biodatacatalyst@nhlbi.nih.gov
                </a>,
              ]}
            />
          </div>
        </div>
      }
    />
  );
}
