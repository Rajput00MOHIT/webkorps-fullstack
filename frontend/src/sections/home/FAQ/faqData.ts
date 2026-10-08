export interface FAQItemData {
  id: string;
  question: string;
  answer: string;
  isApproved: boolean;
}

/**
 * Approved FAQ Questions & Answers from Figma Design (Node 942-1926 / Section 13)
 *
 * Source of truth:
 * - FAQ 1: "When was Webkorps founded?"
 *   Approved Answer: "Webkorps was founded with a vision to deliver excellence in IT services. We have been empowering businesses with innovative solutions for over 10 years."
 *
 * - FAQ 2, 3, 4: Questions are approved in Figma, but answers are pending client confirmation.
 *   Per project requirements, answers are flagged as pending rather than fabricated.
 */
export const FAQ_DATA: FAQItemData[] = [
  {
    id: 'founded',
    question: 'When was Webkorps founded?',
    answer:
      'Webkorps was founded with a vision to deliver excellence in IT services. We have been empowering businesses with innovative solutions for over 10 years.',
    isApproved: true,
  },
  {
    id: 'locations',
    question: "Where are Webkorps' offices located?",
    answer:
      'Approved answer for this question is currently pending client review and confirmation.',
    isApproved: false,
  },
  {
    id: 'mission',
    question: "What is Webkorps' mission?",
    answer:
      'Approved answer for this question is currently pending client review and confirmation.',
    isApproved: false,
  },
  {
    id: 'team-size',
    question: 'How large is the Webkorps team?',
    answer:
      'Approved answer for this question is currently pending client review and confirmation.',
    isApproved: false,
  },
];
