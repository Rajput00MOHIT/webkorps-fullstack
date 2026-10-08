import React from 'react';
import { FOOTER_OFFICES } from './footerData';

export const FooterLocations: React.FC = () => {
  return (
    <section className="wk-footer__locations" aria-labelledby="footer-locations-heading">
      <h4 id="footer-locations-heading" className="sr-only">Webkorps Office Locations</h4>
      <div className="wk-footer__locations-grid">
        {FOOTER_OFFICES.map((office) => (
          <div key={office.id} className="wk-footer__location-col">
            <h5 className="wk-footer__location-name">{office.name}</h5>
            <address className="wk-footer__address">
              {office.addressLines.map((line, idx) => (
                <span key={idx} className="wk-footer__address-line">
                  {line}
                  {idx < office.addressLines.length - 1 && <br />}
                </span>
              ))}
            </address>
          </div>
        ))}
      </div>
    </section>
  );
};
