import type { AiResponseResult } from './types';

/**
 * Grounded local AI response engine for Webkorps.
 * It responds with company-specific facts and uses the same lead conversion paths as the website.
 */
export function mockAiResponse(userMessage: string): AiResponseResult {
  const normalized = userMessage.toLowerCase().trim();

  if (
    normalized.includes('what is webkorps') ||
    normalized.includes('who is webkorps') ||
    normalized.includes('about webkorps') ||
    normalized.includes('tell me about webkorps') ||
    normalized.includes('what does webkorps do')
  ) {
    return {
      text:
        'Webkorps is an enterprise digital engineering company founded in 2014. We help businesses build custom software, AI/ML solutions, web and mobile platforms, cloud systems, and product engineering teams with strong delivery governance. Our core leadership includes Chirag Agrawal (CEO & Founder) and Amul Choudhary (COO & Co-Founder).',
      actions: [
        { label: 'Explore Services', href: '#services', variant: 'primary' },
        { label: 'View Case Studies', href: '#case-studies', variant: 'secondary' }
      ]
    };
  }

  if (
    normalized.includes('founder') ||
    normalized.includes('ceo') ||
    normalized.includes('coo') ||
    normalized.includes('leadership') ||
    normalized.includes('who leads webkorps')
  ) {
    return {
      text:
        'Webkorps is led by Chirag Agrawal as CEO & Founder and Amul Choudhary as COO & Co-Founder. The company operates from Indore, with additional offices in Pune, Bengaluru, Frisco, and Sheridan.',
      actions: [
        { label: 'Meet the Team', href: '#leadership', variant: 'primary' },
        { label: 'Talk to Us', href: '#contact', variant: 'secondary' }
      ]
    };
  }

  if (
    normalized.includes('service') ||
    normalized.includes('services') ||
    normalized.includes('what do you do') ||
    normalized.includes('offer') ||
    normalized.includes('capabilities') ||
    normalized.includes('solutions')
  ) {
    return {
      text:
        'Webkorps delivers end-to-end digital engineering across custom software development, mobile app development, web development, AI & ML engineering, cloud & DevOps, enterprise integrations, and product modernization. We work across product strategy, engineering delivery, and optimization.',
      actions: [
        { label: 'Explore Services', href: '#services', variant: 'primary' },
        { label: 'Book a Consultation', href: '#contact', variant: 'secondary' }
      ]
    };
  }

  if (
    normalized.includes('ai') ||
    normalized.includes('artificial intelligence') ||
    normalized.includes('machine learning') ||
    normalized.includes('ml') ||
    normalized.includes('chatbot') ||
    normalized.includes('llm') ||
    normalized.includes('genai')
  ) {
    return {
      text:
        'Yes. Webkorps builds AI-powered product experiences, AI copilots, workflow automation, recommendation systems, and intelligent enterprise tooling. We help teams identify the right AI use case, architecture, and rollout plan for measurable business outcomes.',
      actions: [
        { label: 'View AI Innovation', href: '#ai-innovation', variant: 'primary' },
        { label: 'Book AI Consultation', href: '#contact', variant: 'secondary' }
      ]
    };
  }

  if (
    normalized.includes('healthcare') ||
    normalized.includes('fintech') ||
    normalized.includes('logistics') ||
    normalized.includes('education') ||
    normalized.includes('retail') ||
    normalized.includes('industry') ||
    normalized.includes('vertical')
  ) {
    return {
      text:
        'Webkorps works across healthcare, fintech, logistics, education, enterprise SaaS, and digital commerce. We design domain-aware engineering systems with the right mix of compliance, scalability, product UX, and operational workflows.',
      actions: [
        { label: 'Explore Industries', href: '#industries', variant: 'primary' },
        { label: 'Talk to an Expert', href: '#contact', variant: 'secondary' }
      ]
    };
  }

  if (
    normalized.includes('technology') ||
    normalized.includes('tech stack') ||
    normalized.includes('framework') ||
    normalized.includes('stack') ||
    normalized.includes('which technology')
  ) {
    return {
      text:
        'Webkorps typically builds with modern enterprise stacks including React, Next.js, TypeScript, Node.js, cloud-native services, APIs, and data platforms. The exact stack depends on performance, security, product complexity, and integration requirements.',
      actions: [
        { label: 'Explore Integrations', href: '#integrations', variant: 'primary' },
        { label: 'Speak with an Architect', href: '#contact', variant: 'secondary' }
      ]
    };
  }

  if (
    normalized.includes('cost') ||
    normalized.includes('price') ||
    normalized.includes('pricing') ||
    normalized.includes('budget') ||
    normalized.includes('quote') ||
    normalized.includes('how much') ||
    normalized.includes('estimate')
  ) {
    return {
      text:
        'Project cost depends on scope, architecture, team size, compliance needs, and delivery timeline. Webkorps offers flexible engagement models for dedicated squads, product engineering, and consulting. The fastest path is to share your goals and we can propose a solution fit and budget range.',
      actions: [
        { label: 'Request a Quote', href: '#contact', variant: 'primary' },
        { label: 'View Case Studies', href: '#case-studies', variant: 'secondary' }
      ]
    };
  }

  if (
    normalized.includes('contact') ||
    normalized.includes('talk to someone') ||
    normalized.includes('schedule') ||
    normalized.includes('book a call') ||
    normalized.includes('hire') ||
    normalized.includes('consultation') ||
    normalized.includes('sales') ||
    normalized.includes('team')
  ) {
    return {
      text:
        'You can reach Webkorps through the contact form on this page, email us at contact@webkorps.com, or book a discovery call with our engineering team. We usually begin with a short requirement review and technical scoping conversation.',
      actions: [
        { label: 'Contact Webkorps', href: '#contact', variant: 'primary' },
        { label: 'Email Us', href: 'mailto:contact@webkorps.com', variant: 'secondary' }
      ]
    };
  }

  if (
    normalized.includes('certification') ||
    normalized.includes('iso') ||
    normalized.includes('quality') ||
    normalized.includes('security') ||
    normalized.includes('compliance')
  ) {
    return {
      text:
        'Webkorps is aligned with enterprise quality and security expectations including ISO/IEC 27001, ISO 9001:2015, and CMMI Level 3. This matters for regulated, high-trust product environments and large-scale digital transformation programs.',
      actions: [
        { label: 'See Our Credentials', href: '#about', variant: 'primary' },
        { label: 'Talk to Us', href: '#contact', variant: 'secondary' }
      ]
    };
  }

  if (
    normalized.includes('mobile') ||
    normalized.includes('app') ||
    normalized.includes('ios') ||
    normalized.includes('android') ||
    normalized.includes('flutter')
  ) {
    return {
      text:
        'Webkorps builds high-performing mobile applications for iOS, Android, and cross-platform environments. We design for performance, user trust, system integrations, and long-term product scalability.',
      actions: [
        { label: 'Mobile Services', href: '#services', variant: 'primary' },
        { label: 'Start a Project', href: '#contact', variant: 'secondary' }
      ]
    };
  }

  if (
    normalized.includes('website') ||
    normalized.includes('web development') ||
    normalized.includes('web app') ||
    normalized.includes('portal') ||
    normalized.includes('frontend')
  ) {
    return {
      text:
        'Webkorps designs and builds web platforms, portals, SaaS products, and high-conversion user experiences. We focus on product architecture, performance, SEO, accessibility, business workflows, and resilient backend integrations.',
      actions: [
        { label: 'Web Development', href: '#services', variant: 'primary' },
        { label: 'Discuss Requirements', href: '#contact', variant: 'secondary' }
      ]
    };
  }

  return {
    text:
      'I can help with Webkorps services, project scope, AI/ML solutions, technology selection, pricing, and discovery calls. For example, we support custom software, web/mobile products, cloud engineering, AI systems, and enterprise platform modernization. Tell me what you want to build and I’ll guide the right next step.',
    actions: [
      { label: 'Explore Services', href: '#services', variant: 'primary' },
      { label: 'Talk to Our Team', href: '#contact', variant: 'secondary' }
    ]
  };
}
