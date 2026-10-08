import React from 'react';
import talkToExpertImg from '../../../assets/talktoourexpert.png';
import { getImgSrc } from '../../../utils/image';

export const ContactVisual: React.FC = () => {
  return (
    <div className="wk-contact__visual-wrapper">
      <div className="wk-contact__visual-card">
        <img
          src={getImgSrc(talkToExpertImg)}
          alt="Webkorps expert consultation and global support team illustration"
          className="wk-contact__visual-img"
          loading="lazy"
          width="480"
          height="480"
        />
      </div>
    </div>
  );
};
