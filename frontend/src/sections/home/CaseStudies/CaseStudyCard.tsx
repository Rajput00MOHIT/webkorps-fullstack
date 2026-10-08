import React from 'react';
import { getImgSrc } from '../../../utils/image';

export interface CaseStudyItem {
  id: string;
  client: string;
  description: string;
  categories: string[];
  image: string | any;
  imageAlt: string;
  href?: string;
}

interface CaseStudyCardProps {
  caseStudy: CaseStudyItem;
  style?: React.CSSProperties;
}

export const CaseStudyCard: React.FC<CaseStudyCardProps> = ({ caseStudy, style }) => {
  return (
    <article className="wk-case-study-card" id={`case-study-${caseStudy.id}`} style={style}>
      <div className="wk-case-study-card__visual">
        <img
          src={getImgSrc(caseStudy.image)}
          alt={caseStudy.imageAlt}
          className="wk-case-study-card__image"
          loading="eager"
          decoding="async"
        />
      </div>

      <div className="wk-case-study-card__body">
        <h3 className="wk-case-study-card__client">{caseStudy.client}</h3>
        <p className="wk-case-study-card__description">{caseStudy.description}</p>
        <div
          className="wk-case-study-card__taxonomy"
          aria-label={`${caseStudy.client} categories`}
        >
          {caseStudy.categories.map((category, index) => (
            <React.Fragment key={category}>
              {index > 0 && (
                <span className="wk-case-study-card__dot" aria-hidden="true">
                  •
                </span>
              )}
              <span className="wk-case-study-card__category">{category}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </article>
  );
};
