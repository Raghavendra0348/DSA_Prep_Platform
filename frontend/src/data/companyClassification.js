// ── Company Classification Data ──────────────────────────────────────────────
// Static map: slug → { tier, type }
// type: 'product' | 'service'
// tier: 1 | 2 | 3 | 4 (0 = unclassified / other)
//
// Source: product_based.txt + industry knowledge
// ─────────────────────────────────────────────────────────────────────────────

// ── Tier & Type Metadata ─────────────────────────────────────────────────────
export const TIER_INFO = {
  1: {
    label: 'Tier 1',
    title: 'FAANG+ / Dream Companies',
    ctc: '30–80+ LPA',
    description: 'Extremely competitive. DSA + System Design + CS Fundamentals.',
    color: '#f0883e',
  },
  2: {
    label: 'Tier 2',
    title: 'Top Product + Finance',
    ctc: '18–45+ LPA',
    description: 'Strong DSA + good LLD/HLD skills. Finance = competitive programming.',
    color: '#58a6ff',
  },
  3: {
    label: 'Tier 3',
    title: 'Indian Unicorns & Startups',
    ctc: '12–35+ LPA',
    description: 'Great for freshers! DSA + LLD. Some HLD for experienced.',
    color: '#3fb950',
  },
  4: {
    label: 'Tier 4',
    title: 'Service-Based (Elevated Roles)',
    ctc: '6–14 LPA',
    description: 'Good starting point. DSA basics + CS Fundamentals + Aptitude.',
    color: '#8b949e',
  },
  0: {
    label: 'Other',
    title: 'Other Companies',
    ctc: 'Varies',
    description: 'International companies, niche firms, and others.',
    color: '#30363d',
  },
};

export const TYPE_INFO = {
  product: { label: 'Product-Based' },
  service: { label: 'Service-Based' },
  other:   { label: 'Other' },
};

// ── The Classification Map ───────────────────────────────────────────────────
// Keys are exact database slugs (verified against DB query)

const COMPANY_CLASSIFICATION = {
  // ─── TIER 1 — FAANG+ / Dream Companies ──────────────────────────────────
  'google':                { tier: 1, type: 'product' },
  'microsoft':             { tier: 1, type: 'product' },
  'amazon':                { tier: 1, type: 'product' },
  'apple':                 { tier: 1, type: 'product' },
  'meta':                  { tier: 1, type: 'product' },
  'netflix':               { tier: 1, type: 'product' },
  'uber':                  { tier: 1, type: 'product' },
  'stripe':                { tier: 1, type: 'product' },
  'airbnb':                { tier: 1, type: 'product' },
  'linkedin':              { tier: 1, type: 'product' },
  'x':                     { tier: 1, type: 'product' },  // Twitter/X
  'palantir-technologies': { tier: 1, type: 'product' },
  'databricks':            { tier: 1, type: 'product' },
  'snowflake':             { tier: 1, type: 'product' },
  'coinbase':              { tier: 1, type: 'product' },
  'openai':                { tier: 1, type: 'product' },
  'bytedance':             { tier: 1, type: 'product' },
  'tiktok':                { tier: 1, type: 'product' },
  'spotify':               { tier: 1, type: 'product' },
  'doordash':              { tier: 1, type: 'product' },
  'snap':                  { tier: 1, type: 'product' },
  'pinterest':             { tier: 1, type: 'product' },
  'dropbox':               { tier: 1, type: 'product' },
  'shopify':               { tier: 1, type: 'product' },
  'robinhood':             { tier: 1, type: 'product' },
  'roblox':                { tier: 1, type: 'product' },
  'reddit':                { tier: 1, type: 'product' },
  'lyft':                  { tier: 1, type: 'product' },
  'tesla':                 { tier: 1, type: 'product' },
  'block':                 { tier: 1, type: 'product' },

  // ─── TIER 2 — Top Product + Finance Companies ───────────────────────────
  'adobe':                 { tier: 2, type: 'product' },
  'goldman-sachs':         { tier: 2, type: 'product' },
  'morgan-stanley':        { tier: 2, type: 'product' },
  'atlassian':             { tier: 2, type: 'product' },
  'salesforce':            { tier: 2, type: 'product' },
  'intuit':                { tier: 2, type: 'product' },
  'visa':                  { tier: 2, type: 'product' },
  'mastercard':            { tier: 2, type: 'product' },
  'paypal':                { tier: 2, type: 'product' },
  'samsung':               { tier: 2, type: 'product' },
  'oracle':                { tier: 2, type: 'product' },
  'vmware':                { tier: 2, type: 'product' },
  'cisco':                 { tier: 2, type: 'product' },
  'sap':                   { tier: 2, type: 'product' },
  'qualcomm':              { tier: 2, type: 'product' },
  'nvidia':                { tier: 2, type: 'product' },
  'intel':                 { tier: 2, type: 'product' },
  'servicenow':            { tier: 2, type: 'product' },
  'splunk':                { tier: 2, type: 'product' },
  'nutanix':               { tier: 2, type: 'product' },
  'rubrik':                { tier: 2, type: 'product' },
  'cloudera':              { tier: 2, type: 'product' },
  'expedia':               { tier: 2, type: 'product' },
  'booking-com':           { tier: 2, type: 'product' },
  'walmart-labs':          { tier: 2, type: 'product' },
  'j-p-morgan':            { tier: 2, type: 'product' },
  'deutsche-bank':         { tier: 2, type: 'product' },
  'barclays':              { tier: 2, type: 'product' },
  'tower-research-capital':{ tier: 2, type: 'product' },
  'de-shaw':               { tier: 2, type: 'product' },
  'american-express':      { tier: 2, type: 'product' },
  'capital-one':           { tier: 2, type: 'product' },
  'bloomberg':             { tier: 2, type: 'product' },
  'citadel':               { tier: 2, type: 'product' },
  'two-sigma':             { tier: 2, type: 'product' },
  'jane-street':           { tier: 2, type: 'product' },
  'hudson-river-trading':  { tier: 2, type: 'product' },
  'jump-trading':          { tier: 2, type: 'product' },
  'blackrock':             { tier: 2, type: 'product' },
  'datadog':               { tier: 2, type: 'product' },
  'crowdstrike':           { tier: 2, type: 'product' },
  'cloudflare':            { tier: 2, type: 'product' },
  'mongodb':               { tier: 2, type: 'product' },
  'twilio':                { tier: 2, type: 'product' },
  'workday':               { tier: 2, type: 'product' },
  'palo-alto-networks':    { tier: 2, type: 'product' },
  'docusign':              { tier: 2, type: 'product' },
  'autodesk':              { tier: 2, type: 'product' },
  'ebay':                  { tier: 2, type: 'product' },
  'dell':                  { tier: 2, type: 'product' },
  'hp':                    { tier: 2, type: 'product' },
  'sony':                  { tier: 2, type: 'product' },
  'disney':                { tier: 2, type: 'product' },
  'duolingo':              { tier: 2, type: 'product' },
  'instacart':             { tier: 2, type: 'product' },
  'hubspot':               { tier: 2, type: 'product' },
  'okta':                  { tier: 2, type: 'product' },
  'asana':                 { tier: 2, type: 'product' },
  'confluent':             { tier: 2, type: 'product' },
  'notion':                { tier: 2, type: 'product' },
  'grammarly':             { tier: 2, type: 'product' },
  'rippling':              { tier: 2, type: 'product' },
  'scale-ai':              { tier: 2, type: 'product' },
  'affirm':                { tier: 2, type: 'product' },
  'brex':                  { tier: 2, type: 'product' },

  // ─── TIER 3 — Indian Unicorns & Top Startups ────────────────────────────
  'flipkart':              { tier: 3, type: 'product' },
  'phonepe':               { tier: 3, type: 'product' },
  'razorpay':              { tier: 3, type: 'product' },
  'swiggy':                { tier: 3, type: 'product' },
  'zomato':                { tier: 3, type: 'product' },
  'dream11':               { tier: 3, type: 'product' },
  'cred':                  { tier: 3, type: 'product' },
  'meesho':                { tier: 3, type: 'product' },
  'groww':                 { tier: 3, type: 'product' },
  'zepto':                 { tier: 3, type: 'product' },
  'sharechat':             { tier: 3, type: 'product' },
  'ola-cabs':              { tier: 3, type: 'product' },
  'dunzo':                 { tier: 3, type: 'product' },
  'navi':                  { tier: 3, type: 'product' },
  'paytm':                 { tier: 3, type: 'product' },
  'cars24':                { tier: 3, type: 'product' },
  'urban-company':         { tier: 3, type: 'product' },
  'delhivery':             { tier: 3, type: 'product' },
  'indmoney':              { tier: 3, type: 'product' },
  'freshworks':            { tier: 3, type: 'product' },
  'zoho':                  { tier: 3, type: 'product' },
  'myntra':                { tier: 3, type: 'product' },
  'blinkit':               { tier: 3, type: 'product' },
  'lenskart':              { tier: 3, type: 'product' },
  'nykaa':                 { tier: 3, type: 'product' },
  'juspay':                { tier: 3, type: 'product' },
  'slice':                 { tier: 3, type: 'product' },
  'bharatpe':              { tier: 3, type: 'product' },
  'makemytrip':            { tier: 3, type: 'product' },
  'hotstar':               { tier: 3, type: 'product' },
  'inmobi':                { tier: 3, type: 'product' },
  'sprinklr':              { tier: 3, type: 'product' },
  'oyo':                   { tier: 3, type: 'product' },
  'licious':               { tier: 3, type: 'product' },
  'info-edge':             { tier: 3, type: 'product' },
  'winzo':                 { tier: 3, type: 'product' },
  'gameskraft':            { tier: 3, type: 'product' },
  'cashfree':              { tier: 3, type: 'product' },
  'cleartrip':             { tier: 3, type: 'product' },
  'freecharge':            { tier: 3, type: 'product' },
  'payu':                  { tier: 3, type: 'product' },
  'carwale':               { tier: 3, type: 'product' },
  'snapdeal':              { tier: 3, type: 'product' },
  'redbus':                { tier: 3, type: 'product' },
  'curefit':               { tier: 3, type: 'product' },
  'ninjacart':             { tier: 3, type: 'product' },
  'mindtickle':            { tier: 3, type: 'product' },
  'darwinbox':             { tier: 3, type: 'product' },
  'devrev':                { tier: 3, type: 'product' },
  'zeta':                  { tier: 3, type: 'product' },
  'directi':               { tier: 3, type: 'product' },
  'media-net':             { tier: 3, type: 'product' },

  // ─── TIER 4 — Service-Based Companies ───────────────────────────────────
  'tcs':                   { tier: 4, type: 'service' },
  'infosys':               { tier: 4, type: 'service' },
  'wipro':                 { tier: 4, type: 'service' },
  'cognizant':             { tier: 4, type: 'service' },
  'accenture':             { tier: 4, type: 'service' },
  'capgemini':             { tier: 4, type: 'service' },
  'tech-mahindra':         { tier: 4, type: 'service' },
  'hcl':                   { tier: 4, type: 'service' },
  'mindtree':              { tier: 4, type: 'service' },
  'lti':                   { tier: 4, type: 'service' },
  'virtusa':               { tier: 4, type: 'service' },
  'dxc-technology':        { tier: 4, type: 'service' },
  'genpact':               { tier: 4, type: 'service' },
  'coforge':               { tier: 4, type: 'service' },
  'nagarro':               { tier: 4, type: 'service' },
  'publicis-sapient':      { tier: 4, type: 'service' },
  'epam-systems':          { tier: 4, type: 'service' },
  'thoughtworks':          { tier: 4, type: 'service' },
  'deloitte':              { tier: 4, type: 'service' },
  'ey':                    { tier: 4, type: 'service' },
  'pwc':                   { tier: 4, type: 'service' },
  'persistent-systems':    { tier: 4, type: 'service' },
  'wissen-technology':     { tier: 4, type: 'service' },
  'luxoft':                { tier: 4, type: 'service' },
  'maq-software':          { tier: 4, type: 'service' },
  'hashedin':              { tier: 4, type: 'service' },
  'consultadd':            { tier: 4, type: 'service' },
  'mountblue':             { tier: 4, type: 'service' },
  'toptal':                { tier: 4, type: 'service' },
  'turing':                { tier: 4, type: 'service' },
  'cedcoss':               { tier: 4, type: 'service' },
  'josh-technology':       { tier: 4, type: 'service' },
  'fpt':                   { tier: 4, type: 'service' },
  'softwire':              { tier: 4, type: 'service' },
  'altimetrik':            { tier: 4, type: 'service' },
  'ibm':                   { tier: 4, type: 'service' },
};

// ── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Get classification for a company slug.
 * Returns { tier: 0, type: 'other' } if not classified.
 */
export function getClassification(slug) {
  return COMPANY_CLASSIFICATION[slug] || { tier: 0, type: 'other' };
}

/**
 * Enrich a company object with tier/type classification.
 * Returns the company with { ...company, tier, companyType }.
 */
export function enrichCompany(company) {
  const { tier, type } = getClassification(company.slug);
  return { ...company, tier, companyType: type };
}

/**
 * Group an array of companies by tier.
 * Returns Map<tier, company[]> sorted by tier (1→2→3→4→0).
 */
export function groupByTier(companies) {
  const groups = new Map();

  // Initialize all tiers in display order
  [1, 2, 3, 4, 0].forEach(t => groups.set(t, []));

  companies.forEach(company => {
    const { tier } = getClassification(company.slug);
    if (!groups.has(tier)) groups.set(tier, []);
    groups.get(tier).push(company);
  });

  // Remove empty tiers
  for (const [tier, list] of groups) {
    if (list.length === 0) groups.delete(tier);
  }

  return groups;
}

/**
 * Filter companies by type ('product' | 'service' | 'all').
 */
export function filterByType(companies, type) {
  if (type === 'all') return companies;
  return companies.filter(c => {
    const classification = getClassification(c.slug);
    return classification.type === type;
  });
}

export default COMPANY_CLASSIFICATION;
