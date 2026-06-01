/* ============================================================
   SECURITY PROPOSAL BUILDER — security.js
   ============================================================ */

// ── DOM REFERENCES ──────────────────────────────────────────
const stepBtns       = document.querySelectorAll('.step-btn');
const stepPanels     = document.querySelectorAll('.step-panel');
const stepIndicator  = document.getElementById('stepIndicator');

// Step 1
const step1Next      = document.getElementById('step1Next');
const frameworkCards = document.querySelectorAll('.framework-card:not(.coming-soon)');

// Step 2
const step2Back      = document.getElementById('step2Back');
const step2Next      = document.getElementById('step2Next');
const clientName     = document.getElementById('clientName');
const clientIndustry = document.getElementById('clientIndustry');
const engagementType = document.getElementById('engagementType');
const igOptions      = document.querySelectorAll('.ig-option');
const userCount      = document.getElementById('userCount');
const regChecks      = document.querySelectorAll('.reg-check input');

// Step 3
const step3Back      = document.getElementById('step3Back');
const step3Next      = document.getElementById('step3Next');
const assessmentRows = document.getElementById('assessmentRows');
const completionPct  = document.getElementById('completionPct');

// Step 4
const step4Back      = document.getElementById('step4Back');
const step4Next      = document.getElementById('step4Next');
const primaryColor   = document.getElementById('primaryColor');
const primaryHex     = document.getElementById('primaryHex');
const secondaryColor = document.getElementById('secondaryColor');
const secondaryHex   = document.getElementById('secondaryHex');
const presetBtns     = document.querySelectorAll('.preset-btn');
const previewHeader  = document.getElementById('previewHeader');
const previewAccent  = document.getElementById('previewAccent');
const previewSub     = document.getElementById('previewSub');

// Step 5
const step5Back          = document.getElementById('step5Back');
const copyAllBtn         = document.getElementById('copyAllBtn');
const widgetsLoading     = document.getElementById('widgetsLoading');
const widgetsContainer   = document.getElementById('widgetsContainer');
const widgetStepActions  = document.getElementById('widgetStepActions');
const loadingStep        = document.getElementById('loadingStep');
const sbTenantUrl        = document.getElementById('sbTenantUrl');
const sbApiKey           = document.getElementById('sbApiKey');
const saveSbCreds        = document.getElementById('saveSbCreds');
const sbStatus           = document.getElementById('sbStatus');
const toast              = document.getElementById('toast');
const exportBtn          = document.getElementById('exportBtn');
const importBtn          = document.getElementById('importBtn');
const importFile         = document.getElementById('importFile');
const exportXlsxBtn      = document.getElementById('exportXlsxBtn');
const importXlsxBtn      = document.getElementById('importXlsxBtn');
const importXlsxFile     = document.getElementById('importXlsxFile');
// Handoff panel buttons (Step 3)
const saveSessionBtn     = document.getElementById('saveSessionBtn');
const downloadTechBtn    = document.getElementById('downloadTechBtn');
const loadSessionBtn     = document.getElementById('loadSessionBtn');
const importTechBtn      = document.getElementById('importTechBtn');

// ── STATE ───────────────────────────────────────────────────
let state = {
  currentStep: 1,
  framework:   'cis',
  client: {
    name:       '',
    industry:   '',
    engagement: 'assessment',
    ig:         1,
    userCount:  '',
    regulations: []
  },
  assessment:  [],   // { id, current, ideal, notes }
  theme: {
    primary:   '#1a3a5c',
    secondary: '#e8840a'
  },
  widgets:     {}   // { execSummary, currentState, gapAnalysis, idealState, riskLandscape, roadmap }
};

// ── CIS CONTROLS DATA ───────────────────────────────────────
const CIS_CONTROLS = [
  { id: 1,  name: 'Inventory & Control of Enterprise Assets',   desc: 'Actively manage all enterprise assets to accurately map the attack surface.',                           ig: 1, defaultIG1: 'partial',       defaultIG2: 'implemented', defaultIG3: 'implemented' },
  { id: 2,  name: 'Inventory & Control of Software Assets',     desc: 'Actively manage all software to prevent unauthorized software from being installed.',                  ig: 1, defaultIG1: 'partial',       defaultIG2: 'implemented', defaultIG3: 'implemented' },
  { id: 3,  name: 'Data Protection',                            desc: 'Develop processes to identify, classify, securely handle, retain, and dispose of data.',               ig: 1, defaultIG1: 'none',          defaultIG2: 'partial',     defaultIG3: 'implemented' },
  { id: 4,  name: 'Secure Configuration of Enterprise Assets',  desc: 'Establish and maintain secure configurations for all enterprise assets and software.',                  ig: 1, defaultIG1: 'partial',       defaultIG2: 'partial',     defaultIG3: 'implemented' },
  { id: 5,  name: 'Account Management',                         desc: 'Use processes to assign and manage authorization to credentials for all accounts.',                     ig: 1, defaultIG1: 'partial',       defaultIG2: 'implemented', defaultIG3: 'implemented' },
  { id: 6,  name: 'Access Control Management',                  desc: 'Use processes to create, assign, manage, and revoke access credentials and privileges.',               ig: 1, defaultIG1: 'none',          defaultIG2: 'partial',     defaultIG3: 'implemented' },
  { id: 7,  name: 'Continuous Vulnerability Management',        desc: 'Develop a plan to continuously assess and track vulnerabilities and remediate appropriately.',          ig: 1, defaultIG1: 'none',          defaultIG2: 'partial',     defaultIG3: 'implemented' },
  { id: 8,  name: 'Audit Log Management',                       desc: 'Collect, alert, review, and retain audit logs to detect, understand, or recover from an attack.',      ig: 1, defaultIG1: 'none',          defaultIG2: 'partial',     defaultIG3: 'implemented' },
  { id: 9,  name: 'Email & Web Browser Protections',           desc: 'Improve protections and detections of threats through email and web vectors.',                          ig: 1, defaultIG1: 'partial',       defaultIG2: 'implemented', defaultIG3: 'implemented' },
  { id: 10, name: 'Malware Defenses',                           desc: 'Prevent or control the installation, spread, and execution of malicious applications.',                ig: 1, defaultIG1: 'implemented',   defaultIG2: 'implemented', defaultIG3: 'implemented' },
  { id: 11, name: 'Data Recovery',                              desc: 'Establish and maintain data recovery practices to restore assets to pre-incident state.',               ig: 1, defaultIG1: 'partial',       defaultIG2: 'implemented', defaultIG3: 'implemented' },
  { id: 12, name: 'Network Infrastructure Management',          desc: 'Establish and maintain the integrity of the network infrastructure.',                                   ig: 2, defaultIG1: 'none',          defaultIG2: 'partial',     defaultIG3: 'implemented' },
  { id: 13, name: 'Network Monitoring & Defense',               desc: 'Operate processes to defend against threats to network infrastructure and services.',                   ig: 2, defaultIG1: 'none',          defaultIG2: 'partial',     defaultIG3: 'implemented' },
  { id: 14, name: 'Security Awareness & Skills Training',       desc: 'Establish and maintain a security awareness program to influence behavior among the workforce.',        ig: 1, defaultIG1: 'none',          defaultIG2: 'partial',     defaultIG3: 'implemented' },
  { id: 15, name: 'Service Provider Management',                desc: 'Develop a process to evaluate service providers who hold sensitive data or are critical to operations.',ig: 2, defaultIG1: 'none',          defaultIG2: 'none',        defaultIG3: 'partial'     },
  { id: 16, name: 'Application Software Security',              desc: 'Manage the security lifecycle of in-house developed, hosted, or acquired software.',                    ig: 2, defaultIG1: 'none',          defaultIG2: 'none',        defaultIG3: 'partial'     },
  { id: 17, name: 'Incident Response Management',               desc: 'Establish a program to prepare, detect, contain, and recover from incidents.',                          ig: 2, defaultIG1: 'none',          defaultIG2: 'partial',     defaultIG3: 'implemented' },
  { id: 18, name: 'Penetration Testing',                        desc: 'Test the effectiveness and resiliency of enterprise assets through simulated attack scenarios.',         ig: 3, defaultIG1: 'none',          defaultIG2: 'none',        defaultIG3: 'partial'     },
];


// ── NIST CSF 2.0 CONTROLS ────────────────────────────────────
const NIST_CONTROLS = [
  { id:1,  name:'Organizational Context',            desc:'Understand the organizational mission, stakeholder expectations, and legal/regulatory requirements that affect cybersecurity.',    domain:'GV', domainLabel:'GOVERN',   defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:2,  name:'Risk Management Strategy',          desc:'Establish, communicate, and monitor cybersecurity risk management priorities, constraints, tolerances, and assumptions.',          domain:'GV', domainLabel:'GOVERN',   defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:3,  name:'Roles & Responsibilities',          desc:'Establish cybersecurity roles, responsibilities, and accountability for the entire workforce and third-party stakeholders.',        domain:'GV', domainLabel:'GOVERN',   defaultS:'partial', defaultM:'partial',      defaultL:'implemented' },
  { id:4,  name:'Asset Management',                  desc:'Identify and manage assets (data, hardware, software, systems, facilities) commensurate with their importance to the business.',  domain:'ID', domainLabel:'IDENTIFY',  defaultS:'partial', defaultM:'partial',      defaultL:'implemented' },
  { id:5,  name:'Risk Assessment',                   desc:'Identify, analyze, and prioritize cybersecurity risks to the organization and its assets.',                                         domain:'ID', domainLabel:'IDENTIFY',  defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:6,  name:'Improvement',                       desc:'Identify improvements to cybersecurity risk management based on lessons learned, assessments, and reviews.',                        domain:'ID', domainLabel:'IDENTIFY',  defaultS:'none',    defaultM:'none',         defaultL:'partial'     },
  { id:7,  name:'Identity Management & Access Control', desc:'Manage identities and credentials for authorized users, services, and hardware. Manage access permissions and authorizations.',domain:'PR', domainLabel:'PROTECT',   defaultS:'partial', defaultM:'implemented',  defaultL:'implemented' },
  { id:8,  name:'Awareness & Training',              desc:'Provide cybersecurity awareness education and training for all personnel including third parties.',                                  domain:'PR', domainLabel:'PROTECT',   defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:9,  name:'Data Security',                     desc:'Manage data consistent with risk strategy to protect confidentiality, integrity, and availability of information.',                 domain:'PR', domainLabel:'PROTECT',   defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:10, name:'Platform Security',                 desc:'Manage hardware, software, and services in a manner consistent with the organization\'s risk strategy.',                            domain:'PR', domainLabel:'PROTECT',   defaultS:'partial', defaultM:'partial',      defaultL:'implemented' },
  { id:11, name:'Technology Infrastructure Resilience', desc:'Manage security architecture, configuration, and operational resilience of technology infrastructure.',                        domain:'PR', domainLabel:'PROTECT',   defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:12, name:'Continuous Monitoring',             desc:'Monitor assets and information to detect anomalies, indicators of compromise, and other potentially adverse events.',               domain:'DE', domainLabel:'DETECT',    defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:13, name:'Adverse Event Analysis',            desc:'Analyze anomalies, indicators of compromise, and other potentially adverse events to characterize incidents.',                      domain:'DE', domainLabel:'DETECT',    defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:14, name:'Incident Management',               desc:'Establish and maintain incident response processes to prepare, detect, analyze, contain, eradicate, and recover from incidents.',   domain:'RS', domainLabel:'RESPOND',   defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:15, name:'Incident Analysis',                 desc:'Conduct investigations to ensure effective response and support forensics and recovery activities.',                                 domain:'RS', domainLabel:'RESPOND',   defaultS:'none',    defaultM:'none',         defaultL:'partial'     },
  { id:16, name:'Incident Response Reporting',       desc:'Report and communicate incidents to internal and external stakeholders per legal and regulatory requirements.',                      domain:'RS', domainLabel:'RESPOND',   defaultS:'none',    defaultM:'none',         defaultL:'partial'     },
  { id:17, name:'Mitigation',                        desc:'Perform activities to prevent expansion of an event, mitigate its effects, and resolve the incident.',                              domain:'RS', domainLabel:'RESPOND',   defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:18, name:'Incident Recovery Plan',            desc:'Restore assets and operations affected by cybersecurity incidents using recovery plans and processes.',                              domain:'RC', domainLabel:'RECOVER',   defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:19, name:'Incident Recovery Communication',   desc:'Coordinate restoration activities with internal and external parties including ISACs and coordinating centers.',                    domain:'RC', domainLabel:'RECOVER',   defaultS:'none',    defaultM:'none',         defaultL:'partial'     },
];

// ── CMMC 2.0 LEVEL 1 CONTROLS ────────────────────────────────
const CMMC_CONTROLS = [
  { id:1,  name:'Authorized Access Control',         desc:'Limit system access to authorized users, processes acting on behalf of authorized users, and devices.',                            domain:'AC', domainLabel:'ACCESS CTRL',   defaultS:'partial', defaultM:'partial',      defaultL:'implemented' },
  { id:2,  name:'Transaction & Function Control',    desc:'Limit system access to the types of transactions and functions that authorized users are permitted to execute.',                    domain:'AC', domainLabel:'ACCESS CTRL',   defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:3,  name:'External Connections',              desc:'Verify and control all connections to external systems.',                                                                            domain:'AC', domainLabel:'ACCESS CTRL',   defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:4,  name:'Control CUI on Devices',            desc:'Control the flow of CUI in accordance with approved authorizations and limit use on portable and mobile devices.',                  domain:'AC', domainLabel:'ACCESS CTRL',   defaultS:'none',    defaultM:'none',         defaultL:'partial'     },
  { id:5,  name:'Identify & Authenticate Users',     desc:'Identify system users, processes, and devices. Authenticate the identities of those users, processes, or devices before allowing access.', domain:'IA', domainLabel:'IDENTITY',  defaultS:'partial', defaultM:'implemented',  defaultL:'implemented' },
  { id:6,  name:'Authenticate Devices',              desc:'Authenticate (or verify) the identities of those devices as required.',                                                             domain:'IA', domainLabel:'IDENTITY',      defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:7,  name:'Sanitize / Destroy Media',          desc:'Sanitize or destroy information system media before disposal or reuse to prevent unauthorized disclosure of CUI.',                  domain:'MP', domainLabel:'MEDIA PROT',    defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:8,  name:'Limit Physical Access',             desc:'Limit physical access to organizational systems to authorized individuals.',                                                        domain:'PE', domainLabel:'PHYSICAL',       defaultS:'partial', defaultM:'implemented',  defaultL:'implemented' },
  { id:9,  name:'Escort Visitors',                   desc:'Escort visitors and monitor visitor activity on premises.',                                                                         domain:'PE', domainLabel:'PHYSICAL',       defaultS:'partial', defaultM:'implemented',  defaultL:'implemented' },
  { id:10, name:'Audit Physical Access',             desc:'Maintain audit logs of physical access to facilities containing organizational systems.',                                           domain:'PE', domainLabel:'PHYSICAL',       defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:11, name:'Assess Periodically',               desc:'Periodically assess the risk to organizational operations, assets, and individuals resulting from the operation of systems.',       domain:'RA', domainLabel:'RISK ASSESS',   defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:12, name:'Scan for Vulnerabilities',          desc:'Scan for vulnerabilities in organizational systems periodically and remediate identified vulnerabilities in a timely manner.',       domain:'RA', domainLabel:'RISK ASSESS',   defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:13, name:'Security Awareness Training',       desc:'Ensure that personnel are aware of the security risks associated with their activities and applicable policies.',                   domain:'AT', domainLabel:'AWARENESS',     defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:14, name:'Train on Recognized Threats',       desc:'Ensure that personnel are trained to carry out their assigned responsibilities and recognize threats including social engineering.', domain:'AT', domainLabel:'AWARENESS',     defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:15, name:'Configuration Management',          desc:'Establish baseline configurations and inventories of organizational systems and enforce security configuration settings.',          domain:'CM', domainLabel:'CONFIG MGMT',   defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:16, name:'Flaw Remediation',                  desc:'Identify, report, and correct information and system flaws in a timely manner.',                                                    domain:'SI', domainLabel:'SYS INTEG',    defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:17, name:'Malicious Code Protection',         desc:'Provide protection from malicious code at appropriate locations within organizational systems.',                                    domain:'SI', domainLabel:'SYS INTEG',    defaultS:'partial', defaultM:'implemented',  defaultL:'implemented' },
];

// ── HIPAA SECURITY RULE CONTROLS ─────────────────────────────
const HIPAA_CONTROLS = [
  { id:1,  name:'Security Management Process',       desc:'Implement policies and procedures to prevent, detect, contain, and correct security violations. Includes risk analysis and management.', domain:'AD', domainLabel:'ADMIN',    defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:2,  name:'Assigned Security Responsibility',  desc:'Identify the security official responsible for HIPAA security policies and procedures.',                                                   domain:'AD', domainLabel:'ADMIN',    defaultS:'partial', defaultM:'implemented',  defaultL:'implemented' },
  { id:3,  name:'Workforce Security',                desc:'Implement policies ensuring workforce members have appropriate access to ePHI and preventing unauthorized access.',                        domain:'AD', domainLabel:'ADMIN',    defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:4,  name:'Information Access Management',     desc:'Implement policies for authorizing access to ePHI consistent with applicable requirements and the minimum necessary standard.',           domain:'AD', domainLabel:'ADMIN',    defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:5,  name:'Security Awareness & Training',     desc:'Implement security awareness and training programs for all workforce members including management.',                                       domain:'AD', domainLabel:'ADMIN',    defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:6,  name:'Security Incident Procedures',      desc:'Implement policies and procedures to address security incidents including response and reporting.',                                        domain:'AD', domainLabel:'ADMIN',    defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:7,  name:'Contingency Plan',                  desc:'Establish policies for responding to emergencies that damage systems containing ePHI. Includes backup, DR, and testing.',                 domain:'AD', domainLabel:'ADMIN',    defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:8,  name:'Evaluation',                        desc:'Perform periodic technical and non-technical evaluation of security measures in response to environmental or operational changes.',        domain:'AD', domainLabel:'ADMIN',    defaultS:'none',    defaultM:'none',         defaultL:'partial'     },
  { id:9,  name:'Business Associate Contracts',      desc:'Obtain satisfactory assurances from business associates handling ePHI through written contracts or arrangements.',                        domain:'AD', domainLabel:'ADMIN',    defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:10, name:'Facility Access Controls',          desc:'Implement policies to limit physical access to systems and facilities while ensuring authorized access is allowed.',                       domain:'PH', domainLabel:'PHYSICAL',  defaultS:'partial', defaultM:'implemented',  defaultL:'implemented' },
  { id:11, name:'Workstation Use Policy',            desc:'Specify proper functions performed by workstations and the manner in which those functions are performed.',                                domain:'PH', domainLabel:'PHYSICAL',  defaultS:'partial', defaultM:'implemented',  defaultL:'implemented' },
  { id:12, name:'Workstation Security',              desc:'Implement physical safeguards for all workstations that access ePHI to restrict access to authorized users.',                              domain:'PH', domainLabel:'PHYSICAL',  defaultS:'partial', defaultM:'implemented',  defaultL:'implemented' },
  { id:13, name:'Device & Media Controls',           desc:'Implement policies for final disposition, reuse, and accountability of hardware and electronic media containing ePHI.',                   domain:'PH', domainLabel:'PHYSICAL',  defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:14, name:'Access Controls',                   desc:'Implement technical policies allowing only authorized persons or software programs to access ePHI.',                                       domain:'TC', domainLabel:'TECHNICAL',  defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:15, name:'Audit Controls',                    desc:'Implement hardware, software, and procedural mechanisms to record and examine activity in systems containing ePHI.',                       domain:'TC', domainLabel:'TECHNICAL',  defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:16, name:'Integrity Controls',                desc:'Implement policies to protect ePHI from improper alteration or destruction and electronic mechanisms to confirm no improper changes.',     domain:'TC', domainLabel:'TECHNICAL',  defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
  { id:17, name:'Person or Entity Authentication',   desc:'Implement procedures to verify that a person or entity seeking access to ePHI is the one claimed.',                                       domain:'TC', domainLabel:'TECHNICAL',  defaultS:'partial', defaultM:'implemented',  defaultL:'implemented' },
  { id:18, name:'Transmission Security',             desc:'Implement technical security measures to guard against unauthorized access to ePHI transmitted over electronic communications.',          domain:'TC', domainLabel:'TECHNICAL',  defaultS:'none',    defaultM:'partial',      defaultL:'implemented' },
];


// ── PCI-DSS v4.0 CONTROLS ────────────────────────────────────
const PCI_CONTROLS = [
  { id:1,  name:'Install & Maintain Network Security Controls', desc:'Install and maintain network security controls (firewalls, routers) to protect the cardholder data environment from unauthorized access.',           domain:'NW', domainLabel:'NETWORK',    defaultS:'partial', defaultM:'partial',     defaultL:'implemented' },
  { id:2,  name:'Secure Configurations for All Components',     desc:'Apply secure configurations to all system components. Do not use vendor-supplied defaults for passwords or other security parameters.',             domain:'NW', domainLabel:'NETWORK',    defaultS:'none',    defaultM:'partial',     defaultL:'implemented' },
  { id:3,  name:'Protect Stored Account Data',                  desc:'Protect stored account data by minimizing storage, rendering PAN unreadable, and protecting encryption keys.',                                          domain:'PD', domainLabel:'PROTECT DATA', defaultS:'none',    defaultM:'partial',     defaultL:'implemented' },
  { id:4,  name:'Protect Cardholder Data in Transit',           desc:'Protect cardholder data with strong cryptography during transmission over open, public networks.',                                                      domain:'PD', domainLabel:'PROTECT DATA', defaultS:'partial', defaultM:'implemented', defaultL:'implemented' },
  { id:5,  name:'Protect All Systems Against Malware',          desc:'Protect all systems and networks from malicious software. Deploy and maintain anti-malware solutions on all applicable systems.',                       domain:'VM', domainLabel:'VULN MGMT',  defaultS:'partial', defaultM:'implemented', defaultL:'implemented' },
  { id:6,  name:'Develop & Maintain Secure Systems',            desc:'Develop and maintain secure systems and software. Protect systems from known vulnerabilities by patching and using secure development practices.',     domain:'VM', domainLabel:'VULN MGMT',  defaultS:'none',    defaultM:'partial',     defaultL:'implemented' },
  { id:7,  name:'Restrict Access to System Components',         desc:'Restrict access to system components and cardholder data to only those individuals whose job requires such access.',                                    domain:'AC', domainLabel:'ACCESS CTRL', defaultS:'none',    defaultM:'partial',     defaultL:'implemented' },
  { id:8,  name:'Identify Users & Authenticate Access',         desc:'Identify users and authenticate access to system components. Assign a unique ID to each person with access. Enforce MFA for all access into the CDE.',domain:'AC', domainLabel:'ACCESS CTRL', defaultS:'partial', defaultM:'implemented', defaultL:'implemented' },
  { id:9,  name:'Restrict Physical Access to Cardholder Data',  desc:'Restrict physical access to systems and data that store, process, or transmit cardholder data.',                                                       domain:'AC', domainLabel:'ACCESS CTRL', defaultS:'partial', defaultM:'implemented', defaultL:'implemented' },
  { id:10, name:'Log & Monitor All Access to System Components',desc:'Log and monitor all access to network resources and cardholder data. Implement audit logging and review logs daily.',                                   domain:'MN', domainLabel:'MONITOR',    defaultS:'none',    defaultM:'partial',     defaultL:'implemented' },
  { id:11, name:'Test Security of Systems & Networks Regularly',desc:'Test security of systems and networks regularly. Run vulnerability scans, penetration tests, and intrusion detection.',                                  domain:'MN', domainLabel:'MONITOR',    defaultS:'none',    defaultM:'partial',     defaultL:'implemented' },
  { id:12, name:'Support Information Security with Policies',   desc:'Support information security with organizational policies and programs. Maintain a security policy and security awareness program for all personnel.',  domain:'PL', domainLabel:'POLICY',     defaultS:'none',    defaultM:'partial',     defaultL:'implemented' },
];

// ── FRAMEWORK CONFIG MAP ──────────────────────────────────────
const FRAMEWORK_CONFIG = {
  cis: {
    controls:   () => CIS_CONTROLS,
    categories: [
      { label:'Asset & Data Management', ids:[1,2,3] },
      { label:'Configuration & Access',  ids:[4,5,6] },
      { label:'Vulnerability & Logging', ids:[7,8] },
      { label:'Threat Defense',          ids:[9,10,11] },
      { label:'Network Security',        ids:[12,13] },
      { label:'People & Process',        ids:[14,15,17] },
      { label:'Advanced Controls',       ids:[16,18] },
    ],
    label:      'CIS Controls v8',
    badgeLabel: (ctrl) => `IG${ctrl.ig}`,
    badgeColor: (ctrl) => ctrl.ig === 1 ? '#2d7a4f' : ctrl.ig === 2 ? '#c9830a' : '#c9303a',
    defaultKey: (ig)   => `defaultIG${ig}`,
    panelTitle: 'CIS CONTROLS ASSESSMENT',
    colHeader:  'IG',
  },
  nist: {
    controls:   () => NIST_CONTROLS,
    categories: [
      { label:'Govern',   ids:[1,2,3] },
      { label:'Identify', ids:[4,5,6] },
      { label:'Protect',  ids:[7,8,9,10,11] },
      { label:'Detect',   ids:[12,13] },
      { label:'Respond',  ids:[14,15,16,17] },
      { label:'Recover',  ids:[18,19] },
    ],
    label:      'NIST CSF 2.0',
    badgeLabel: (ctrl) => ctrl.domain,
    badgeColor: (ctrl) => ({ GV:'#4a6fa5', ID:'#2d7a4f', PR:'#c9830a', DE:'#8b5cf6', RS:'#c9303a', RC:'#0891b2' })[ctrl.domain] || '#666',
    defaultKey: (ig)   => ig === 1 ? 'defaultS' : ig === 2 ? 'defaultM' : 'defaultL',
    panelTitle: 'NIST CSF 2.0 ASSESSMENT',
    colHeader:  'DOMAIN',
  },
  cmmc: {
    controls:   () => CMMC_CONTROLS,
    categories: [
      { label:'Access Control',        ids:[1,2,3,4] },
      { label:'Identity & Auth',       ids:[5,6] },
      { label:'Media & Physical',      ids:[7,8,9,10] },
      { label:'Risk Assessment',       ids:[11,12] },
      { label:'Awareness & Training',  ids:[13,14] },
      { label:'Config & Integrity',    ids:[15,16,17] },
    ],
    label:      'CMMC 2.0 Level 1',
    badgeLabel: (ctrl) => ctrl.domain,
    badgeColor: (ctrl) => ({ AC:'#1a3a5c', IA:'#2d7a4f', MP:'#c9830a', PE:'#8b5cf6', RA:'#c9303a', AT:'#0891b2', CM:'#d97706', SI:'#dc2626' })[ctrl.domain] || '#666',
    defaultKey: (ig)   => ig === 1 ? 'defaultS' : ig === 2 ? 'defaultM' : 'defaultL',
    panelTitle: 'CMMC 2.0 LEVEL 1 ASSESSMENT',
    colHeader:  'DOMAIN',
  },
  hipaa: {
    controls:   () => HIPAA_CONTROLS,
    categories: [
      { label:'Admin — Risk & Policy',      ids:[1,2,3] },
      { label:'Admin — Access & Training',  ids:[4,5,6] },
      { label:'Admin — Continuity',         ids:[7,8,9] },
      { label:'Physical Safeguards',        ids:[10,11,12,13] },
      { label:'Technical Safeguards',       ids:[14,15,16,17,18] },
    ],
    label:      'HIPAA Security Rule',
    badgeLabel: (ctrl) => ctrl.domain,
    badgeColor: (ctrl) => ({ AD:'#1a3a5c', PH:'#2d7a4f', TC:'#c9830a' })[ctrl.domain] || '#666',
    defaultKey: (ig)   => ig === 1 ? 'defaultS' : ig === 2 ? 'defaultM' : 'defaultL',
    panelTitle: 'HIPAA SECURITY RULE ASSESSMENT',
    colHeader:  'SAFEGUARD',
  },
  pci: {
    controls:   () => PCI_CONTROLS,
    categories: [
      { label:'Network Security',   ids:[1,2] },
      { label:'Data Protection',    ids:[3,4] },
      { label:'Vulnerability Mgmt', ids:[5,6] },
      { label:'Access Control',     ids:[7,8,9] },
      { label:'Monitoring & Testing',ids:[10,11] },
      { label:'Policy & Awareness', ids:[12] },
    ],
    label:      'PCI-DSS v4.0',
    badgeLabel: (ctrl) => ctrl.domain,
    badgeColor: (ctrl) => ({ NW:'#1a3a5c', PD:'#c9303a', VM:'#c9830a', AC:'#2d7a4f', MN:'#8b5cf6', PL:'#0891b2' })[ctrl.domain] || '#666',
    defaultKey: (ig)   => ig === 1 ? 'defaultS' : ig === 2 ? 'defaultM' : 'defaultL',
    panelTitle: 'PCI-DSS v4.0 ASSESSMENT',
    colHeader:  'DOMAIN',
  },
};

// Helper — get active framework config and controls
function fw()         { return FRAMEWORK_CONFIG[state.framework] || FRAMEWORK_CONFIG.cis; }
function fwControls() { return fw().controls(); }

// Score map
const SCORE = { 'none': 0, 'partial': 1, 'implemented': 2 };
const SCORE_LABEL = { 'none': 'Not Started', 'partial': 'Partial', 'implemented': 'Implemented' };

// ── NAVIGATION ──────────────────────────────────────────────
function goToStep(n) {
  state.currentStep = n;
  stepPanels.forEach(p => p.classList.remove('active'));
  stepBtns.forEach(b => {
    const s = parseInt(b.dataset.step);
    b.classList.remove('active', 'completed');
    if (s === n) b.classList.add('active');
    if (s < n)   b.classList.add('completed');
  });
  document.getElementById(`step${n}`).classList.add('active');
  stepIndicator.textContent = `STEP ${n} OF 5`;
  window.scrollTo(0, 0);
}

// ── STEP 1 ───────────────────────────────────────────────────
// Select all framework cards including newly activated ones
document.querySelectorAll('.framework-card:not(.coming-soon)').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.framework-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    state.framework = card.dataset.framework;
    // Update Step 2 framework label and IG badge labels
    const fwLabelEl = document.getElementById('selectedFwLabel');
    if (fwLabelEl) fwLabelEl.textContent = fw().label;
    updateIgBadges();
  });
});

step1Next.addEventListener('click', () => goToStep(2));

// ── STEP 2 ───────────────────────────────────────────────────
function updateIgBadges() {
  const isCIS = state.framework === 'cis';
  const badges = [
    { el: document.querySelector('[data-ig="1"] .ig-badge'), cis: 'IG1', other: 'S' },
    { el: document.querySelector('[data-ig="2"] .ig-badge'), cis: 'IG2', other: 'M' },
    { el: document.querySelector('[data-ig="3"] .ig-badge'), cis: 'IG3', other: 'L' },
  ];
  badges.forEach(b => {
    if (b.el) b.el.textContent = isCIS ? b.cis : b.other;
  });
}
igOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    igOptions.forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    state.client.ig = parseInt(opt.dataset.ig);
  });
});

userCount.addEventListener('input', () => {
  const n = parseInt(userCount.value);
  if (!isNaN(n)) {
    let ig = n <= 100 ? 1 : n <= 500 ? 2 : 3;
    igOptions.forEach(o => {
      o.classList.remove('selected');
      if (parseInt(o.dataset.ig) === ig) o.classList.add('selected');
    });
    state.client.ig = ig;
  }
});

step2Back.addEventListener('click', () => goToStep(1));
step2Next.addEventListener('click', () => {
  state.client.name       = clientName.value.trim();
  state.client.industry   = clientIndustry.value;
  state.client.engagement = engagementType.value;
  state.client.userCount  = userCount.value;
  state.client.regulations = Array.from(regChecks).filter(c => c.checked).map(c => c.value);

  if (!state.client.name) {
    showToast('Please enter a client name.');
    return;
  }
  buildAssessment();
  goToStep(3);
});

// ── STEP 3 ───────────────────────────────────────────────────
function buildAssessment() {
  const ig         = state.client.ig;
  const config     = fw();
  const defaultKey = config.defaultKey(ig);
  const controls   = fwControls();

  // preserve any existing notes/values
  const existing = {};
  state.assessment.forEach(a => { existing[a.id] = a; });

  state.assessment = controls.map(ctrl => ({
    id:      ctrl.id,
    current: existing[ctrl.id]?.current ?? ctrl[defaultKey],
    ideal:   existing[ctrl.id]?.ideal   ?? 'implemented',
    notes:   existing[ctrl.id]?.notes   ?? ''
  }));

  renderAssessmentRows();
}

function renderAssessmentRows() {
  const config   = fw();
  const controls = fwControls();

  // Update panel title dynamically
  const panelTitle = document.querySelector('#step3 .panel-title');
  if (panelTitle) panelTitle.textContent = config.panelTitle;
  const colHdr = document.querySelector('.col-h-ig');
  if (colHdr) colHdr.textContent = config.colHeader;

  assessmentRows.innerHTML = '';
  controls.forEach((ctrl, idx) => {
    const a         = state.assessment[idx] || { current: 'none', ideal: 'implemented', notes: '' };
    const badgeColor = config.badgeColor(ctrl);
    const badgeText  = config.badgeLabel(ctrl);

    const row = document.createElement('div');
    row.className = 'assessment-row';
    row.innerHTML = `
      <div class="row-num">${ctrl.id}</div>
      <div>
        <div class="row-control-name">${ctrl.name}</div>
        <div class="row-control-desc">${ctrl.desc}</div>
      </div>
      <div>
        <span class="row-ig" style="background:${badgeColor};font-size:9px;letter-spacing:0.02em;">${badgeText}</span>
      </div>
      <div>
        <select class="state-select val-${a.current}" data-idx="${idx}" data-type="current">
          <option value="none"          ${a.current === 'none'          ? 'selected' : ''}>Not Started</option>
          <option value="partial"       ${a.current === 'partial'       ? 'selected' : ''}>Partial</option>
          <option value="implemented"   ${a.current === 'implemented'   ? 'selected' : ''}>Implemented</option>
        </select>
      </div>
      <div>
        <select class="state-select val-${a.ideal}" data-idx="${idx}" data-type="ideal">
          <option value="none"          ${a.ideal === 'none'          ? 'selected' : ''}>Not Started</option>
          <option value="partial"       ${a.ideal === 'partial'       ? 'selected' : ''}>Partial</option>
          <option value="implemented"   ${a.ideal === 'implemented'   ? 'selected' : ''}>Implemented</option>
        </select>
      </div>
      <div>
        <textarea class="notes-input" data-idx="${idx}" placeholder="Optional notes...">${a.notes}</textarea>
      </div>
    `;
    assessmentRows.appendChild(row);
  });

  // Events
  assessmentRows.querySelectorAll('.state-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const idx = parseInt(sel.dataset.idx);
      const type = sel.dataset.type;
      state.assessment[idx][type] = sel.value;
      sel.className = `state-select val-${sel.value}`;
      updateCompletion();
    });
  });
  assessmentRows.querySelectorAll('.notes-input').forEach(ta => {
    ta.addEventListener('input', () => {
      state.assessment[parseInt(ta.dataset.idx)].notes = ta.value;
    });
  });

  updateCompletion();
}

function updateCompletion() {
  const filled = state.assessment.filter(a => a.current !== '').length;
  completionPct.textContent = Math.round((filled / state.assessment.length) * 100) + '%';
}

step3Back.addEventListener('click', () => goToStep(2));
step3Next.addEventListener('click', () => goToStep(4));

// ── STEP 4 ───────────────────────────────────────────────────
function applyTheme(primary, secondary) {
  state.theme.primary   = primary;
  state.theme.secondary = secondary;
  document.documentElement.style.setProperty('--accent-a', primary);
  document.documentElement.style.setProperty('--accent-b', secondary);
  primaryColor.value   = primary;
  primaryHex.value     = primary;
  secondaryColor.value = secondary;
  secondaryHex.value   = secondary;
  previewHeader.style.background    = primary;
  previewAccent.style.background    = secondary;
  document.querySelectorAll('.preview-pill.impl').forEach(el => el.style.background = primary);
  document.querySelectorAll('.preview-pill.gap').forEach(el => el.style.background = '#c9303a');
  // update step nav active border
  document.querySelectorAll('.step-btn.active').forEach(b => b.style.borderBottomColor = primary);
}

primaryColor.addEventListener('input', () => { primaryHex.value = primaryColor.value; applyTheme(primaryColor.value, state.theme.secondary); });
primaryHex.addEventListener('input',   () => { if (/^#[0-9a-f]{6}$/i.test(primaryHex.value)) { primaryColor.value = primaryHex.value; applyTheme(primaryHex.value, state.theme.secondary); } });
secondaryColor.addEventListener('input', () => { secondaryHex.value = secondaryColor.value; applyTheme(state.theme.primary, secondaryColor.value); });
secondaryHex.addEventListener('input',   () => { if (/^#[0-9a-f]{6}$/i.test(secondaryHex.value)) { secondaryColor.value = secondaryHex.value; applyTheme(state.theme.primary, secondaryHex.value); } });

presetBtns.forEach(btn => {
  btn.addEventListener('click', () => applyTheme(btn.dataset.primary, btn.dataset.secondary));
});

step4Back.addEventListener('click', () => goToStep(3));
step4Next.addEventListener('click', () => {
  goToStep(5);
  generateWidgets();
});

// ── STEP 5 — WIDGET GENERATION ──────────────────────────────
async function generateWidgets() {
  widgetsLoading.style.display    = 'block';
  widgetsContainer.style.display  = 'none';
  widgetStepActions.style.display = 'none';

  // Build gap data
  const gaps = computeGaps();

  // 1. Generate non-AI widgets first (instant)
  loadingStep.textContent = 'Building current state table...';
  state.widgets.currentState  = buildCurrentStateWidget();
  state.widgets.gapAnalysis   = buildGapAnalysisWidget(gaps);
  state.widgets.idealState    = buildIdealStateWidget();
  state.widgets.riskLandscape = buildRiskLandscapeWidget(gaps);

  // 2. AI widgets
  loadingStep.textContent = 'Generating executive summary with AI...';
  try {
    const aiResult = await callAI(gaps);
    state.widgets.execSummary = aiResult.execSummary;
    state.widgets.roadmap     = aiResult.roadmap;
  } catch (e) {
    state.widgets.execSummary = buildFallbackExecSummary(gaps);
    state.widgets.roadmap     = buildFallbackRoadmap(gaps);
  }

  // Render all
  loadingStep.textContent = 'Rendering widgets...';
  renderWidgets();

  widgetsLoading.style.display    = 'none';
  widgetsContainer.style.display  = 'flex';
  widgetStepActions.style.display = 'flex';
}

function computeGaps() {
  const controls = fwControls();
  return state.assessment.map((a, idx) => {
    const ctrl  = controls[idx];
    const cScore = SCORE[a.current];
    const iScore = SCORE[a.ideal];
    const gap    = iScore - cScore;
    let risk = 'Low';
    if (gap === 2) risk = 'Critical';
    else if (gap === 1 && iScore === 2) risk = 'High';
    else if (gap === 1) risk = 'Medium';
    return {
      id:           ctrl.id,
      name:         ctrl.name,
      ig:           ctrl.ig,
      current:      a.current,
      ideal:        a.ideal,
      notes:        a.notes,
      gap:          gap,
      risk:         gap === 0 ? 'None' : risk,
      currentLabel: SCORE_LABEL[a.current],
      idealLabel:   SCORE_LABEL[a.ideal]
    };
  });
}

// ── WIDGET BUILDERS ─────────────────────────────────────────
const P  = () => state.theme.primary;
const S  = () => state.theme.secondary;
const cn = () => state.client.name || 'Your Client';
const dt = () => new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

function wrapWidget(title, content) {
  // {{company.name}} and {{siteTitle}} are Salesbuildr template variables —
  // they resolve to the client company name and MSP site title at render time.
  // {{date quote.createdAt}} resolves to the proposal creation date.
  // {{company.accountManager.fullName}} resolves to the assigned account manager.
  return `<div style="font-family:Arial,Helvetica,sans-serif;width:100%;max-width:100%;color:#1a1a18;">
  <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
    <tr>
      <td style="background:${P()};color:#ffffff;padding:14px 18px;">
        <div style="font-size:14px;font-weight:bold;letter-spacing:0.12em;text-transform:uppercase;">${title}</div>
        <div style="font-size:11px;opacity:0.7;margin-top:3px;letter-spacing:0.06em;">{{company.name}} &nbsp;·&nbsp; ${fw().label} &nbsp;·&nbsp; {{date quote.createdAt}}</div>
      </td>
    </tr>
  </table>
  ${content}
  <table style="width:100%;border-collapse:collapse;margin-top:0;">
    <tr><td colspan="2" style="background:${S()};height:4px;padding:0;"></td></tr>
    <tr>
      <td style="padding:8px 18px;background:#f5f2eb;font-size:10px;color:#8a8680;letter-spacing:0.08em;">
        PREPARED BY {{siteTitle}} &nbsp;·&nbsp; {{company.accountManager.fullName}} &nbsp;·&nbsp; {{company.accountManager.email}} &nbsp;·&nbsp; CONFIDENTIAL
      </td>
      <td style="padding:8px 18px;background:#f5f2eb;text-align:right;">
        {{image company.accountManager.signature.imageUrl height=30}}
      </td>
    </tr>
  </table>
</div>`;
}

function buildCurrentStateWidget() {
  let rows = '';
  const fwc = fw();
  state.assessment.forEach((a, idx) => {
    const ctrl = fwControls()[idx];
    if (!ctrl) return;
    const bgColor = idx % 2 === 0 ? '#ffffff' : '#faf8f4';
    const statusColor = a.current === 'implemented' ? '#2d7a4f' : a.current === 'partial' ? '#c9830a' : '#999';
    const badgeColor = fwc.badgeColor(ctrl);
    const badgeText  = fwc.badgeLabel(ctrl);
    const notesCell = a.notes
      ? `<td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;font-size:11px;color:#5a5750;font-style:italic;">${a.notes}</td>`
      : '<td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;"></td>';
    rows += `<tr style="background:${bgColor};">
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;font-size:12px;font-weight:bold;white-space:nowrap;color:#8a8680;">${ctrl.id}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;font-size:12px;overflow:hidden;">${ctrl.name}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;text-align:center;white-space:nowrap;">
        <span style="background:${badgeColor};color:white;padding:2px 6px;font-size:9px;font-weight:bold;white-space:nowrap;display:inline-block;">${badgeText}</span>
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;text-align:center;white-space:nowrap;">
        <span style="background:${statusColor};color:white;padding:3px 10px;font-size:10px;font-weight:bold;white-space:nowrap;display:inline-block;">${SCORE_LABEL[a.current].toUpperCase()}</span>
      </td>
      ${notesCell}
    </tr>`;
  });

  const content = `
  <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
    <colgroup>
      <col style="width:4%;">
      <col style="width:38%;">
      <col style="width:7%;">
      <col style="width:14%;">
      <col style="width:37%;">
    </colgroup>
    <tr style="background:#2d2d2d;">
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:left;">#</th>
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:left;">Control Domain</th>
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:center;">IG</th>
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:center;">Status</th>
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:left;">Notes</th>
    </tr>
    ${rows}
  </table>`;
  return wrapWidget('CURRENT SECURITY POSTURE', content);
}

function buildGapAnalysisWidget(gaps) {
  const activeGaps = gaps.filter(g => g.gap > 0);
  let rows = '';
  activeGaps.forEach((g, idx) => {
    const riskBg = g.risk === 'Critical' ? '#c9303a' : g.risk === 'High' ? '#c9830a' : g.risk === 'Medium' ? '#c9a30a' : '#666';
    const bgColor = idx % 2 === 0 ? '#ffffff' : '#faf8f4';
    rows += `<tr style="background:${bgColor};">
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;font-size:12px;width:99%;">${g.name}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;text-align:center;white-space:nowrap;">
        <span style="background:#999;color:white;padding:3px 10px;font-size:10px;font-weight:bold;white-space:nowrap;display:inline-block;">${g.currentLabel.toUpperCase()}</span>
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;text-align:center;white-space:nowrap;">
        <span style="background:${P()};color:white;padding:3px 10px;font-size:10px;font-weight:bold;white-space:nowrap;display:inline-block;">${g.idealLabel.toUpperCase()}</span>
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;text-align:center;white-space:nowrap;">
        <span style="background:${riskBg};color:white;padding:3px 10px;font-size:10px;font-weight:bold;white-space:nowrap;display:inline-block;">${g.risk.toUpperCase()}</span>
      </td>
    </tr>`;
  });

  if (activeGaps.length === 0) {
    rows = `<tr><td colspan="4" style="padding:20px;text-align:center;font-size:13px;color:#2d7a4f;font-weight:bold;">No gaps identified — all controls meet target state.</td></tr>`;
  }

  const content = `
  <table style="width:100%;border-collapse:collapse;table-layout:auto;">
    <tr style="background:#2d2d2d;">
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:left;width:99%;">Control Domain</th>
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:center;white-space:nowrap;">Current</th>
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:center;white-space:nowrap;">Target</th>
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:center;white-space:nowrap;">Risk</th>
    </tr>
    ${rows}
  </table>`;
  return wrapWidget('GAP ANALYSIS', content);
}

function buildIdealStateWidget() {
  let rows = '';
  state.assessment.forEach((a, idx) => {
    const ctrl = CIS_CONTROLS[idx];
    const bgColor = idx % 2 === 0 ? '#ffffff' : '#faf8f4';
    const statusColor = a.ideal === 'implemented' ? '#2d7a4f' : a.ideal === 'partial' ? '#c9830a' : '#999';
    rows += `<tr style="background:${bgColor};">
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;font-size:12px;font-weight:bold;white-space:nowrap;color:#8a8680;">${ctrl.id}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;font-size:12px;overflow:hidden;">${ctrl.name}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;text-align:center;white-space:nowrap;">
        <span style="background:${statusColor};color:white;padding:3px 10px;font-size:10px;font-weight:bold;white-space:nowrap;display:inline-block;">${SCORE_LABEL[a.ideal].toUpperCase()}</span>
      </td>
    </tr>`;
  });

  const content = `
  <table style="width:100%;border-collapse:collapse;table-layout:auto;">
    <tr style="background:#2d2d2d;">
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:left;white-space:nowrap;">#</th>
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:left;width:99%;">Control Domain</th>
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:center;white-space:nowrap;">Target State</th>
    </tr>
    ${rows}
  </table>`;
  return wrapWidget('IDEAL SECURITY ENVIRONMENT', content);
}

function buildRiskLandscapeWidget(gaps) {
  // Heat map: use framework-specific categories
  const categories = fw().categories;

  function getRisk(ids) {
    const scores = ids.map(id => {
      const g = gaps.find(x => x.id === id);
      return g ? SCORE[g.current] : 0;
    });
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg >= 1.7) return { label: 'STRONG', color: '#2d7a4f', width: '90%' };
    if (avg >= 1.0) return { label: 'MODERATE', color: '#c9830a', width: '55%' };
    if (avg >= 0.4) return { label: 'WEAK', color: '#c9303a', width: '30%' };
    return { label: 'NOT ADDRESSED', color: '#8a8680', width: '10%' };
  }

  let heatRows = '';
  categories.forEach(cat => {
    const r = getRisk(cat.ids);
    heatRows += `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e8e4dc;font-size:12px;font-weight:bold;width:40%;">${cat.label}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e8e4dc;width:45%;">
        <div style="background:#e8e4dc;height:18px;width:100%;position:relative;">
          <div style="background:${r.color};height:18px;width:${r.width};"></div>
        </div>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #e8e4dc;text-align:center;width:15%;">
        <span style="background:${r.color};color:white;padding:3px 8px;font-size:10px;font-weight:bold;white-space:nowrap;display:inline-block;">${r.label}</span>
      </td>
    </tr>`;
  });

  // Summary counts
  const critical = gaps.filter(g => g.risk === 'Critical').length;
  const high     = gaps.filter(g => g.risk === 'High').length;
  const medium   = gaps.filter(g => g.risk === 'Medium').length;
  const none     = gaps.filter(g => g.risk === 'None').length;

  const content = `
  <table style="width:100%;border-collapse:collapse;margin-bottom:1px;">
    <tr>
      <td style="padding:10px 18px;background:#f5f2eb;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="text-align:center;padding:12px;">
              <div style="font-size:28px;font-weight:bold;color:#c9303a;">${critical}</div>
              <div style="font-size:10px;color:#8a8680;letter-spacing:0.1em;text-transform:uppercase;">Critical</div>
            </td>
            <td style="text-align:center;padding:12px;border-left:1px solid #e8e4dc;">
              <div style="font-size:28px;font-weight:bold;color:#c9830a;">${high}</div>
              <div style="font-size:10px;color:#8a8680;letter-spacing:0.1em;text-transform:uppercase;">High</div>
            </td>
            <td style="text-align:center;padding:12px;border-left:1px solid #e8e4dc;">
              <div style="font-size:28px;font-weight:bold;color:#c9a30a;">${medium}</div>
              <div style="font-size:10px;color:#8a8680;letter-spacing:0.1em;text-transform:uppercase;">Medium</div>
            </td>
            <td style="text-align:center;padding:12px;border-left:1px solid #e8e4dc;">
              <div style="font-size:28px;font-weight:bold;color:#2d7a4f;">${none}</div>
              <div style="font-size:10px;color:#8a8680;letter-spacing:0.1em;text-transform:uppercase;">No Gap</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <table style="width:100%;border-collapse:collapse;">
    <tr style="background:#2d2d2d;">
      <th style="padding:9px 14px;color:#f5f2eb;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;text-align:left;">Security Domain</th>
      <th style="padding:9px 14px;color:#f5f2eb;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;text-align:left;">Coverage</th>
      <th style="padding:9px 14px;color:#f5f2eb;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;text-align:center;">Status</th>
    </tr>
    ${heatRows}
  </table>`;
  return wrapWidget('RISK LANDSCAPE', content);
}

function buildFallbackExecSummary(gaps) {
  const critical = gaps.filter(g => g.risk === 'Critical').length;
  const high = gaps.filter(g => g.risk === 'High').length;
  const implemented = gaps.filter(g => g.gap === 0).length;
  const client = cn();
  const ig = state.client.ig;
  const igLabel = ig === 1 ? 'essential cyber hygiene (IG1)' : ig === 2 ? 'foundational security (IG2)' : 'advanced security (IG3)';

  const content = `
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="padding:20px 24px;font-size:13px;line-height:1.7;color:#1a1a18;">
        <p style="margin:0 0 6px 0;font-size:12px;color:#8a8680;letter-spacing:0.08em;">Dear {{contact.firstName}},</p>
        <p style="margin:0 0 14px 0;">This assessment evaluates <strong>{{company.name}}</strong>'s current cybersecurity posture against the CIS Controls v8 framework, targeting ${igLabel} as the baseline standard, assessed against ${fw().label}.</p>
        <p style="margin:0 0 14px 0;">Of the 18 CIS Control domains assessed, <strong>${implemented} controls</strong> are currently meeting or exceeding the target state. The assessment identified <strong>${critical} critical gap${critical !== 1 ? 's' : ''}</strong> and <strong>${high} high-priority gap${high !== 1 ? 's' : ''}</strong> requiring near-term remediation.</p>
        <p style="margin:0;">The recommended security program outlined in this proposal is designed to close identified gaps in a structured, prioritized manner — reducing risk exposure while aligning with industry best practices and applicable regulatory requirements.</p>
      </td>
    </tr>
  </table>`;
  return wrapWidget('EXECUTIVE SUMMARY', content);
}

function buildFallbackRoadmap(gaps) {
  const critical = gaps.filter(g => g.risk === 'Critical');
  const high     = gaps.filter(g => g.risk === 'High');
  const medium   = gaps.filter(g => g.risk === 'Medium');

  function phaseRows(items, label, color) {
    if (!items.length) return '';
    return items.slice(0, 4).map((g, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#faf8f4'};">
      <td style="padding:9px 12px;border-bottom:1px solid #e8e4dc;font-size:12px;">${g.name}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #e8e4dc;text-align:center;">
        <span style="background:${color};color:white;padding:3px 8px;font-size:10px;font-weight:bold;">${label}</span>
      </td>
    </tr>`).join('');
  }

  const content = `
  <table style="width:100%;border-collapse:collapse;">
    ${critical.length ? `<tr style="background:${P()};"><td colspan="2" style="padding:11px 14px;color:#ffffff;font-size:11px;letter-spacing:0.12em;font-weight:bold;">PHASE 1 — IMMEDIATE (0–90 DAYS)</td></tr>${phaseRows(critical,'CRITICAL','#c9303a')}` : ''}
    ${high.length ? `<tr style="background:${P()};"><td colspan="2" style="padding:11px 14px;color:#ffffff;font-size:11px;letter-spacing:0.12em;font-weight:bold;">PHASE 2 — SHORT TERM (90–180 DAYS)</td></tr>${phaseRows(high,'HIGH','#c9830a')}` : ''}
    ${medium.length ? `<tr style="background:${P()};"><td colspan="2" style="padding:11px 14px;color:#ffffff;font-size:11px;letter-spacing:0.12em;font-weight:bold;">PHASE 3 — ONGOING (180+ DAYS)</td></tr>${phaseRows(medium,'MEDIUM','#c9a30a')}` : ''}
  </table>`;
  return wrapWidget('RECOMMENDED ROADMAP', content);
}

// ── AI CALL ─────────────────────────────────────────────────
async function callAI(gaps) {
  const criticalGaps = gaps.filter(g => g.risk === 'Critical').map(g => g.name);
  const highGaps     = gaps.filter(g => g.risk === 'High').map(g => g.name);
  const implemented  = gaps.filter(g => g.gap === 0).map(g => g.name);
  const ig           = state.client.ig;
  const regs         = state.client.regulations.join(', ') || 'none specified';

  const prompt = `You are a cybersecurity consultant writing content for a formal MSP security proposal.

MSP PRIMARY COLOR: ${P()}

CLIENT: ${cn()}
INDUSTRY: ${state.client.industry || 'not specified'}
ORGANIZATION SIZE: IG${ig} (${ig === 1 ? '1-100 users' : ig === 2 ? '100-500 users' : '500+ users'})
FRAMEWORK: ${fw().label}
APPLICABLE REGULATIONS: ${regs}
CRITICAL GAPS: ${criticalGaps.join(', ') || 'none'}
HIGH PRIORITY GAPS: ${highGaps.join(', ') || 'none'}
CONTROLS MEETING TARGET: ${implemented.join(', ') || 'none yet'}

IMPORTANT: In the execSummary content, use these Salesbuildr template variables literally (do not substitute values — write them exactly as shown):
- {{contact.firstName}} — for the salutation (e.g. "Dear {{contact.firstName}},")
- {{company.name}} — wherever you reference the client company name
- {{quote.title}} — if referencing the proposal title

Generate TWO sections and return them as JSON ONLY (no markdown, no preamble):

{
  "execSummary": "<HTML content only — NO outer wrapper, NO table header. Start with a <table> containing 1 <tr><td> with the body content. Use inline styles only. Font: Arial. Write 3 concise executive-facing paragraphs (total ~120 words). Reference the client name, specific critical gaps, and business risk. Professional, direct tone — no fluff.>",
  "roadmap": "<HTML content only — NO outer wrapper, NO table header. A 3-phase roadmap table with phases as dark header rows and 2-4 action items per phase as body rows. Phase 1 = 0-90 days (critical gaps), Phase 2 = 90-180 days (high gaps + quick wins), Phase 3 = 180+ days (maturity). Each row: action item name + brief 1-sentence rationale. Use inline styles only. Font: Arial. Colors: Phase headers use the MSP primary color (provided as a hex value in the context — use it literally as the background, white #ffffff text). Alternating row bg #ffffff/#faf8f4.>"
}`;

  loadingStep.textContent = 'Waiting for AI response...';
  const res = await fetch('/api/security-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);

  let parsed;
  try {
    const clean = data.content.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('JSON parse failed');
  }

  const p = () => state.theme.primary;
  const sec = () => state.theme.secondary;
  const wrap = (title, inner) => wrapWidget(title, inner);

  return {
    execSummary: wrap('EXECUTIVE SUMMARY', parsed.execSummary),
    roadmap:     wrap('RECOMMENDED ROADMAP', parsed.roadmap)
  };
}

// ── RENDER WIDGETS ───────────────────────────────────────────
function renderWidgets() {
  const map = {
    execSummary:   'prevExecSummary',
    currentState:  'prevCurrentState',
    riskLandscape: 'prevRiskLandscape',
    gapAnalysis:   'prevGapAnalysis',
    idealState:    'prevIdealState',
    roadmap:       'prevRoadmap'
  };
  Object.entries(map).forEach(([key, elId]) => {
    const el = document.getElementById(elId);
    if (el && state.widgets[key]) {
      el.innerHTML = state.widgets[key];
    }
  });
}

// ── HELPERS ──────────────────────────────────────────────────
function copyHtml(html) {
  if (!html) return;
  navigator.clipboard.writeText(html).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = html;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

// Build the ordered widget array for push-widgets API
function buildWidgetArray() {
  const WIDGET_ORDER = [
    { key: 'execSummary',   title: 'Executive Summary' },
    { key: 'currentState',  title: 'Current Security Posture' },
    { key: 'gapAnalysis',   title: 'Gap Analysis' },
    { key: 'riskLandscape', title: 'Risk Landscape' },
    { key: 'idealState',    title: 'Ideal Security Environment' },
    { key: 'roadmap',       title: 'Recommended Roadmap' },
  ];
  return WIDGET_ORDER
    .filter(w => state.widgets[w.key])
    .map(w => ({ id: w.key, title: w.title, html: state.widgets[w.key] }));
}

async function pushWidgets(widgetArray, prefix, cleanup = false) {
  const tenantUrl = sbTenantUrl.value.trim().replace(/\/$/, '');
  const apiKey    = sbApiKey.value.trim();
  if (!tenantUrl || !apiKey) {
    showToast('Enter Salesbuildr credentials first.');
    return null;
  }
  const res = await fetch('/api/push-widgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ widgets: widgetArray, prefix, apiKey, tenantUrl, cleanup })
  });
  return res.json();
}

// ── COPY & PUSH ──────────────────────────────────────────────
document.querySelectorAll('.btn-copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.widget;
    copyHtml(state.widgets[key]);
    showToast('HTML copied to clipboard.');
  });
});

document.querySelectorAll('.btn-push').forEach(btn => {
  btn.addEventListener('click', async () => {
    const key   = btn.dataset.widget;
    const title = btn.closest('.widget-card').querySelector('.widget-label').textContent.trim();
    const html  = state.widgets[key];
    if (!html) return;

    btn.textContent = 'PUSHING...';
    btn.disabled    = true;
    try {
      const data = await pushWidgets(
        [{ id: key, title, html }],
        cn(),   // prefix = client name
        false   // no cleanup for single push
      );
      if (data && data.ok) {
        showToast(`"${title}" pushed to Salesbuildr.`);
        btn.textContent = '✓ PUSHED';
      } else {
        const errMsg = data?.results?.[0]?.error || data?.error || 'Unknown error';
        showToast(`Push failed: ${errMsg}`);
        btn.textContent = 'PUSH TO SALESBUILDR';
      }
    } catch {
      showToast('Network error — push failed.');
      btn.textContent = 'PUSH TO SALESBUILDR';
    }
    btn.disabled = false;
  });
});

copyAllBtn.addEventListener('click', () => {
  const all = Object.values(state.widgets).filter(Boolean).join('\n\n');
  copyHtml(all);
  showToast('All widgets copied to clipboard.');
});

// Push All button (in salesbuildr bar)
const pushAllBtn = document.getElementById('pushAllBtn');
if (pushAllBtn) {
  pushAllBtn.addEventListener('click', async () => {
    const widgets = buildWidgetArray();
    if (!widgets.length) { showToast('No widgets to push yet.'); return; }

    pushAllBtn.textContent = 'PUSHING ALL...';
    pushAllBtn.disabled    = true;
    try {
      const data = await pushWidgets(widgets, cn(), true); // cleanup=true replaces previous set
      if (data && data.successCount > 0) {
        showToast(`${data.successCount}/${data.total} widgets pushed to Salesbuildr.`);
        // Mark all individual push buttons as pushed
        document.querySelectorAll('.btn-push').forEach(b => b.textContent = '✓ PUSHED');
        pushAllBtn.textContent = '✓ ALL PUSHED';
      } else {
        showToast(`Push failed: ${data?.error || 'Check credentials.'}`);
        pushAllBtn.textContent = 'PUSH ALL TO SALESBUILDR';
      }
    } catch {
      showToast('Network error — push failed.');
      pushAllBtn.textContent = 'PUSH ALL TO SALESBUILDR';
    }
    pushAllBtn.disabled = false;
  });
}

// ── SALESBUILDR CREDS ────────────────────────────────────────
saveSbCreds.addEventListener('click', () => {
  localStorage.setItem('sb_tenant_url', sbTenantUrl.value.trim());
  localStorage.setItem('sb_api_key',    sbApiKey.value.trim());
  sbStatus.textContent = 'CREDENTIALS SAVED';
  setTimeout(() => sbStatus.textContent = '', 2000);
});

step5Back.addEventListener('click', () => goToStep(3));

// ── TOAST ────────────────────────────────────────────────────
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── SESSION EXPORT / IMPORT ─────────────────────────────────
const SESSION_VERSION = 1;

exportBtn.addEventListener('click', () => {
  if (!state.client.name) {
    showToast('Complete the client profile before exporting.');
    return;
  }
  const payload = {
    _version:  SESSION_VERSION,
    _exported: new Date().toISOString(),
    _client:   state.client.name,
    state: {
      framework:  state.framework,
      client:     state.client,
      assessment: state.assessment,
      theme:      state.theme,
    }
  };
  const json        = JSON.stringify(payload, null, 2);
  const blob        = new Blob([json], { type: 'application/json' });
  const url         = URL.createObjectURL(blob);
  const a           = document.createElement('a');
  const defaultName = `${state.client.name} — Session`;
  const userLabel   = window.prompt('Name this session file:', defaultName);
  if (userLabel === null) { URL.revokeObjectURL(url); return; } // cancelled
  const safeName    = (userLabel.trim() || defaultName).replace(/[^a-z0-9 _\-–—]/gi, '').trim().replace(/\s+/g, '-');
  a.href            = url;
  a.download        = `${safeName}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Session exported: ${a.download}`);
});

importBtn.addEventListener('click', () => {
  importFile.value = ''; // reset so same file can be re-imported
  importFile.click();
});

importFile.addEventListener('change', () => {
  const file = importFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const payload = JSON.parse(e.target.result);
      if (!payload.state || !payload.state.assessment || !payload.state.client) {
        showToast('Invalid session file — missing required data.');
        return;
      }
      // Restore state
      state.framework  = payload.state.framework  || 'cis';
      state.client     = payload.state.client;
      state.assessment = payload.state.assessment;
      state.theme      = payload.state.theme || { primary: '#1a3a5c', secondary: '#e8840a' };

      // Restore UI
      applyTheme(state.theme.primary, state.theme.secondary);

      // Restore client profile fields
      clientName.value     = state.client.name     || '';
      clientIndustry.value = state.client.industry || '';
      engagementType.value = state.client.engagement || 'assessment';
      userCount.value      = state.client.userCount  || '';
      igOptions.forEach(o => {
        o.classList.toggle('selected', parseInt(o.dataset.ig) === state.client.ig);
      });
      regChecks.forEach(c => {
        c.checked = (state.client.regulations || []).includes(c.value);
      });

      // Restore framework selection
      document.querySelectorAll('.framework-card').forEach(c => {
        c.classList.toggle('selected', c.dataset.framework === state.framework);
      });
      const fwLabelEl = document.getElementById('selectedFwLabel');
      if (fwLabelEl) fwLabelEl.textContent = fw().label;
      updateIgBadges();

      // Re-render assessment with restored values
      renderAssessmentRows();

      showToast(`Session loaded: ${payload._client}`);
      goToStep(3); // land on assessment so MSP can review
    } catch (err) {
      showToast('Could not read session file — is it a valid JSON export?');
    }
  };
  reader.readAsText(file);
});

// ── HANDOFF PANEL BUTTON WIRING ─────────────────────────────
// These delegate to the existing export/import handlers
saveSessionBtn.addEventListener('click',  () => exportBtn.click());
downloadTechBtn.addEventListener('click', () => exportXlsxBtn.click());
loadSessionBtn.addEventListener('click',  () => importBtn.click());
importTechBtn.addEventListener('click',   () => importXlsxBtn.click());

// ── SPREADSHEET EXPORT / IMPORT ─────────────────────────────
const VALID_STATES = ['Not Started', 'Partial', 'Implemented'];

// Normalize whatever the tech typed/selected into our internal values
function normalizeState(raw) {
  if (!raw) return 'none';
  const s = String(raw).trim().toLowerCase();
  if (s === 'implemented' || s === 'i') return 'implemented';
  if (s === 'partial' || s === 'p')     return 'partial';
  return 'none'; // Not Started / blank / anything else
}

exportXlsxBtn.addEventListener('click', () => {
  if (!state.client.name) {
    showToast('Complete the client profile first.');
    return;
  }

  const wb  = XLSX.utils.book_new();
  const ig  = state.client.ig;

  // ── Sheet 1: Instructions ──────────────────────────────────
  const instrRows = [
    ['SECURITY ASSESSMENT — TECH QUESTIONNAIRE'],
    [''],
    ['Client:', state.client.name],
    ['Framework:', fw().label],
    ['Org Size:', `${ig === 1 ? 'Small (1–100 users)' : ig === 2 ? 'Mid-size (100–500 users)' : 'Large (500+ users)'}`],
    ['Date:', new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })],
    [''],
    ['INSTRUCTIONS FOR TECH:'],
    ['1. Go to the "Assessment" sheet.'],
    ['2. For each control, select the CURRENT STATE from the dropdown:'],
    ['   • Not Started — nothing is in place'],
    ['   • Partial     — some implementation exists but not complete'],
    ['   • Implemented — fully in place'],
    ['3. All 18 controls must be completed (default is Not Started).'],
    ['4. Add optional notes in the Notes column — keep them brief.'],
    ['5. Save the file and return it to the salesperson for import.'],
    [''],
    ['DO NOT change column headers, row order, or control IDs.'],
  ];

  const instrSheet = XLSX.utils.aoa_to_sheet(instrRows);
  instrSheet['!cols'] = [{ wch: 18 }, { wch: 60 }];
  instrSheet['A1'] && (instrSheet['A1'].s = { font: { bold: true, sz: 13 } });
  XLSX.utils.book_append_sheet(wb, instrSheet, 'Instructions');

  // ── Sheet 2: Assessment ────────────────────────────────────
  const fwConf    = fw();
  const fwCtrls   = fwControls();
  const headerRow = ['ID', 'Control Domain', 'Description', fwConf.colHeader, 'Current State', 'Notes'];
  const dataRows  = fwCtrls.map((ctrl, idx) => {
    const a    = state.assessment[idx];
    const curr = a.current === 'implemented' ? 'Implemented'
               : a.current === 'partial'     ? 'Partial'
               : 'Not Started';
    return [
      ctrl.id,
      ctrl.name,
      ctrl.desc,
      fwConf.badgeLabel(ctrl),
      curr,
      a.notes || ''
    ];
  });

  const assessSheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  // Column widths
  assessSheet['!cols'] = [
    { wch: 5  },  // ID
    { wch: 38 },  // Control Domain
    { wch: 52 },  // Description
    { wch: 10 },  // IG Level
    { wch: 16 },  // Current State
    { wch: 40 },  // Notes
  ];

  // Data validation dropdown on Current State column (E2:E19)
  assessSheet['!dataValidation'] = assessSheet['!dataValidation'] || [];
  assessSheet['!dataValidation'].push({
    type: 'list',
    sqref: 'E2:E19',
    formula1: '"Not Started,Partial,Implemented"',
    showDropDown: false,
    showErrorMessage: true,
    errorTitle: 'Invalid value',
    error: 'Please select: Not Started, Partial, or Implemented'
  });

  XLSX.utils.book_append_sheet(wb, assessSheet, 'Assessment');

  // ── Write file ─────────────────────────────────────────────
  const defaultName = `${state.client.name} — Security Assessment`;
  const userLabel   = window.prompt('Name this spreadsheet file:', defaultName);
  if (userLabel === null) return; // cancelled
  const safeName = (userLabel.trim() || defaultName).replace(/[^a-z0-9 _\-–—]/gi, '').trim().replace(/\s+/g, '-');
  XLSX.writeFile(wb, `${safeName}.xlsx`);
  showToast('Spreadsheet downloaded — send to tech for completion.');
});

// ── Import spreadsheet (xlsx or csv) ──────────────────────────
importXlsxBtn.addEventListener('click', () => {
  importXlsxFile.value = '';
  importXlsxFile.click();
});

importXlsxFile.addEventListener('change', () => {
  const file = importXlsxFile.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb   = XLSX.read(data, { type: 'array' });

      // Find the Assessment sheet (xlsx) or use first sheet (csv)
      const sheetName = wb.SheetNames.includes('Assessment')
        ? 'Assessment'
        : wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });

      // Skip header row, read data rows — r[0] may be number or string so use != not !==
      const dataRows = rows.slice(1).filter(r => r[0] != null && r[0] !== ''); // skip blanks

      if (dataRows.length < 18) {
        showToast(`Only ${dataRows.length} rows found — expected 18. Check the file.`);
        return;
      }

      // Validate all 18 have a valid state
      const blanks = [];
      dataRows.slice(0, 18).forEach((row, idx) => {
        const raw = String(row[4] || '').trim();
        if (!raw) blanks.push(idx + 1);
      });

      if (blanks.length > 0) {
        showToast(`${blanks.length} control${blanks.length > 1 ? 's' : ''} missing a Current State (rows ${blanks.join(', ')}). All 18 required.`);
        return;
      }

      // Ensure assessment array is populated — may be empty if Step 2 was skipped
      if (state.assessment.length === 0) buildAssessment();

      // Apply to assessment state — match by row index (ID order is preserved)
      let updated = 0;
      dataRows.slice(0, 18).forEach((row, idx) => {
        if (idx >= state.assessment.length) return;
        const newState = normalizeState(row[4]);
        const newNotes = String(row[5] || '').trim();
        state.assessment[idx].current = newState;
        if (newNotes) state.assessment[idx].notes = newNotes;
        updated++;
      });

      if (updated === 0) {
        showToast('No controls were updated — check the spreadsheet format.');
        return;
      }

      // Re-render assessment rows with imported values
      renderAssessmentRows();
      showToast(`✓ Imported ${updated} controls from spreadsheet.`);
      goToStep(3); // jump to assessment for review
    } catch (err) {
      showToast('Could not read spreadsheet — is it the correct file?');
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
});

// ── INIT ─────────────────────────────────────────────────────
function init() {
  // Load Salesbuildr creds
  const savedUrl = localStorage.getItem('sb_tenant_url');
  const savedKey = localStorage.getItem('sb_api_key');
  if (savedUrl) sbTenantUrl.value = savedUrl;
  if (savedKey) sbApiKey.value    = savedKey;

  // Apply default theme
  applyTheme(state.theme.primary, state.theme.secondary);

  // Build initial assessment defaults (IG1)
  buildAssessment();

  goToStep(1);
}

init();
