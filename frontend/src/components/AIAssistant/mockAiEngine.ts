import type { AiResponseResult } from './types';

/**
 * Local mock AI response engine.
 * Matches keywords and intents locally to provide authentic, contextual responses
 * without external API dependencies or fake network calls.
 */
export function mockAiResponse(userMessage: string): AiResponseResult {
  const normalized = userMessage.toLowerCase().trim();

  // 1. Services intent
  if (
    normalized.includes('service') ||
    normalized.includes('what do you do') ||
    normalized.includes('offer') ||
    normalized.includes('capabilities')
  ) {
    return {
      text:
        'Webkorps delivers end-to-end digital engineering solutions including Web Development, Mobile App Development, AI & ML Engineering, Enterprise Software, Cloud & DevOps, and E-Commerce Platforms.\n\nWhether you need to modernize legacy systems, build scalable cloud architectures, or deploy generative AI workflows, our 350+ certified engineers can help you execute quickly.',
      actions: [
        { label: 'Explore Services', href: '#services', variant: 'primary' },
        { label: 'Talk to Our Team', href: '#contact', variant: 'secondary' },
      ],
    };
  }

  // 2. AI & ML Solutions
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
        'Yes! We specialize in custom AI and ML solutions. From fine-tuned Generative AI copilots and autonomous workflow agents to computer vision and predictive data pipelines, we guide businesses through every phase of the AI Development Life Cycle (AI DLC).\n\nWe ensure enterprise-grade security, data privacy, and measurable business ROI.',
      actions: [
        { label: 'View AI Innovations', href: '#ai-innovation', variant: 'primary' },
        { label: 'Book AI Consultation', href: '#contact', variant: 'secondary' },
      ],
    };
  }

  // 3. Technology selection
  if (
    normalized.includes('which technology') ||
    normalized.includes('technology') ||
    normalized.includes('tech stack') ||
    normalized.includes('framework') ||
    normalized.includes('right for my project')
  ) {
    return {
      text:
        'The ideal technology depends on your target users, scale, and performance needs:\n\n• For Modern Web Platforms: Next.js, React, Node.js, and TypeScript offer maximum agility and SEO speed.\n• For Mobile: Native Swift/Kotlin or high-velocity Flutter/React Native architectures.\n• For Cloud & Big Data: AWS, Azure, Google Cloud, and Kubernetes for resilient autoscaling.\n\nTell me more about your system requirements, and I can give you a tailored recommendation.',
      actions: [
        { label: 'Explore Integrations', href: '#integrations', variant: 'primary' },
        { label: 'Speak with an Architect', href: '#contact', variant: 'secondary' },
      ],
    };
  }

  // 4. Project cost & pricing
  if (
    normalized.includes('cost') ||
    normalized.includes('price') ||
    normalized.includes('pricing') ||
    normalized.includes('budget') ||
    normalized.includes('how much')
  ) {
    return {
      text:
        'Project costs depend on your scope, technical complexity, custom integrations, security compliances (e.g., HIPAA, ISO 27001), and delivery timeline.\n\nWebkorps offers flexible collaboration models including Dedicated Engineering Squads, Fixed-Scope Milestones, and Time & Materials.\n\nWe can provide a detailed estimation and roadmap after a quick technical scoping session.',
      actions: [
        { label: 'Request a Quote', href: '#contact', variant: 'primary' },
        { label: 'View Case Studies', href: '#case-studies', variant: 'secondary' },
      ],
    };
  }

  // 5. Mobile App Development
  if (
    normalized.includes('mobile') ||
    normalized.includes('app') ||
    normalized.includes('ios') ||
    normalized.includes('android') ||
    normalized.includes('flutter')
  ) {
    return {
      text:
        'Webkorps builds robust, high-performance mobile applications across iOS, Android, and cross-platform frameworks. We craft seamless UI/UX, offline-first data sync, biometric authentication, and enterprise backend integrations.',
      actions: [
        { label: 'See Mobile Work', href: '#services', variant: 'primary' },
        { label: 'Schedule Scoping Call', href: '#contact', variant: 'secondary' },
      ],
    };
  }

  // 6. Web Development
  if (
    normalized.includes('website') ||
    normalized.includes('web development') ||
    normalized.includes('web app') ||
    normalized.includes('frontend') ||
    normalized.includes('portal')
  ) {
    return {
      text:
        'Our web engineering team develops mission-critical web applications, high-converting digital portals, and complex SaaS platforms designed for ultra-low latency, full accessibility (WCAG 2.2 AA), and modern search engine optimization.',
      actions: [
        { label: 'Explore Web Services', href: '#services', variant: 'primary' },
        { label: 'View Case Studies', href: '#case-studies', variant: 'secondary' },
      ],
    };
  }

  // 7. E-Commerce
  if (
    normalized.includes('ecommerce') ||
    normalized.includes('e-commerce') ||
    normalized.includes('online store') ||
    normalized.includes('shop')
  ) {
    return {
      text:
        'We engineer scalable omnichannel e-commerce experiences with headless commerce architectures, secure checkout flows, inventory ERP synchronization, and customized customer loyalty portals.',
      actions: [
        { label: 'Explore E-Commerce', href: '#services', variant: 'primary' },
        { label: 'Get in Touch', href: '#contact', variant: 'secondary' },
      ],
    };
  }

  // 8. Cloud & DevOps
  if (
    normalized.includes('cloud') ||
    normalized.includes('devops') ||
    normalized.includes('aws') ||
    normalized.includes('azure') ||
    normalized.includes('kubernetes')
  ) {
    return {
      text:
        'Webkorps cloud architects design resilient, auto-scaling infrastructures across AWS, Google Cloud, and Microsoft Azure. We automate zero-downtime CI/CD pipelines, container orchestration, and multi-region failovers.',
      actions: [
        { label: 'Learn About Integrations', href: '#integrations', variant: 'primary' },
        { label: 'Consult Cloud Expert', href: '#contact', variant: 'secondary' },
      ],
    };
  }

  // 9. Contact / Talk to someone
  if (
    normalized.includes('contact') ||
    normalized.includes('talk to someone') ||
    normalized.includes('sales') ||
    normalized.includes('team') ||
    normalized.includes('hire') ||
    normalized.includes('call')
  ) {
    return {
      text:
        'Our engineering leaders and technology consultants are ready to discuss your product roadmap and architectural vision. You can share your project details, and our team will get back to you within 24 hours.',
      actions: [
        { label: 'Talk to Our Team', href: '#contact', variant: 'primary' },
      ],
    };
  }

  // 10. Helpful Generic Fallback
  return {
    text:
      "I can help you explore Webkorps services, engineering technologies, industry verticals, project requirements, and AI-powered solutions.\n\nTell me what you're planning to build or what challenge your business is solving, and I'll guide you in the right direction.",
    actions: [
      { label: 'Explore Services', href: '#services', variant: 'primary' },
      { label: 'Talk to Our Team', href: '#contact', variant: 'secondary' },
    ],
  };
}
