# Webkorps Website Implementation & Architecture Guide

> **Status:** Project Setup & Technical Foundation Complete  
> **Source of Truth:** Figma Design System & Landing Page Export (`docs/Webkorps Landing Page.pdf`)  
> **Execution Model:** Section-by-Section Sequential Implementation (Locked Sections Rule)

---

## 1. Project Objective

Build a world-class, premium 2026 B2B technology/software company website for **Webkorps**, balancing two essential outcomes simultaneously:

1. **Human Experience**
   - Premium 2026 visual excellence, clean typography, and polished micro-interactions.
   - High conversion clarity with single-focused value propositions and clear CTAs.
   - Seamless responsive adaptation across mobile, tablet, laptop, and ultra-wide screens.
   - WCAG 2.2 AA accessibility and instantaneous performance.

2. **Machine & AI Discoverability (SEO + GEO / Generative Engine Optimization)**
   - Unambiguous entity clarity for search and AI answer engines (ChatGPT, Google Gemini / AI Overviews, Perplexity).
   - Semantic HTML5 document hierarchy and comprehensive Schema.org JSON-LD structured data.
   - Evidence-driven content architecture connecting Webkorps to its capabilities, verticals, case studies, technologies, and verified leadership.
   - Crawlable, high-speed HTML without cloaking or fake hidden SEO copy.

---

## 2. Current Stack

- **Framework:** React 19 (`react` ^19.2.8, `react-dom` ^19.2.8)
- **Language / Tooling:** TypeScript ~6.0.2 with strict types
- **Build System & Dev Server:** Vite 8.3 (`vite` ^8.3.0) with `@vitejs/plugin-react`
- **Styling Architecture:** Modern Vanilla CSS + Design Tokens (CSS Variables)
  - Modular, zero-runtime overhead, maximum control over Figma fidelity
  - Design Tokens: `src/styles/tokens.css`
  - Global Reset & Typography: `src/styles/globals.css`
  - Responsive & Layout Utilities: `src/styles/utilities.css`
- **Iconography:** `lucide-react` (~1.48.0) + curated SVG assets
- **Linting & Code Quality:** Oxlint (~1.81.0) + TypeScript compiler checks (`tsc -b`)
- **Package Manager:** `npm` (Node v24.14.0)

---

## 3. Figma Source & Visual Reference

- **Visual Design Reference:** `docs/Webkorps Landing Page.pdf` (High-resolution visual export of the approved Figma canvas).
- **Figma MCP Integration:** Whenever a section is targeted for implementation, the exact Figma node must be inspected using the Figma MCP workflow before code is written.
- **Workflow:**
  1. Identify exact Figma node.
  2. Inspect layout, padding, constraints, typography, colors, shadows, borders, SVGs, and component variants via Figma MCP.
  3. Inspect motion and prototype connections if available.
  4. Implement section using established primitives and token system.
  5. Render and verify visual fidelity against Figma reference.
  6. Correct discrepancies before marking as `REVIEW`.

---

## 4. Design System Tokens (`src/styles/tokens.css`)

### Color Palette
- **Brand Primary:** `#0066FF` (Hover: `#0052CC`, Light: `#EBF3FF`, Subtle: `#F0F6FF`)
- **Brand Secondary / Dark:** `#0B132B` / `#0F172A`
- **Brand Accent:** `#00C2FF` (Cyan / Electric Blue)
- **Canvas / Background:** `#FFFFFF`, Canvas Subtle: `#F8FAFC`, Canvas Muted: `#F1F5F9`
- **Card Surfaces:** `#FFFFFF` with border `#EDF2F7` / `#E2E8F0`
- **Text:** Primary: `#0F172A`, Secondary: `#334155`, Muted: `#64748B`, Light: `#94A3B8`
- **Status:** Success: `#10B981` (BG: `#ECFDF5`), Warning: `#F59E0B`, Error: `#EF4444`, Info: `#0066FF`
- **Focus Ring:** `rgba(0, 102, 255, 0.4)`

### Typography Scale
- **Headings Font:** `'Plus Jakarta Sans'`, sans-serif
- **Body Font:** `'Inter'`, sans-serif
- **Sizes:**
  - `Display`: `clamp(2.5rem, 5vw + 1rem, 4rem)` (40px - 64px)
  - `H1`: `clamp(2rem, 3.5vw + 0.5rem, 3.25rem)` (32px - 52px)
  - `H2`: `clamp(1.75rem, 2.5vw + 0.5rem, 2.5rem)` (28px - 40px)
  - `H3`: `clamp(1.35rem, 1.8vw + 0.5rem, 1.875rem)` (22px - 30px)
  - `H4`: `1.25rem` (20px)
  - `Body Large`: `1.125rem` (18px)
  - `Body`: `1rem` (16px)
  - `Body Small`: `0.875rem` (14px)
  - `Caption`: `0.75rem` (12px)

### Spacing & Layout
- **Scale:** 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px, 128px
- **Container Max Width:** 1280px (Wide: 1400px, Narrow: 960px)
- **Container Padding:** Desktop: 32px, Tablet: 24px, Mobile: 16px
- **Section Padding Y:** `clamp(3.5rem, 6vw, 6.5rem)`

### Radius & Elevation
- **Radius:** xs (4px), sm (6px), md (8px), lg (12px), xl (16px), 2xl (24px), full (9999px)
- **Shadows:**
  - `Card`: `0 4px 24px 0 rgba(15, 23, 42, 0.04)`
  - `Card Hover`: `0 12px 32px 0 rgba(0, 102, 255, 0.12)`
  - `Elevated`: `0 10px 15px -3px rgba(0, 0, 0, 0.08)`

---

## 5. Component Architecture

Located under `src/components/`:
- **`Container`** (`src/components/Container/Container.tsx`): Standard responsive max-width wrapper with padding variants.
- **`Button`** (`src/components/Button/Button.tsx`): Semantic button/link with variants (`primary`, `secondary`, `outline`, `white`, `ghost`), size scale, icon slots, accessible focus rings, and WCAG compliance.
- **`Badge`** (`src/components/Badge/Badge.tsx`): Pill chips for categories, status tags, and metadata.
- **`SectionHeading`** (`src/components/SectionHeading/SectionHeading.tsx`): Standardized section title block with kicker/eyebrow, gradient highlight text, subtitle, and optional right-aligned action CTA.
- **`Card`** (`src/components/Card/Card.tsx`): Base surface card with rounded corners, subtle borders, elevation tokens, and smooth hover elevation.

---

## 6. Section Architecture

Landing page sections will live as isolated, modular units under `src/sections/home/`:

```
src/sections/home/
├── Header/                 # 01 — Header / Navigation
├── Hero/                   # 02 — Hero Section
├── LeadingBrands/          # 03 — Leading Brands Logo Wall
├── Stats/                  # 04 — Statistics / Numbers
├── AIInnovation/           # 05 — AI-Powered Innovation Cards
├── Services/               # 06 — Smart Technology / Services Grid
├── Industries/             # 07 — Industry-focused Solutions Carousel
├── Integrations/           # 08 — Digital Ecosystem Integrations Tabs
├── Leadership/             # 09 — Leadership Profiles
├── CaseStudies/            # 10 — Flagship Case Studies (Cigna, PayPal)
├── Partners/               # 11 — OEM Technology Partners
├── NeedPartnerCallout/     # 12 — Mid-Page CTA Callout
├── Insights/               # 13 — Insights & Blogs
├── FAQ/                    # 14 — Frequently Asked Questions Accordion
├── Contact/                # 15 — Support & Consultation Form
└── Footer/                 # 16 — Global Footer & Locations
```

---

## 7. Responsive Strategy

Every section must be designed and implemented responsively:
- **Breakpoints:**
  - Mobile Small: 375px
  - Mobile Large: 430px
  - Tablet: 768px
  - Laptop / Desktop: 1024px
  - Desktop Standard: 1280px
  - Wide Display: 1440px+
- **Rules:**
  - Multi-column grids collapse to 1 or 2 columns on tablets/mobile.
  - Typography scales smoothly using CSS `clamp()` tokens without abrupt layout jumps.
  - Horizontal padding adjusts from 16px (mobile) to 24px (tablet) to 32px (desktop).
  - Touch targets maintain at least 44px x 44px on mobile devices.
  - Interactive carousels enable touch scroll on mobile while preserving button navigation on desktop.

---

## 8. SEO Strategy

- **Document Hierarchy:** Exactly one `<h1>` per page (Hero), followed by `<h2>` for major sections and `<h3>` for cards/sub-features.
- **Metadata Management:** `src/lib/seo/meta.ts` dynamically handles `<title>`, `<meta name="description">`, `<link rel="canonical">`, Open Graph, and Twitter Cards.
- **Crawlability:** Clean, semantic HTML rendered in DOM (not hidden behind dynamic javascript tabs or client clicks).
- **Robots & Sitemap:** `public/robots.txt` and `public/sitemap.xml` actively deployed in root.
- **Image Optimization:** Explicit `alt` attributes describing image content; decorative imagery uses `alt=""`.

---

## 9. GEO Strategy (Generative Engine Optimization & AI Citations)

Optimized for retrieval and synthesis by LLM answer engines (ChatGPT, Google Gemini / AI Overviews, Perplexity):
- **Ground Truth Knowledge Graph:** `src/lib/geo/entityGraph.ts` maintains exact official company data:
  - Legal name: Webkorps Services India Pvt. Ltd.
  - Founding year: 2014
  - Global locations: Indore (HQ), Pune, Bengaluru, Frisco (Texas), Sheridan (Wyoming)
  - Official certifications: ISO/IEC 27001, ISO 9001:2015, CMMI Level 3, Startup India
  - Verified founders: Chirag Agrawal (CEO), Amul Choudhary (COO)
- **Topical Relationship Mapping:** Content architecture maps Webkorps $\to$ Core Services $\to$ Target Verticals $\to$ Case Studies $\to$ Enterprise Technologies.
- **Citable Evidence:** Concrete case study details (e.g. Cigna healthcare provider portal, PayPal payment checkout enhancements).

---

## 10. Structured Data Strategy (Schema.org JSON-LD)

Implemented via `src/lib/structured-data/schema.ts`:
- **`Organization` Schema:** Establishes official identity, address, logo, certifications, founders, and social profile links (`sameAs`).
- **`WebSite` Schema:** Declares official search domain and publisher entity.
- **`WebPage` Schema:** Declares primary page topic and entity association.
- **`Service` Schema:** Outlines core engineering and AI capabilities.
- **`FAQPage` Schema:** Embeds verified question-and-answer pairs matching on-page text.

---

## 11. Accessibility Rules (WCAG 2.2 AA)

- **Keyboard Focus:** Visible 2px outline with 4px focus ring on all interactive elements via `:focus-visible`.
- **Skip Navigation:** Implemented `<a href="#main-content" className="skip-to-content">` as first body element.
- **Semantic Tags:** Buttons render as `<button>`, navigation links render as `<a>`.
- **Contrast Ratios:** Text colors meet or exceed 4.5:1 contrast against background surfaces.
- **Screen Readers:** `.sr-only` utility for visually hidden descriptive text.
- **Reduced Motion:** Mandatory `@media (prefers-reduced-motion: reduce)` block nullifies non-essential transitions and animations.

---

## 12. Performance Rules

- **Zero Heavy Bundles:** Vanilla CSS with scoped class names; no heavy runtime UI component frameworks.
- **Image Formats:** WebP/SVG assets prioritized.
- **Transform & Opacity Only:** CSS animations restricted to GPU-accelerated properties (`transform`, `opacity`) to eliminate layout thrashing.
- **Production Build:** Verified with Vite 8 (`tsc -b && vite build` finishes cleanly in < 1 second).

---

## 13. Motion Rules

- Micro-interactions must feel intentional, professional, and subtle.
- Durations: Fast (150ms) for buttons and hovers; Smooth (350ms) for modals and dropdowns.
- Avoid large continuous CPU-bound background animations or heavy box-shadow blurs.
- Honor user motion preferences unconditionally.

---

## 14. Asset Rules

- Export exact SVG and WebP assets from Figma reference.
- Meaningful filenames (e.g., `webkorps-logo.svg`, `cigna-case-study.webp`).
- No generic Unsplash or AI-generated stock placeholders in approved sections.

---

## 15. Content Rules

- Specific, outcome-driven enterprise B2B copy.
- Avoid generic marketing clichés ("Transform your business with cutting-edge next-gen innovation").
- Factual representation of software architecture, engineering disciplines, and business outcomes.

---

## 16. Entity Rules

- Consistent representation of Webkorps across all sections and structured data.
- Locations: Indore HQ, Pune, Bengaluru, Frisco TX, Sheridan WY.
- Certifications: ISO 27001, ISO 9001:2015, CMMI Level 3.

---

## 17. Internal Linking Strategy

- Connect every high-level capability (e.g., AI & ML Development) to related industry verticals (Fintech, Healthtech) and relevant case studies (PayPal, Cigna).
- Navigation and footer provide contextual link architecture for discovery.

---

## 18. Section Implementation Status

| Section ID | Order | Section Name | Status | Figma Node | Notes / Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `header` | 01 | Header / Navigation | **REVIEW** | `1753-6940` | Top bar, navigation links, contact CTA |
| `hero` | 02 | Hero | **REVIEW** | `1753-6940` | Value proposition, CTAs, 6-service explorer card, dot bg |
| `leading-brands`| 03 | Leading Brands | **REVIEW** | `1753-6940` | 7 client logos, muted gray treatment, divider line |
| `stats` | 04 | Statistics / Numbers | **REVIEW** | `1753-6940` | Title: Every Number Holds a Story. Metrics: 08, 150, 180 with vertical dividers |
| `ai-innovation` | 05 | AI-Powered Innovation | **REVIEW** | `1753-6940` | Title: AI-Powered Innovation for Your Business. 4 Cards: How We Use AI, How AI Helps Your Business, AI DLC Method, SaaS Smarter With AI |
| `services` | 06 | Services / Technology | **REVIEW** | `1753-6940` / `1046-2805` | Title: Smart Technology for Smarter Business Growth. 6 Cards with Figma hover overlay |
| `industries` | 07 | Industry Solutions | **REVIEW** | `1753-6940`, `1059-3396`, `1059-3401`, `1059-3407` | Title: Industry-focused solutions for real business challenges. 3 Cards with 3D illustration hover reveals, carousel track & arrows |
| `integrations` | 08 | Integrations / Ecosystem | **REVIEW** | `1753-6940` / `1212-3075` | Title: Our Seamless Integrations to Enhance Your Digital Ecosystem. Interactive tabs: IoT, RPA, AI & ML, Cyber Security, Data Analytics, Block Chain |
| `leadership` | 09 | Leadership | **REVIEW** | `1753-6940`, `1530-2981`, `1530-2969`, `1523-2784`, `1530-2977`, `1530-2965`, `1530-2953`, `1530-2973`, `1530-2961`, `1530-2957` | Title: Meet the leaders building what's next. Chirag Agrawal (CEO & Founder), Amul Choudhary (COO & Co-Founder) carousel cards with quotes & social badges |
| `case-studies` | 10 | Case Studies | **REVIEW** | `1750-6228`, `1750-5893`, `1212-3237` | Cigna, PayPal, Canopie, Pebble 4-card interactive carousel |
| `oem-partners` | 11 | Trusted OEM Partners | **REVIEW** | `1753-7030` | Concentric orbital ecosystem with continuous floating logo motion, 9 partner badges, central Webkorps anchor |
| `banner-callout`| 12 | Tech Partner Callout | **NOT STARTED** | Pending | Mid-page consultation banner |
| `insights` | 13 | Insights / Blog | **NOT STARTED** | Pending | Featured technology insights |
| `faq` | 14 | Frequently Asked Questions | **NOT STARTED** | Pending | Accordion & consultation booking |
| `contact` | 15 | Contact / Consultation | **NOT STARTED** | Pending | Support team contact form |
| `footer` | 16 | Global Footer | **NOT STARTED** | Pending | Multi-column links & office addresses |

---

## 19. Section Implementation Records

### Section 03: Statistics / "Every Number Holds a Story"
- **Status:** `REVIEW` (Awaiting client / stakeholder review; NOT LOCKED)
- **Figma Node:** `1753-6940`
- **Components Created:**
  - `src/sections/home/Stats/Stats.tsx`
  - `src/sections/home/Stats/Stats.css`
- **Metrics Implemented:**
  - `08` — Years in Business (Leading zero preserved)
  - `150` — Clients Served
  - `180` — Projects Delivered
- **Typography & Styling:**
  - Heading: `Every Number` (`#0F172A`) + `<span className="wk-stats__title-accent">Holds a Story</span>` (`#0066FF`), clamp(2rem, 3.6vw, 2.75rem), 800 weight.
  - Numbers: `clamp(3.25rem, 6vw, 5.25rem)`, `#0066FF`, 800 weight, `tabular-nums`.
  - Labels: `clamp(0.95rem, 1.2vw, 1.0625rem)`, `#334155`, 600 weight.
  - Dividers: 84px height, 1px width, `#E2E8F0` (`var(--color-border-default)`).
- **Animation Behavior:**
  - Static display adhering strictly to Figma specifications (Figma prototype specifies no motion/counter transitions).
  - Eliminates layout shifting, flashing "0", or animation stalls.
- **Responsive Behavior:**
  - Desktop (>680px): 3-column horizontal row with 2 vertical dividers.
  - Tablet / Mobile (<=680px): Stacked vertical layout; vertical dividers hidden gracefully to avoid overflow; balanced vertical spacing.
- **Accessibility:**
  - Semantic `<section aria-labelledby="stats-heading">` and `<h2>`.
  - Semantic `<article>` items with `aria-label="08 Years in Business"`, etc.
  - Vertical dividers marked with `aria-hidden="true"` and `role="separator"`.
- **Content Verification & Conflict Flag:**
  - Figma Node 1753-6940 displays: `08`, `150`, `180`.
  - Corporate overview / audit PDF displays: `10+ Years`, `350+ Clients`, `500+ Products Delivered`.
  - Followed strict protocol: adhered to Figma design content (`08 / 150 / 180`) and flagged the conflict for user resolution.

### Section 04: AI-Powered Innovation for Your Business
- **Status:** `REVIEW` (Awaiting client / stakeholder review; NOT LOCKED)
- **Figma Node:** `1753-6940`
- **Components Created:**
  - `src/sections/home/AIInnovation/AIInnovation.tsx`
  - `src/sections/home/AIInnovation/AIInnovation.css`
- **Assets Created & Integrated:**
  - `src/assets/ai/ai-how-we-use.png` (AI chat prompt & data analysis interface)
  - `src/assets/ai/ai-helps-business.png` (4 business outcome connectors to central AI node)
  - `src/assets/ai/ai-dlc-method.png` (Inception, Construction, Operations circular lifecycle)
  - `src/assets/ai/ai-saas-smarter.png` (SaaS application window with bright blue AI spark indicator)
- **Content Blocks Implemented:**
  1. `How We Use AI`: "We use AI to automate tasks, analyze data, and build smarter digital experiences tailored to business needs."
  2. `How AI Helps Your Business`: "AI helps reduce manual effort, improve decisions, increase efficiency, and create better customer experiences."
  3. `Our AI DLC Method`: "Discover opportunities, leverage the right AI, and create smarter solutions that deliver real business value."
  4. `Make Your SaaS Smarter With AI`: "We identify the right AI opportunities for your SaaS from AI assistants and smart search to automation, recommendations."
- **Interactive & Motion Behavior:**
  - GPU-accelerated card hover lift (`transform: translateY(-4px); box-shadow: 0 16px 36px rgba(0, 102, 255, 0.08);`).
  - Smooth easing `cubic-bezier(0.16, 1, 0.3, 1)` with 300ms duration.
  - Zero layout thrashing (`transform` and `opacity` only).
  - Reduced motion fully supported: transforms and transitions are disabled when `prefers-reduced-motion: reduce` is active.
- **Responsive Behavior:**
  - Desktop (>900px): 2-column balanced grid (`grid-template-columns: repeat(2, 1fr)`).
  - Tablet (≤900px): Single-column centered stack with max-width 640px.
  - Mobile (≤600px): Fluid card layout with adapted padding (1.25rem), scaled typography (`clamp(1.65rem, 5.5vw, 2.75rem)`), no horizontal overflow.
- **Accessibility:**
  - `<section aria-labelledby="ai-heading">`
  - Heading semantically coded as `<h2>` with accent `<span>`.
  - Cards semantically coded as `<article>` elements with keyboard focus support (`tabIndex={0}` and `:focus-within` outline).
  - Sub-headings coded as `<h3>`.
  - Descriptive `alt` attributes on all illustration graphics for screen reader comprehension.

### Section 05: Smart Technology for Smarter Business Growth
- **Status:** `REVIEW` (Awaiting client / stakeholder review; NOT LOCKED)
- **Figma Nodes:** `1753-6940` (Section layout) & `1046-2805` (Hover interaction component)
- **Components Created:**
  - `src/sections/home/Services/Services.tsx`
  - `src/sections/home/Services/Services.css`
- **Assets Created & Integrated:**
  - `src/assets/services/service-mobile.png` (Mobile phone displaying software code)
  - `src/assets/services/service-web.png` (MacBook laptop displaying code editor)
  - `src/assets/services/service-custom.png` (Smartphone with floating translucent code pane)
  - `src/assets/services/service-blockchain.png` (Isometric 3D blocks representing blockchain technology)
  - `src/assets/services/service-enterprise.png` (Enterprise system cards with code, clock, branch)
  - `src/assets/services/service-aiml.png` (AI microchip with neural circuitry)
- **Services Implemented (6 Offerings):**
  1. `Mobile App Development`: "Transforming ideas into powerful mobile solutions"
  2. `Web Development`: "Creating scalable, high-performance web solutions"
  3. `Custom Software Development`: "Custom software built for your business goals"
  4. `Blockchain Development`: "Powering the future of industries with blockchain solutions"
  5. `Enterprise Software Development`: "Driving business efficiency through enterprise solutions"
  6. `AI-ML Development`: "Unlock business potential through AI-ML solutions"
- **Figma Hover Interaction (Node 1046-2805):**
  - Dark backdrop blur overlay on image container (`rgba(15, 23, 42, 0.72)` with `backdrop-filter: blur(4px)`).
  - Overlay prompt: "Not sure which fits?" in bold white typography.
  - Interactive CTA pill button: "Chat with us ↗" (`#0066FF`, white text, diagonal arrow icon).
  - Subtle image scale on hover (`scale(1.05)`).
  - Card elevation on hover (`translateY(-4px)`, elevated shadow).
  - Full keyboard accessibility: `:focus-within` displays overlay for keyboard users; title and description remain 100% visible and accessible below.
- **Responsive Behavior:**
  - Desktop (>1024px): 3-column grid (`grid-template-columns: repeat(3, 1fr)`).
  - Tablet (640px - 1024px): 2-column grid (`grid-template-columns: repeat(2, 1fr)`).
  - Mobile (≤640px): 1-column card stack with fluid image aspect ratio (`460 / 266`).
- **Accessibility:**
  - `<section aria-labelledby="services-heading">`
  - Section heading coded as `<h2>` with accent `<span>` for "Business Growth".
  - Each card coded as `<article>` with an `<h3>` heading.
  - Descriptive `alt` attributes on all 6 service graphics.
  - Focus indicators for keyboard navigation.

### Section 06: Industry-Focused Solutions for Real Business Challenges
- **Status:** `REVIEW` (Awaiting client / stakeholder review; NOT LOCKED)
- **Figma Nodes:** `1753-6940` (Section layout), `1059-3396` (Manufacturing card & hover state), `1059-3401` (Logistics & Supply Chain card & hover state), `1059-3407` (Education & E-Learning card & hover state)
- **Components Created:**
  - `src/sections/home/Industries/Industries.tsx`
  - `src/sections/home/Industries/Industries.css`
- **Assets Created & Integrated:**
  - `src/assets/industries/manufacturing-illustration.png` (3D robotic welding arm & precision equipment)
  - `src/assets/industries/logistics-illustration.png` (3D cargo airplane, globe, parcel boxes)
  - `src/assets/industries/education-illustration.png` (3D desk globe on stack of textbooks)
- **Industries Implemented (3 Approved Offerings):**
  1. `Manufacturing`: "Automation and systems to improve productivity and operations."
  2. `Logistics & Supply Chain`: "Real time tracking and smarter operational workflows."
  3. `Education & E-Learning`: "Scalable platforms for modern digital learning experiences."
- **Actions Implemented:**
  - Header Action: "View all >>" right-aligned in header, styled with brand blue `#0066FF` and double chevrons.
  - Card Action: "Learn More →" aligned at bottom left of each card with smooth hover arrow offset (`translateX(4px)`).
- **Interactive & Motion Behavior:**
  - Default state: Clean, high-contrast typography over soft `#F8FBFE` ice-blue surface with subtle border.
  - Hover / Focus / Tap state:
    - Card elevates with `translateY(-4px)` and soft drop-shadow (`box-shadow: 0 16px 36px -12px rgba(0, 102, 255, 0.12)`).
    - 3D illustration fades in and slides up (`opacity: 0 -> 1; transform: translateY(14px) -> translateY(0)`).
    - Action arrow nudges 4px right.
  - Carousel track controls:
    - Active progress bar (`#0066FF`) updates dynamically with scroll position.
    - Arrow buttons (`←` and `→`) enable smooth horizontal scrolling.
  - Full support for `prefers-reduced-motion: reduce` (transitions disabled; illustrations rendered statically).
- **Responsive Behavior:**
  - Desktop (>1024px): 3-column equal grid with fixed min-height 440px.
  - Tablet (640px - 1024px): 2-card horizontal scroll-snap view with active progress bar.
  - Mobile (≤640px): 85vw fluid card swipe view; header stacks gracefully without overflow.
- **Accessibility:**
  - Semantic `<section aria-labelledby="industry-heading">` and `<h2>`.
  - Cards coded as `<article>` elements with subheadings as `<h3>`.
  - Interactive elements have full keyboard accessibility (`tabIndex={0}`, `:focus-visible` ring).
  - Meaningful `alt` text provided for illustration graphics.
- **Routes Used & Missing Destinations:**
  - Internal links currently map to `#contact` with explicit `aria-label` context.
  - Dedicated industry pages (`/industries/manufacturing`, `/industries/logistics`, `/industries/education`) do not exist yet in the single-page application and are reported for future multi-page routing.

### Section 07 / 08: Seamless Integrations / Digital Ecosystem
- **Status:** `REVIEW` (Awaiting client / stakeholder review; NOT LOCKED)
- **Figma Nodes:** `1753-6940` (Section layout) & `1212-3075` (Component variants & states)
- **Components Created:**
  - `src/sections/home/Integrations/Integrations.tsx`
  - `src/sections/home/Integrations/Integrations.css`
- **Assets Integrated:**
  - `src/assets/integrations/integration-iot.png` (IoT smart illuminated key)
  - `src/assets/integrations/integration-rpa.png` (Robotic Process Automation microprocessor circuitry on tablet)
  - `src/assets/integrations/integration-aiml.png` (Human hand & robotic cyborg finger connecting around AI brain)
  - `src/assets/integrations/integration-cybersecurity.png` (Cyber Security glowing neon shield emblem with checkmark)
  - `src/assets/integrations/integration-dataanalytics.png` (Data Analytics ascending neon growth curve)
  - `src/assets/integrations/integration-blockchain.png` (Block Chain 3D connected blocks)
- **Technologies Implemented (6 Capabilities):**
  1. `Internet of Things`
  2. `Robotics Process Automation`
  3. `AI & ML`
  4. `Cyber Security`
  5. `Data Analytics`
  6. `Block Chain` (exact Figma wording preserved with space)
- **Interactive & Motion Behavior:**
  - 2-column layout: vertical tab list on left, dynamic image display on right.
  - Active tab rendered with solid brand blue `#1887C9`, white typography, and white SVG icon.
  - Inactive tabs rendered with white surface, `#E2E8F0` border, dark typography `#0F172A`, and smooth hover translation `translateX(4px)` with background tint `#F8FAFC`.
  - Right-side showcase displays the image corresponding to the selected tab with smooth crossfade and subtle scale transition.
  - Full keyboard accessibility: W3C WAI-ARIA tablist pattern with ArrowUp, ArrowDown, Home, End navigation and focus following.
  - Full support for `prefers-reduced-motion: reduce` (transitions and animations disabled).
- **Responsive Behavior:**
  - Desktop (>960px): Balanced 2-column layout with left tab list ~350px and right visual showcase.
  - Tablet (600px - 960px): Stacks vertically; tabs display in a 2-column responsive grid with fluid image showcase below.
  - Mobile (≤600px): Clean single-column stack, fluid touch-friendly tabs with proportional 16:10 image showcase. Zero horizontal overflow.
- **Accessibility:**
  - Semantic `<section aria-labelledby="integrations-heading">` and `<h2>`.
  - Hidden semantic `<h3>` subheadings for all 6 technology capabilities ensuring search engines and screen readers index Webkorps' capability entities in real HTML text.
  - W3C compliant tab pattern with `role="tablist"`, `aria-orientation="vertical"`, `role="tab"`, `aria-selected`, `aria-controls`, and `role="tabpanel"`.
  - Descriptive `alt` text on all images.
  - Focus rings with `:focus-visible` for keyboard users.
- **Entity Consistency & Routes:**
  - Standardized terminology across website. Internal routing will connect directly to dedicated technology pages when multi-page routing is implemented.

### Section 08 / 09: Leadership / "Meet the leaders building what's next."
- **Status:** `REVIEW` (Awaiting client / stakeholder review; NOT LOCKED)
- **Figma Nodes:** `1753-6940` (Section layout) & `1530-2981`, `1530-2969`, `1523-2784`, `1530-2977`, `1530-2965`, `1530-2953`, `1530-2973`, `1530-2961`, `1530-2957` (Leadership card components & states)
- **Components Created:**
  - `src/sections/home/Leadership/Leadership.tsx`
  - `src/sections/home/Leadership/Leadership.css`
- **Assets Integrated:**
  - `src/assets/leadership/chirag-agrawal.png` (High-resolution portrait of Chirag Agrawal over soft blue background)
  - `src/assets/leadership/amul-choudhary.png` (High-resolution portrait of Amul Choudhary over soft blue background)
- **Leaders Implemented:**
  1. `Chirag Agrawal`
     - Title: `CEO & Founder`
     - Quote: `"Success is not about being ahead of others, it's about becoming better than who you were yesterday."`
     - Social Badges: LinkedIn (`#0A66C2`) and Mail (`#1887C9`)
  2. `Amul Choudhary`
     - Title: `COO & Co-Founder`
     - Quote: `"Keep learning, keep growing, and keep moving forward because every small step creates a bigger journey"`
     - Social Badges: LinkedIn (`#0A66C2`) and Mail (`#1887C9`)
- **Card & Carousel Structure:**
  - 2-part horizontal cards with 28px border-radius:
    - Left: Soft ice-blue (`#EDF6FC`) background with portrait photo and decorative organic wave SVG overlay at the bottom.
    - Right: Clean white card content container with Name, Social Badges, Job Title, and semantic `<blockquote>` quote.
  - Carousel track with touch-swipe scroll-snap (`scroll-snap-type: x mandatory`).
  - Circular `<` and `>` arrow navigation buttons (`#F1F5F9` background, `#1887C9` hover).
  - 3 pagination dot indicators with `#1887C9` active state indicator matching Figma specifications.
  - Keyboard navigation: Left/Right arrows on track, Tab navigation, and Enter/Space on buttons.
- **Responsive Behavior:**
  - Desktop (>960px): Horizontal 2-card carousel track with cards sized at `clamp(480px, 48%, 620px)`.
  - Tablet (720px - 960px): Touch-scrollable track with smooth scroll-snap.
  - Mobile (≤720px): Stacked vertical card layout (portrait on top, content below) with 88vw - 92vw width and zero horizontal page overflow.
- **Accessibility:**
  - Semantic `<section aria-labelledby="leadership-heading">` and `<h2>`.
  - Leader names coded as `<h3>` with semantic `<article>` containers.
  - Quotes semantically wrapped in `<blockquote>`.
  - Descriptive alt text: `alt="Chirag Agrawal, CEO & Founder at Webkorps"` and `alt="Amul Choudhary, COO & Co-Founder at Webkorps"`.
  - Focus rings with `:focus-visible` for keyboard users.
  - Respects `prefers-reduced-motion: reduce`.

### Section 09 / 10: Case Studies / "Industry-focused solutions for real business challenges"
- **Status:** `REVIEW` (Awaiting client / stakeholder review; NOT LOCKED)
- **Figma Nodes:** `1750-6228`, `1750-5893`, `1212-3237`
- **Components Created:**
  - `src/sections/home/CaseStudies/CaseStudies.tsx`
  - `src/sections/home/CaseStudies/CaseStudyCard.tsx`
  - `src/sections/home/CaseStudies/caseStudiesData.ts`
  - `src/sections/home/CaseStudies/CaseStudies.css`
- **Assets Integrated:**
  - `src/assets/case-studies/cigna.png` (High-resolution Cigna healthcare platform interface on laptop)
  - `src/assets/case-studies/paypal.png` (High-resolution PayPal payment platform mobile app interface on smartphone)
- **Case Studies Implemented:**
  1. `Cigna`
     - Client: `Cigna`
     - Description: `"Cigna is a health platform that connects patients with doctors for online consultations, appointments, records, and prescriptions across multiple medical specialties."`
     - Taxonomy / Tags: `Website • Healthcare • Health Solutions`
     - Alt Text: `"Cigna healthcare platform interface displayed on a laptop screen"`
     - Route Link: `#case-study-cigna`
  2. `PayPal`
     - Client: `PayPal`
     - Description: `"PayPal partnered with Webkorps to enhance its payment platform with a smoother checkout experience, improved card payment capabilities, and secure, seamless online."` (Preserved exact approved Figma wording)
     - Taxonomy / Tags: `Application • Payment Platform • Custom Application`
     - Alt Text: `"PayPal payment platform mobile app interface displaying balance and transfer features"`
     - Route Link: `#case-study-paypal`
- **Visual Structure & Components:**
  - Header Row:
    - `<h2>` Title: `Industry-focused solutions for` with blue accent `real business challenges` (`#1887C9`).
    - Top Right CTA: `View all >>` link in brand primary blue with smooth hover translation.
  - Cards Container:
    - Multi-card horizontal carousel track on desktop and mobile (`gap: 24px`, CSS scroll-snap `mandatory`, zero scrollbar visible).
    - Desktop (`>900px`): 2 cards visible at a time (`calc(50% - 12px)` width each).
    - Case studies implemented (4 total):
      1. **Cigna:** Website • Healthcare • Health Solutions
      2. **PayPal:** Application • Payment Platform • Custom Application
      3. **Canopie:** Mental Health App • Healthcare • Website
      4. **Pebble:** Application • Smartwatch App • Fitness Tracking
    - Outer card: white background, `#EDF2F7` border, 20px border radius, 24px padding.
    - Inner visual container: soft `#F9FDFF` ice-blue background, 14px border radius, `object-contain` display.
    - Card body: `<h3>` client heading, 15px muted description (`#475569`), and semantic dot-separated taxonomy tags (`#64748B`).
  - Bottom Navigation:
    - Reading progress bar track: `#CBD5E1` background, 3px height, pill border radius, with `#1887C9` active progress indicator dynamically mapped from visible ratio (50%) to 100%.
    - Accessible navigation buttons: Left arrow `←` and right arrow `→` with click-to-scroll, hover states, `:focus-visible` rings, and ARIA labels.
- **Interactions & Motion:**
  - Card hover: Elevated drop-shadow `0 12px 32px -8px rgba(15, 23, 42, 0.08)`, subtle border tint `#BFDBFE`, and GPU-accelerated gentle scale `scale(1.02)` on the device mockup.
  - Arrow buttons: Smooth scrolling across cards on desktop and touch screens with dynamic progress bar updates.
  - Full support for `prefers-reduced-motion: reduce` (all transforms and transitions nullified).
- **Responsive Behavior:**
  - Desktop (>900px): 2 cards visible per view with interactive slider navigation for all 4 cards.
  - Tablet (600px - 900px): Horizontal touch-scrollable swipe track with 85% width card peek layout.
  - Mobile (≤600px): Fluid 90% card touch-swipe track with edge-to-edge padding, scaled typography (`clamp(1.85rem, 3.2vw, 2.75rem)`), fluid 230px visual height, and responsive bottom navigation controls. Zero horizontal page overflow.
- **Accessibility:**
  - Semantic `<section id="case-studies" aria-labelledby="case-studies-heading">`.
  - Heading hierarchy: `<h2>` section heading, `<h3>` client names within `<article>` card elements.
  - No nested links: clean semantic structure with accessible category tags and non-intrusive interactive focus.
  - Progress bar provides `role="progressbar"`, `aria-label`, and `aria-valuenow`.
  - Arrow buttons provide `aria-label="Previous case study"` and `aria-label="Next case study"`.
- **Missing Routes & Content Notes:**
  - Dedicated case-study destination pages (`/case-studies/cigna`, `/case-studies/paypal`, `/case-studies/canopie`, `/case-studies/pebble`) and `/case-studies` index do not exist in the project yet; internal links currently anchor to `#case-study-*`.
  - The PayPal description appears to end with "and secure, seamless online." which is preserved verbatim from the provided source text.

---

### Section 10: Trusted OEM Partners. Proven Technology
- **Status:** `REVIEW` (Awaiting client / stakeholder review; NOT LOCKED)
- **Figma Node:** `1753-7030`
- **Components Created:**
  - `src/sections/home/TrustedOEMPartners/TrustedOEMPartners.tsx`
  - `src/sections/home/TrustedOEMPartners/TrustedOEMPartners.css`
  - `src/sections/home/TrustedOEMPartners/oemPartnersData.ts`
- **Partner Logos Implemented (9 Approved OEM Partners):**
  1. **Salesforce** (Outer Orbit, Zenith/Top `94.0°`, 116px badge, blue cloud asset)
  2. **AWS** (Outer Orbit, Upper-Left `112.5°`, 116px badge, orange smile asset)
  3. **CloudSEK** (Outer Orbit, Upper-Right `52.2°`, 116px badge, star/network asset)
  4. **Cisco** (Middle Orbit, Lower-Left `147.0°`, 116px badge, blue signal bars asset)
  5. **Trellix** (Middle Orbit, Mid-Left `126.7°`, 116px badge, teal/blue chevron asset)
  6. **Fortinet** (Middle Orbit, Upper-Right `80.4°`, 116px badge, red grid mark asset)
  7. **HPE Juniper Networking** (Middle Orbit, Lower-Right `32.4°`, 116px badge, dark wordmark asset)
  8. **Sysdig** (Inner Orbit, Inner-Left `114.8°`, 116px badge, teal shovel asset)
  9. **Adobe** (Inner Orbit, Inner-Right `73.1°`, 116px badge, red 'A' mark asset)
  - Sizing Calibrations: All 9 logos cropped directly to their exact ink bounds (eliminating extraneous padding), placed in uniform 116px circular badges on desktop (`clamp(88px, 8vw, 120px)`), with aspect-ratio-tuned sizing (72%–82% badge fill) matching the Figma visual weight.
- **Central Webkorps Anchor:**
  - Webkorps logo (`src/assets/oem/logo_webkorps.png`) seated at the apex of the central `#FFFFFF` dome surface.
  - Stationary, non-rotating, stable anchor (`z-index: 10`). Orbiting badges in the lower half smoothly pass underneath the solid dome and remain cleanly clipped.
- **Concentric Orbital Paths & Geometry:**
  - Background SVG with exact concentric color bands matching Figma:
    - Outermost band: `#F2F8FE` (radius $R_4 = 922\text{px}$)
    - Middle band: `#E8F2FB` (radius $R_3 = 788\text{px}$)
    - Inner band: `#E1EEFB` (radius $R_2 = 624\text{px}$)
    - Central dome: `#FFFFFF` (radius $R_1 = 380\text{px}$)
    - Subtle dashed orbital guide lines (`stroke="#D8E8F5"`).
- **Motion Implementation & Mechanics:**
  - Continuous 360° circular orbital motion using GPU-accelerated CSS `transform: rotate(...)`.
  - Counter-rotation on every child logo badge ensures all partner logos **ALWAYS REMAIN 100% HORIZONTALLY UPRIGHT AND LEGIBLE**.
  - Distinct orbital velocities per layer:
    - Inner orbit: 60s
    - Middle orbit: 80s
    - Outer orbit: 100s
  - Interactive hover state: Hovering over the stage or any logo pauses the orbit (`animation-play-state: paused`), with subtle badge elevation (`scale(1.08)` and glowing shadow).
  - Mathematical seamless loop: Pure continuous degree rotation (`0deg` to `360deg`) eliminates resets, jumps, or stutters.
- **Responsive Behavior:**
  - Desktop (>1024px): Full 1600px stage width with complete multi-tier orbital trajectories.
  - Tablet (768px - 1024px): Fluid radii scaling (`--stage-r: clamp(260px, 35vw, 560px)`), badge scale `0.75 - 0.85`.
  - Mobile (≤768px): Compact stage height (`340px - 440px`), adjusted radii (`185px - 320px`), badge scale `0.58 - 0.65`, zero horizontal overflow or clipping anomalies.
- **Accessibility:**
  - Semantic `<section id="oem-partners" aria-labelledby="oem-partners-heading">`.
  - Semantic `<h2>` with accessible `<span className="wk-oem__title-accent">OEM Partners.</span>` styling.
  - Every partner badge is keyboard-focusable with visible focus rings (`:focus-visible`) and `aria-label="[Partner Name] partner logo"`.
  - `@media (prefers-reduced-motion: reduce)`: Shuts off animations completely (`animation: none !important`). All 9 logos remain in their exact static Figma resting coordinates.
- **Performance:**
  - 0 React state updates during animation (no `setState` or per-frame re-renders).
  - Uses strictly GPU-composited CSS transforms (`transform`). Zero layout thrashing.
  - Production build time < 500ms; zero Oxlint warnings/errors.

### Section 11 / 12: Need Technology Partner Callout / "Need the Right Technology Partner?"
- **Status:** `REVIEW` (Awaiting client / stakeholder review; NOT LOCKED)
- **Figma Node:** `942-1926`
- **Components Created:**
  - `src/sections/home/NeedPartnerCallout/NeedPartnerCallout.tsx`
  - `src/sections/home/NeedPartnerCallout/NeedPartnerCallout.css`
- **Assets Integrated:**
  - `src/assets/Technology Partner/Entrepreneur_giving_positive_fee…_202609081049 1.png` (High-resolution mobile smartphone mockup with video consultation)
- **Structure & Composition:**
  - 2-column layout enclosed in a rounded card (`border-radius: clamp(24px, 3.2vw, 40px)`) with subtle gradient `#F0F7FD -> #FFFFFF -> #F4F9FD` and border `1px solid rgba(24, 135, 201, 0.16)`.
  - Left Column:
    - Semantic `<h2>`: "Need the Right <span className="wk-tech-partner__title-accent">Technology</span> Partner?"
    - Subtitle `<p>`: "Build faster, innovate smarter, and scale confidently with Webkorps."
    - Primary CTA: "Let's Talk ↗" pill button (`#1887C9`) with hover glow and arrow micro-animation.
  - Right Column:
    - Smartphone device mockup seated above an ambient circular radial glow (`#D5EBFE`) and dashed decorative aura ring.
    - Hover lift micro-interaction on desktop.
- **Responsive Behavior:**
  - Desktop (>992px): 2-column layout.
  - Tablet & Mobile (≤992px): Centered single-column stacked layout with fluid typography and scalable smartphone visual.
- **Accessibility & Performance:**
  - Semantic `<section id="technology-partner" aria-labelledby="tech-partner-heading">`.
  - Fully accessible `:focus-visible` ring on the CTA button.
  - Respects `@media (prefers-reduced-motion: reduce)`.
  - Built cleanly with zero Oxlint errors.

### Section 12: Insights / Blog / "Explore Blogs, insights, and stories shaping the future."
- **Status:** `REVIEW` (Awaiting client / stakeholder review; NOT LOCKED)
- **Figma Node:** `942-1926`
- **Components Created:**
  - `src/sections/home/Insights/Insights.tsx`
  - `src/sections/home/Insights/Insights.css`
  - `src/sections/home/Insights/BlogCard.tsx`
  - `src/sections/home/Insights/BlogCarousel.tsx`
  - `src/sections/home/Insights/insightsData.ts`
- **Assets Integrated:**
  - `src/assets/Blog/image 368.png` (Industrial IoT diagnostic laptop display with failure indicator)
  - `src/assets/Blog/image 369.png` (Power BI revenue and analytics dashboard on laptop)
- **Approved Articles Implemented:**
  1. *Industrial IoT Pilots Are Failing. Here Is Where*
     - Date: `August 19, 2026` (`datetime="2026-08-19"`)
     - Category: `AI-ML Development`
     - CTA: `Read Blog ↗`
  2. *Power BI Consulting for Digital Transformation*
     - Date: `June 23, 2026` (`datetime="2026-06-23"`)
     - Category: `Technology`
     - CTA: `Read Blog ↗`
- **Carousel & Navigation Mechanics:**
  - Desktop Viewport: 2 cards visible simultaneously with horizontal slide track.
  - Controls: Circular Previous and Next arrow buttons with accessible `:focus-visible` states and disabled state at extremities.
  - Progress Indicator: Real-time progress bar reflecting visible viewport coverage (starts at ~50% for 2 of 4 cards, expands to 100% at track end).
  - Touch & Swipe: Native touch-swipeable track on mobile and tablet (`scroll-snap-type: x mandatory`).
- **Responsive Behavior:**
  - Desktop (>992px): 2 cards visible side-by-side (`calc((100% - gap) / 2)`).
  - Tablet (641px - 992px): Fluid card sizing (`clamp(320px, 75%, 480px)`).
  - Mobile (≤640px): 1 card visible at a time (`90vw`), text remains fully readable with artwork subtly positioned.
- **Accessibility & SEO:**
  - Semantic `<section id="insights" aria-labelledby="insights-heading">`.
  - Single semantic `<h2>` with styling span for `"shaping the future."`.
  - Article cards use `<article>` and `<h3>` heading tags.
  - Dates use semantic `<time datetime="...">` tags.
  - Zero body horizontal overflow (`overflow-x: hidden`).
  - Respects `@media (prefers-reduced-motion: reduce)`.

### Section 13 / 14: Frequently Asked Questions (FAQ)
- **Status:** `REVIEW` (Awaiting client / stakeholder review; NOT LOCKED)
- **Figma Node:** `942-1926`
- **Components Created:**
  - `src/sections/home/FAQ/FAQ.tsx`
  - `src/sections/home/FAQ/FAQItem.tsx`
  - `src/sections/home/FAQ/FAQCTA.tsx`
  - `src/sections/home/FAQ/faqData.ts`
  - `src/sections/home/FAQ/FAQ.css`
- **Structure & Visual Hierarchy:**
  - Centered Section Heading: Semantic `<h2>` with "Frequently Asked <span className="wk-faq__title-accent">Questions</span>".
  - Interactive Accordion Stack: 4 individual rounded cards (`border-radius: 12px`, `border: 1px solid #E2E8F0`, `background: #FFFFFF`, `16px gap`).
  - First Item Expanded by Default: FAQ 1 ("When was Webkorps founded?") is open on initial load with the approved answer and minus icon (`−`).
  - Remaining Items Collapsed by Default: FAQs 2, 3, and 4 are collapsed with plus icons (`+`).
  - Bottom CTA Card: Rounded surface (`border-radius: 16px`) with `<h3>Still have question?</h3>`, subtitle guidance text, and a centered pill button `Book a Consultation ↗` (`#1887C9`) linking to `#contact`.
- **Content & Authenticity:**
  - FAQ 1 Approved Answer: "Webkorps was founded with a vision to deliver excellence in IT services. We have been empowering businesses with innovative solutions for over 10 years."
  - FAQs 2, 3, 4: Questions preserved exactly from Figma without keyword stuffing. Missing answers are strictly flagged with a "Pending Client Confirmation" badge instead of fabricating placeholder claims.
- **Accordion Mechanics & Accessibility:**
  - Accordion triggers use accessible semantic `<button>` elements with `aria-expanded` and `aria-controls`.
  - Answer panels use stable IDs and `role="region"` associated via `aria-labelledby`.
  - Full keyboard navigability (Enter / Space to toggle, visible `:focus-visible` outline).
  - Smooth height transition powered by modern CSS Grid (`grid-template-rows: 0fr -> 1fr`) with zero layout thrashing.
  - Plus/minus icon smoothly transitions with SVG animation.
- **Responsive Behavior:**
  - Desktop (>1024px): Centered container (`max-width: 1000px`).
  - Tablet (768px - 1024px): Fluid item padding and comfortable line widths.
  - Mobile (≤768px): Fluid typography (`clamp(1.75rem, 3.5vw, 2.75rem)`), natural wrapping on multi-line questions, aligned plus/minus icons, zero horizontal overflow.
- **Structured Data / Schema Rule:**
  - Did not generate premature or fabricated `FAQPage` schema data since answers 2–4 remain pending client confirmation.
- **Reduced Motion Support:**
  - `@media (prefers-reduced-motion: reduce)` removes all panel and icon transitions while preserving full toggle functionality.

### Section 14 / 15: Contact / Lead Generation ("Talk to Our Support Team")
- **Status:** `REVIEW` (Awaiting client / stakeholder review; NOT LOCKED)
- **Figma Node:** `1267-2517`
- **Components Created:**
  - `src/sections/home/Contact/Contact.tsx`
  - `src/sections/home/Contact/ContactForm.tsx`
  - `src/sections/home/Contact/ContactVisual.tsx`
  - `src/sections/home/Contact/Contact.css`
- **Assets Integrated:**
  - `src/assets/talktoourexpert.png` (High-resolution 3D isometric composition with magnifying glass, map graphic, and blue location marker)
- **Structure & Desktop Composition:**
  - 2-Column Responsive Layout:
    - **Left Column:**
      - Single semantic `<h2>`: "Talk to Our <br /><span className="wk-contact__title-accent">Support Team</span>"
      - 3D Isometric Visual: `talktoourexpert.png` positioned directly below the heading with subtle ambient drop-shadow.
    - **Right Column:**
      - Form Card: Enclosed in rounded white card (`background: #FFFFFF`, `border: 1px solid #E2E8F0`, `border-radius: 24px`, `box-shadow: 0 8px 30px rgba(15, 23, 42, 0.04)`).
- **Form Fields & Semantics:**
  - Semantic `<form noValidate>` element with explicit `<label htmlFor="...">` bindings for every input:
    1. `Full Name *`: `type="text"`, `autoComplete="name"`, `placeholder="Enter Full Name"`.
    2. `Email Address *`: `type="email"`, `autoComplete="email"`, `placeholder="Enter Email Address"`.
    3. `Phone Number *`: `type="tel"`, `autoComplete="tel"`, `placeholder="Enter Phone Number"`.
    4. `Message *`: `<textarea rows={4}>`, `placeholder="Write Your Message Here"`.
  - Primary CTA: `<button type="submit">` labeled `Send Message ↗` (`#1887C9`) with hover glow and arrow micro-animation.
- **Client-Side Validation & Accessible UX:**
  - Field-level validation on blur and submit:
    - Full Name: Non-empty, minimum 2 characters.
    - Email Address: Standard RFC-compliant email regex.
    - Phone Number: Permissive international format allowing `+`, `-`, spaces, `()`, requiring at least 7 digits (does not reject international numbers).
    - Message: Non-empty, minimum 5 characters.
  - Accessible error indicators: `aria-invalid="true"`, `aria-describedby="[field]-error"`, focused error scroll to the first invalid field on failed submission.
  - Does not log sensitive form data to console or localStorage.
- **Submission States:**
  - `idle`: Standard pristine form.
  - `submitting`: Disables submit button to prevent duplicate submissions, displays animated CSS spinner and "Sending...".
  - `success`: Renders an accessible confirmation banner (`role="status"`, `aria-live="polite"`) with checkmark icon and "Send Another Message" action.
  - `error`: Displays accessible error alert if transmission fails.
- **Backend / Integration Status:**
  - *Submission endpoint/integration not available.* Form handles validation and simulated network flow client-side. Dedicated CRM / email backend endpoint required for production deployment.
- **Responsive Behavior:**
  - Desktop (>992px): 2-column layout.
  - Tablet & Mobile (≤992px): Stacked single-column layout (Heading → Visual → Form Card). Fluid card padding and typography prevent any horizontal overflow.
- **Reduced Motion Support:**
  - `@media (prefers-reduced-motion: reduce)` removes button transforms and spinner animations.

### Section 15 / 16: Footer
- **Status:** `REVIEW` (Awaiting client / stakeholder review; NOT LOCKED)
- **Figma Node:** `1207-2502`
- **Components Created:**
  - `src/sections/home/Footer/Footer.tsx`
  - `src/sections/home/Footer/FooterCTA.tsx`
  - `src/sections/home/Footer/FooterNav.tsx`
  - `src/sections/home/Footer/FooterLocations.tsx`
  - `src/sections/home/Footer/FooterBottom.tsx`
  - `src/sections/home/Footer/footerData.ts`
  - `src/sections/home/Footer/Footer.css`
- **Structure & Architectural Layers:**
  - Semantic `<footer id="footer" className="wk-footer" role="contentinfo">`:
    1. **Layer 1 — Final CTA & Contact/Social Card:**
       - Left: Heading `<h3>Ready to get started?</h3>`, description, and dual actions (`Contact Sales` outline button + `Start Now ↗` primary pill button linking to `#contact`).
       - Right: Enclosed contact card (`#F8FAFC`) with quote inquiry prompt, clickable `contact@webkorps.com` mailto link, and 4 official social icons (Instagram, LinkedIn, Facebook, X) in brand blue outline badges.
    2. **Layer 2 — 5-Column Global Navigation Grid:**
       - Categories: **Company**, **Events**, **Services**, **Technology**, **Industry**.
       - Vertical crisp divider lines (`1px solid #E2E8F0`) between all 5 columns on desktop.
       - Exact Figma nomenclature and capitalization preserved (`AI&ML services`, `RoR`, `JAVA`, `IOS`, `Logistic Industry`).
    3. **Layer 3 — 5-Column Global Office Locations:**
       - Exact corporate entity addresses rendered with semantic `<address>` elements:
         - **Indore, India (HQ):** 4th Floor, Winway World Offices, Vijay Nagar, Indore, Madhya Pradesh 452010
         - **Pune, India:** Trios Co-working, 3rd floor, Lalwani Icon, off New Airport Road, Sakore Nagar, Viman Nagar, Pune, Maharashtra 411014
         - **Bengaluru, India:** 7th Floor, Commerce Mantri, 12, 1 & 2, Bannerghatta Road, BTM 2nd Stage, BTM Layout, Bengaluru, Karnataka 560076
         - **Frisco, TX:** 6160 Warren Parkway, Suite 100 Frisco, Texas 75034
         - **Sheridan, WY:** 1309 Coffeen Ave, STE B1, Sheridan, WY 82801
    4. **Layer 4 — Legal & Copyright Bottom Bar:**
       - Left: `© 2026 Webkorps. All rights reserved.`
       - Center: Privacy Policy, Cookies, Legal Disclaimer, Sitemap links.
       - Right: `India` region indicator.
- **Responsive Behavior:**
  - Desktop (>1024px): Full 5-column navigation with vertical dividers, 5-column office location strip, horizontal bottom row.
  - Tablet (768px - 1024px): Navigation and offices wrap to 3 columns and 2 columns without clipping.
  - Mobile (≤768px): Stacked layout, 2-column navigation/offices grid, vertical dividers seamlessly drop, full touch targets (minimum 44px), zero horizontal overflow.
- **Accessibility & SEO:**
  - Semantic `<nav aria-label="Footer Navigation">` and `<nav aria-label="Legal Navigation">`.
  - Accessible names on all social links (`aria-label="Webkorps on LinkedIn"` etc).
  - High-contrast `:focus-visible` outlines on all interactive links and buttons.
  - Respects `@media (prefers-reduced-motion: reduce)`.

---

## 20. Known Issues

1. **Stats Discrepancy:** The visual landing-page design presents:
   - `08 Years in Business`
   - `150 Clients Served`
   - `180 Projects Delivered`  
   However, historical corporate documents and audit reports cite `10+ Years`, `350+ Clients`, and `500+ Products Delivered`. Flagged for business stakeholder confirmation before production lock.
2. **Client Case Studies Approval:** PayPal, Cigna, Verizon, Wendy's, and ABP News appear in visual assets and report references. Ensure written client logos/case study approvals are confirmed for production deployment.

---

## 21. Open Questions

1. Which statistics should be displayed in Section 04 (the design numbers `08 / 150 / 180` or the updated corporate numbers `10+ / 350+ / 500+`)?
2. Are specific Figma node IDs available for Section 01 (Header) and subsequent sections?
