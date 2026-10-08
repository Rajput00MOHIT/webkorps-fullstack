'use client';

import React from 'react';
import wekorpsIcon from '../../assets/wekorps iconsvg.svg';
import { getImgSrc } from '../../utils/image';

export interface ImpactStat {
  value: string;
  label: string;
}

export interface ImpactPanelProps {
  headline?: string;
  description?: string;
  stats?: ImpactStat[];
}

export const ImpactPanel: React.FC<ImpactPanelProps> = ({
  headline = '10+ Years of Digital Excellence',
  description = 'Trusted by 350+ satisfied clients across 30+ countries worldwide.',
  stats = [
    { value: '500+', label: 'Products Delivered' },
    { value: '350+', label: 'Satisfied Clients' },
  ],
}) => {
  return (
    <aside className="wk-insights-page__sidebar" aria-label="Webkorps Impact Highlights">
      <div className="wk-insights-sidebar__emblem" aria-hidden="true">
        <img
          src={getImgSrc(wekorpsIcon)}
          alt=""
          width={22}
          height={22}
          style={{ display: 'block', width: '22px', height: '22px' }}
        />
      </div>

      <h3 className="wk-insights-sidebar__headline">{headline}</h3>
      <p className="wk-insights-sidebar__desc">{description}</p>

      <div className="wk-insights-sidebar__stats">
        {stats.map((stat, idx) => (
          <div key={idx} className="wk-insights-sidebar__stat-item">
            <div className="wk-insights-sidebar__stat-val">{stat.value}</div>
            <div className="wk-insights-sidebar__stat-lbl">{stat.label}</div>
          </div>
        ))}
      </div>
    </aside>
  );
};
