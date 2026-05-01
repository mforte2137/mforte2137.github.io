// =========================================================
// bid-analyze.js — Netlify function
// Path: /api/bid-analyze
//
// Sends the first 25 rows of a vendor file to Claude Haiku.
// Claude identifies the header row, section header patterns
// to exclude, and column mapping suggestions.
//
// The converter works without this — it's an enhancement.
// If this call fails the tool falls back to its existing logic.
// =========================================================

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are a specialist in parsing vendor special bid and deal registration spreadsheets for MSP (Managed Service Provider) software.

Vendor files come in many formats — they often contain:
- Multiple rows of company metadata, logos, or document info BEFORE the actual product table
- Section header rows INTERSPERSED with products (e.g. "Standalone Products", "Bundle # 1 (Eclipse Id - 88294684)")
- Multi-row column headers where the real field names are not in the first header row
- Unusual column names that need mapping to standard fields

YOUR JOB:
1. Identify which 0-based row index contains the ACTUAL column headers (skip metadata above)
2. Identify patterns for rows that look like products but are actually section labels or bundle identifiers — these must be EXCLUDED from import
3. Suggest mappings from vendor column names to Salesbuildr import fields

SALESBUILDR IMPORT FIELDS:
MPN (manufacturer part number / SKU / part code)
Name (product title)
Description (longer description)
Cost (reseller buy/purchase price — NOT the sell price)
MSRP (list price / RRP / recommended retail)
Sales Price (the price charged to the customer)
Markup (percentage markup on cost)
Margin (gross margin percentage)
Quantity (min quantity / quantity on deal)
Category (product category)
Unit (unit of measure: item, license, month, etc.)
Term (subscription/contract term)
Manufacturer (vendor/brand name)
Distributor (distributor/wholesaler name)

SECTION HEADER INDICATORS (these rows should be excluded):
- The "MPN" column contains a descriptive phrase rather than a part code (has spaces, words like "Bundle", "Standalone", "Section", "Group")
- The row has no cost/price values (or only a total/extended value, not a per-unit value)
- The row appears to label or separate groups of products

Use the submit_analysis tool to return your findings.`;

const ANALYZE_TOOL = {
  name: 'submit_analysis',
  description: 'Submit analysis of the vendor spreadsheet structure',
  input_schema: {
    type: 'object',
    properties: {
      headerRowIndex: {
        type: 'integer',
        description: '0-based index of the row containing the actual column headers'
      },
      sectionHeaderColumn: {
        type: 'integer',
        description: 'Which column index (0-based) typically contains section header text, or -1 if not detected'
      },
      sectionHeaderExamples: {
        type: 'array',
        description: 'Examples of section header text found in the file',
        items: { type: 'string' }
      },
      sectionHeaderRule: {
        type: 'string',
        description: 'Plain-English rule for identifying section header rows to exclude, e.g. "Exclude rows where the Product No column contains spaces or starts with Bundle"'
      },
      columnMappings: {
        type: 'array',
        description: 'Mapping suggestions for each column found in the vendor file',
        items: {
          type: 'object',
          properties: {
            vendorColumn:     { type: 'string', description: 'The exact vendor column name' },
            salesbuildrField: { type: 'string', description: 'The Salesbuildr field name, or empty string if no match' },
            confidence:       { type: 'string', enum: ['high', 'medium', 'low'] },
            note:             { type: 'string', description: 'Brief note, e.g. "This is the distributor buy price, not the sell price"' }
          },
          required: ['vendorColumn', 'salesbuildrField', 'confidence']
        }
      },
      notes: {
        type: 'string',
        description: 'Overall observations about this file — bundle rows, pricing nuances, anything the MSP should know before importing'
      }
    },
    required: ['headerRowIndex', 'sectionHeaderColumn', 'columnMappings']
  }
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch (e) { return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  const { rows, sheetName } = body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'rows array required.' }) };
  }

  // Format the sample rows as readable text for Claude
  const rowText = rows.slice(0, 25).map((row, i) =>
    `Row ${i}: [${row.map(c => c === null || c === undefined ? '(empty)' : String(c).slice(0, 60)).join(' | ')}]`
  ).join('\n');

  const userMessage = `Analyze this vendor spreadsheet sample${sheetName ? ` (sheet: "${sheetName}")` : ''}.

${rowText}

Identify the header row, section header patterns to exclude, and map each column to the appropriate Salesbuildr field.`;

  try {
    const res  = await fetch(ANTHROPIC_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'x-api-key':     process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:       'claude-haiku-4-5-20251001',
        max_tokens:  1500,
        system:      SYSTEM_PROMPT,
        tools:       [ANALYZE_TOOL],
        tool_choice: { type: 'tool', name: 'submit_analysis' },
        messages:    [{ role: 'user', content: userMessage }]
      })
    });

    const data = await res.json();
    const tool = Array.isArray(data.content) ? data.content.find(b => b.type === 'tool_use') : null;

    if (!tool) {
      return { statusCode: 502, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Claude did not return an analysis.' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, analysis: tool.input })
    };

  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
