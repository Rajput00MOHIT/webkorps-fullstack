import type { AiResponseResult } from './types';

/**
 * Generic fallback response engine with no hardcoded personal or production-specific assumptions.
 */
export function mockAiResponse(userMessage: string): AiResponseResult {
  const normalized = userMessage.toLowerCase().trim();

  if (!normalized) {
    return {
      text: 'I can help with product and engineering questions, service fit, pricing guidance, and the best next step. Tell me a bit about your goal and I’ll point you in the right direction.',
      actions: [
        { label: 'Explore Services', href: '#services', variant: 'primary' },
        { label: 'Contact Us', href: '#contact', variant: 'secondary' }
      ]
    };
  }

  if (/(pricing|cost|budget|quote|price|how much|estimate)/.test(normalized)) {
    return {
      text: 'Project cost depends on scope, timeline, platform needs, and delivery model. The best next step is a short discovery call so the right engagement model can be recommended.',
      actions: [
        { label: 'Request a Quote', href: '#contact', variant: 'primary' },
        { label: 'Book a Call', href: '#contact', variant: 'secondary' }
      ]
    };
  }

  if (/(service|services|software|mobile|web|cloud|ai|ml|devops)/.test(normalized)) {
    return {
      text: 'We help businesses with custom software, web and mobile app development, AI and automation, cloud engineering, and digital transformation support.',
      actions: [
        { label: 'Explore Services', href: '#services', variant: 'primary' },
        { label: 'Talk to an Expert', href: '#contact', variant: 'secondary' }
      ]
    };
  }

  if (/(contact|talk|consult|schedule|book|call|hire)/.test(normalized)) {
    return {
      text: 'The best next step is to share a few project details through the contact form or book a discovery call. We can recommend the right engagement model and technical path.',
      actions: [
        { label: 'Contact Us', href: '#contact', variant: 'primary' },
        { label: 'Start a Project', href: '#contact', variant: 'secondary' }
      ]
    };
  }

  return {
    text: 'I can help with service fit, product strategy, AI and engineering direction, and the right next step for your project. Share your goal and timeline and I’ll guide you from there.',
    actions: [
      { label: 'Explore Services', href: '#services', variant: 'primary' },
      { label: 'Contact Us', href: '#contact', variant: 'secondary' }
    ]
  };
}
