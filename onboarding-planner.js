const AGENT_LINKS = {
  mike: "https://calendly.com/mike-salesbuildr/onboarding-1-quote-tour",
  bram: "https://calendly.com/salesbuildr-bram",
  kristel: "https://calendly.com/kristel-salesbuildr",
  demi: "https://calendly.com/demi-salesbuildr"
};

const SESSION_SCRIPTS = {
  session1: {
    objective: `Guide the MSP through their first successful interaction with Salesbuildr by demonstrating how a simple quote is created and experienced by the customer.

This session establishes a clear mental model of how Salesbuildr works at a high level, without getting into configuration, so the MSP understands how all key areas connect back to quoting.`,

    flow: [
      {
        title: "1. Introduction (2 min)",
        content: `Welcome and quick intro.

Set expectations:
"I’ll guide you through getting up and running with Salesbuildr."`
      },
      {
        title: "2. First Quote Demo (Anchor) (2–3 min)",
        content: `Create a simple hardware quote live.
Use hardware template from MSP OR (US/CA) Marketplace → Basic Hardware Template.

Keep it fast and simple.

Emphasize:
- "This is how quickly a quote can be created"
- "We’ll refer back to this quote as we go through the tour"

This becomes the anchor point for the rest of the session.`
      },
      {
        title: "3. Customer Experience (1 min)",
        content: `Mark quote as sent.

Copy the quote link, paste into chat, and have them open it.

Reinforce:
- This is what you are building toward
- The quote is both a sales tool and experience`
      },
      {
        title: "4. Guided Tour (High-Level Only)",
        content: `Keep everything tied back to the quote.

Quote Editor:
- Show widgets (left)
- Show pricing/tools (right)

Products:
- Synced from PSA

Marketplace:
- Import products
- Only syncs when used in a quote

Categories:
- Structure and pricing control

Opportunities:
- Linked to quotes
- Refer back to demo

Templates / Widgets:
- Widgets = building blocks
- Templates = structure
- Guides customer journey
- Standardization

Dynamic Pricing:
- Cost + margin = price
- Keeps pricing current

Admin:
- Preview only
- Covered in homework`
      }
    ],

    keyPoints: [
      "The quote is the center of everything",
      "Keep things simple and high-level",
      "Templates guide the customer journey",
      "Standardization improves consistency",
      "You don’t need everything perfect to start"
    ],

    avoid: [
      "Do NOT configure admin settings",
      "Do NOT troubleshoot",
      "Do NOT solve edge cases",
      "Say: 'We’ll cover that in a focused session'"
    ],

    homework: `Introduce the homework (30 minutes).

They will:
- Create a simple quote
- Build familiarity
- Configure essential settings

Reassure:
- Nothing will break
- It doesn’t need to be perfect

Share the homework link in chat.

<a href="https://docs.google.com/document/d/1azLuGUAr9wedx-2yQ4ZDvCYcxaAEuiw0hzYIF51bxHA/edit?usp=sharing" target="_blank" style="display:inline-block;margin-top:8px;font-weight:600;">
  🔗 Open Homework Document
</a>`
  },

  session2_catalog: {
    objective: `Help the MSP understand how products are structured, sourced, and priced in Salesbuildr so they can build quotes efficiently and consistently.

This session focuses on the core concepts of catalog management and pricing, while leaving detailed setup and cleanup to homework.`,

flow: [
  {
    title: "1. Homework Review / Key Questions (5–10 min)",
    content: `Ask what questions came up from homework.

Address the 1–2 most important questions.

Keep answers focused and practical.

If something requires a deeper dive, capture it for follow-up so the session stays on track.

If needed, say:
"That’s a great question — let’s make sure we stay on track today, and we can come back to that in a focused follow-up if needed."`
  },
  {
    title: "2. Product Model Overview (Concept First)",
    content: `Explain the 3 item types:
- Products (managed in Salesbuildr)
- Services and Labor (managed in PSA)

Key idea:
Products are managed in Salesbuildr because pricing is dynamic and tied to distributors.

Reinforce:
- Products do not sync to PSA until used in a quote
- This keeps the PSA clean and controlled`
      },
      {
        title: "3. Categories = Portfolio Structure",
        content: `Show category structure (root + sub-categories).

Key idea:
Categories define:
- organization
- pricing (markup / margin)

Reinforce:
- Sub-categories control pricing strategy
- This is where standardization begins

Do NOT spend time editing or reorganizing here.`
      },
      {
        title: "4. Products Overview (What Good Looks Like)",
        content: `Show the product list briefly.

Explain:
- In stock vs not found
- Dynamic vs static pricing

Key idea:
We want clean, active, dynamically priced products.

Do NOT:
- bulk edit
- clean data
- fix catalog issues`
      },
      {
        title: "5. Adding Products to a Quote (Anchor Back to Session 1)",
        content: `Go back to a quote.

Show how to:
- browse categories
- add a product

Reinforce:
- Everything connects back to quoting
- This is the real workflow`
      },
      {
        title: "6. Marketplace (Key Moment)",
        content: `Show how to search and import a product.

Key idea:
This is how you bring in new products when they do not exist yet.

Reinforce:
- Import into catalog
- Add to quote
- Sync to PSA when quoted`
      },
      {
        title: "7. Bundles (Concept Only)",
        content: `Briefly explain that bundles are grouped products and/or services.

Position them as:
- an efficiency tool
- something most MSPs already understand conceptually

Do NOT build one live.`
      },
      {
        title: "8. Pricing (High-Level Only)",
        content: `Explain:
- distributor cost + category markup = price

Reinforce:
- pricing is centralized
- supports consistency

Do NOT:
- adjust pricing live
- go into bulk edits`
      }
    ],

    keyPoints: [
      "Products are managed in Salesbuildr for dynamic pricing",
      "Categories control both structure and pricing",
      "Marketplace is how new products are introduced",
      "Everything connects back to quoting",
      "Standardization improves speed and consistency",
      "The goal is a clean, usable catalog — not perfection"
    ],

    avoid: [
      "Do NOT clean up the product catalog live",
      "Do NOT bulk edit or fix pricing",
      "Do NOT troubleshoot missing products",
      "Do NOT build bundles step-by-step",
      "Say: 'We’ll cover that in detail in homework or a focused session'",
      "Do NOT let homework questions consume the full session"
    ],

    homework: `This is where they will actually set up and refine their catalog.

They will:
- Organize categories and sub-categories
- Add products to the catalog
- Use Marketplace to import products
- Add products by MPN
- Create unique/manual products
- Create bundles
- Configure markups
- Enable dynamic pricing by clearing static pricing
- Unlist inactive or end-of-life products

<a href="PASTE_SESSION_2_HOMEWORK_LINK_HERE" target="_blank" style="display:inline-block;margin-top:8px;font-weight:600;">
  🔗 Open Homework Document
</a>`
  },
  session3_templates: {
    objective: `Help the MSP understand how to design a clear, compelling proposal that guides the customer toward a decision.

This session focuses on how templates, widgets, and cover pages work together to create a consistent and professional quote experience — without getting into detailed configuration.`,

flow: [
  {
    title: "1. Homework Review / Key Questions (5–10 min)",
    content: `Ask what questions came up from homework.

Address the 1–2 most important questions.

Keep answers focused and practical.

If something requires a deeper dive, capture it for follow-up so the session stays on track.

If needed, say:
"That’s a great question — let’s make sure we stay on track today, and we can come back to that in a focused follow-up if needed."`
  },
  {
    title: "2. Reconnect to the Quote (Anchor)",
    content: `Start with a quote.

Reinforce:
- This is what your customer sees
- This is not just a quote — it’s a sales experience`
  },
  {
    title: "3. What Makes a Strong Proposal",
    content: `Explain that a strong proposal:
- tells a clear story
- focuses on outcomes (not technical details)
- makes it easy for the customer to decide

Simple structure:
- problem
- solution
- what’s included
- next steps

Templates deliver this structure consistently.`
  },
  {
    title: "4. Cover Pages (First Impression Layer)",
    content: `Optional but powerful.

Explain:
- Adds a professional, branded introduction
- Uses variables for personalization
- Can be tailored by solution or vertical

Do NOT build one live.

Position as:
- branding and positioning tool
- covered in homework`
  },
  {
    title: "5. Widgets (Building Blocks)",
    content: `Widgets are the components used to build templates.

Types include:
- content only
- content with products/services
- forms
- images/media

Key idea:
Widgets help tell your story in sections.

Do NOT build or configure deeply.`
  },
  {
    title: "6. Templates (Structure & Consistency)",
    content: `Templates are built from widgets and define the structure of the quote.

Explain:
- ensures consistency across the team
- guides the customer through a decision journey

Show Marketplace templates as examples.

Key idea:
You don’t start from scratch — you adapt and refine.`
  },
  {
    title: "7. Bring It Together (Light Demo)",
    content: `SHOW:
- Create a quote using a Marketplace template
- Add a product or service
- Optionally add a widget

Explain:
- Templates can be edited
- Widgets can be added as needed

Keep this quick — reinforce, don’t build.`
  }
],

    keyPoints: [
      "A quote is a guided customer experience, not just pricing",
      "Templates create structure and consistency",
      "Widgets are the building blocks of that experience",
      "Cover pages enhance professionalism and positioning",
      "The goal is clarity and simplicity for the customer",
      "You are guiding the customer toward a decision"
    ],

    avoid: [
      "Do NOT build templates from scratch",
      "Do NOT configure every widget",
      "Do NOT perfect layout or design during the session",
      "Do NOT get stuck editing content",
      "Say: 'We’ll cover that in detail in homework'",
"Do NOT let homework questions consume the full session"
      
    ],

    homework: `This is where they will build and refine their proposal structure.

They will:
- Create a cover page
- Build and modify widgets
- Build or customize templates
- Explore Marketplace templates

<a href="PASTE_SESSION_3_HOMEWORK_LINK_HERE" target="_blank" style="display:inline-block;margin-top:8px;font-weight:600;">
  🔗 Open Homework Document
</a>`
  },
  session4_workflow: {
    objective: `Help the MSP refine how they actually build and adjust quotes in Salesbuildr by reviewing their practice quotes, answering common workflow questions, and reinforcing best practices.

This session focuses on real-world quote usage, light workflow refinement, and identifying whether additional follow-up is needed.`,

    flow: [
      {
        title: "1. Practice Quote Review / Key Questions (10–15 min)",
        content: `Review the test quotes they created.

Ask:
- what felt easy
- what felt confusing
- what questions came up

Focus on:
- quote adjustments
- adding products
- pricing changes
- discounts
- option choices

Key idea:
Use their real quotes as the discussion anchor.`
      },
      {
        title: "2. How They Are Actually Quoting",
        content: `Ask how they expect their sales team to build quotes.

Ask:
- what they are trying to replicate from their current tool
- where they feel friction
- what they want to improve most

Key idea:
This is about aligning workflow, not copying the old tool exactly.`
      },
      {
        title: "3. Common Quote-Level Adjustments",
        content: `Show high-level examples of common quote-level flexibility.

Examples:
- discounts
- price changes
- quote-level overrides
- quantity adjustments

Example:
Allowing recipient quantity changes on a quote even if that is off by default.

Reinforce:
Salesbuildr has defaults for consistency, but there is quote-level flexibility where needed.`
      },
      {
        title: "4. Product Choice / Options",
        content: `Introduce the concept of quote options in a practical way.

Example:
- add two laptop choices
- configure single-choice or multi-choice options

Explain:
- this helps the customer compare options
- supports guided decision-making
- keeps the quote clean and structured

Do a light demo, not a deep build.`
      },
      {
        title: "5. Additional Product Questions",
        content: `Address common product questions that appear after they begin quoting.

Typical examples:
- adding products
- choosing the right product
- handling special items
- when to use Marketplace vs existing catalog items

Keep this practical and tied to the quotes they already created.`
      },
      {
        title: "6. Reinforce Best Practices",
        content: `Bring the session back to:
- keep quoting simple
- standardize where possible
- use flexibility intentionally
- do not over-customize every quote

Key idea:
Consistency first, refinement over time.`
      },
      {
        title: "7. Decide the Next Step",
        content: `At the end of the session, decide:

- are they ready to move forward confidently?
- do they need a focused follow-up?
- do they need an ad-hoc session for a specific topic?
- have they practiced enough?

This is the natural decision point for:
- no further onboarding needed
- add ad-hoc session
- follow up with Loom or notes`
      }
    ],

    keyPoints: [
      "Real quoting questions usually appear only after hands-on practice",
      "Quote-level flexibility exists, but defaults still matter",
      "Options help guide customer decisions clearly",
      "The goal is to refine workflow, not recreate the old tool exactly",
      "Consistency is more valuable than excessive customization",
      "This session helps determine whether an additional focused session is needed"
    ],

    avoid: [
      "Do NOT let one edge case take over the session",
      "Do NOT attempt to redesign their entire process live",
      "Do NOT over-explain every quote setting",
      "Do NOT promise to recreate the old tool exactly",
      "Say: 'Let’s keep this focused on your main quoting workflow, and if needed we can handle that as a separate follow-up.'"
    ],

    homework: `This session usually ends in one of three ways:

- They are ready to move forward
- They need a focused follow-up session
- They need offline follow-up (notes / Loom / specific answer)

This is the natural place to identify:
- deferred questions
- MSP-specific needs
- possible ad-hoc sessions`
  },
  addon_sales: {
    objective: `Train the sales team to confidently create, adjust, and send quotes in Salesbuildr using the current approved quoting workflow.

This session focuses on the rep experience only. It is designed to get the sales team quoting quickly and consistently, without going into configuration or admin setup.`,

    flow: [
      {
        title: "1. Set Expectations / Scope",
        content: `Explain that this session is about how to make quotes.

Clarify:
- setup and configuration have already been handled
- today is about the quoting workflow
- not every feature needs to be covered

Key message:
Today is about how to create and send quotes confidently.`
      },
      {
        title: "2. Start a Quote",
        content: `Show where reps begin.

Show how to select:
- company
- opportunity
- quote entry point

Keep it simple and repeatable.

Key idea:
This is the standard starting point for reps.`
      },
      {
        title: "3. Use the Current Template Workflow",
        content: `Show how to choose the template that is ready for use.

Explain:
- the quote structure is already designed for them
- this session is about using the workflow, not building templates

Key idea:
Reps are using the system, not designing it.`
      },
      {
        title: "4. Add Products and Services",
        content: `Show how to add products and services into the quote.

Use a realistic example.

Keep it focused on the rep workflow:
- select
- add
- review

Reinforce:
This is the day-to-day quoting motion.`
      },
      {
        title: "5. Show the Customer Experience",
        content: `Preview the quote and show what the customer sees.

Reinforce:
- this is not just pricing
- this is the customer-facing sales experience
- the rep is guiding the customer toward a decision`
      },
      {
        title: "6. Show Simple Quote Adjustments",
        content: `Only show the adjustments reps are likely to use.

Examples:
- changing quantities
- basic price or discount adjustment (if appropriate)
- using quote options if part of the workflow

Keep this practical and limited.

Key idea:
Show the flexibility reps need without opening the door to too many exceptions.`
      },
      {
        title: "7. Reinforce the Standard Rep Workflow",
        content: `End by showing the simple repeatable motion:

- start quote
- use approved template
- add products and services
- review customer experience
- send quote

Keep the reps anchored to the standard process.`
      }
    ],

    keyPoints: [
      "This session is about the rep workflow, not admin configuration",
      "Reps should learn the current approved quoting process",
      "The goal is confidence and consistency, not mastering every feature",
      "Quotes should be clear, simple, and customer-friendly",
      "Start with the standard workflow first, then refine over time",
      "Salesbuildr does not need to behave exactly like the old system to be effective"
    ],

    avoid: [
      "Do NOT go into admin settings",
      "Do NOT explain template building in detail",
      "Do NOT edit widgets live",
      "Do NOT troubleshoot configuration issues during the session",
      "Do NOT turn the session into a discussion of everything still being refined",
      "Do NOT promise that every legacy workflow will work exactly the same way",
      "Say: 'Today we’re focused on the quoting workflow your team will use right now. If something needs deeper refinement, we can handle that separately.'"
    ],

    homework: `This session usually does not need heavy homework.

Instead, the follow-up should be practical:

- create a few real practice quotes
- get comfortable with the quoting flow
- note any rep-specific questions
- identify where additional coaching is needed

This session may lead to:
- a focused rep follow-up
- a Loom walkthrough for a specific question
- an ad-hoc session for a special quoting scenario`
  },
  addon_storefront: {
    objective: `Help the MSP understand how the Storefront works, what business problem it solves, and how to set up a simple first version for testing.

This session focuses on the self-serve purchasing workflow, basic setup structure, and best practices for launching with a controlled test use case.`,

    flow: [
      {
        title: "1. What Storefront Is / Why It Exists",
        content: `Explain the purpose of Storefront:

- a self-serve portal for customers
- used for pre-selected, easy-to-order items

Examples:
- laptops
- monitors
- keyboards
- docking stations
- laptop bags

Reinforce:
- not a replacement for every quote
- designed for simple, repeatable purchasing

Key idea:
Storefront reduces friction for small, standard purchases.`
      },
      {
        title: "2. What Happens When a Customer Orders",
        content: `Explain the workflow:

- customer logs in
- selects approved items
- places the basket order
- order syncs to Salesbuildr as an approved order
- follows the normal order workflow

Key idea:
Storefront orders flow into the same process as other approved orders.`
      },
      {
        title: "3. Best Practice: Start with a Test Company",
        content: `Recommend a controlled rollout:

- build the first storefront for Test Company
- use it to understand the experience
- test safely before opening to real customers

Key idea:
Start small, test the experience, then expand.`
      },
      {
        title: "4. Basic Storefront Structure",
        content: `Explain the setup model:

- create a root category (Storefront)
- create sub-categories (Laptops, Monitors, Docking Stations, etc.)
- add products into those categories

Key idea:
Start with a clean, intentionally selected catalog.`
      },
      {
        title: "5. Control Access",
        content: `Explain access control:

- whitelist companies allowed to use the storefront
- enable self-serve at the company level
- select contacts who can access it

Key idea:
Access is controlled at both company and contact level.`
      },
      {
        title: "6. Bring It Together (Light Walkthrough)",
        content: `Walk through at a high level:

- category structure
- company access settings
- contact enablement
- how the experience connects back to workflow

Keep this as a guided overview, not a full build-out.`
      }
    ],

    keyPoints: [
      "Storefront is designed for simple, repeatable purchases",
      "Start with a controlled test use case",
      "Product selection should be intentional and limited at first",
      "Access is managed by company and contact",
      "Orders follow the normal operational workflow",
      "The goal is simplicity and control, not a large catalog launch"
    ],

    avoid: [
      "Do NOT build a large storefront live",
      "Do NOT over-expand the product set during the session",
      "Do NOT troubleshoot edge cases during the session",
      "Do NOT treat Storefront as a replacement for all quoting",
      "Do NOT open to multiple customers before testing",
      "Say: 'Let’s keep this focused on a clean first setup, and we can refine it after testing.'"
    ],

    homework: `Follow these steps to set up your initial Storefront:

- Create a root category for Storefront
- Create sub-categories (Laptops, Monitors, etc.)
- Add starter products
- Whitelist Test Company
- Enable self-serve on the company
- Select contacts for access

Start with a controlled test setup before expanding.

<a href="PASTE_STOREFRONT_VIDEO_LINK_HERE" target="_blank" style="display:inline-block;margin-top:8px;font-weight:600;">
  🔗 Watch Storefront Setup Video
</a>`
  }
};

const AGENT_LABELS = {
  mike: "Mike",
  bram: "Bram",
  kristel: "Kristel",
  demi: "Demi"
};

const recommendBtn = document.getElementById("recommendBtn");
const recommendationEl = document.getElementById("recommendation");
const sessionPlanEl = document.getElementById("sessionPlan");
const addonPlanEl = document.getElementById("addonPlan");
const reportOutput = document.getElementById("reportOutput");
const copyReportBtn = document.getElementById("copyReport");
const exportPlanBtn = document.getElementById("exportPlan");
const importPlanFile = document.getElementById("importPlanFile");
const agendaPanel = document.getElementById("agendaPanel");
const copyAgendaBtn = document.getElementById("copyAgenda");
const agentModeToggle = document.getElementById("agentModeToggle");

let currentPlanData = null;
let agentMode = false;

recommendBtn.addEventListener("click", generatePlan);
copyReportBtn.addEventListener("click", copyReport);
exportPlanBtn.addEventListener("click", exportPlan);
importPlanFile.addEventListener("change", importPlan);
copyAgendaBtn.addEventListener("click", copyAgenda);

if (agentModeToggle) {
  agentModeToggle.addEventListener("change", (e) => {
    agentMode = e.target.checked;
    if (currentPlanData) {
      renderAll(currentPlanData);
    }
  });
}

function generatePlan() {
  const mspName = document.getElementById("mspName").value.trim();
  const goLiveDate = document.getElementById("goLiveDate").value;
  const plannerUsage = document.getElementById("plannerUsage").value;
  const q1 = document.getElementById("q1").value;
  const q2 = document.getElementById("q2").value;
  const q3 = document.getElementById("q3").value;
  const salesTrainingNeeded = document.getElementById("salesTrainingNeeded").value;
  const storefrontNeeded = document.getElementById("storefrontNeeded").value;
  const priorities = getSelectedPriorities();

  if (!mspName) {
    alert("Please enter the MSP name.");
    return;
  }

  if (!goLiveDate) {
    alert("Please select a Go-Live date.");
    return;
  }

  if (!q1 || !q2 || !q3 || !salesTrainingNeeded || !storefrontNeeded) {
    alert("Please answer all assessment questions.");
    return;
  }

  if (priorities.length === 0) {
    alert("Please select at least one priority area.");
    return;
  }

  const scores = scoreAssessment(q1, q2, q3, priorities);
  const recommendedTypeKey = getWinningType(scores);
  const recommendedTypeName = typeNames[recommendedTypeKey];
  const whyBullets = buildWhyBullets(recommendedTypeKey, q1, q2, q3, priorities);
  const planMeta = getPlanMeta(recommendedTypeKey);

  const coreSessions = buildCoreSessions(recommendedTypeKey, priorities);
  const addonSessions = buildAddonSessions(salesTrainingNeeded, storefrontNeeded);

  const combinedSessions = assignPlannedDates(
    [...coreSessions, ...addonSessions],
    goLiveDate,
    recommendedTypeKey
  );

  const finalCoreSessions = combinedSessions.slice(0, coreSessions.length);
  const finalAddonSessions = combinedSessions.slice(coreSessions.length);

  currentPlanData = {
    mspName,
    goLiveDate,
    plannerUsage,
    answers: {
      q1,
      q2,
      q3,
      salesTrainingNeeded,
      storefrontNeeded
    },
    priorities,
    recommendedTypeKey,
    recommendedTypeName,
    whyBullets,
    planMeta,
    coreSessions: finalCoreSessions,
    addonSessions: finalAddonSessions,
    notes: [],
    adhocSessions: []
  };

  renderAll(currentPlanData);
}

function renderAll(planData) {
  renderRecommendation(planData.recommendedTypeName, planData.whyBullets, planData.planMeta);
  renderSessions(planData.coreSessions, sessionPlanEl, false);
  renderSessions(planData.addonSessions, addonPlanEl, true);
  renderAgenda(planData);
  renderReport(planData);
  
notes = planData.notes || [];
renderNotes();

  adhocSessions = planData.adhocSessions || [];
renderAdhocSessions();
  
  // Bind buttons once after all session HTML has been rendered
  bindSessionCopyButtons();
  bindSessionStatusButtons();
  bindAgentDropdowns();
}

function getSelectedPriorities() {
  const checked = document.querySelectorAll('input[name="priority"]:checked');
  return Array.from(checked).map(item => item.value);
}

function setSelectedPriorities(priorities) {
  const checkboxes = document.querySelectorAll('input[name="priority"]');
  checkboxes.forEach(box => {
    box.checked = priorities.includes(box.value);
  });
}

function scoreAssessment(q1, q2, q3, priorities) {
  const scores = {
    expert: 0,
    explorer: 0,
    guided: 0,
    rollout: 0,
    momentum: 0
  };

  if (q1 === "several") scores.expert += 2;
  if (q1 === "one") scores.explorer += 1;
  if (q1 === "new") scores.guided += 2;

  if (q2 === "experiment") scores.explorer += 2;
  if (q2 === "structured") scores.guided += 2;
  if (q2 === "mix") scores.expert += 1;

  if (q3 === "few") scores.expert += 1;
  if (q3 === "small") scores.explorer += 1;
  if (q3 === "departments") {
    scores.guided += 2;
    scores.rollout += 1;
  }

  if (priorities.includes("sales")) scores.rollout += 1;
  if (priorities.includes("speed")) scores.explorer += 1;
  if (priorities.includes("sync")) scores.expert += 1;
  if (priorities.includes("appearance")) scores.guided += 1;
  if (priorities.includes("pricing")) scores.guided += 1;
  if (priorities.includes("experience")) scores.guided += 1;

  if (q1 === "new" && q3 === "small" && q2 === "structured") {
    scores.momentum += 2;
  }

  return scores;
}

function getWinningType(scores) {
  const orderedTypes = ["expert", "explorer", "guided", "rollout", "momentum"];
  let winner = orderedTypes[0];

  orderedTypes.forEach(type => {
    if (scores[type] > scores[winner]) {
      winner = type;
    }
  });

  return winner;
}

const typeNames = {
  expert: "Targeted Expert",
  explorer: "Fast-Track Explorer",
  guided: "Guided Team",
  rollout: "Admin → Sales Rollout",
  momentum: "Momentum Risk"
};

function buildWhyBullets(type, q1, q2, q3, priorities) {
  const reasonPool = [];

  if (q1 === "several") {
    reasonPool.push({
      types: ["expert"],
      text: "You’ve used several quoting tools before and likely don’t need a basics-heavy onboarding."
    });
  }

  if (q1 === "one") {
    reasonPool.push({
      types: ["explorer", "expert"],
      text: "You already have some quoting tool experience, so we can move more quickly."
    });
  }

  if (q1 === "new") {
    reasonPool.push({
      types: ["guided", "momentum"],
      text: "A more guided onboarding will help build confidence with the quoting workflow."
    });
  }

  if (q2 === "experiment") {
    reasonPool.push({
      types: ["explorer"],
      text: "You prefer to learn by doing, which fits a faster, hands-on onboarding style."
    });
  }

  if (q2 === "structured") {
    reasonPool.push({
      types: ["guided", "momentum"],
      text: "You prefer a structured walkthrough, which usually works best with more focused sessions."
    });
  }

  if (q2 === "mix") {
    reasonPool.push({
      types: ["expert"],
      text: "You’re comfortable with a blended approach, which allows for a flexible onboarding pace."
    });
  }

  if (q3 === "few") {
    reasonPool.push({
      types: ["expert"],
      text: "A smaller onboarding group makes it easier to focus on targeted priorities quickly."
    });
  }

  if (q3 === "small") {
    reasonPool.push({
      types: ["explorer"],
      text: "A small team can usually move quickly while still keeping alignment across users."
    });
  }

  if (q3 === "departments") {
    reasonPool.push({
      types: ["guided", "rollout"],
      text: "Multiple departments are involved, so a more structured rollout will help keep everyone aligned."
    });
  }

  if (priorities.includes("speed")) {
    reasonPool.push({
      types: ["explorer"],
      text: "Faster quoting is a priority, so the plan should focus early on practical quote-building workflows."
    });
  }

  if (priorities.includes("appearance")) {
    reasonPool.push({
      types: ["guided"],
      text: "Quote presentation is important, so templates and customer experience should be covered early."
    });
  }

  if (priorities.includes("sync")) {
    reasonPool.push({
      types: ["expert", "rollout"],
      text: "Integration quality is important, so operational workflow and sync behavior should be part of the plan."
    });
  }

  if (priorities.includes("pricing")) {
    reasonPool.push({
      types: ["expert", "guided", "momentum"],
      text: "Pricing consistency matters, so catalog structure and quoting rules should be part of onboarding."
    });
  }

  if (priorities.includes("sales")) {
    reasonPool.push({
      types: ["rollout"],
      text: "Sales team enablement is a priority, which may require a broader rollout approach."
    });
  }

  if (priorities.includes("experience")) {
    reasonPool.push({
      types: ["guided", "momentum"],
      text: "Customer quote experience matters, so template design and decision flow should be prioritized."
    });
  }

  if (type === "momentum") {
    reasonPool.push({
      types: ["momentum"],
      text: "A lighter, more focused onboarding structure will make progress easier to maintain."
    });
  }

  const filtered = reasonPool
    .filter(item => item.types.includes(type))
    .map(item => item.text);

  const unique = [...new Set(filtered)];
  return unique.slice(0, 3);
}

function getPlanMeta(type) {
  const meta = {
    expert: {
      sessions: "2–3",
      pace: "2–3 weeks",
      meaning: "Less time on basics and more focus on known pain points and specific goals.",
      focusAreas: [
        "Catalog & Quoting Workflow",
        "Integrations & Workflow",
        "Templates & Quote Experience"
      ]
    },
    explorer: {
      sessions: "2–3",
      pace: "2–3 weeks",
      meaning: "A faster pace with practical, hands-on focus and less time spent on theory.",
      focusAreas: [
        "Catalog & Quoting Workflow",
        "Templates & Quote Experience"
      ]
    },
    guided: {
      sessions: "4",
      pace: "3–4 weeks",
      meaning: "A more structured rollout with clear separation of topics across meetings.",
      focusAreas: [
        "Catalog & Pricing",
        "Templates & Quote Experience",
        "Integrations & Workflow"
      ]
    },
    rollout: {
      sessions: "4–5",
      pace: "4–5 weeks",
      meaning: "A more structured rollout that often suits broader teams and more operational setup.",
      focusAreas: [
        "Catalog & Configuration",
        "Templates & Quote Experience",
        "Integrations & Workflow"
      ]
    },
    momentum: {
      sessions: "2–3",
      pace: "3–5 weeks",
      meaning: "Smaller steps with quick wins and clearer next actions to help maintain momentum.",
      focusAreas: [
        "Quote Fundamentals",
        "Templates & Essentials"
      ]
    }
  };

  return meta[type];
}

function buildCoreSessions(type, priorities) {
  const sessions = [];

  sessions.push(makeSession(
    "Session 1 – Kickoff + First Quote + Roadmap",
    [
      "Kickoff",
      "First quote demo",
      "Customer quote experience",
      "Roadmap planning"
    ]
  ));

  if (type === "explorer") {
    sessions.push(makeSession(
      "Session 2 – Catalog & Quoting Workflow",
      buildTopicList([
        "Products & categories",
        "Marketplace imports",
        "Bundles",
        "Dynamic pricing",
        "Margin strategy"
      ], priorities)
    ));

    sessions.push(makeSession(
      "Session 3 – Templates, Widgets & Cover Pages",
      buildTopicList([
        "Templates",
        "Widgets",
        "Cover pages",
        "Branding",
        "Customer quote experience"
      ], priorities)
    ));
  }

  if (type === "expert") {
    sessions.push(makeSession(
      "Session 2 – Integrations & Catalog Strategy",
      buildTopicList([
        "PSA sync",
        "Distributor feeds",
        "Source of truth",
        "Marketplace imports",
        "Catalog structure"
      ], priorities)
    ));

    sessions.push(makeSession(
      "Session 3 – Templates, Widgets & Cover Pages",
      buildTopicList([
        "Templates",
        "Widgets",
        "Approval rules",
        "Quote workflow",
        "Email defaults"
      ], priorities)
    ));
  }

  if (type === "guided") {
    sessions.push(makeSession(
      "Session 2 – Catalog & Pricing",
      buildTopicList([
        "Products & categories",
        "Marketplace imports",
        "Bundles",
        "Dynamic pricing",
        "Pricing consistency"
      ], priorities)
    ));

    sessions.push(makeSession(
      "Session 3 – Templates, Widgets & Cover Pages",
      buildTopicList([
        "Templates",
        "Widgets",
        "Email defaults",
        "Email templates",
        "Notifications"
      ], priorities)
    ));

    sessions.push(makeSession(
      "Session 4 – Refining Your Workflow",
      buildTopicList([
        "PSA sync",
        "Opportunity stages",
        "Approval rules",
        "Users & permissions",
        "Operational workflow"
      ], priorities)
    ));
  }

  if (type === "rollout") {
    sessions.push(makeSession(
      "Session 2 – Catalog & Configuration",
      buildTopicList([
        "Products & categories",
        "Marketplace imports",
        "Dynamic pricing",
        "Distributor feeds",
        "PSA sync"
      ], priorities)
    ));

    sessions.push(makeSession(
      "Session 3 – Templates, Widgets & Cover Pages",
      buildTopicList([
        "Templates",
        "Widgets",
        "Branding",
        "Customer quote experience",
        "Notifications"
      ], priorities)
    ));

    sessions.push(makeSession(
      "Session 4 – Refining Your Workflow",
      buildTopicList([
        "PSA sync behavior",
        "Opportunity stages",
        "Users & permissions",
        "Approval workflow"
      ], priorities)
    ));
  }

  if (type === "momentum") {
    sessions.push(makeSession(
      "Session 2 – Quick Quote Workflow",
      buildTopicList([
        "Products & categories",
        "Marketplace imports",
        "First real quote workflow"
      ], priorities)
    ));

    sessions.push(makeSession(
      "Session 3 – Templates, Widgets & Cover Pages",
      buildTopicList([
        "Templates",
        "Email defaults",
        "Customer quote experience",
        "Simple best practices"
      ], priorities)
    ));
  }

  return sessions;
}

function buildAddonSessions(salesTrainingNeeded, storefrontNeeded) {
  const sessions = [];

  if (salesTrainingNeeded === "yes") {
    sessions.push(makeSession(
      "Add-On – Sales Team Training",
      [
        "How to create a quote from templates",
        "How to add products and services",
        "How to send quotes",
        "Sales-only quoting workflow"
      ],
      true
    ));
  }

  if (storefrontNeeded === "yes") {
    sessions.push(makeSession(
      "Add-On – Storefront Module",
      [
        "Storefront overview",
        "Catalog readiness for storefront",
        "Self-serve order flow",
        "Approved order sync back to Salesbuildr"
      ],
      true
    ));
  }

  return sessions;
}

function makeSession(title, topics, isAddon = false) {
  return {
    title,
    topics,
    isScheduled: false,
    isAddon,
    assignedAgent: "mike",
    plannedDate: ""
  };
}

function buildTopicList(defaultTopics, priorities) {
  const topics = [...defaultTopics];

  if (priorities.includes("sync") && !topics.includes("PSA sync")) {
    topics.push("PSA sync");
  }

  if (priorities.includes("appearance") && !topics.includes("Templates")) {
    topics.push("Templates");
  }

  if (priorities.includes("experience") && !topics.includes("Customer quote experience")) {
    topics.push("Customer quote experience");
  }

  return topics.slice(0, 5);
}

function assignPlannedDates(sessions, goLiveDate, type) {
  if (!sessions.length) return sessions;

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const goLive = new Date(goLiveDate + "T12:00:00");

  const START_OFFSET = 5;
  const END_BUFFER = 3;

  const startDate = addBusinessDays(today, START_OFFSET);
  const endDate = subtractBusinessDays(goLive, END_BUFFER);

  const coreSessions = sessions.filter(session => !session.isAddon);
  const addonSessions = sessions.filter(session => session.isAddon);

  let scheduledCoreDates = [];
  let scheduledAddonDates = [];

  if (coreSessions.length > 0) {
    scheduledCoreDates = spreadDatesBetween(startDate, endDate, coreSessions.length);
  }

  if (addonSessions.length > 0) {
    const addonStart = coreSessions.length > 0
      ? addBusinessDays(parseIsoDate(scheduledCoreDates[scheduledCoreDates.length - 1]), 2)
      : startDate;

    scheduledAddonDates = spreadDatesBetween(addonStart, endDate, addonSessions.length);
  }

  const updatedCore = coreSessions.map((session, index) => ({
    ...session,
    plannedDate: scheduledCoreDates[index] || formatDate(startDate)
  }));

  const updatedAddon = addonSessions.map((session, index) => ({
    ...session,
    plannedDate: scheduledAddonDates[index] || formatDate(endDate)
  }));

  return [...updatedCore, ...updatedAddon];
}

function spreadDatesBetween(startDate, endDate, count) {
  if (count <= 0) return [];

  if (count === 1) {
    return [formatDate(startDate)];
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const totalBusinessDays = countBusinessDaysBetween(start, end);

  if (totalBusinessDays <= 0) {
    const fallback = [];
    let current = new Date(start);
    for (let i = 0; i < count; i++) {
      fallback.push(formatDate(current));
      current = addBusinessDays(current, 1);
    }
    return fallback;
  }

  const gap = Math.max(1, Math.floor(totalBusinessDays / (count - 1)));
  const dates = [];
  let current = new Date(start);

  for (let i = 0; i < count; i++) {
    dates.push(formatDate(current));
    current = addBusinessDays(current, gap);
    if (current > end) {
      current = new Date(end);
    }
  }

  return dates;
}

function countBusinessDaysBetween(startDate, endDate) {
  const current = new Date(startDate);
  let count = 0;

  while (current < endDate) {
    current.setDate(current.getDate() + 1);
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
  }

  return count;
}

function parseIsoDate(iso) {
  return new Date(iso + "T12:00:00");
}

function subtractBusinessDays(date, days) {
  const result = new Date(date);
  let remaining = days;

  while (remaining > 0) {
    result.setDate(result.getDate() - 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) {
      remaining--;
    }
  }

  return result;
}

function addBusinessDays(date, days) {
  const result = new Date(date);
  let added = 0;

  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) {
      added++;
    }
  }

  return result;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function renderRecommendation(typeName, whyBullets, planMeta) {
  recommendationEl.innerHTML = `
    <div class="recommendation-type">${typeName}</div>

    <div class="info-section">
      <h3>Why this was recommended</h3>
      <ul>
        ${whyBullets.map(item => `<li>${item}</li>`).join("")}
      </ul>
    </div>

    <div class="info-section">
      <h3>What this means</h3>
      <ul>
        <li>Recommended core sessions: <strong>${planMeta.sessions}</strong></li>
        <li>Estimated pace: <strong>${planMeta.pace}</strong></li>
        <li>${planMeta.meaning}</li>
      </ul>
    </div>

    <div class="info-section">
      <h3>Focus areas</h3>
      <ul>
        ${planMeta.focusAreas.map(item => `<li>${item}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderSessions(sessions, containerEl, isAddonSection) {
  containerEl.innerHTML = "";

  if (!sessions || sessions.length === 0) {
    containerEl.innerHTML = `<div class="muted">${isAddonSection ? "No add-on sessions selected." : "No sessions generated."}</div>`;
    return;
  }

  sessions.forEach((session, index) => {
    const topicsText = session.topics.join(" • ");
    const sessionTitleForCopy = `Salesbuildr Onboarding – ${session.title.replace(/^Session \d+ – /, "").replace(/^Add-On – /, "")}`;
const isScheduled = Boolean(session.isScheduled);
const statusClass = isScheduled ? "status-scheduled" : "status-not-scheduled";
const statusText = isScheduled ? "Scheduled" : "Not Scheduled";
const toggleText = isScheduled ? "Mark Unscheduled" : "Mark Scheduled";
    const cardClass = session.isAddon ? "session-card addon-card" : "session-card";
    const sessionKey = getSessionKey(isAddonSection, index);

    containerEl.innerHTML += `
      <div class="${cardClass}">
        <div class="session-header">
          <div class="session-title">${session.title}</div>
          <div class="session-status-badge ${statusClass}">${statusText}</div>
        </div>
        <div class="session-date">Planned Date: ${session.plannedDate || "TBD"}</div>
        <div class="session-topics">${topicsText}</div>

        <div class="agent-row">
          <label for="agent-${sessionKey}">Assigned Agent</label>
          <select class="agent-select" id="agent-${sessionKey}" data-session-key="${sessionKey}">
            ${buildAgentOptions(session.assignedAgent)}
          </select>
        </div>

        <div class="session-actions">
          <a class="session-link-btn" href="${AGENT_LINKS[session.assignedAgent]}" target="_blank" rel="noopener noreferrer">Schedule Session</a>
          <button class="session-copy-btn" type="button" data-copy-title="${escapeHtml(sessionTitleForCopy)}">Copy Session Title</button>
          <button class="session-status-btn" type="button" data-session-key="${sessionKey}">${toggleText}</button>
          <button type="button" onclick="deleteAdhocSession(${index})" style="margin-left:8px;">Delete</button>
          ${agentMode ? `<button class="session-script-btn" type="button" onclick="openScript('${escapeHtmlAttribute(session.title)}')">View Script</button>` : ""}
        </div>
      </div>
    `;
  });
}

function getSessionKey(isAddonSection, index) {
  return `${isAddonSection ? "addon" : "core"}-${index}`;
}

function buildAgentOptions(selectedAgent) {
  return Object.keys(AGENT_LABELS)
    .map(agent => `<option value="${agent}" ${agent === selectedAgent ? "selected" : ""}>${AGENT_LABELS[agent]}</option>`)
    .join("");
}

function bindSessionCopyButtons() {
  const buttons = document.querySelectorAll(".session-copy-btn");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const text = button.getAttribute("data-copy-title");
      navigator.clipboard.writeText(text).then(() => {
        const original = button.textContent;
        button.textContent = "Copied!";
        setTimeout(() => {
          button.textContent = original;
        }, 1200);
      }).catch(() => {
        alert("Could not copy the session title.");
      });
    });
  });
}

function bindSessionStatusButtons() {
  const buttons = document.querySelectorAll(".session-status-btn");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const sessionKey = button.getAttribute("data-session-key");
      toggleSessionStatus(sessionKey);
    });
  });
}

function toggleSessionStatus(sessionKey) {
  console.log("toggle clicked", sessionKey);
  
  if (!currentPlanData) return;

  const [group, indexStr] = sessionKey.split("-");
  const index = Number(indexStr);

  if (group === "core" && currentPlanData.coreSessions[index]) {
    currentPlanData.coreSessions = currentPlanData.coreSessions.map((session, i) => {
      if (i === index) {
        return {
          ...session,
          isScheduled: !Boolean(session.isScheduled)
        };
      }
      return session;
    });
  }

  if (group === "addon" && currentPlanData.addonSessions[index]) {
    currentPlanData.addonSessions = currentPlanData.addonSessions.map((session, i) => {
      if (i === index) {
        return {
          ...session,
          isScheduled: !Boolean(session.isScheduled)
        };
      }
      return session;
    });
  }

  if (group === "adhoc" && currentPlanData.adhocSessions[index]) {
  currentPlanData.adhocSessions = currentPlanData.adhocSessions.map((session, i) => {
    if (i === index) {
      return {
        ...session,
        isScheduled: !Boolean(session.isScheduled)
      };
    }
    return session;
  });
}
  
  renderAll(currentPlanData);
}

function bindAgentDropdowns() {
  const dropdowns = document.querySelectorAll(".agent-select");

  dropdowns.forEach(dropdown => {
    dropdown.addEventListener("change", () => {
      const sessionKey = dropdown.getAttribute("data-session-key");
      const target = getSessionByKey(sessionKey);
      if (!target) return;

      target.assignedAgent = dropdown.value;
      renderAll(currentPlanData);
    });
  });
}

function getSessionByKey(sessionKey) {
  if (!currentPlanData) return null;

  const [group, indexStr] = sessionKey.split("-");
  const index = Number(indexStr);

  if (group === "core") return currentPlanData.coreSessions[index] || null;
  if (group === "addon") return currentPlanData.addonSessions[index] || null;
  if (group === "adhoc") return currentPlanData.adhocSessions[index] || null;

  return null;
}

function getAgendaSession(planData) {
  if (!planData) return null;

  const combined = [...planData.coreSessions, ...planData.addonSessions];
  if (combined.length === 0) return null;

  const startIndex = planData.plannerUsage === "session1" ? 1 : 0;

  for (let i = startIndex; i < combined.length; i++) {
    if (!combined[i].isScheduled) {
      return combined[i];
    }
  }

  return combined[startIndex] || combined[combined.length - 1];
}

function renderAgenda(planData) {
  const nextSession = getAgendaSession(planData);

  if (!nextSession) {
    agendaPanel.innerHTML = `<div class="muted">No session data available.</div>`;
    return;
  }

  agendaPanel.innerHTML = `
    <div class="agenda-title">Next Meeting Agenda</div>
    <div class="agenda-line"><strong>MSP:</strong> ${planData.mspName}</div>
    <div class="agenda-line"><strong>Onboarding Type:</strong> ${planData.recommendedTypeName}</div>
    <div class="agenda-line"><strong>Planner Usage:</strong> ${planData.plannerUsage === "session1" ? "We are in Session 1 now" : "Planning / kickoff only"}</div>
    <div class="agenda-line"><strong>Go-Live:</strong> ${planData.goLiveDate}</div>
    <div class="agenda-line"><strong>Next Session:</strong> ${nextSession.title}</div>
    <div class="agenda-line"><strong>Assigned Agent:</strong> ${AGENT_LABELS[nextSession.assignedAgent]}</div>
    <div class="agenda-line"><strong>Planned Date:</strong> ${nextSession.plannedDate || "TBD"}</div>
    <div class="agenda-line"><strong>Focus Topics:</strong> ${nextSession.topics.join(" • ")}</div>
  `;
}

function renderReport(planData) {
  const priorityLabels = planData.priorities.map(getPriorityLabel);
  const usageLabel = planData.plannerUsage === "session1" ? "We are in Session 1 now" : "Planning / kickoff only";

  let report = `MSP: ${planData.mspName}
Go-Live Date: ${planData.goLiveDate}
Planner Usage: ${usageLabel}

Recommended Onboarding Type: ${planData.recommendedTypeName}

Why this was recommended:
`;

  planData.whyBullets.forEach(item => {
    report += `- ${item}
`;
  });

  report += `
What this means:
- Recommended core sessions: ${planData.planMeta.sessions}
- Estimated pace: ${planData.planMeta.pace}
- ${planData.planMeta.meaning}

Priority Areas:
`;

  priorityLabels.forEach(item => {
    report += `- ${item}
`;
  });

  report += `
Core Sessions:
`;

  planData.coreSessions.forEach(session => {
    report += `- ${session.title} (${session.plannedDate || "TBD"}) [${session.isScheduled ? "Scheduled" : "Not Scheduled"}] [Agent: ${AGENT_LABELS[session.assignedAgent]}]
`;
    session.topics.forEach(topic => {
      report += `  • ${topic}
`;
    });
  });

  report += `
Add-On Sessions:
`;

  if (planData.addonSessions.length === 0) {
    report += `- None
`;
  } else {
    planData.addonSessions.forEach(session => {
      report += `- ${session.title} (${session.plannedDate || "TBD"}) [${session.isScheduled ? "Scheduled" : "Not Scheduled"}] [Agent: ${AGENT_LABELS[session.assignedAgent]}]
`;
      session.topics.forEach(topic => {
        report += `  • ${topic}
`;
      });
    });
  }

  report += `
Ad-Hoc Sessions:
`;

if (!planData.adhocSessions || planData.adhocSessions.length === 0) {
  report += `- None
`;
} else {
  planData.adhocSessions.forEach(session => {
    report += `- ${session.title} (${session.plannedDate || "TBD"}) [${session.isScheduled ? "Scheduled" : "Not Scheduled"}] [Agent: ${AGENT_LABELS[session.assignedAgent]}]
`;
  });
}
  
  const nextSession = getAgendaSession(planData);

  if (nextSession) {
    report += `
Next Meeting Agenda:
- ${nextSession.title}
- Assigned Agent: ${AGENT_LABELS[nextSession.assignedAgent]}
- Planned Date: ${nextSession.plannedDate || "TBD"}
`;
    nextSession.topics.forEach(topic => {
      report += `  • ${topic}
`;
    });
  }

  reportOutput.value = report;
}

function getPriorityLabel(value) {
  const labels = {
    appearance: "Better looking quotes",
    speed: "Faster quoting",
    sync: "Better PSA sync",
    pricing: "Standardized pricing",
    sales: "Sales team efficiency",
    experience: "Better customer quote experience"
  };

  return labels[value] || value;
}

function copyReport() {
  reportOutput.select();
  document.execCommand("copy");
}

function copyAgenda() {
  if (!currentPlanData) {
    alert("Please generate or import a plan first.");
    return;
  }

  const nextSession = getAgendaSession(currentPlanData);

  if (!nextSession) {
    alert("No agenda available to copy.");
    return;
  }

  const text = `MSP: ${currentPlanData.mspName}
Onboarding Type: ${currentPlanData.recommendedTypeName}
Planner Usage: ${currentPlanData.plannerUsage === "session1" ? "We are in Session 1 now" : "Planning / kickoff only"}
Go-Live: ${currentPlanData.goLiveDate}

Next Session: ${nextSession.title}
Assigned Agent: ${AGENT_LABELS[nextSession.assignedAgent]}
Planned Date: ${nextSession.plannedDate || "TBD"}

Focus Topics:
- ${nextSession.topics.join("\n- ")}`;

  navigator.clipboard.writeText(text).then(() => {
    const original = copyAgendaBtn.textContent;
    copyAgendaBtn.textContent = "Copied!";
    setTimeout(() => {
      copyAgendaBtn.textContent = original;
    }, 1200);
  }).catch(() => {
    alert("Could not copy the agenda.");
  });
}

function exportPlan() {
  if (!currentPlanData) {
    alert("Please generate or import a plan first.");
    return;
  }

  const safeName = currentPlanData.mspName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const filename = `${safeName || "msp"}-onboarding-plan.json`;

  const dataStr = JSON.stringify(currentPlanData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

function importPlan(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);

      populateForm(imported);
      currentPlanData = {
        ...imported,
        coreSessions: imported.coreSessions || [],
        addonSessions: imported.addonSessions || [],
        notes: imported.notes || []
      };
      renderAll(currentPlanData);
    } catch (err) {
      alert("Could not import plan file. Please check that it is a valid JSON export.");
    }
  };

  reader.readAsText(file);
}

function populateForm(planData) {
  document.getElementById("mspName").value = planData.mspName || "";
  document.getElementById("goLiveDate").value = planData.goLiveDate || "";
  document.getElementById("plannerUsage").value = planData.plannerUsage || "planning";
  document.getElementById("q1").value = planData.answers?.q1 || "";
  document.getElementById("q2").value = planData.answers?.q2 || "";
  document.getElementById("q3").value = planData.answers?.q3 || "";
  document.getElementById("salesTrainingNeeded").value = planData.answers?.salesTrainingNeeded || "";
  document.getElementById("storefrontNeeded").value = planData.answers?.storefrontNeeded || "";
  setSelectedPriorities(planData.priorities || []);

  if (agentModeToggle) {
    agentMode = agentModeToggle.checked;
  }
}

function openScript(sessionTitle) {
  const modal = document.getElementById("scriptModal");
  const body = document.getElementById("scriptBody");
  const content = document.querySelector(".script-content");

  if (!modal || !body || !content) return;

  body.innerHTML = getScriptContent(sessionTitle);
  modal.style.display = "flex";

  body.scrollTop = 0;
  modal.scrollTop = 0;
  content.scrollTop = 0;
}

function closeScript() {
  const modal = document.getElementById("scriptModal");
  if (modal) {
    modal.style.display = "none";
  }
}

document.getElementById("addNoteBtn").addEventListener("click", () => {
  const form = document.getElementById("noteForm");
  if (!form) return;

  form.style.display = form.style.display === "none" ? "block" : "none";
});

document.getElementById("addAdhocBtn").addEventListener("click", () => {
  const form = document.getElementById("adhocForm");
  if (!form) return;

  form.style.display = form.style.display === "none" ? "block" : "none";
});


/* ===== ADD THIS BLOCK START ===== */

let notes = [];

document.getElementById("saveNoteBtn").addEventListener("click", () => {
  const type = document.getElementById("noteType").value;
  const session = document.getElementById("noteSession").value;
  const text = document.getElementById("noteText").value;

  if (!text.trim()) return;

  const note = {
    type,
    session,
    text,
    status: "Open"
  };

 if (!currentPlanData.notes) {
  currentPlanData.notes = [];
}

currentPlanData.notes.push(note);
notes = currentPlanData.notes;

  renderNotes();

  // reset form
  document.getElementById("noteText").value = "";
  document.getElementById("noteForm").style.display = "none";
});

function renderNotes() {
  const container = document.getElementById("notesSection");
  if (!container) return;

  if (notes.length === 0) {
    container.innerHTML = `<div class="muted">No notes yet.</div>`;
    return;
  }

  container.innerHTML = notes.map((note, index) => `
  <div class="note-item" style="margin-bottom:12px;">
  <strong>${note.type}</strong>
  ${note.session ? `— ${note.session}` : ""}
  <br>
  ${note.text}
  <br>
  <em>Status: ${note.status}</em>
  <br>
  <button type="button" onclick="toggleNoteStatus(${index})">
    ${note.status === "Open" ? "Mark Done" : "Mark Open"}
  </button>

  ${note.type === "Ad-hoc session idea" ? `
    <button type="button" onclick="createAdhocFromNote(${index})">
      Create Session
    </button>
  ` : ""}
</div>
  `).join("");
}

function toggleNoteStatus(index) {
  if (!notes[index]) return;

  notes[index].status = notes[index].status === "Open" ? "Done" : "Open";

  renderNotes();
}

// 👇 PASTE RIGHT HERE

function createAdhocFromNote(index) {
  if (!notes[index] || !currentPlanData) return;

  const note = notes[index];

  // Prevent duplicate session creation from the same note
  const alreadyExists = (currentPlanData.adhocSessions || []).some(
    session => session.title === note.text
  );

  if (alreadyExists) {
    alert("An ad-hoc session with this title already exists.");
    return;
  }

  const session = {
    title: note.text,
    plannedDate: "TBD",
    assignedAgent: "mike",
    isScheduled: false,
    isAddon: false,
    isAdhoc: true,
    topics: []
  };

  if (!currentPlanData.adhocSessions) {
    currentPlanData.adhocSessions = [];
  }

  currentPlanData.adhocSessions.push(session);

  // Mark the note as done once a session is created
  notes[index].status = "Done";
  currentPlanData.notes = notes;

  adhocSessions = currentPlanData.adhocSessions;

  renderAll(currentPlanData);

  // Scroll the Ad-Hoc section into view so the user sees the result
  const adhocCard = document.getElementById("adhocSection");
  if (adhocCard) {
    adhocCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// 👇 ADD THIS NEW FUNCTION RIGHT BELOW

function deleteAdhocSession(index) {
  if (!currentPlanData || !currentPlanData.adhocSessions) return;

  const confirmDelete = confirm("Delete this ad-hoc session?");
  if (!confirmDelete) return;

  currentPlanData.adhocSessions.splice(index, 1);
  adhocSessions = currentPlanData.adhocSessions;

  renderAll(currentPlanData);
}

let adhocSessions = [];

document.getElementById("saveAdhocBtn").addEventListener("click", () => {
  const title = document.getElementById("adhocTitle").value;
  const date = document.getElementById("adhocDate").value;
  const agent = document.getElementById("adhocAgent").value;

  if (!title.trim()) return;

  const session = {
    title,
    plannedDate: date || "TBD",
    assignedAgent: agent,
    isScheduled: false,
    isAddon: false,
    isAdhoc: true,
    topics: []
  };

  if (!currentPlanData.adhocSessions) {
    currentPlanData.adhocSessions = [];
  }

  currentPlanData.adhocSessions.push(session);
  adhocSessions = currentPlanData.adhocSessions;

  renderAll(currentPlanData);

  // reset form
  document.getElementById("adhocTitle").value = "";
  document.getElementById("adhocDate").value = "";
  document.getElementById("adhocForm").style.display = "none";
});

function renderAdhocSessions() {
  const container = document.getElementById("adhocSection");
  if (!container) return;

  if (!adhocSessions || adhocSessions.length === 0) {
    container.innerHTML = `<div class="muted">No ad-hoc sessions added.</div>`;
    return;
  }

  container.innerHTML = adhocSessions.map((session, index) => {
    const isScheduled = Boolean(session.isScheduled);
    const statusClass = isScheduled ? "status-scheduled" : "status-not-scheduled";
    const statusText = isScheduled ? "Scheduled" : "Not Scheduled";
    const toggleText = isScheduled ? "Mark Unscheduled" : "Mark Scheduled";

    const sessionKey = `adhoc-${index}`;

    return `
      <div class="session-card">
        <div class="session-header">
          <div class="session-title">${session.title}</div>
          <div class="session-status-badge ${statusClass}">${statusText}</div>
        </div>

        <div class="session-date">Planned Date: ${session.plannedDate}</div>
        <div class="session-topics">Ad-hoc session</div>

        <div class="agent-row">
          <label>Assigned Agent</label>
          <select class="agent-select" data-session-key="${sessionKey}">
            ${buildAgentOptions(session.assignedAgent)}
          </select>
        </div>

 <div class="session-actions">
  <a class="session-link-btn" href="${AGENT_LINKS[session.assignedAgent]}" target="_blank" rel="noopener noreferrer">
    Schedule Session
  </a>

 <button class="session-copy-btn" type="button" data-copy-title="${escapeHtml(`Salesbuildr Onboarding – ${session.title}`)}">
  Copy Session Title
</button>

  <button class="session-status-btn" type="button" data-session-key="${sessionKey}">
    ${toggleText}
  </button>
</div>
      </div>
    `;
  }).join("");
}

/* ===== ADD THIS BLOCK END ===== */

function getScriptKeyFromTitle(title) {
  if (title.includes("Kickoff")) return "session1";
  if (title.includes("Catalog")) return "session2_catalog";
  if (title.includes("Templates")) return "session3_templates";
  if (title.includes("Workflow")) return "session4_workflow";
  if (title.includes("Sales Team Training")) return "addon_sales";
  if (title.includes("Storefront")) return "addon_storefront";
  return null;
}

function getScriptContent(title) {
  const scriptKey = getScriptKeyFromTitle(title);
  const script = SESSION_SCRIPTS[scriptKey];

  if (!script) {
    return "<p>No script available yet.</p>";
  }

  let html = `
    <h2>${title}</h2>

    <h3>Objective</h3>
    <p>${script.objective.replace(/\n/g, "<br>")}</p>

    <h3>Session Flow</h3>
  `;

  script.flow.forEach(step => {
    html += `
      <div style="margin-bottom:10px;">
        <strong>${step.title}</strong><br>
        ${step.content.replace(/\n/g, "<br>")}
      </div>
    `;
  });

  html += `
    <h3>Key Points</h3>
    <ul>
      ${script.keyPoints.map(p => `<li>${p}</li>`).join("")}
    </ul>

    <h3>Avoid</h3>
    <ul>
      ${script.avoid.map(a => `<li>${a}</li>`).join("")}
    </ul>

    <h3>Homework</h3>
    <p>${script.homework.replace(/\n/g, "<br>")}</p>
  `;

  return html;
}

window.openScript = openScript;
window.closeScript = closeScript;

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlAttribute(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "\\'");
}
