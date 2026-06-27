// netlify/functions/ask-ai.js
// Receives a user question and returns tool recommendations using the KB

const TOOL_KB = `
TOOL: Upsell Services Widget Builder
WHAT: Generates a curated, branded widget listing complementary services that pair with any managed services proposal. Acts as a mini-roadmap and conversation starter — showing the customer a logical path of future services alongside the current engagement.
WHO: MSPs sending project-type proposals who want to identify and present complementary services to generate future revenue.
INPUT: Choose a pre-set engagement type (e.g. M365 migration, network refresh, security deployment) or describe a custom project. Add your own proprietary services to the AI-generated list.
OUTPUT: A Salesbuildr-ready widget with AI-generated complementary services — tagged as recommended or optional, reordered to preference, colour-branded, and ready to paste or push directly into a quote.
USE WHEN: Sending a managed services or project proposal and wanting to open conversations about additional services. Wanting to position yourself as a strategic partner with a forward-looking roadmap.
NOT FOR: Simple hardware or product-only quotes with no service component.
URL: https://widgetcreator.netlify.app/complementary-services.html

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

TOOL: MSP Quote Preflight
WHAT: Reviews a quote for common issues — missing information, unclear pricing, weak justification — before the buyer sees it. Requires Salesbuildr Public API connection.
WHO: MSP sales reps who want a final check on a quote before sending it out.
INPUT: A draft quote ID from Salesbuildr (requires Public API) or quote details for review.
OUTPUT: A list of flagged issues with specific suggestions, plus an AI evaluation of the proposal.
USE WHEN: About to send an important quote and wanting one last review. A deal has stalled and you want to check if the quote is the problem.
NOT FOR: Broader evaluation of proposal narrative — use Proposal Evaluator.
URL: https://widgetcreator.netlify.app/preflight.html

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
