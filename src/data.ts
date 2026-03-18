import { Client, User, Task, Deadline, Template, Email, Note, Password, Document, Folder, Meeting, TaskTypeConfig, Workflow, Permission, Role } from './types';

const today = new Date();
const fmt = (d: Date) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const subDays = (d: Date, n: number) => addDays(d, -n);

export const INIT_PERMISSIONS: Permission[] = [
  { id: 'view_dashboard', name: 'View Dashboard', description: 'Access to main dashboard and stats', module: 'Dashboard' },
  { id: 'view_tasks', name: 'Manage Tasks', description: 'Create, edit and delete tasks', module: 'Tasks' },
  { id: 'view_clients', name: 'View Clients', description: 'View client list and details', module: 'Clients' },
  { id: 'manage_clients', name: 'Manage Clients', description: 'Add, edit and delete clients', module: 'Clients' },
  { id: 'manage_team', name: 'Manage Team', description: 'Add and manage team members', module: 'Settings' },
  { id: 'manage_roles', name: 'Manage Roles', description: 'Create and manage custom roles', module: 'Settings' },
  { id: 'view_compliance', name: 'View Compliance', description: 'Access to compliance master', module: 'Compliance' },
  { id: 'manage_settings', name: 'Manage Settings', description: 'Access to workspace configurations', module: 'Settings' },
];

export const INIT_ROLES: Role[] = [
  { id: 'r1', name: 'Admin', description: 'Full access to all modules', permissions: ['view_dashboard', 'view_tasks', 'view_clients', 'manage_clients', 'manage_team', 'manage_roles', 'view_compliance', 'manage_settings'], isSystem: true },
  { id: 'r2', name: 'Manager', description: 'Manage tasks and clients', permissions: ['view_dashboard', 'view_tasks', 'view_clients', 'manage_clients', 'view_compliance'], isSystem: true },
  { id: 'r3', name: 'Staff', description: 'Execute assigned tasks', permissions: ['view_dashboard', 'view_tasks', 'view_clients', 'view_compliance'], isSystem: true },
  { id: 'r4', name: 'Article Clerk', description: 'Limited access for articles', permissions: ['view_dashboard', 'view_tasks', 'view_compliance'], isSystem: true },
];

export const INIT_TASK_TYPES: TaskTypeConfig[] = [
  { id: 'tt1', name: 'Task', icon: 'check-square', color: '#3b82f6', workflowId: 'wf1' },
  { id: 'tt2', name: 'Subtask', icon: 'git-merge', color: '#6b7280', workflowId: 'wf1' },
  { id: 'tt3', name: 'Bug', icon: 'bug', color: '#ef4444', workflowId: 'wf1' },
  { id: 'tt4', name: 'Epic', icon: 'zap', color: '#8b5cf6', workflowId: 'wf1' }
];

export const INIT_WORKFLOWS: Workflow[] = [
  {
    id: 'wf1',
    name: 'Standard Workflow',
    description: 'Default workflow for tasks',
    statuses: ['To Do', 'In Progress', 'Awaiting Info', 'Under Review', 'Completed', 'On Hold'],
    transitions: [
      { from: 'To Do', to: ['In Progress', 'On Hold'] },
      { from: 'In Progress', to: ['To Do', 'Under Review', 'Awaiting Info', 'On Hold'] },
      { from: 'Awaiting Info', to: ['In Progress', 'On Hold'] },
      { from: 'Under Review', to: ['In Progress', 'Completed'] },
      { from: 'Completed', to: ['In Progress'] },
      { from: 'On Hold', to: ['To Do', 'In Progress'] }
    ]
  }
];

export const INIT_CLIENTS: Client[] = [
  { id: 'c1', name: 'Agarwal Exports Pvt Ltd', pan: 'AAGCA1234F', gstin: '29AAGCA1234F1Z5', category: 'Pvt Ltd', services: ['GST', 'Audit', 'ITR', 'TDS'], manager: '00000000-0000-0000-0000-000000000002', email: 'ramesh@agarwalexports.in', phone: '9876543210', address: 'HSR Layout, Bengaluru - 560102', onboarded: '2021-04-01', active: true },
  { id: 'c2', name: 'Mehta Industries', pan: 'AAAFM4567G', gstin: '27AAAFM4567G1ZA', category: 'Partnership', services: ['GST', 'TDS'], manager: '00000000-0000-0000-0000-000000000003', email: 'info@mehtaind.in', phone: '9845012345', address: 'Andheri East, Mumbai - 400069', onboarded: '2020-07-15', active: true },
  { id: 'c3', name: 'Sharma & Sons', pan: 'AAEFS9801H', gstin: '07AAEFS9801H1Z2', category: 'Proprietorship', services: ['Audit', 'ITR'], manager: '00000000-0000-0000-0000-000000000001', email: 'ceo@sharmasons.in', phone: '9711234567', address: 'Connaught Place, New Delhi - 110001', onboarded: '2019-03-10', active: true },
  { id: 'c4', name: 'Patel Constructions Pvt Ltd', pan: 'AAKFP2344J', gstin: '24AAKFP2344J1ZB', category: 'Pvt Ltd', services: ['ROC', 'TDS', 'GST'], manager: '00000000-0000-0000-0000-000000000002', email: 'admin@patelconstructions.in', phone: '9512345678', address: 'Navrangpura, Ahmedabad - 380009', onboarded: '2022-01-20', active: true },
  { id: 'c5', name: 'Verma Pharmaceuticals', pan: 'AAFPV6712K', gstin: '09AAFPV6712K1ZC', category: 'Pvt Ltd', services: ['GST', 'Audit', 'ROC', 'ITR'], manager: '00000000-0000-0000-0000-000000000003', email: 'accounts@vermapharma.com', phone: '9412345678', address: 'Gomti Nagar, Lucknow - 226010', onboarded: '2023-06-01', active: true },
  { id: 'c6', name: 'Sunita Textiles LLP', pan: 'AAQFS3388L', gstin: '29AAQFS3388L1ZD', category: 'LLP', services: ['GST', 'TDS', 'ITR'], manager: '00000000-0000-0000-0000-000000000002', email: 'accounts@sunitatex.in', phone: '9632145678', address: 'Ring Road, Surat - 395007', onboarded: '2021-11-14', active: true },
  { id: 'c7', name: 'Kapoor & Associates', pan: 'AABFK7890M', gstin: '06AABFK7890M1ZE', category: 'Partnership', services: ['ITR', 'Audit'], manager: '00000000-0000-0000-0000-000000000001', email: 'kapoor.assoc@gmail.com', phone: '9871234560', address: 'Sector 18, Gurugram - 122015', onboarded: '2020-09-01', active: true },
  { id: 'c8', name: 'Raghunath Steel Works', pan: 'AACFR4521N', gstin: '33AACFR4521N1ZF', category: 'Pvt Ltd', services: ['GST', 'TDS', 'Audit', 'ROC', 'ITR'], manager: '00000000-0000-0000-0000-000000000003', email: 'accounts@raghunathsteel.in', phone: '9344512345', address: 'Ambattur Industrial Estate, Chennai - 600058', onboarded: '2022-08-30', active: true },
];

export const INIT_USERS: User[] = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Rajesh Sharma', email: 'rajesh@kdkfirm.in', role: 'Admin', designation: 'Partner', color: '#2563eb', active: true },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Priya Nair', email: 'priya@kdkfirm.in', role: 'Manager', designation: 'Senior Manager', color: '#dc2626', active: true },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Amit Kulkarni', email: 'amit@kdkfirm.in', role: 'Manager', designation: 'Senior Accountant', color: '#059669', active: true },
  { id: '00000000-0000-0000-0000-000000000004', name: 'Sneha Reddy', email: 'sneha@kdkfirm.in', role: 'Staff', designation: 'Accountant', color: '#7c3aed', active: true },
  { id: '00000000-0000-0000-0000-000000000005', name: 'Rahul Joshi', email: 'rahul@kdkfirm.in', role: 'Article Clerk', designation: 'Article Clerk', color: '#d97706', active: true },
];

export const INIT_TASKS: Task[] = [
  { id: 'KDK-1', title: 'GSTR-3B Filing — October 2024', clientId: 'c1', type: 'GST', status: 'In Progress', priority: 'High', assigneeId: '00000000-0000-0000-0000-000000000002', reviewerId: '00000000-0000-0000-0000-000000000001', dueDate: fmt(subDays(today, 2)), createdAt: fmt(subDays(today, 19)), recurring: 'Monthly', description: 'File GSTR-3B for Agarwal Exports for October 2024. ITC claim pending verification.', tags: ['urgent', 'filing'], subtasks: [], comments: [{ id: 'cm1', userId: '00000000-0000-0000-0000-000000000002', text: 'Bank statement received. Starting GSTR-2B reconciliation.', createdAt: fmt(today) }, { id: 'cm2', userId: '00000000-0000-0000-0000-000000000001', text: 'This is overdue! Penalty accruing. File today.', createdAt: fmt(subDays(today, 1)) }], attachments: [{ id: 'a1', name: 'Oct_Invoices.pdf', size: '2.1 MB', type: 'pdf' }, { id: 'a2', name: 'Bank_Statement.xlsx', size: '340 KB', type: 'xlsx' }], activity: [{ text: 'Moved to In Progress by Priya', at: fmt(today) }, { text: 'Auto-escalated (overdue)', at: fmt(today) }, { text: 'Created by Rajesh', at: fmt(subDays(today, 19)) }] },
  { id: 'KDK-2', parentId: 'KDK-1', issueType: 'Subtask', title: 'Collect purchase invoices', clientId: 'c1', type: 'GST', status: 'Completed', priority: 'Medium', assigneeId: '00000000-0000-0000-0000-000000000002', reviewerId: '00000000-0000-0000-0000-000000000001', dueDate: fmt(subDays(today, 5)), createdAt: fmt(subDays(today, 19)), recurring: 'One-time', description: '', tags: [], subtasks: [], comments: [], attachments: [], activity: [] },
  { id: 'KDK-3', parentId: 'KDK-1', issueType: 'Subtask', title: 'Obtain bank statement', clientId: 'c1', type: 'GST', status: 'Completed', priority: 'Medium', assigneeId: '00000000-0000-0000-0000-000000000002', reviewerId: '00000000-0000-0000-0000-000000000001', dueDate: fmt(subDays(today, 4)), createdAt: fmt(subDays(today, 19)), recurring: 'One-time', description: '', tags: [], subtasks: [], comments: [], attachments: [], activity: [] },
  { id: 'KDK-4', parentId: 'KDK-1', issueType: 'Subtask', title: 'Reconcile GSTR-2B vs books', clientId: 'c1', type: 'GST', status: 'In Progress', priority: 'High', assigneeId: '00000000-0000-0000-0000-000000000002', reviewerId: '00000000-0000-0000-0000-000000000001', dueDate: fmt(today), createdAt: fmt(subDays(today, 19)), recurring: 'One-time', description: '', tags: [], subtasks: [], comments: [], attachments: [], activity: [] },
  { id: 'KDK-5', title: 'TDS Return Q2 — 26Q Filing', clientId: 'c2', type: 'TDS', status: 'In Progress', priority: 'High', assigneeId: '00000000-0000-0000-0000-000000000003', reviewerId: '00000000-0000-0000-0000-000000000001', dueDate: fmt(addDays(today, 8)), createdAt: fmt(subDays(today, 10)), recurring: 'Quarterly', description: 'Prepare and file Form 26Q for Q2 for Mehta Industries.', tags: ['tds', 'quarterly'], subtasks: [], comments: [{ id: 'cm1', userId: '00000000-0000-0000-0000-000000000003', text: 'Salary data received. Preparing return now.', createdAt: fmt(subDays(today, 1)) }], attachments: [], activity: [{ text: 'Amit started work', at: fmt(subDays(today, 2)) }] },
  { id: 'KDK-6', title: 'Balance Sheet Preparation FY 2023-24', clientId: 'c3', type: 'Audit', status: 'Under Review', priority: 'Medium', assigneeId: '00000000-0000-0000-0000-000000000004', reviewerId: '00000000-0000-0000-0000-000000000002', dueDate: fmt(addDays(today, 25)), createdAt: fmt(subDays(today, 30)), recurring: 'Annual', description: 'Prepare balance sheet and P&L for Sharma & Sons.', tags: ['audit', 'annual'], subtasks: [], comments: [], attachments: [{ id: 'a1', name: 'Trial_Balance.xlsx', size: '180 KB', type: 'xlsx' }], activity: [{ text: 'Sneha submitted for review', at: fmt(subDays(today, 1)) }] },
  { id: 'KDK-7', title: 'ROC Annual Return MGT-7', clientId: 'c4', type: 'ROC', status: 'Completed', priority: 'Low', assigneeId: '00000000-0000-0000-0000-000000000002', reviewerId: '00000000-0000-0000-0000-000000000001', dueDate: fmt(subDays(today, 5)), createdAt: fmt(subDays(today, 25)), recurring: 'Annual', description: 'File MGT-7 annual return for Patel Constructions on MCA portal.', tags: ['roc', 'completed'], subtasks: [], comments: [{ id: 'cm1', userId: '00000000-0000-0000-0000-000000000002', text: 'Filed successfully. Challan receipt saved.', createdAt: fmt(subDays(today, 5)) }], attachments: [{ id: 'a1', name: 'MGT7_Filed.pdf', size: '520 KB', type: 'pdf' }], activity: [{ text: 'Task completed', at: fmt(subDays(today, 5)) }] },
  { id: 'KDK-8', title: 'ITR Filing — AY 2024-25', clientId: 'c5', type: 'ITR', status: 'To Do', priority: 'Medium', assigneeId: '00000000-0000-0000-0000-000000000003', reviewerId: '00000000-0000-0000-0000-000000000001', dueDate: fmt(addDays(today, 41)), createdAt: fmt(subDays(today, 5)), recurring: 'Annual', description: 'Prepare and file Income Tax Return for Verma Pharmaceuticals.', tags: ['itr', 'annual'], subtasks: [], comments: [], attachments: [], activity: [{ text: 'Task created from template', at: fmt(subDays(today, 5)) }] },
  { id: 'KDK-9', title: 'GSTR-1 November — Outward Supplies', clientId: 'c6', type: 'GST', status: 'To Do', priority: 'High', assigneeId: '00000000-0000-0000-0000-000000000004', reviewerId: '00000000-0000-0000-0000-000000000002', dueDate: fmt(addDays(today, 21)), createdAt: fmt(subDays(today, 3)), recurring: 'Monthly', description: 'File GSTR-1 for Sunita Textiles LLP for November 2024.', tags: ['gst', 'monthly'], subtasks: [], comments: [], attachments: [], activity: [{ text: 'Task auto-created (recurring)', at: fmt(subDays(today, 3)) }] },
  { id: 'KDK-10', title: 'Advance Tax Q3 Computation', clientId: 'c2', type: 'Advance Tax', status: 'To Do', priority: 'Medium', assigneeId: '00000000-0000-0000-0000-000000000005', reviewerId: '00000000-0000-0000-0000-000000000003', dueDate: fmt(addDays(today, 25)), createdAt: fmt(subDays(today, 2)), recurring: 'Quarterly', description: 'Compute Q3 advance tax liability for Mehta Industries.', tags: ['advance-tax'], subtasks: [], comments: [], attachments: [], activity: [{ text: 'Task created', at: fmt(subDays(today, 2)) }] },
  { id: 'KDK-11', title: 'GST Reconciliation — GSTR-2B vs Books', clientId: 'c1', type: 'GST', status: 'Awaiting Info', priority: 'Medium', assigneeId: '00000000-0000-0000-0000-000000000004', reviewerId: '00000000-0000-0000-0000-000000000002', dueDate: fmt(addDays(today, 15)), createdAt: fmt(subDays(today, 8)), recurring: 'Monthly', description: 'Reconcile GSTR-2B auto-drafted ITC with purchase books for Agarwal Exports.', tags: ['reconciliation'], subtasks: [], comments: [{ id: 'cm1', userId: '00000000-0000-0000-0000-000000000004', text: 'Pending 5 invoices from client. Sent reminder.', createdAt: fmt(subDays(today, 1)) }], attachments: [], activity: [{ text: 'Status changed to Awaiting Info', at: fmt(subDays(today, 1)) }] },
  { id: 'KDK-12', title: 'Statutory Audit FY 2023-24', clientId: 'c8', type: 'Audit', status: 'In Progress', priority: 'High', assigneeId: '00000000-0000-0000-0000-000000000003', reviewerId: '00000000-0000-0000-0000-000000000001', dueDate: fmt(addDays(today, 35)), createdAt: fmt(subDays(today, 45)), recurring: 'Annual', description: 'Full statutory audit for Raghunath Steel Works FY 2023-24.', tags: ['audit', 'statutory'], subtasks: [], comments: [], attachments: [{ id: 'a1', name: 'Audit_Plan.pdf', size: '890 KB', type: 'pdf' }], activity: [{ text: 'Audit commenced', at: fmt(subDays(today, 10)) }] },
];

export const INIT_DEADLINES: Deadline[] = [
  { id: 'cd1', title: 'GSTR-3B Filing', desc: 'Monthly summary return', category: 'GST', dueDate: fmt(subDays(today, 2)), clients: 18, form: 'GSTR-3B', section: 'Sec 39 CGST Act' },
  { id: 'cd2', title: 'DIR-3 KYC', desc: 'KYC of directors', category: 'ROC', dueDate: fmt(addDays(today, 8)), clients: 7, form: 'DIR-3 KYC', section: 'Rule 12A CA2013' },
  { id: 'cd3', title: 'TDS Deposit', desc: 'Tax deducted October 2024', category: 'TDS', dueDate: fmt(addDays(today, 10)), clients: 14, form: 'Challan 281', section: 'Sec 192-194' },
  { id: 'cd4', title: 'GSTR-1 — November', desc: 'Outward supplies monthly', category: 'GST', dueDate: fmt(addDays(today, 21)), clients: 21, form: 'GSTR-1', section: 'Sec 37 CGST Act' },
  { id: 'cd5', title: 'Advance Tax Q3 (75%)', desc: '3rd installment', category: 'Advance Tax', dueDate: fmt(addDays(today, 25)), clients: 34, form: 'Challan 280', section: 'Sec 211' },
  { id: 'cd6', title: 'Form 26Q — Q2 TDS Return', desc: 'TDS return non-salary', category: 'TDS', dueDate: fmt(addDays(today, 8)), clients: 12, form: 'Form 26Q', section: 'Rule 31A' },
  { id: 'cd7', title: 'ITR Filing — Companies', desc: 'Extended deadline AY 2024-25', category: 'ITR', dueDate: fmt(addDays(today, 41)), clients: 9, form: 'ITR-6', section: 'Sec 139(1)' },
  { id: 'cd8', title: 'GSTR-9 Annual Return', desc: 'Annual GST return FY 2023-24', category: 'GST', dueDate: fmt(addDays(today, 60)), clients: 24, form: 'GSTR-9', section: 'Sec 44 CGST Act' },
  { id: 'cd9', title: 'Form AOC-4', desc: 'Annual financial statements', category: 'ROC', dueDate: fmt(addDays(today, 55)), clients: 11, form: 'AOC-4', section: 'Sec 137 CA2013' },
  { id: 'cd10', title: 'PF/ESI Contribution', desc: 'Monthly employer contribution', category: 'Labour', dueDate: fmt(addDays(today, 15)), clients: 8, form: 'ECR/ESIC', section: 'PF Act' },
];

export const INIT_TEMPLATES: Template[] = [
  { id: 'tmpl1', name: 'Monthly GST Filing', category: 'GST', recurring: 'Monthly', estHours: '4-6', description: 'Complete GST return filing workflow including GSTR-1 and GSTR-3B preparation, ITC reconciliation, and portal submission.', color: '#d97706', subtasks: ['Collect sales invoices from client', 'Download purchase invoices', 'Reconcile GSTR-2B with books', 'Identify ITC mismatches', 'Prepare GSTR-1 data', 'Prepare GSTR-3B computation', 'Partner review and approval', 'File on GST portal', 'Download acknowledgement and file'] },
  { id: 'tmpl2', name: 'Statutory Audit', category: 'Audit', recurring: 'Annual', estHours: '40-80', description: 'Full statutory audit engagement covering planning, fieldwork, and reporting as per Standards on Auditing.', color: '#0d9488', subtasks: ['Audit planning and risk assessment', 'Obtain trial balance and financials', 'Review internal control systems', 'Vouching of transactions', 'Verification of assets and liabilities', 'Debtors and creditors confirmation', 'Inventory observation', 'Bank reconciliation review', 'Draft CARO report', 'Prepare audit report', 'Management representation letter', 'Partner review and sign-off', 'File audit report with ROC'] },
  { id: 'tmpl3', name: 'Income Tax Return', category: 'ITR', recurring: 'Annual', estHours: '6-10', description: 'Individual or corporate ITR preparation including tax computation, deductions, and e-filing.', color: '#059669', subtasks: ['Collect financial statements', 'Obtain Form 26AS and AIS', 'Tax computation sheet', 'Depreciation calculation (if applicable)', 'Review deductions (80C-80U)', 'Prepare ITR form', 'Partner review', 'E-file on Income Tax portal', 'Download acknowledgement', 'Verify via Aadhaar OTP or EVC'] },
  { id: 'tmpl4', name: 'ROC Annual Compliance', category: 'ROC', recurring: 'Annual', estHours: '8-12', description: 'Complete annual MCA compliance including AOC-4, MGT-7, and director KYC filings.', color: '#7c3aed', subtasks: ['Draft Directors Report', 'Prepare Board resolution', 'Compile annual accounts', 'Form AOC-4 preparation', 'Form MGT-7 preparation', 'DIR-3 KYC for all directors', 'Review by partner', 'File AOC-4 on MCA21 portal', 'File MGT-7 on MCA21 portal', 'Download SRN receipts'] },
  { id: 'tmpl5', name: 'TDS Quarterly Return', category: 'TDS', recurring: 'Quarterly', estHours: '3-5', description: 'Quarterly TDS return filing for salary and non-salary deductions including TRACES upload.', color: '#2563eb', subtasks: ['Obtain salary register', 'Verify TDS deductions made', 'Match with challans paid', 'Prepare Form 26Q / 24Q', 'TRACES portal upload', 'Partner review', 'File return', 'Download Form 16 / 16A', 'Distribute to deductees'] },
  { id: 'tmpl6', name: 'New Client Onboarding', category: 'Other', recurring: 'One-time', estHours: '2-3', description: 'Systematic onboarding process for new clients including KYC, engagement setup, and compliance calendar.', color: '#ea580c', subtasks: ['KYC documents collection', 'GST registration verification', 'Obtain PAN and other registrations', 'Engagement letter execution', 'Portal credentials setup (IT, GST, MCA)', 'Create client file in document manager', 'Assign team members', 'Set up compliance calendar', 'Initial task creation for pending filings'] },
  { id: 'tmpl7', name: 'GST Annual Return (GSTR-9)', category: 'GST', recurring: 'Annual', estHours: '8-15', description: 'Annual GST return preparation covering full year reconciliation and GSTR-9C certification if applicable.', color: '#d97706', subtasks: ['Compile monthly GSTR-1 filed data', 'Compile monthly GSTR-3B filed data', 'Reconcile with annual books of accounts', 'Compute ITC reconciliation (Table 6-8)', 'Check GSTR-9C applicability', 'Prepare GSTR-9 working file', 'CA review and certification', 'File GSTR-9 on GSTN portal'] },
  { id: 'tmpl8', name: 'Advance Tax Computation', category: 'Advance Tax', recurring: 'Quarterly', estHours: '1-2', description: 'Quarterly advance tax liability computation and challan preparation for Q1-Q4 installments.', color: '#059669', subtasks: ['Estimate current year income', 'Compute total tax liability', 'Deduct TDS credit (26AS/AIS)', 'Calculate installment due', 'Prepare challan 280', 'Client approval and confirmation', 'Deposit advance tax online', 'Update computation file and archive'] },
];

export const INIT_EMAILS: Email[] = [
  { id: 'e1', from: 'CA Ramesh Agarwal', fromEmail: 'ramesh@agarwalexports.in', to: 'rajesh@kdkfirm.in', cc: 'accounts@agarwalexports.in', clientId: 'c1', subject: 'Documents for GSTR-3B — October', preview: 'Please find attached purchase invoices and bank statements...', body: 'Dear Rajesh ji,\n\nHope you are doing well. Please find attached the required documents for GSTR-3B filing for the month of October 2024:\n\n1. Purchase invoices (October 2024) — 47 invoices total\n2. Bank statements — HDFC Current Account\n3. Credit notes issued during the month\n\nAs discussed, we need to file this by 20th November. Please let me know if any additional documents are required.\n\nAlso, we have a credit of ₹1,42,000 in the electronic credit ledger from September ITC. Please ensure the same is reflected correctly.\n\nRegards,\nRamesh Agarwal\nDirector — Agarwal Exports Pvt Ltd', date: fmt(today), time: '10:32 AM', read: false, taskLinked: 'KDK-1', attachments: ['Oct_Invoices.pdf', 'Bank_Statement_Oct.xlsx'] },
  { id: 'e2', from: 'Mehta Industries HR', fromEmail: 'hr@mehtaind.in', to: 'rajesh@kdkfirm.in', clientId: 'c2', subject: 'Salary data for TDS calculation — Q2', preview: 'Hi, attaching salary register for Q2 TDS calculation...', body: 'Hi Amit,\n\nAttaching salary register and Form 12BA for Q2.\n\nTotal employees: 48\nTotal salary paid: ₹38,42,000\nTDS deducted: ₹3,12,400\n\nThanks,\nNeha Mehta', date: fmt(today), time: '9:15 AM', read: false, taskLinked: 'KDK-5', attachments: ['Salary_Register_Q2.xlsx'] },
  { id: 'e3', from: 'Income Tax Department', fromEmail: 'no-reply@incometax.gov.in', to: 'rajesh@kdkfirm.in', clientId: 'c3', subject: 'Notice u/s 139(9) — Defective Return', preview: 'Your ITR filed for AY 2024-25 has been classified as defective...', body: 'Dear Taxpayer,\n\nYour Income Tax Return for AY 2024-25 has been classified as Defective under Section 139(9).\n\nDefect: Tax computation mismatch in Schedule BP.\n\nPlease rectify within 15 days.', date: fmt(subDays(today, 1)), time: '8:00 AM', read: false, taskLinked: null, attachments: [] },
  { id: 'e4', from: 'Sharma & Sons CEO', fromEmail: 'ceo@sharmasons.in', to: 'rajesh@kdkfirm.in', clientId: 'c3', subject: 'Request for meeting — Audit discussion', preview: 'I would like to schedule a meeting to discuss the audit findings...', body: 'Dear Rajesh ji,\n\nI would like to schedule a meeting to discuss the audit findings for FY 2023-24.\n\nAre you available Thursday or Friday afternoon?\n\nWarm regards,\nSuresh Sharma', date: fmt(subDays(today, 1)), time: '3:45 PM', read: true, taskLinked: null, attachments: [] },
  { id: 'e5', from: 'GST Portal', fromEmail: 'no-reply@gst.gov.in', to: 'rajesh@kdkfirm.in', clientId: 'c6', subject: 'GSTR-1 Filing Confirmation — October', preview: 'Your GSTR-1 for October 2024 has been successfully filed.', body: 'Dear Taxpayer,\n\nGSTR-1 for October 2024 has been successfully filed.\n\nGSTIN: 29AAQFS3388L1ZD\nFiling Date: ' + fmt(subDays(today, 3)) + '\nARN: AA2910240001234', date: fmt(subDays(today, 3)), time: '9:00 AM', read: true, taskLinked: null, attachments: ['GSTR1_Confirmation.pdf'] },
];

export const INIT_NOTES: Note[] = [
  { id: 'n1', title: 'GST Portal Login Tip', content: 'Remember to clear browser cache before logging into GST portal. Use Chrome or Firefox. Portal is slow after 11 PM.', color: '#fef9c3', pinned: true, createdAt: fmt(subDays(today, 5)), updatedAt: fmt(subDays(today, 1)) },
  { id: 'n2', title: 'Agarwal Exports — Key Contacts', content: 'Ramesh Agarwal (MD): 9876543210\nAccounts — Preeti: 9876543211\nDue dates: 11th for GSTR-1, 20th for 3B', color: '#dbeafe', pinned: true, createdAt: fmt(subDays(today, 10)), updatedAt: fmt(subDays(today, 3)) },
  { id: 'n3', title: 'Article Clerk Schedule', content: 'Rahul available Mon-Wed for client visits\nSneha handles Mehta and Verma\nAmit to review all TDS computations before filing', color: '#d1fae5', pinned: false, createdAt: fmt(subDays(today, 3)), updatedAt: fmt(subDays(today, 3)) },
  { id: 'n4', title: 'Pending ITR Checklist', content: 'Still awaiting Form 16 from:\n- Kapoor & Associates (3 employees)\n- Sharma & Sons (5 employees)\nChase up before 15th', color: '#ede9fe', pinned: false, createdAt: fmt(subDays(today, 7)), updatedAt: fmt(subDays(today, 7)) },
];

export const INIT_PASSWORDS: Password[] = [
  { id: 'pw1', clientId: 'c1', portal: 'GST Portal', url: 'https://www.gst.gov.in', username: '29AAGCA1234F1Z5', password: 'Ag@rw@l#2024', notes: 'TAN linked for TDS also. 2FA via registered mobile.', category: 'GST', strength: 4, lastUpdated: fmt(subDays(today, 30)) },
  { id: 'pw2', clientId: 'c1', portal: 'Income Tax Portal', url: 'https://eportal.incometax.gov.in', username: 'AAGCA1234F', password: 'AE@IT2024#', notes: 'E-filing for ITR. Aadhaar OTP linked.', category: 'Income Tax', strength: 4, lastUpdated: fmt(subDays(today, 15)) },
  { id: 'pw3', clientId: 'c2', portal: 'GST Portal', url: 'https://www.gst.gov.in', username: '27AAAFM4567G1ZA', password: 'Mehta@Gst99', notes: 'Quarterly filer. Composition opted.', category: 'GST', strength: 3, lastUpdated: fmt(subDays(today, 45)) },
  { id: 'pw4', clientId: 'c3', portal: 'MCA21 Portal', url: 'https://efiling.mca.gov.in', username: 'sharma_ceo@email.in', password: 'S&Sons@MCA1', notes: 'Director DIN: 02345678. DSC expires Jun 2025.', category: 'MCA', strength: 4, lastUpdated: fmt(subDays(today, 20)) },
  { id: 'pw5', clientId: 'c4', portal: 'TRACES', url: 'https://www.tdscpc.gov.in', username: 'AAKFP2344J', password: 'Patel@TDS24', notes: 'Used for Form 16A download and TDS statements.', category: 'TDS', strength: 3, lastUpdated: fmt(subDays(today, 60)) },
  { id: 'pw6', clientId: 'c5', portal: 'GST Portal', url: 'https://www.gst.gov.in', username: '09AAFPV6712K1ZC', password: 'Verm@Pharma#23', notes: 'Monthly GST filer. Auto-pay enabled for GST.', category: 'GST', strength: 5, lastUpdated: fmt(subDays(today, 10)) },
];

export const INIT_DOCS: Document[] = [
  { id: 'd1', folderId: 'f2', name: 'GSTR-3B_Oct2024_AgarwalExports.pdf', type: 'pdf', size: '1.2 MB', clientId: 'c1', tags: ['GST', 'GSTR-3B', 'October', '2024'], uploadedBy: 'u2', uploadedAt: fmt(subDays(today, 5)), description: 'Filed GSTR-3B for October 2024' },
  { id: 'd2', folderId: 'f2', name: 'GSTR-1_Oct2024_AgarwalExports.pdf', type: 'pdf', size: '890 KB', clientId: 'c1', tags: ['GST', 'GSTR-1', 'October', '2024'], uploadedBy: 'u2', uploadedAt: fmt(subDays(today, 6)), description: 'Filed GSTR-1 for October 2024' },
  { id: 'd3', folderId: 'f3', name: 'BalanceSheet_FY2324_Sharma.xlsx', type: 'xlsx', size: '340 KB', clientId: 'c3', tags: ['Audit', 'Balance Sheet', 'FY2324'], uploadedBy: 'u4', uploadedAt: fmt(subDays(today, 3)), description: 'Balance sheet prepared for audit' },
  { id: 'd4', folderId: 'f4', name: 'Form26Q_Q2_Mehta.pdf', type: 'pdf', size: '210 KB', clientId: 'c2', tags: ['TDS', '26Q', 'Q2', '2024'], uploadedBy: 'u3', uploadedAt: fmt(subDays(today, 10)), description: 'TDS return Q2 filed copy' },
  { id: 'd5', folderId: 'f5', name: 'MGT7_Patel_Constructions.pdf', type: 'pdf', size: '520 KB', clientId: 'c4', tags: ['ROC', 'MGT-7', 'Annual'], uploadedBy: 'u2', uploadedAt: fmt(subDays(today, 7)), description: 'MGT-7 filed copy with SRN' },
  { id: 'd6', folderId: 'f1', name: 'Engagement_Letter_Template.docx', type: 'docx', size: '85 KB', clientId: null, tags: ['Template', 'Engagement', 'Standard'], uploadedBy: 'u1', uploadedAt: fmt(subDays(today, 60)), description: 'Standard engagement letter template' },
  { id: 'd7', folderId: 'f1', name: 'Client_KYC_Form.pdf', type: 'pdf', size: '120 KB', clientId: null, tags: ['Template', 'KYC'], uploadedBy: 'u1', uploadedAt: fmt(subDays(today, 90)), description: 'Standard KYC form for new clients' },
  { id: 'd8', folderId: 'f6', name: 'GSTR-3B_Nov2024.pdf', type: 'pdf', size: '1.1 MB', clientId: 'c1', tags: ['GST', 'GSTR-3B'], uploadedBy: 'u2', uploadedAt: fmt(subDays(today, 1)), description: 'Draft GSTR-3B for November' },
];

export const INIT_FOLDERS: Folder[] = [
  { id: 'f1', name: 'General Templates', parentId: null, clientId: null, icon: 'folder' },
  { id: 'f2', name: 'GST Returns', parentId: null, clientId: 'c1', icon: 'folder' },
  { id: 'f3', name: 'Audit Files', parentId: null, clientId: 'c3', icon: 'folder' },
  { id: 'f4', name: 'TDS Returns', parentId: null, clientId: 'c2', icon: 'folder' },
  { id: 'f5', name: 'ROC Filings', parentId: null, clientId: 'c4', icon: 'folder' },
  { id: 'f6', name: '2024-25', parentId: 'f2', clientId: 'c1', icon: 'folder' },
  { id: 'f7', name: 'Workings', parentId: 'f3', clientId: 'c3', icon: 'folder' },
];

export const INIT_MEETINGS: Meeting[] = [
  { id: 'm1', title: 'Audit Review — Sharma & Sons', clientId: 'c3', type: 'Video Call', platform: 'google_meet', meetLink: 'https://meet.google.com/abc-defg-hij', date: fmt(addDays(today, 2)), time: '15:00', duration: 60, attendees: ['u1', 'u4'], description: 'Review audit findings with client. Discuss depreciation queries.', status: 'confirmed' },
  { id: 'm2', title: 'GST Filing Discussion — Agarwal Exports', clientId: 'c1', type: 'In-Person', platform: 'in_person', meetLink: '', date: fmt(addDays(today, 5)), time: '11:00', duration: 90, attendees: ['u1', 'u2'], description: 'Monthly GST review and planning for Q3.', status: 'confirmed' },
  { id: 'm3', title: 'TDS Return Walkthrough — Mehta', clientId: 'c2', type: 'Video Call', platform: 'zoom', meetLink: 'https://zoom.us/j/123456789', date: fmt(subDays(today, 2)), time: '10:00', duration: 45, attendees: ['u3', 'u2'], description: 'Walk client through TDS computation for Q2.', status: 'completed' },
  { id: 'm4', title: 'New Client Meeting — Kapoor & Associates', clientId: 'c7', type: 'Video Call', platform: 'microsoft_teams', meetLink: 'https://teams.microsoft.com/l/meetup-join/xxx', date: fmt(addDays(today, 10)), time: '14:00', duration: 60, attendees: ['u1', 'u2', 'u3'], description: 'Initial meeting for onboarding new client.', status: 'scheduled' },
];
