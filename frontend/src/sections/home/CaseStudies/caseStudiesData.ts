import type { CaseStudyItem } from './CaseStudyCard';
import cignaAsset from '../../../assets/case-studies/cigna.png';
import paypalAsset from '../../../assets/case-studies/paypal.png';
import canopieAsset from '../../../assets/case-studies/canopie.png';
import pebbleAsset from '../../../assets/case-studies/peble.png';

export const CASE_STUDIES_DATA: CaseStudyItem[] = [
  {
    id: 'cigna',
    client: 'Cigna',
    description:
      'Cigna is a health platform that connects patients with doctors for online consultations, appointments, records, and prescriptions across multiple medical specialties.',
    categories: ['Website', 'Healthcare', 'Health Solutions'],
    image: cignaAsset,
    imageAlt: 'Cigna healthcare platform interface displayed on a laptop screen',
    href: '#case-study-cigna',
  },
  {
    id: 'paypal',
    client: 'PayPal',
    description:
      'PayPal partnered with Webkorps to enhance its payment platform with a smoother checkout experience, improved card payment capabilities, and secure, seamless online.',
    categories: ['Application', 'Payment Platform', 'Custom Application'],
    image: paypalAsset,
    imageAlt: 'PayPal payment platform mobile app interface displaying balance and transfer features',
    href: '#case-study-paypal',
  },
  {
    id: 'canopie',
    client: 'Canopie',
    description:
      'Canopie is a digital mental health app for expecting and new mothers, offering personalized support during pregnancy and postpartum.',
    categories: ['Mental Health App', 'Healthcare', 'Website'],
    image: canopieAsset,
    imageAlt: 'Canopie mental health app interface displayed on a laptop screen',
    href: '#case-study-canopie',
  },
  {
    id: 'pebble',
    client: 'Pebble',
    description:
      'Pebble partnered with Webkorps to create a custom smartwatch app that delivers notifications, fitness tracking, and personalized experiences.',
    categories: ['Application', 'Smartwatch App', 'Fitness Tracking'],
    image: pebbleAsset,
    imageAlt: 'Pebble smartwatch app interface featuring fitness tracking and personalized experiences',
    href: '#case-study-pebble',
  },
];
