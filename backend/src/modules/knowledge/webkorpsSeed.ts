/**
 * Webkorps Authoritative Entity Ground Truth Seed
 * Seeded for Tenant: 00000000-0000-0000-0000-000000000001 (Webkorps)
 */

export const WEBKORPS_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000001';

export const webkorpsGroundTruth = {
  organizationId: WEBKORPS_ORGANIZATION_ID,
  name: 'Webkorps',
  legalName: 'Webkorps Services India Pvt. Ltd.',
  url: 'https://www.webkorps.com',
  foundedYear: 2014,
  yearsInBusiness: 10,
  teamSize: '400+ Engineers & Technology Specialists',
  overview: 'Webkorps is an enterprise digital engineering and software solutions provider delivering high-concurrency cloud architectures, mobile and web applications, AI/ML engineering, and dedicated development pods for global enterprises.',
  positioning: 'Enterprise Digital Transformation and Full-Lifecycle Software Engineering Partner.',
  differentiators: [
    'Dedicated agile engineering pods with full lifecycle ownership',
    'Enterprise security with ISO 27001 and CMMI Level 3 compliance',
    'Proven track record with global brands across healthcare, fintech, and enterprise tech',
    'Full-stack expertise spanning mobile, cloud, backend, AI/ML, and DevOps'
  ],
  certifications: [
    'ISO/IEC 27001 (Information Security Management)',
    'ISO 9001:2015 (Quality Management System)',
    'CMMI Level 3 (Capability Maturity Model Integration)',
    'Startup India Certified'
  ],
  headquarters: {
    id: 'hq-indore',
    city: 'Indore',
    country: 'India',
    isHQ: true,
    addressLines: [
      '4th Floor, Winway World Offices',
      'Vijay Nagar, Indore, Madhya Pradesh'
    ],
    postalCode: '452010'
  },
  globalOffices: [
    {
      id: 'office-pune',
      city: 'Pune',
      country: 'India',
      isHQ: false,
      addressLines: [
        'Trios Co-working, 3rd Floor, Lalwani Icon',
        'off New Airport Road, Sakore Nagar, Viman Nagar, Pune, Maharashtra'
      ],
      postalCode: '411014'
    },
    {
      id: 'office-bengaluru',
      city: 'Bengaluru',
      country: 'India',
      isHQ: false,
      addressLines: [
        '7th Floor, Commerce Mantri, 12, 1 & 2',
        'Bannerghatta Road, BTM 2nd Stage, BTM Layout, Bengaluru, Karnataka'
      ],
      postalCode: '560076'
    },
    {
      id: 'office-frisco',
      city: 'Frisco',
      country: 'United States',
      isHQ: false,
      addressLines: [
        '6160 Warren Parkway, Suite 100',
        'Frisco, Texas'
      ],
      postalCode: '75034'
    },
    {
      id: 'office-sheridan',
      city: 'Sheridan',
      country: 'United States',
      isHQ: false,
      addressLines: [
        '1309 Coffeen Ave, STE B1',
        'Sheridan, Wyoming'
      ],
      postalCode: '82801'
    }
  ],
  leadership: [
    {
      id: 'chirag-agrawal',
      name: 'Chirag Agrawal',
      role: 'CEO & Founder',
      quote: 'Success is not about being ahead of others, it’s about becoming better than who you were yesterday.'
    },
    {
      id: 'amul-choudhary',
      name: 'Amul Choudhary',
      role: 'COO & Co-Founder',
      quote: 'Keep learning, keep growing, and keep moving forward because every small step creates a bigger journey.'
    }
  ],
  coreServices: [
    {
      name: 'Mobile App Development',
      description: 'Engineering native iOS (Swift), native Android (Kotlin), and cross-platform apps with Flutter and React Native. Includes offline sync, real-time GPS telemetry, and seamless API integration.',
      technologies: ['Flutter', 'React Native', 'Swift', 'Kotlin'],
      capabilities: ['Cross-Platform Mobile Engineering', 'Real-Time Telemetry & Location Systems']
    },
    {
      name: 'Web Development',
      description: 'Building scalable enterprise web platforms and progressive web apps using React, Next.js, TypeScript, and Angular.',
      technologies: ['React', 'Next.js', 'TypeScript', 'Angular', 'Vue.js'],
      capabilities: ['UI/UX Design & Prototyping', 'High-Concurrency Backend Architecture']
    },
    {
      name: 'Custom Software Development',
      description: 'Architecting bespoke enterprise systems, distributed microservices, event-driven workflows, and high-throughput APIs.',
      technologies: ['Node.js', 'Python', 'Go', 'Java', 'PostgreSQL'],
      capabilities: ['High-Concurrency Backend Architecture', 'Enterprise Security & Compliance']
    },
    {
      name: 'Cloud & DevOps Engineering',
      description: 'Multi-cloud infrastructure management across AWS, GCP, and Azure with Kubernetes container orchestration, Terraform infrastructure as code, and CI/CD pipelines.',
      technologies: ['AWS', 'Google Cloud Platform', 'Docker', 'Kubernetes', 'Terraform'],
      capabilities: ['Cloud Infrastructure & DevOps Automation', 'Enterprise Security & Compliance']
    },
    {
      name: 'AI & ML Development',
      description: 'Designing predictive machine learning models, GenAI applications, LLM RAG pipelines, computer vision, and NLP systems.',
      technologies: ['Python', 'PyTorch', 'TensorFlow', 'OpenAI API'],
      capabilities: ['AI/ML Model & LLM Integration']
    },
    {
      name: 'UI/UX Design',
      description: 'End-to-end design thinking, user journey mapping, design systems, wireframing in Figma, and interactive prototyping.',
      technologies: ['Figma', 'Design Systems', 'User Research'],
      capabilities: ['UI/UX Design & Prototyping']
    },
    {
      name: 'QA & Test Automation',
      description: 'Comprehensive software quality assurance including automated regression suites with Playwright and Cypress, API testing, and performance stress testing.',
      technologies: ['Playwright', 'Cypress', 'Selenium', 'JMeter'],
      capabilities: ['Enterprise Security & Compliance']
    },
    {
      name: 'E-Commerce Solutions',
      description: 'Building custom digital commerce platforms, headless storefronts, multi-vendor marketplaces, and secure payment checkout integrations.',
      technologies: ['React', 'Node.js', 'Shopify', 'PostgreSQL', 'Redis'],
      capabilities: ['High-Concurrency Backend Architecture']
    },
    {
      name: 'Blockchain Development',
      description: 'Smart contract development, EVM protocols, decentralized applications (dApps), and Web3 ecosystem integrations.',
      technologies: ['Solidity', 'Ethereum', 'Web3.js'],
      capabilities: ['Enterprise Security & Compliance']
    }
  ],
  technologies: [
    { name: 'Flutter', category: 'Mobile Framework', description: 'Google cross-platform UI framework for building performant native iOS and Android apps from a single codebase.' },
    { name: 'React Native', category: 'Mobile Framework', description: 'Cross-platform mobile application framework using React and JavaScript/TypeScript.' },
    { name: 'Swift', category: 'Mobile Native', description: 'Apple native language for robust iOS applications.' },
    { name: 'Kotlin', category: 'Mobile Native', description: 'Modern native language for Android application development.' },
    { name: 'React', category: 'Frontend Library', description: 'Declarative component-based frontend library for interactive user interfaces.' },
    { name: 'Next.js', category: 'Frontend Framework', description: 'Enterprise React framework with server-side rendering, static generation, and edge routing.' },
    { name: 'TypeScript', category: 'Programming Language', description: 'Strict syntactical superset of JavaScript providing compile-time type safety.' },
    { name: 'Node.js', category: 'Backend Runtime', description: 'Asynchronous event-driven JavaScript runtime used with NestJS and Express for high-concurrency APIs.' },
    { name: 'Python', category: 'Backend & AI Language', description: 'High-level language for FastAPI/Django backends, data engineering, and AI/ML model deployment.' },
    { name: 'Go', category: 'Backend Language', description: 'Compiled concurrent language for high-throughput dispatch systems and microservices.' },
    { name: 'Java', category: 'Enterprise Backend', description: 'Spring Boot enterprise backend framework for robust microservices.' },
    { name: 'PostgreSQL', category: 'Relational Database', description: 'Extensible open-source object-relational database system.' },
    { name: 'PostGIS', category: 'Geospatial Database', description: 'Spatial database extender for PostgreSQL for geospatial coordinates, routing, and geofencing.' },
    { name: 'Redis', category: 'In-Memory Cache', description: 'In-memory data structure store for low-latency session caching, driver telemetry, and rate limiting.' },
    { name: 'WebSockets', category: 'Real-Time Protocol', description: 'Full-duplex bidirectional protocol for live location streaming and dispatch alerts.' },
    { name: 'MQTT', category: 'IoT / Telemetry Protocol', description: 'Lightweight publish-subscribe protocol for IoT devices and GPS tracker telemetry.' },
    { name: 'AWS', category: 'Cloud Platform', description: 'Amazon Web Services cloud computing suite (EC2, ECS, EKS, Lambda, S3, RDS).' },
    { name: 'Google Cloud Platform', category: 'Cloud Platform', description: 'GCP cloud services, Google Kubernetes Engine (GKE), BigQuery, Cloud Run, and Cloud Storage.' },
    { name: 'Docker & Kubernetes', category: 'DevOps & Containers', description: 'Containerization and container orchestration for scalable enterprise deployments.' },
    { name: 'Google Maps Platform', category: 'Geolocation & Maps', description: 'APIs for routing, distance matrix calculation, geocoding, and live map rendering.' },
    { name: 'Mapbox', category: 'Geolocation & Maps', description: 'Custom maps, navigation SDKs, and geospatial location services.' }
  ],
  targetIndustries: [
    {
      name: 'Logistics & Supply Chain',
      commonApps: ['Fleet tracking application', 'Dispatch management portal', 'Delivery tracking app', 'Warehouse management system', 'Freight forwarding platform'],
      commonProblems: ['Lack of real-time shipment visibility', 'Inefficient driver dispatching', 'High fuel and routing costs', 'Manual paperwork for proof of delivery'],
      relevantFeatures: ['Real-time GPS tracking', 'Automated dispatching & load allocation', 'Algorithmic route optimization', 'Electronic proof of delivery (ePOD)', 'Live customer tracking link & SMS alerts'],
      recommendedStack: ['Flutter / React Native (Mobile)', 'Node.js / Python (Backend)', 'PostgreSQL + PostGIS (Spatial DB)', 'Redis (Live Telemetry)', 'WebSockets / MQTT (Live Stream)', 'Google Maps / Mapbox (Navigation)'],
      webkorpsCapabilities: 'Webkorps provides custom software engineering, cross-platform mobile apps, telemetry ingestion pipelines, and cloud backend architecture for the logistics and supply chain sector.'
    },
    {
      name: 'Healthcare & HealthTech',
      commonApps: ['Telehealth consultation platform', 'Patient portal', 'EHR/EMR integration system', 'Remote patient monitoring app'],
      commonProblems: ['Data silos between providers', 'HIPAA compliance overhead', 'Poor patient onboarding'],
      relevantFeatures: ['HIPAA compliant video calling', 'FHIR/HL7 record integration', 'Encrypted messaging', 'Appointment scheduling'],
      recommendedStack: ['React / Next.js', 'Node.js / Python', 'PostgreSQL', 'WebRTC', 'AWS / GCP'],
      webkorpsCapabilities: 'Webkorps delivers HIPAA-compliant healthcare software, telemedicine portals, and secure patient data architectures.'
    },
    {
      name: 'FinTech & Payment Solutions',
      commonApps: ['Payment gateway integration', 'Digital wallet app', 'Lending portal', 'Financial dashboard'],
      commonProblems: ['Transaction latency', 'Payment fraud', 'PCI-DSS regulatory compliance'],
      relevantFeatures: ['Multi-gateway routing', 'Tokenization & encryption', 'Real-time ledger processing', 'Fraud risk scoring'],
      recommendedStack: ['React / Next.js', 'Java / Go / Node.js', 'PostgreSQL', 'Kafka', 'Redis'],
      webkorpsCapabilities: 'Webkorps engineers secure financial microservices, high-throughput checkout systems, and custom fintech platforms.'
    },
    {
      name: 'Manufacturing & Industrial IoT',
      commonApps: ['Factory floor dashboard', 'Asset tracking portal', 'Predictive maintenance system'],
      commonProblems: ['Unscheduled downtime', 'Lack of machine telemetry', 'Siloed equipment logs'],
      relevantFeatures: ['MQTT sensor ingestion', 'Real-time machine telemetry', 'Predictive maintenance alerts', 'SCADA integrations'],
      recommendedStack: ['React', 'Python / Go', 'TimescaleDB / InfluxDB', 'MQTT Broker', 'AWS IoT'],
      webkorpsCapabilities: 'Webkorps builds IoT sensor ingestion backends, telemetry dashboards, and industrial software systems.'
    },
    {
      name: 'Education & E-Learning',
      commonApps: ['Learning management system (LMS)', 'Live interactive classroom', 'Student mobile app'],
      commonProblems: ['Low student engagement', 'Video bandwidth bottlenecks', 'Complex grading workflows'],
      relevantFeatures: ['Live video classrooms', 'Interactive quizzes', 'Automated grading', 'Progress tracking'],
      recommendedStack: ['React / Next.js', 'Node.js', 'PostgreSQL', 'AWS CloudFront'],
      webkorpsCapabilities: 'Webkorps designs intuitive e-learning platforms and scalable video streaming portals.'
    },
    {
      name: 'Real Estate & PropTech',
      commonApps: ['Property listing portal', 'Tenant management app', 'Virtual touring app'],
      commonProblems: ['Slow lead turnaround', 'Manual lease paperwork', 'Poor property viewing experiences'],
      relevantFeatures: ['3D virtual tours', 'Automated tenant screening', 'Digital lease signing', 'Payment collection'],
      recommendedStack: ['Next.js', 'Node.js', 'PostgreSQL', 'Mapbox'],
      webkorpsCapabilities: 'Webkorps develops real estate listing engines, tenant portals, and property management systems.'
    },
    {
      name: 'E-Commerce & Retail',
      commonApps: ['Omnichannel shopping app', 'B2B wholesale portal', 'Multi-vendor marketplace'],
      commonProblems: ['Cart abandonment', 'Inventory sync delays across channels', 'Slow page speed'],
      relevantFeatures: ['1-click checkout', 'Headless catalog architecture', 'Omnichannel inventory sync', 'Personalized recommendations'],
      recommendedStack: ['Next.js', 'Node.js', 'Shopify Plus / Custom API', 'Elasticsearch', 'Redis'],
      webkorpsCapabilities: 'Webkorps builds lightning-fast headless e-commerce storefronts and custom checkout systems.'
    },
    {
      name: 'Travel & Hospitality',
      commonApps: ['Booking engine', 'Hotel reservation portal', 'Travel companion mobile app'],
      commonProblems: ['Complex multi-provider GDS integrations', 'Dynamic pricing volatility', 'Booking cancellations'],
      relevantFeatures: ['Real-time room/seat availability', 'Dynamic pricing algorithms', 'Multi-currency payment', 'Itinerary builder'],
      recommendedStack: ['React', 'Node.js / Python', 'PostgreSQL', 'Redis'],
      webkorpsCapabilities: 'Webkorps engineers reservation platforms and mobile travel companion apps.'
    },
    {
      name: 'Restaurant & Food Delivery',
      commonApps: ['Customer ordering app', 'Driver dispatch system', 'Kitchen display system (KDS)'],
      commonProblems: ['High 3rd-party marketplace commission fees', 'Late delivery times', 'Order errors'],
      relevantFeatures: ['Direct online ordering', 'Live driver GPS tracking', 'Automated kitchen routing', 'Loyalty rewards'],
      recommendedStack: ['Flutter (Mobile)', 'React (Web)', 'Node.js', 'PostgreSQL + PostGIS', 'WebSockets'],
      webkorpsCapabilities: 'Webkorps delivers direct-to-consumer online ordering and driver tracking platforms.'
    }
  ],
  capabilities: [
    { name: 'Cross-Platform Mobile Engineering', description: 'Production-grade Flutter and React Native engineering delivering pixel-perfect UI, native performance, and offline-first data sync.' },
    { name: 'High-Concurrency Backend Architecture', description: 'Distributed microservices, event-driven message queues (Kafka, RabbitMQ), and high-throughput REST/GraphQL APIs.' },
    { name: 'Real-Time Telemetry & Location Systems', description: 'GPS coordinates ingestion, sub-second Redis geospatial lookups, PostGIS geofencing, and WebSocket streaming.' },
    { name: 'Cloud Infrastructure & DevOps Automation', description: 'Automated CI/CD pipelines, Docker containerization, Kubernetes cluster orchestration, and infrastructure as code.' },
    { name: 'UI/UX Design & Prototyping', description: 'User-centric design systems, clickable wireframes, user testing, and developer-ready Figma assets.' },
    { name: 'AI/ML Model & LLM Integration', description: 'Retrieval-Augmented Generation (RAG), fine-tuned LLM agents, predictive machine learning pipelines, and vector databases.' },
    { name: 'Enterprise Security & Compliance', description: 'ISO 27001, CMMI Level 3, HIPAA, PCI-DSS compliance, and zero-trust authentication engineering.' }
  ],
  caseStudies: [
    {
      name: 'Cigna Healthcare Platform',
      client: 'Cigna',
      industry: 'Healthcare & HealthTech',
      projectType: 'Telemedicine & Health Portal',
      businessProblem: 'Patient access to telehealth consultations required HIPAA-compliant encrypted video and real-time biometric telemetry synchronization.',
      solution: 'Webkorps architected a scalable web and mobile patient portal utilizing WebRTC for encrypted video, Node.js microservices for EHR sync, and AWS cloud infrastructure.',
      outcomes: 'Delivered 99.99% uptime, reduced patient waiting times by 40%, and achieved full HIPAA and SOC2 compliance.',
      technologies: ['React', 'Node.js', 'WebRTC', 'AWS', 'PostgreSQL'],
      verified: true
    },
    {
      name: 'PayPal Payment Optimization',
      client: 'PayPal',
      industry: 'FinTech & Payment Solutions',
      projectType: 'Payment Checkout & Microservices',
      businessProblem: 'High-concurrency checkout pipelines experienced latency spikes during peak transaction periods.',
      solution: 'Webkorps engineered an optimized microservice routing layer in Go and Java with Redis distributed caching and Kafka message queues.',
      outcomes: 'Reduced checkout latency by 35% and supported tens of thousands of concurrent transaction authorizations with zero data loss.',
      technologies: ['Java', 'Go', 'Kafka', 'Redis', 'Docker'],
      verified: true
    }
  ],
  faqs: [
    {
      question: 'What services does Webkorps provide?',
      answer: 'Webkorps provides end-to-end digital engineering services including Mobile App Development (Flutter, React Native, iOS, Android), Web Development (React, Next.js, Angular), Custom Software Development, Cloud & DevOps Engineering (AWS, GCP, Kubernetes), AI & ML Solutions, UI/UX Design, QA Automation, and E-Commerce Platforms.'
    },
    {
      question: 'What technologies does Webkorps use?',
      answer: 'Webkorps engineering teams specialize in Flutter, React Native, Swift, Kotlin, React, Next.js, TypeScript, Node.js (NestJS), Python (FastAPI/Django), Java, Go, PostgreSQL, PostGIS, Redis, AWS, GCP, Docker, Kubernetes, WebSockets, and Kafka.'
    },
    {
      question: 'Can Webkorps build a logistics application?',
      answer: 'Yes. Webkorps engineers custom logistics platforms including driver and customer mobile apps, admin dispatch dashboards, real-time GPS tracking engines, route optimization services, and automated notification systems.'
    },
    {
      question: 'Has Webkorps worked on a logistics project?',
      answer: 'Webkorps actively serves the Logistics & Supply Chain sector with custom engineering and cloud architectures. Currently verified company records highlight work across healthcare (Cigna) and fintech (PayPal).'
    },
    {
      question: 'Where are Webkorps offices located?',
      answer: 'Webkorps is headquartered in Indore, India (Winway World Offices, Vijay Nagar), with development centers in Pune and Bengaluru, India, and US client service offices in Frisco, Texas, and Sheridan, Wyoming.'
    },
    {
      question: 'Who is the leadership of Webkorps?',
      answer: 'Webkorps was founded by Chirag Agrawal (CEO & Founder) and Amul Choudhary (COO & Co-Founder).'
    }
  ],
  socialProfiles: {
    linkedin: 'https://www.linkedin.com/company/webkorps',
    twitter: 'https://twitter.com/webkorps'
  }
};

