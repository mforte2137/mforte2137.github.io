
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
window.SESSION_SCRIPTS = SESSION_SCRIPTS;
