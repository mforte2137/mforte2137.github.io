// netlify/functions/ask-ai.js
// Receives a user question and returns tool recommendations using the KB

const TOOL_KB = `
TOOL: Product & Service Explainer
WHAT: Generates a single polished, benefit-led explainer widget for any product or service an MSP is quoting. Three visual styles: Layered Rows (icon + label + description rows, alternating tints), Numbered Blocks (numbered items with colour bar left and badge right, best for software bundles), Benefit Grid (2x2 grid of icon + title + description, best for hardware and multi-feature products). AI knows common MSP products (Meraki, Dell, Microsoft 365 SKUs, Yealink, SentinelOne, Huntress, Datto, Acronis etc.) and writes accurate benefit content. Designed for fast batch use — MSP generates one widget per line item in sequence.
WHO: MSP sales reps building any Salesbuildr quote who want professional explainer widgets for their products and services.
INPUT: Product/service name, category, optional one-line context, visual style choice, colour theme.
OUTPUT: One TinyMCE-ready explainer widget — push to Salesbuildr or copy HTML.
USE WHEN: Adding products or services to a Salesbuildr quote and wanting to explain what they do in plain language the buyer can understand. Replacing plain line items with visual, benefit-oriented explainers.
NOT FOR: Full proposal narrative — use Proposal Widget Builder. Pricing or cost information. Multiple products in one widget — generate one per product.
URL: https://widgetcreator.netlify.app/product-explainer.html

TOOL: Multi-Stakeholder Proposal Pack
WHAT: Generates three versions of the same proposal story — one for each key stakeholder — from a single input describing the engagement. CEO version: risk, business continuity, strategic partnership. CFO version: cost comparison table (Managed IT vs In-House vs Break-Fix), ROI framing using real benchmarks, cost of inaction. IT & Operations version: technical credibility, methodology, transition process, day-to-day staff impact, co-managed framing if relevant. Prospect or Existing Client toggle shapes tone throughout. MSP chooses separate widgets or a combined pack.
WHO: MSP sales reps sending proposals to companies with more than one decision-maker.
INPUT: Client type (Prospect / Existing Client), client name, industry, company size, services being proposed (quick checkboxes), optional one-line context per stakeholder, colour theme.
OUTPUT: Up to three stakeholder widgets — push separately, as a combined pack, or copy HTML. MSP adds pricing and line items in Salesbuildr separately.
USE WHEN: A proposal is going to multiple decision-makers with different priorities. A deal has stalled because someone on the committee isn't convinced. You want each reader to find content written for their specific concerns.
NOT FOR: Single decision-maker proposals. Detailed pricing — the CFO widget is qualitative only. Use with the Proposal Widget Builder for the complete sales narrative.
URL: https://widgetcreator.netlify.app/multi-stakeholder-pack.html

TOOL: Business Review Builder
WHAT: Builds a professional client business review with three distinct outputs — (1) a full-screen web-based slideshow for in-person meetings (open in browser, present full-screen, arrow key navigation), (2) a PDF via browser print for emailing as a follow-up or to smaller clients, and (3) Salesbuildr widgets pushed individually or as a pack for a combined QBR + proposal ideal for accounts where face-to-face meetings aren't possible. Eight toggleable sections: Title/Cover, Period in Review, Security Posture Update, What We Delivered, Technology Health, Looking Ahead, Investment Summary, and Recommended Services. Logo upload (PNG/SVG/JPG), colour theme selector, auto-save sessions via Netlify Blobs.
WHO: MSP account managers, vCIOs, or owners preparing for quarterly reviews, annual reviews, or any structured client conversation — in person or remote.
INPUT: Client name, review period, review type, logo upload, colour theme, industry, and guided fields per active section (support stats, security figures, project wins, technology health, roadmap priorities, investment figures, service gaps).
OUTPUT: Three outputs — full-screen presentation (present in-browser), PDF (browser print to email), and Salesbuildr widgets (push individually or as a pack, combine with recommended services for QBR + proposal).
USE WHEN: Preparing for a QBR or annual review. Sending a business review remotely via Salesbuildr to smaller clients. Identifying and presenting upsell opportunities as part of a review. Combining a structured review with a proposal for services in one Salesbuildr quote.
NOT FOR: In-flight project status updates — use Project Reports. PSA or RMM data is not pulled automatically — all inputs are manual.
URL: https://widgetcreator.netlify.app/business-review.html

TOOL: Proposal Defence Kit
WHAT: A modular tool for stalled or rejected proposals. Three optional modules — Competitor Comparison (calm value comparison when a cheaper quote has been mentioned), Pricing Justification (breaks down what's included and reframes cost as insurance), and Objection & FAQ (addresses specific concerns in a confident FAQ widget). Each active module generates a customer-facing widget for a re-quote AND private talking points for the follow-up call, shown in an on-screen modal with a copy button.
WHO: MSP sales reps dealing with a stalled proposal, a rejected quote, a competitor mention, or pricing pushback.
INPUT: Prospect name, industry, offering description, situation. Per module: competitor details and differentiators (Module 1), monthly price and services included (Module 2), preset or custom objections (Module 3). Colour theme.
OUTPUT: Up to three customer-facing widgets (push to Salesbuildr individually or as a pack, or copy HTML) plus private talk track copied from an on-screen modal.
USE WHEN: A proposal has been declined or gone quiet. A prospect mentioned a competitor or cheaper quote. Price or value objections have been raised. You need structured talking points before a follow-up call or meeting.
NOT FOR: New business proposals — use Guided Sales Tool or Proposal Widget Builder. Making specific claims about competitors that cannot be substantiated.
URL: https://widgetcreator.netlify.app/proposal-defence-kit.html

TOOL: Technology Roadmap Builder
WHAT: Guided discovery tool that generates four executive-facing Salesbuildr widgets from a structured technology assessment. Works for prospects (aspirational tone) and existing customers (strategic continuation tone). MSP completes a discovery form using dropdowns, chip selectors, and a preset service library — minimal typing. Sessions auto-save to localStorage so the MSP can pause and resume. Includes colour theme selector.
WHO: MSP sales reps, account managers, or vCIOs presenting a technology roadmap as part of a proposal or account review.
INPUT: Client type (Prospect / Existing Customer), industry vertical (12 options), company size, current stack assessment (endpoints, email, security, backup, connectivity etc. — all dropdowns), business goals (multi-select chips), phased roadmap (3 phases with timeframes and services from a preset library), optional budget range and constraints.
OUTPUT: Four widgets — Where You Are Today, Your Technology Roadmap (phased table), Business Outcomes, and Investment Summary. Push individually or as a pack to Salesbuildr, or copy HTML.
USE WHEN: Positioning as a strategic partner rather than a vendor. A prospect or customer wants to understand their technology direction over 12–24 months. Preparing for a QBR, strategic review, or new business proposal that needs a roadmap component.
NOT FOR: Simple hardware or product quotes. Detailed pricing proposals — Investment Summary is narrative only, no specific figures. Requires manual discovery input — no PSA or RMM integration.
URL: https://widgetcreator.netlify.app/technology-roadmap.html

TOOL: Renewal Proposal Widget Creator
WHAT: Paste in a Salesbuildr renewal quote URL — the tool reads the services automatically and generates up to seven targeted proposal widgets ready to push to your widget library. Standard mode for healthy clients, At-Risk mode for clients who are wavering or have raised concerns. At-Risk mode addresses the client's specific concern directly. Optional upsell selections generate additional benefit-led recommendation cards. Sessions auto-save so reps can pause and resume.
WHO: MSP account managers preparing for a contract renewal — routine or where the client relationship needs defending.
INPUT: Salesbuildr renewal quote URL (services read automatically), mode selection (Standard / At-Risk), optional support stats and highlights, optional client concerns and proposed response (At-Risk), optional upsell service selections, colour theme.
OUTPUT: Up to seven widgets — Executive Cover Letter, Value Delivered, IT Partnership Summary, Why Continuity Matters, What's Included, What's Next / Our Commitment, plus Recommended Addition cards per upsell. Push individually, as a pack, or copy HTML.
USE WHEN: A managed services contract is coming up for renewal. A client has raised concerns or gone quiet. You want to make a structured, professional case for renewal rather than just resending the same quote.
NOT FOR: New business proposals — use Guided Sales Tool or Proposal Widget Builder. Hardware-only quotes. Requires the renewal quote to be created in Salesbuildr first.
URL: https://widgetcreator.netlify.app/renewal-pack.html

TOOL: Industry Proposal Pack
WHAT: Generates five short, coordinated Salesbuildr widgets tailored to a specific industry vertical. Widgets cover: Industry Pain Points, Why IT Matters to Your Business, Compliance & Risk, Our Approach for the vertical, and What's Included. Supports Generic or Personalised mode with Salesbuildr merge tags ({{company.name}}, {{contact.firstName}}, {{servicingBranch.name}}). Includes colour theme selector with 8 presets and custom hex.
WHO: MSP sales reps pitching to prospects in a specific industry vertical who want their proposal to speak the buyer's language and demonstrate genuine sector knowledge.
INPUT: Industry vertical (Healthcare, Legal, Accounting & Finance, Education, Government & Municipalities, Manufacturing, Construction, Real Estate, Non-Profit, Insurance, Engineering & Architecture, or Professional Services), optional engagement description, merge tag mode, and colour theme.
OUTPUT: Five industry-tailored widgets — push as a full pack or individually to Salesbuildr, or copy combined HTML.
USE WHEN: Pitching to a prospect in a specific industry and wanting the proposal to feel genuinely tailored to their sector. Wanting to demonstrate compliance knowledge, sector pain points, and specialist positioning without writing it from scratch.
NOT FOR: Generic proposals without a clear vertical. Use the Proposal Widget Builder for the core sales narrative.
URL: https://widgetcreator.netlify.app/industry-proposal-pack.html

TOOL: Case Study Widget Builder
WHAT: Generates a polished case study widget from a customer win. The MSP enters the industry, challenge, solution, and outcome — AI writes the narrative. Toggle between using the real company name or anonymising to a descriptor like "a mid-sized healthcare provider". Includes a colour theme selector with 8 presets and custom hex.
WHO: MSP sales reps or owners who want to include social proof in proposals without writing case studies from scratch.
INPUT: Industry, company size, location (optional), the challenge, the solution, the outcome, engagement type, optional client quote, and a colour theme.
OUTPUT: A professional, colour-branded case study widget with headline, challenge, solution, and outcome sections — TinyMCE-ready, with Copy HTML or Push to Salesbuildr export.
USE WHEN: Pitching to a prospect in the same industry as an existing customer win. Wanting to add credibility and social proof to a proposal quickly and professionally.
NOT FOR: Collecting reviews or producing long-form case study documents.
URL: https://widgetcreator.netlify.app/case-study-widget.html

TOOL: Upsell Services Widget Builder
WHAT: Generates a curated, branded widget listing complementary services that pair with any managed services proposal. Acts as a mini-roadmap and conversation starter — showing the customer a logical path of future services alongside the current engagement.
WHO: MSPs sending project-type proposals who want to identify and present complementary services to generate future revenue.
INPUT: Choose a pre-set engagement type (e.g. M365 migration, network refresh, security deployment) or describe a custom project. Add your own proprietary services to the AI-generated list.
OUTPUT: A Salesbuildr-ready widget with AI-generated complementary services — tagged as recommended or optional, reordered to preference, colour-branded, and ready to paste or push directly into a quote.
USE WHEN: Sending a managed services or project proposal and wanting to open conversations about additional services. Wanting to position yourself as a strategic partner with a forward-looking roadmap.
NOT FOR: Simple hardware or product-only quotes with no service component.
URL: https://widgetcreator.netlify.app/complementary-services.html

TOOL: Copilot Proposal Widget Pack
WHAT: Generates customer-facing proposal widgets for selling Microsoft 365 Copilot to SMB clients. Plain-language, no marketing hype. Six toggleable sections: What Copilot Does in Plain English (app-by-app, industry-specific), What This Means for Your Team (concrete day-in-the-life scenarios), Your Data Stays Yours (data privacy facts, calm and factual), Getting Started (realistic adoption timeline), optional Investment section (ROI framing using Forrester benchmarks — 14-26 minutes saved per user per day), and optional Readiness Confirmed section. Optional tier comparison matrix for MSPs proposing multiple SKU options. Second tool in the AI Tools family.
WHO: MSP sales reps proposing Microsoft 365 Copilot Business or M365 Copilot to SMB clients after an AI Readiness Assessment.
INPUT: Client name, industry, company size, Copilot SKU (Business / Business Standard bundle / Business Premium bundle / Enterprise), readiness status, MSP name, section toggles, colour theme.
OUTPUT: Customer-facing widgets for a Salesbuildr proposal — push individually or as a pack, or copy HTML. MSP adds Copilot licence line items in Salesbuildr separately.
USE WHEN: Proposing Microsoft 365 Copilot to an SMB client. A prospect asks what Copilot actually does. You need to address data privacy concerns in a proposal. Building a Copilot proposal after an AI Readiness Assessment.
NOT FOR: Technical Copilot deployment or configuration. Use AI Readiness Proposal Pack first if the client has not completed a readiness assessment.
URL: https://widgetcreator.netlify.app/copilot-proposal-pack.html

TOOL: AI Readiness Proposal Pack
WHAT: Generates customer-facing proposal widgets for selling an AI Readiness service engagement — before any assessment work has been done. Explains what the readiness service includes (Identity & Access, Data Governance, Security Baseline), why it's essential before deploying Microsoft 365 Copilot, what deliverables the client receives, and what the risk is of skipping it. Five toggleable sections plus an optional tier comparison matrix. Industry-specific framing across 12 verticals. First tool in the AI Tools family — designed to be used before the Copilot Proposal Widget Pack.
WHO: MSP sales reps proposing an AI Readiness service to clients considering Microsoft 365 Copilot or AI tooling.
INPUT: Client name, industry, company size, Copilot SKU being considered, MSP name, section toggles, colour theme.
OUTPUT: Customer-facing widgets for a Salesbuildr proposal — push individually or as a pack, or copy HTML. MSP adds service line items in Salesbuildr separately.
USE WHEN: A client is asking about Copilot or AI. You want to position readiness as the essential first step before deployment. Building a proposal for an AI Readiness engagement.
NOT FOR: Showing assessment results — this tool sells the service before the work begins. Use after a readiness assessment is complete to build the Copilot proposal instead.
URL: https://widgetcreator.netlify.app/ai-readiness-pack.html

TOOL: Proposal Evaluator
WHAT: Reads an uploaded MSP proposal through the buyer's eyes and scores it against five questions: do you understand my situation, why should I care now, why should I trust you, what exactly am I getting, and is it worth the money?
WHO: MSP sales reps or owners who have written a proposal and want an objective read before sending it to a prospect.
INPUT: An existing proposal document — PDF or Word.
OUTPUT: Structured evaluation with scores and specific feedback on each of the five buyer questions.
USE WHEN: You've written a proposal and want a sanity check before it goes out. A deal is important and you want to stress-test the narrative. You want to understand why your win rate is low. Best for managed services and large project proposals.
NOT FOR: Simple hardware quotes. Building a proposal from scratch — use Guided Sales Tool or Proposal Widget Builder first.
URL: https://widgetcreator.netlify.app/evaluator.html

TOOL: Proposal Widget Builder
WHAT: Generates five buyer-journey widgets for a Salesbuildr quote based on what you're selling and who you're selling it to. Widgets can be sent directly to your widget library via the Salesbuildr Public API.
WHO: MSP sales reps building quotes in Salesbuildr who want professional, persuasive content without writing it from scratch.
INPUT: A description of what you're selling and a brief profile of the prospect or their industry.
OUTPUT: Five ready-to-paste Salesbuildr widgets covering the buyer journey — problem, solution, trust, value, and next steps.
USE WHEN: Building a new quote and wanting industry-focused content quickly. Wanting consistent, professional widget copy across your team.
NOT FOR: Reformatting existing content — use Document Converter or MSP Document to Widget instead.
URL: https://widgetcreator.netlify.app/sales.html

TOOL: Guided Sales Tool
WHAT: Walks you through three structured processes — Discovery (customer describes a problem, tool prepares a quote and tech checklist), Design Desk (upload a parts-list spreadsheet, AI builds the proposal), and Quick Quote (speak or type what you need, AI searches your catalog or the web).
WHO: MSP sales reps or owners who want to build a consultative, problem-first proposal.
INPUT: Customer situation and challenges, or a spreadsheet, or a plain-language description of what you need.
OUTPUT: A structured, buyer-focused proposal narrative ready to turn into a Salesbuildr quote.
USE WHEN: Starting a proposal from scratch. Moving away from product-first selling. Quickly generating a quote from a parts list or verbal description.
NOT FOR: Reviewing an existing draft — use Proposal Evaluator. Populating an existing quote — use Proposal Widget Builder.
URL: https://widgetcreator.netlify.app/sales-guide.html

TOOL: ROI Builder
WHAT: Takes financial inputs and calculates the return on investment for your proposed solution, then generates a customer-facing widget.
WHO: MSP sales reps who need to justify solution costs to a business owner or CFO in financial terms.
INPUT: A few numbers — current costs, proposed costs, efficiency gains, or risk reduction estimates.
OUTPUT: A calculated ROI summary and an attractive Salesbuildr-ready widget presenting the financial case.
USE WHEN: A prospect is price-sensitive and needs financial justification. You want to make the business case, not just the technical case.
NOT FOR: Building the full proposal narrative — use Guided Sales Tool or Proposal Widget Builder.
URL: https://widgetcreator.netlify.app/roi-builder.html

TOOL: Cover Page Creator
WHAT: Generates four branded cover pages for a Salesbuildr quote, personalised with the prospect's details and colours. In auto mode, just provide the website URL.
WHO: MSP sales reps who want a polished, personalised quote cover without an in-house marketing department.
INPUT: The prospect's website URL (auto mode), or company name, contact name, and brand colours/logo.
OUTPUT: Four branded cover pages as high-resolution PNG files ready to add to your Salesbuildr cover page library.
USE WHEN: Sending a formal quote to a new prospect. Wanting to differentiate from competitors with a polished presentation.
NOT FOR: Banner images inside widgets — use Widget Banner Tool. If marketing has already created branded cover pages.
URL: https://widgetcreator.netlify.app/first-impression.html

TOOL: MSP Matrix Widgets
WHAT: Creates comparison matrix widgets from pre-built templates or generated by AI. All rows and columns are customisable. Can send directly to Salesbuildr widget library via Public API.
WHO: MSP sales reps who want to visually compare service tiers, product options, or feature sets inside a Salesbuildr quote.
INPUT: A template selection, or a description of what to compare — products, services, tiers, or frameworks.
OUTPUT: A clean HTML comparison matrix ready to drop into a Salesbuildr widget.
USE WHEN: Showing a prospect the difference between service tiers or support levels. Comparing your offering against a competitor or current state.
NOT FOR: Full security framework assessment matrices — use MSP Security Assessment Tool.
URL: https://widgetcreator.netlify.app/matrix-creator.html

TOOL: Customer Growth Operating System (CGOS)
WHAT: A beta tool that helps MSPs identify customer risks, growth opportunities, alignment gaps, and recommended next actions by bringing together data from multiple systems.
WHO: MSP owners, account managers, vCIOs, and sales teams who want a proactive way to manage customer relationships.
INPUT: Customer information from systems you already use, plus knowledge of the customer's business goals and environment.
OUTPUT: A prioritised view of customer health, opportunities, risks, lifecycle events, and recommended actions.
USE WHEN: Preparing for a QBR, roadmap discussion, or customer review. Identifying opportunities across your customer base.
NOT FOR: Building a proposal for a new prospect — use Guided Sales Tool or Proposal Widget Builder.
URL: https://widgetcreator.netlify.app/cgos.html

TOOL: SOW Widget Generator
WHAT: Generates a clean, professional customer-facing Statement of Work for any project type — from pre-built presets or written from scratch by AI.
WHO: MSP project managers, sales reps, or technical leads who need to produce a clear SOW quickly.
INPUT: A selection from preset project types, or a plain-language description of scope and deliverables.
OUTPUT: A polished, customer-facing SOW ready to drop directly into a Salesbuildr widget.
USE WHEN: Scoping a new project and needing to present the work clearly to the customer. Professionalising project documentation without writing from scratch.
NOT FOR: Calculating effort hours and costs — use Project Tasks Calculator. Highly detailed SOWs for legal purposes.
URL: https://widgetcreator.netlify.app/sow-generator.html

TOOL: Project Tasks → Calculator
WHAT: Builds a detailed task list for a complex project and generates a clean effort-hour table. Use presets or describe your project to AI. Save projects, create templates, collaborate as a team.
WHO: MSP project managers or pre-sales engineers who need to scope project effort and present it clearly in a quote.
INPUT: Project tasks and estimated hours — use presets or AI generation from a description.
OUTPUT: A formatted, professional, customer-facing effort table with totals, ready for a Salesbuildr Quote Widget.
USE WHEN: Scoping a complex project and needing to itemise and price the work. Wanting a professional labour breakdown in a quote.
NOT FOR: The written scope narrative — use SOW Widget Generator for that. Both tools complement each other well.
URL: https://widgetcreator.netlify.app/project-scope.html

TOOL: Project Reports
WHAT: Generates executive-style PDF project status reports in plain, non-technical language for clients managing complex multi-week projects.
WHO: MSP project managers or account managers who need to keep clients informed without overwhelming them with technical detail.
INPUT: Current project status, milestones completed, upcoming work, and any issues or risks.
OUTPUT: A clean, professional PDF status report in plain English suitable for sending to a business owner or stakeholder.
USE WHEN: A project is in flight and you need to update the client on progress. Professionalising client communications.
NOT FOR: Scoping or pricing the project — use SOW Widget Generator or Project Tasks Calculator.
URL: https://widgetcreator.netlify.app/progress.html

TOOL: Compliance Sales Pack
WHAT: Generates customer-facing proposal widgets for selling compliance engagements. The MSP selects a framework and industry — no client assessment data required. Three or four widgets: Why This Framework Matters (real penalty figures, audit consequences, insurance implications), Where Most Businesses Fall Short (typical gaps for that industry against that framework — AI uses its knowledge base, no client data needed), How We Get You There (engagement scope, timeline, what the MSP handles vs the client), and optional What Compliance Unlocks (contracts won, premiums reduced, audit confidence). Frameworks: Cyber Essentials, HIPAA, GDPR, NIST CSF, SOC 2, ISO 27001, CIS Controls, FedRAMP, CMMC. 12 industry verticals.
WHO: MSP sales reps building proposals for compliance-related engagements.
INPUT: Compliance framework, client industry, engagement type (dropdown + optional custom), Widget 4 toggle, colour theme.
OUTPUT: Three or four customer-facing widgets — push individually or as a pack, or copy HTML.
USE WHEN: Proposing a compliance engagement to a client. A client is facing an audit or needs certification. You want to make the business case for compliance in plain language without a pre-assessment.
NOT FOR: Generating technical compliance artefacts — use the Security Assessment Tool. Showing a specific client's actual gap data — this tool uses typical industry gaps, not client-specific assessment results.
URL: https://widgetcreator.netlify.app/compliance-sales-pack.html

TOOL: Cyber Insurance Readiness Widget
WHAT: Generates customer-facing proposal widgets showing a client's readiness against common cyber insurance underwriter requirements. 12-control checklist (MFA, EDR, Backup & DR, Patch Management, Email Security, Staff Training, Privileged Access Management, Incident Response Plan, Vulnerability Scanning, Remote Access Security, Data Encryption, Vendor Risk). Auto-calculates a readiness score (X.X / 10) with a colour-coded gradient bar. Produces two or three widgets: Readiness Score card, Gap Analysis (critical gaps that may affect coverage + recommended gaps that may affect premium), and optional Path to Readiness. Supports Excel export for technician completion and import back. Session saves to localStorage.
WHO: MSP sales reps building security or managed services proposals where cyber insurance is part of the conversation.
INPUT: Client name, industry, 12-control checklist with In Place / Partial / Not In Place / Unknown status per control. Optional Excel import from technician. Colour theme.
OUTPUT: Two or three customer-facing widgets pushed to Salesbuildr or copied as HTML.
USE WHEN: A client is renewing cyber insurance. A prospect has had a claim denied or premiums have increased. You want to frame IT services as insurance cost reduction. Building a security proposal with a financial justification angle.
NOT FOR: Formal security audits. Compliance framework assessments — use MSP Security Assessment Tool for NIST/CIS. The widgets are proposal tools, not audit reports.
URL: https://widgetcreator.netlify.app/cyber-insurance.html

TOOL: MSP Security Assessment Tool
WHAT: Generates proposal widgets for major security framework assessments (NIST, CIS, and similar), including technician checklists and current-state vs. ideal-state comparison matrices.
WHO: MSP security specialists, vCISOs, or account managers presenting security assessments to clients.
INPUT: The security framework being used and the client's current state information.
OUTPUT: Customer-facing proposal widgets, technician checklists, and current/ideal state matrices for Salesbuildr.
USE WHEN: Presenting a security assessment or gap analysis to a client. Visualising the gap between current and ideal security state.
NOT FOR: General product/service comparison matrices — use MSP Matrix Widgets.
URL: https://widgetcreator.netlify.app/security.html

TOOL: Widget Banner Tool
WHAT: Creates visual banner images for Salesbuildr widgets using logos or custom text overlays — no design skills required.
WHO: MSP sales reps or marketers who want polished, on-brand Salesbuildr widgets.
INPUT: A logo file or text content, plus colour or style preferences.
OUTPUT: A banner image ready to use inside a Salesbuildr widget.
USE WHEN: Adding a professional branded header to a widget. Wanting the visual presentation to match your brand.
NOT FOR: Full quote cover pages — use Cover Page Creator.
URL: https://widgetcreator.netlify.app/banner.html

TOOL: Document Converter
WHAT: Converts PDF, Word, and Excel documents into TinyMCE-ready inline HTML for pasting directly into a Salesbuildr widget.
WHO: MSP sales or admin staff who have existing documents they want to bring into Salesbuildr without manual reformatting.
INPUT: A PDF, Word (.docx), or Excel (.xlsx) file.
OUTPUT: Clean inline HTML ready to paste into the Salesbuildr widget editor.
USE WHEN: You have an existing document — service description, terms sheet, data table — that you want inside a widget.
NOT FOR: Word-format scopes of work — use MSP Document to Widget for a more tailored conversion.
URL: https://widgetcreator.netlify.app/tinymce.html

TOOL: MSP Document to Widget
WHAT: Converts an existing Word document scope of work into a clean, customer-facing Salesbuildr widget instantly.
WHO: MSP project managers or sales reps who have a scope written in Word and want it in Salesbuildr quickly.
INPUT: A Word document containing your project scope.
OUTPUT: A formatted, customer-facing Salesbuildr widget based on the document content.
USE WHEN: You've written a scope in Word and want to move it into Salesbuildr without rebuilding it.
NOT FOR: General PDFs or Excel files — use Document Converter. No scope yet — use SOW Widget Generator.
URL: https://widgetcreator.netlify.app/doc-to-widget.html

TOOL: Import Special Pricing
WHAT: Converts vendor deal registration files (xlsx, xls, or csv) into a Salesbuildr import-ready format in seconds.
WHO: MSP purchasing or sales staff who receive deal-reg pricing files from vendors.
INPUT: A vendor deal-reg file in xlsx, xls, or csv format.
OUTPUT: A formatted file ready to import directly into Salesbuildr.
USE WHEN: You've received a special pricing file from a vendor and want to use it in a quote.
NOT FOR: Cleaning up your existing product catalog — use Product Catalog Guided Cleanup.
URL: https://widgetcreator.netlify.app/converter.html

TOOL: Product Catalog — Guided Cleanup
WHAT: Connects to your Salesbuildr product catalog and uses AI to identify duplicate MPNs, near-duplicate products, EOL items, and missing products — then guides you through resolving them in bulk.
WHO: MSP administrators or purchasing managers responsible for keeping the Salesbuildr product catalog accurate.
INPUT: Your Salesbuildr API credentials — the tool fetches your catalog directly.
OUTPUT: A guided cleanup workflow with grouped issues and bulk actions to unlist or merge products.
USE WHEN: Your product catalog has grown messy with duplicates or outdated products. Doing a catalog audit.
NOT FOR: Importing new special pricing — use Import Special Pricing.
URL: https://widgetcreator.netlify.app/product-cleanup.html

TOOL: Widget Library Cleanup
WHAT: Fetches your full Salesbuildr widget library and uses AI to group duplicates, near-duplicates, and suspiciously named widgets for bulk review and cleanup.
WHO: MSP administrators or sales ops staff who manage the shared widget library in Salesbuildr.
INPUT: Your Salesbuildr API credentials — the tool fetches your widget library directly.
OUTPUT: A grouped review of potential duplicates and problem widgets with actions to remove or consolidate them.
USE WHEN: Your widget library has grown large and hard to navigate. Doing a periodic audit.
NOT FOR: Cleaning up your product catalog — use Product Catalog Guided Cleanup.
URL: https://widgetcreator.netlify.app/widget-cleaner.html
`;

const SYSTEM_PROMPT = `You are a helpful assistant for the Salesbuildr MSP Tools Hub — a collection of practical tools built for managed service providers (MSPs).

Your job is to recommend the right tool (or tools) based on what the user is trying to accomplish. You have access to a knowledge base of all available tools below.

RESPONSE RULES:
- Recommend 1 to 3 tools maximum. Only recommend what genuinely fits.
- For each tool, give: the tool name, one sentence on why it fits, and the URL.
- If no tool fits well, say so honestly and suggest they submit a feature request using the feedback button.
- If the question is about data security or privacy, answer from the security note in the KB.
- Keep responses short, direct, and practical — these are busy MSP professionals.
- Do not invent tools or features that don't exist in the KB.
- Format your response as clean plain text. Use this structure for each tool:

TOOL NAME
Why it fits in one sentence.
Open: [URL]

If recommending multiple tools, separate them with a blank line.

KNOWLEDGE BASE:
${TOOL_KB}`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  const { question } = body;
  if (!question || !question.trim()) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'question is required.' }) };
  }

  let aiRes;
  try {
    aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: question.trim() }]
      })
    });
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'Could not reach AI service.' }) };
  }

  if (!aiRes.ok) {
    const errBody = await aiRes.text();
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: `AI error ${aiRes.status}`, detail: errBody }) };
  }

  const aiData = await aiRes.json();
  const answer = aiData.content?.[0]?.text || '';

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: true, answer })
  };
};
