import type {
  AssistantMode,
  QuestionScope,
  LeadIntentSignal,
  LeadIntentLevel,
  Message,
  ConversationContext,
  IntentDetectionResult
} from './assistantTypes.js';

export class AssistantIntentDetector {
  /**
   * Deterministically classifies visitor intent, question scope (company vs general vs hybrid),
   * resolves multi-turn conversation context, detects user dissatisfaction / correction signals,
   * and synthesizes a contextual effective query.
   */
  public static detect(
    query: string,
    history: Message[] = []
  ): IntentDetectionResult {
    const raw = query.trim();
    const rawLower = raw.toLowerCase();

    // 1. Detect User Dissatisfaction / Correction Signals
    const dissatisfactionPatterns = [
      /\b(?:not able to (?:answer|ans)|can't (?:answer|ans)|cannot (?:answer|ans))\b/i,
      /\b(?:didn't (?:understand|answer)|did not (?:understand|answer))\b/i,
      /\b(?:this is not what i asked|that is not what i asked|not what i mean|that's not what i asked)\b/i,
      /\b(?:wrong answer|not useful|useless response|you don't know|you are generic)\b/i
    ];
    const isDissatisfied = dissatisfactionPatterns.some(p => p.test(rawLower));

    // 2. Extract Entities from History and Current Message
    const context = this.extractConversationContext(rawLower, history, isDissatisfied);

    // 3. Lead Intent Detection
    const highLeadPatterns = [
      /\b(?:hire|hiring|hire you|quote|pricing|how much|cost|costs|amount|fee|fees|charges|charge|budget|price|prices|rates|hourly rate|proposal|consultation|schedule a call|contact me|talk to sales|book a meeting|get in touch|commercial terms|commercial proposal|commercial model|commercial pricing|commercial engagement|engagement model|engagement models|is there any amount|talk to (?:someone|sales|team|architect|human|expert|a person)|speak to (?:someone|sales|team|architect|human|expert)|speak with (?:someone|sales|team|architect|human|expert)|contact someone)\b/i,
      /\b(?:build my|need a (?:team|developer|engineer)|ready to start|rfp|request for proposal)\b/i
    ];

    const medLeadPatterns = [
      /\b(?:timeline|estimate|project budget|available to start|work with us)\b/i
    ];

    const lowLeadPatterns = [
      /\b(?:interested in|how do you work|onboarding process)\b/i
    ];

    let leadLevel: LeadIntentLevel = 'NONE';
    let leadReason = 'No commercial procurement intent detected.';

    if (highLeadPatterns.some(p => p.test(rawLower))) {
      leadLevel = 'HIGH';
      leadReason = 'Visitor explicitly inquired about hiring, pricing, quotes, or project engagement.';
    } else if (medLeadPatterns.some(p => p.test(rawLower))) {
      leadLevel = 'MEDIUM';
      leadReason = 'Visitor asked about engagement scope, timelines, or commercial estimates.';
    } else if (lowLeadPatterns.some(p => p.test(rawLower))) {
      leadLevel = 'LOW';
      leadReason = 'Visitor exploring delivery engagement models or project scoping.';
    }

    // 4. Determine Question Scope: COMPANY_SPECIFIC vs GENERAL vs HYBRID
    const mentionsCompany =
      rawLower.includes('webkorps') ||
      rawLower.includes('your team') ||
      rawLower.includes('your company') ||
      rawLower.includes('do you') ||
      rawLower.includes('you provide') ||
      rawLower.includes('you build') ||
      rawLower.includes('you worked') ||
      rawLower.includes('have you') ||
      rawLower.includes('has webkorps') ||
      rawLower.includes('can webkorps');

    const asksGeneralConcept =
      rawLower.startsWith('what is ') ||
      rawLower.startsWith('explain ') ||
      rawLower.startsWith('what does ') ||
      rawLower.startsWith('define ') ||
      rawLower.includes('how does route optimization work') ||
      rawLower.includes('industry standards') ||
      rawLower.includes('common practices');

    let questionScope: QuestionScope = 'COMPANY_SPECIFIC';
    if (mentionsCompany && (rawLower.includes('should i') || rawLower.includes('suitable') || rawLower.includes('recommend') || rawLower.includes('features'))) {
      questionScope = 'HYBRID';
    } else if (!mentionsCompany && (asksGeneralConcept || rawLower.includes('what is flutter') || rawLower.includes('what is react') || rawLower.includes('what is route optimization') || rawLower.includes('what is fleet management'))) {
      questionScope = 'GENERAL';
    } else if (!mentionsCompany && context.activeTopic && (rawLower.includes('technology') || rawLower.includes('feature') || rawLower.includes('architecture'))) {
      questionScope = 'HYBRID';
    }

    context.questionScope = questionScope;

    // 5. Intent Classification
    let mode: AssistantMode = 'GENERAL_GUIDANCE';

    if (
      rawLower.includes('work done') ||
      rawLower.includes('case study') ||
      rawLower.includes('case studies') ||
      rawLower.includes('portfolio') ||
      rawLower.includes('past project') ||
      rawLower.includes('previous work') ||
      rawLower.includes('examples of work') ||
      rawLower.includes('examples of past work') ||
      rawLower.includes('clients you worked with') ||
      rawLower.includes('enterprise clients') ||
      rawLower.includes('fortune 500') ||
      rawLower.includes('has webkorps built') ||
      rawLower.includes('have you built') ||
      rawLower.includes('did webkorps') ||
      rawLower.includes('has webkorps worked') ||
      rawLower.includes('has webkorps done') ||
      rawLower.includes('have you done') ||
      rawLower.includes('have you worked') ||
      rawLower.includes('worked in') ||
      rawLower.includes('worked on') ||
      rawLower.includes('experience in logistics') ||
      rawLower.includes('experience in healthcare') ||
      rawLower.includes('has webkorps implemented') ||
      rawLower.includes('done something like this') ||
      rawLower.includes('past work') ||
      rawLower.includes('projects has webkorps done') ||
      rawLower.includes('project with') ||
      rawLower.includes('cigna') ||
      rawLower.includes('paypal') ||
      rawLower.includes('logistics project') ||
      (rawLower.includes('project') && (rawLower.includes('tell me about') || rawLower.includes('about a webkorps'))) ||
      rawLower.includes('drone delivery') ||
      rawLower.includes('mars rover')
    ) {
      mode = 'CASE_STUDY_QA';
    } else if (leadLevel === 'HIGH') {
      mode = 'LEAD_INTENT';
    } else if (
      rawLower.includes('who is webkorps') ||
      rawLower.includes('what does webkorps do') ||
      rawLower.includes('about webkorps') ||
      rawLower.includes('about the company') ||
      rawLower.includes('headquarters') ||
      rawLower.includes('branch') ||
      rawLower.includes('office') ||
      rawLower.includes('offices') ||
      rawLower.includes('indore') ||
      rawLower.includes('pune') ||
      rawLower.includes('bengaluru') ||
      rawLower.includes('wyoming') ||
      rawLower.includes('texas') ||
      rawLower.includes('founded') ||
      rawLower.includes('how long') ||
      rawLower.includes('years in business') ||
      rawLower.includes('team size') ||
      rawLower.includes('how many engineers') ||
      rawLower.includes('how many developers') ||
      rawLower.includes('leadership') ||
      rawLower.includes('leaders') ||
      rawLower.includes('founder') ||
      rawLower.includes('ceo') ||
      rawLower.includes('coo') ||
      rawLower.includes('chirag') ||
      rawLower.includes('amul') ||
      rawLower.includes('certif') ||
      rawLower.includes('iso 27001') ||
      rawLower.includes('iso 9001') ||
      rawLower.includes('cmmi') ||
      rawLower.includes('nda') ||
      rawLower.includes('ip protection') ||
      rawLower.includes('intellectual property') ||
      rawLower.includes('standards for') ||
      rawLower.includes('policy') ||
      rawLower.includes('passwords') ||
      rawLower.includes('source keys')
    ) {
      mode = 'COMPANY_QA';
    } else if (
      !mentionsCompany &&
      (rawLower.startsWith('what is ') ||
       rawLower.startsWith('explain ') ||
       rawLower.startsWith('define ') ||
       rawLower.includes('how does route optimization work'))
    ) {
      mode = 'GENERAL_GUIDANCE';
    } else if (
      rawLower.includes('flutter') ||
      rawLower.includes('react native') ||
      rawLower.includes('react') ||
      rawLower.includes('next.js') ||
      rawLower.includes('python') ||
      rawLower.includes('fastapi') ||
      rawLower.includes('django') ||
      rawLower.includes('node.js') ||
      rawLower.includes('typescript') ||
      rawLower.includes('golang') ||
      rawLower.includes(' go ') ||
      rawLower.startsWith('go ') ||
      rawLower.includes('java') ||
      rawLower.includes('spring boot') ||
      rawLower.includes('kafka') ||
      rawLower.includes('redis') ||
      rawLower.includes('postgis') ||
      rawLower.includes('postgresql') ||
      rawLower.includes('mongodb') ||
      rawLower.includes('docker') ||
      rawLower.includes('kubernetes') ||
      rawLower.includes('aws') ||
      rawLower.includes('gcp') ||
      rawLower.includes('google cloud') ||
      rawLower.includes('webrtc') ||
      rawLower.includes('technolog') ||
      rawLower.includes('tech stack') ||
      rawLower.includes('framework') ||
      rawLower.includes('what backend') ||
      rawLower.includes('what frontend') ||
      rawLower.includes('give me technologies') ||
      rawLower.includes('which technology') ||
      rawLower.includes('what stack') ||
      rawLower.includes('apis does webkorps')
    ) {
      mode = 'TECHNOLOGY_QA';
    } else if (
      rawLower.startsWith('what about ') ||
      rawLower.startsWith('and ') ||
      rawLower.includes('tracking feature') ||
      rawLower.includes('feature') ||
      rawLower.includes('features') ||
      rawLower.includes('fleet management system') ||
      rawLower.includes('delivery tracking application') ||
      rawLower.includes('functionality') ||
      rawLower.includes('capabilities needed') ||
      rawLower.includes('modules')
    ) {
      mode = 'FEATURE_QA';
    } else if (
      rawLower.includes('fintech') ||
      rawLower.includes('fintech & payment') ||
      rawLower.includes('e-commerce') ||
      rawLower.includes('ecommerce') ||
      rawLower.includes('healthcare & healthtech') ||
      rawLower.includes('logistics & supply chain') ||
      rawLower.includes('manufacturing & industrial') ||
      rawLower.includes('edtech & elearning') ||
      rawLower.includes('real estate & proptech') ||
      rawLower.includes('travel & hospitality') ||
      rawLower.includes('restaurant & food delivery') ||
      rawLower.includes('industry vertical') ||
      rawLower.includes('industry challenges') ||
      rawLower.includes('industry trends') ||
      rawLower.includes('does webkorps serve the') ||
      rawLower.includes('industries does webkorps serve') ||
      rawLower.includes('what industries do you') ||
      rawLower.includes('what industries does webkorps') ||
      rawLower.includes('industries you serve') ||
      rawLower.includes('tell me about healthcare') ||
      rawLower.includes('tell me about fintech') ||
      rawLower.includes('tell me about logistics') ||
      (rawLower.includes('industry') && (rawLower.includes('serve') || rawLower.includes('work') || rawLower.includes('solutions')))
    ) {
      mode = 'INDUSTRY_QA';
    } else if (
      rawLower.includes('digital product transformation') ||
      rawLower.includes('mobile app development') ||
      rawLower.includes('custom software development') ||
      rawLower.includes('cloud & devops') ||
      rawLower.includes('ui/ux design') ||
      rawLower.includes('qa & test automation') ||
      rawLower.includes('ai & generative ai') ||
      rawLower.includes('e-commerce solutions') ||
      rawLower.includes('how can webkorps help') ||
      rawLower.includes('what services') ||
      rawLower.includes('services does webkorps') ||
      rawLower.includes('services you provide') ||
      rawLower.includes('do you provide') ||
      rawLower.includes('does webkorps provide') ||
      rawLower.includes('does webkorps offer') ||
      rawLower.includes('can webkorps help') ||
      rawLower.includes('can webkorps build') ||
      rawLower.includes('can webkorps deliver') ||
      rawLower.includes('can webkorps audit') ||
      rawLower.includes('can webkorps stream') ||
      rawLower.includes('can webkorps integrate') ||
      rawLower.includes('can webkorps configure') ||
      rawLower.includes('can webkorps set up') ||
      rawLower.includes('can webkorps implement') ||
      rawLower.includes('can webkorps test') ||
      rawLower.includes('how does webkorps deliver') ||
      rawLower.includes('how does webkorps integrate') ||
      rawLower.includes('how does webkorps synchronize') ||
      rawLower.includes('how does webkorps implement') ||
      rawLower.includes('how does webkorps configure') ||
      rawLower.includes('what architecture does webkorps') ||
      rawLower.includes('what is webkorps experience with') ||
      rawLower.includes('what security measures are applied when webkorps') ||
      rawLower.includes('why choose webkorps for')
    ) {
      mode = 'SERVICE_QA';
    } else if (
      rawLower.includes('i want to design') ||
      rawLower.includes('i want to build') ||
      rawLower.includes('we want to build') ||
      rawLower.includes('we are building') ||
      rawLower.includes('looking to create') ||
      rawLower.includes('planning to develop') ||
      rawLower.includes('project requirement') ||
      rawLower.includes('how would webkorps architect') ||
      rawLower.includes('we are a seed stage') ||
      rawLower.includes('we are a series a')
    ) {
      mode = 'PROJECT_REQUIREMENT';
    } else if (
      rawLower.startsWith('what is ') ||
      rawLower.startsWith('explain ') ||
      rawLower.startsWith('define ') ||
      rawLower.includes('how does ') ||
      rawLower.includes('in ai search engines') ||
      rawLower.includes('ai search citations') ||
      rawLower.includes('citations')
    ) {
      mode = 'GENERAL_GUIDANCE';
    } else if (
      rawLower.includes('can you build it') ||
      rawLower.includes('what should i use') ||
      rawLower.includes('which one is better') ||
      rawLower.includes('is it scalable') ||
      rawLower.includes('is it secure')
    ) {
      mode = 'CLARIFICATION';
    }

    // 6. Contextual Query Rewriting
    const effectiveQuery = this.buildContextualQuery(raw, mode, context, questionScope);

    return {
      mode,
      questionScope,
      leadIntent: {
        level: leadLevel,
        reason: leadReason,
        detectedService: context.requestedService,
        detectedIndustry: context.detectedIndustry
      },
      effectiveQuery,
      context,
      detectedService: context.requestedService,
      detectedIndustry: context.detectedIndustry,
      detectedTechnology: context.technology,
      isDissatisfied
    };
  }

  /**
   * Extracts industry, project type, technical features, technologies, and active topic across conversation history
   */
  private static extractConversationContext(
    currentLower: string,
    history: Message[],
    isDissatisfied: boolean
  ): ConversationContext {
    const context: ConversationContext = {
      entities: {},
      isDissatisfied
    };

    // Combine recent turns for entity extraction (last 6 messages + current)
    const recentMessages = [...history.slice(-6).map(m => m.text.toLowerCase()), currentLower];
    const fullText = recentMessages.join(' | ');

    // 1. Industry Extraction (Current message has absolute priority over history)
    const isCompanyMeta = /\b(?:ceo|coo|founder|founders|leadership|management|executive|director|directors|headquarters|office|offices|team size|employees|engineers|how many|founded|certifications|iso|about webkorps|who is webkorps)\b/i.test(currentLower);

    const industryMap: Record<string, string> = {
      health: 'healthcare',
      healthcare: 'healthcare',
      healthtech: 'healthcare',
      medical: 'healthcare',
      telemedicine: 'healthcare',
      logistic: 'logistics',
      logistics: 'logistics',
      'supply chain': 'logistics',
      fleet: 'logistics',
      freight: 'logistics',
      warehouse: 'logistics',
      transportation: 'logistics',
      fintech: 'fintech',
      banking: 'fintech',
      payment: 'fintech',
      finance: 'fintech',
      coffee: 'retail_food_beverage',
      cafe: 'retail_food_beverage',
      restaurant: 'retail_food_beverage',
      food: 'retail_food_beverage',
      ecommerce: 'ecommerce',
      'e-commerce': 'ecommerce',
      retail: 'ecommerce',
      shop: 'ecommerce',
      store: 'ecommerce',
      education: 'education',
      elearning: 'education',
      edtech: 'education',
      'real estate': 'real estate',
      proptech: 'real estate',
      manufacturing: 'manufacturing',
      iot: 'manufacturing',
      travel: 'travel',
      hospitality: 'travel'
    };

    // Check current message first
    let foundIndustry: string | undefined;
    if (!isCompanyMeta) {
      for (const [kw, ind] of Object.entries(industryMap)) {
        if (currentLower.includes(kw)) {
          foundIndustry = ind;
          break;
        }
      }

      // Fallback to history only if direct follow-up
      const isFollowup = /^(?:how|what|why|tell me more|explain|and|can you|how they help|what about)\b/i.test(currentLower) || currentLower.split(' ').length <= 3;
      if (!foundIndustry && isFollowup && history.length > 0) {
        const historyText = history.slice(-2).map(m => m.text.toLowerCase()).join(' ');
        for (const [kw, ind] of Object.entries(industryMap)) {
          if (historyText.includes(kw)) {
            foundIndustry = ind;
            break;
          }
        }
      }
    }

    if (foundIndustry) {
      context.detectedIndustry = foundIndustry;
      context.entities['industry'] = foundIndustry;
    }

    // 2. Project Type Extraction
    const projectTypes = [
      'mobile application', 'mobile app', 'ios app', 'android app',
      'web application', 'web app', 'platform', 'dashboard', 'portal',
      'software system', 'application', 'app', 'mvp', 'saas'
    ];

    for (const pt of projectTypes) {
      if (fullText.includes(pt)) {
        context.projectType = pt.includes('app') ? 'application' : pt;
        context.entities['project_type'] = context.projectType;
        break;
      }
    }

    // 3. Service Extraction
    const serviceKeywords: Record<string, string> = {
      'ai & ml': 'AI & ML Development',
      'machine learning': 'AI & ML Development',
      'mobile app': 'Mobile App Development',
      'mobile development': 'Mobile App Development',
      'flutter': 'Mobile App Development',
      'react native': 'Mobile App Development',
      'web development': 'Web Development',
      'custom software': 'Custom Software Development',
      'cloud': 'Cloud & DevOps Engineering',
      'devops': 'Cloud & DevOps Engineering',
      'ui/ux': 'UI/UX Design',
      'qa': 'QA & Test Automation',
      'ecommerce': 'E-Commerce Solutions'
    };

    for (const [kw, sName] of Object.entries(serviceKeywords)) {
      if (fullText.includes(kw)) {
        context.requestedService = sName;
        context.entities['service'] = sName;
        break;
      }
    }

    // 4. Technology Extraction
    const techKeywords = [
      'flutter', 'react native', 'swift', 'kotlin', 'react', 'next.js', 'typescript',
      'node.js', 'python', 'go', 'java', 'postgresql', 'postgis', 'redis', 'websockets',
      'mqtt', 'aws', 'gcp', 'docker', 'kubernetes', 'google maps', 'mapbox'
    ];
    for (const tk of techKeywords) {
      if (fullText.includes(tk)) {
        context.technology = tk;
        context.entities['technology'] = tk;
        break;
      }
    }

    // 5. Feature Interest
    if (fullText.includes('tracking') || fullText.includes('gps') || fullText.includes('location')) {
      context.featureInterest = 'real-time GPS tracking & maps';
    } else if (fullText.includes('payment') || fullText.includes('checkout')) {
      context.featureInterest = 'payments & checkout';
    } else if (fullText.includes('dispatch') || fullText.includes('route')) {
      context.featureInterest = 'dispatching & route optimization';
    }

    // 6. Active Topic Synthesis
    if (context.detectedIndustry && context.projectType) {
      context.activeTopic = `${context.detectedIndustry} ${context.projectType}`;
    } else if (context.detectedIndustry) {
      context.activeTopic = `${context.detectedIndustry} engineering solutions`;
    } else if (context.requestedService) {
      context.activeTopic = context.requestedService;
    }

    return context;
  }

  /**
   * Rewrites ambiguous follow-up questions using conversation context into a rich retrieval query.
   */
  private static buildContextualQuery(
    rawQuery: string,
    mode: AssistantMode,
    context: ConversationContext,
    scope: QuestionScope
  ): string {
    const rawLower = rawQuery.toLowerCase();

    // Pure general domain questions do not need company context injected into retrieval
    if (scope === 'GENERAL') {
      return rawQuery;
    }

    if (context.isDissatisfied && context.activeTopic) {
      return `Comprehensive architecture, technology stack, and engineering capabilities for building a ${context.activeTopic}`;
    }

    if (mode === 'FEATURE_QA') {
      if (context.activeTopic) {
        return `Essential core features, modules, and architecture for building a ${context.activeTopic}`;
      }
      return `${rawQuery} core software features and application modules`;
    }

    if (mode === 'TECHNOLOGY_QA') {
      if (context.activeTopic) {
        return `Technologies, frameworks, databases, and backend stack recommended for building a ${context.activeTopic} and Webkorps technology capabilities`;
      }
      return `${rawQuery} Webkorps engineering technology stack`;
    }

    if (mode === 'CASE_STUDY_QA') {
      if (context.detectedIndustry) {
        return `Webkorps ${context.detectedIndustry} case studies, past client projects, and verified work portfolio`;
      }
      return `${rawQuery} Webkorps case studies and client projects`;
    }

    if (mode === 'PROJECT_REQUIREMENT' || mode === 'FOLLOW_UP') {
      if (rawLower.includes('tracking')) {
        return `Real-time GPS tracking, maps, and geolocation architecture for ${context.activeTopic || 'logistics applications'}`;
      }
      if (context.activeTopic) {
        return `${context.activeTopic} architecture, features, and engineering services: ${rawQuery}`;
      }
    }

    if (mode === 'INDUSTRY_QA' || mode === 'FOLLOW_UP' || mode === 'SERVICE_QA') {
      if (context.detectedIndustry && context.requestedService) {
        const sName = context.requestedService.toLowerCase();
        const extra = sName.includes('mobile') ? 'mobile apps ' : '';
        return `${context.detectedIndustry} ${extra}${sName} and software engineering solutions`;
      }
      if (context.detectedIndustry && context.projectType) {
        return `${context.detectedIndustry} ${context.projectType} and software engineering solutions`;
      }
      if (context.detectedIndustry) {
        return `${context.detectedIndustry} software systems, core features, architecture, and Webkorps industry solutions`;
      }
    }

    if (mode === 'SERVICE_QA' && context.detectedIndustry) {
      return `How Webkorps delivers custom engineering and software development for ${context.detectedIndustry} applications`;
    }

    return rawQuery;
  }
}


