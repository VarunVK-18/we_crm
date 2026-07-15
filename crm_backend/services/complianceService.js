const ComplianceTask = require('../models/ComplianceTask');
const pdfParse = require('pdf-parse');

const extractDateFromText = (text) => {
    // Look for DD/MM/YYYY or DD-MM-YYYY
    const dateRegex = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/;
    const match = text.match(dateRegex);
    if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const year = parseInt(match[3], 10);
        return new Date(year, month, day);
    }
    return new Date(); // fallback to today
};

exports.extractDateFromCOI = async (buffer) => {
    try {
        const data = await pdfParse(buffer);
        return extractDateFromText(data.text);
    } catch (e) {
        console.error("PDF Parsing error", e);
        return new Date();
    }
};

const calculateFirstAGM = (incDate) => {
    const year = incDate.getFullYear();
    // Indian FY logic: If incorporated between Jan 1 and Mar 31, 
    // the FY ends on Mar 31 of the *following* year.
    // E.g. Inc Nov 2023 -> FY ends Mar 31 2024 (2023 + 1)
    // E.g. Inc Feb 2024 -> FY ends Mar 31 2025 (2024 + 1)
    // So in both cases, the FY end year is `year + 1`.
    const fyEndYear = year + 1;
    
    // First AGM is within 9 months of FY end -> December 31
    return new Date(fyEndYear, 11, 31);
};

const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

// Calculate which AGM number this is, based on the company incorporation date and current financial year
const calculateAGMNumber = (incDate) => {
    const today = new Date();
    // Indian FY: April 1 to March 31
    // Current FY end year: if today is Jan-Mar, FY ends this year; Apr-Dec = ends next year
    const currentFyEndYear = (today.getMonth() < 3) ? today.getFullYear() : today.getFullYear() + 1;
    // First AGM FY end year = incDate.year + 1 (always one year after inc)
    const firstFyEndYear = incDate.getFullYear() + 1;
    const agmNumber = currentFyEndYear - firstFyEndYear + 1;
    return Math.max(1, agmNumber);
};

const AGM_ORDINAL = (n) => {
    const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
    return n <= 10 ? ordinals[n - 1] : `${n}th`;
};

const getNextFyDate = (month, day) => {
    const today = new Date();
    const year = (today.getMonth() < 3) ? today.getFullYear() : today.getFullYear() + 1;
    return new Date(year, month, day);
};

// CASE 1: First-time client (incorporated with/via us)
// Full first-year compliances. Share Capital Bank Statement is uploaded separately by client.
exports.generateCase1Compliances = async (clientUid, companyId, checklistId, incDate, entityName = '') => {
    await ComplianceTask.deleteMany({ checklistId });

    const firstAgmDate = calculateFirstAGM(incDate);
    const agmNumber = calculateAGMNumber(incDate);

    const compliances = [
        {
            title: 'ADT-1',
            description: 'First Auditor Appointment — Due 14 days after incorporation',
            dueDate: addDays(incDate, 14)
        },
        {
            title: 'INC-20A (Commencement of Business)',
            description: 'Declaration of commencement of business — Due 180 days after incorporation',
            dueDate: addDays(incDate, 180)
        },
        {
            title: `${AGM_ORDINAL(agmNumber)} AGM`,
            description: `Annual General Meeting — Within 9 months from first financial year end`,
            dueDate: firstAgmDate
        },
        {
            title: 'MGT-7A',
            description: 'Annual Return — Due 60 days after AGM',
            dueDate: addDays(firstAgmDate, 60)
        },
        {
            title: 'AOC-4',
            description: 'Financial Statements — Due 30 days after AGM',
            dueDate: addDays(firstAgmDate, 30)
        },
        {
            title: 'DIR-3 KYC',
            description: 'Director KYC — Due 30 September every year',
            dueDate: getNextFyDate(8, 30)
        },
        {
            title: 'ITR-6',
            description: 'Income Tax Return — Due 31 October every year',
            dueDate: getNextFyDate(9, 31)
        },
        {
            title: 'MCA Reports',
            description: 'MCA Annual Reports — Due 30 September every year',
            dueDate: getNextFyDate(8, 30)
        }
    ];

    for (const c of compliances) {
        await ComplianceTask.create({
            clientUid, companyId, checklistId, entityName,
            title: c.title, description: c.description, dueDate: c.dueDate, status: 'Upcoming'
        });
    }
};

// CASE 2: Renewal — Client has already done year 1+ with us. No ADT-1, no bank statement.
// Runs each April 1 for existing clients. AGM number increments from yearNumber.
exports.generateCase2Compliances = async (clientUid, companyId, checklistId, incDate, entityName = '', yearNumber = 2) => {
    await ComplianceTask.deleteMany({ checklistId });

    const agmNumber = Math.max(yearNumber, calculateAGMNumber(incDate));
    // AGM due: Sept 30 of current FY end
    const agmDate = getNextFyDate(8, 30);

    const compliances = [
        {
            title: `${AGM_ORDINAL(agmNumber)} AGM`,
            description: `Annual General Meeting — Due 30 September`,
            dueDate: agmDate
        },
        {
            title: 'MGT-7A',
            description: 'Annual Return — Due 60 days after AGM',
            dueDate: addDays(agmDate, 60)
        },
        {
            title: 'AOC-4',
            description: 'Financial Statements — Due 30 days after AGM',
            dueDate: addDays(agmDate, 30)
        },
        {
            title: 'DIR-3 KYC',
            description: 'Director KYC — Due 30 September every year',
            dueDate: getNextFyDate(8, 30)
        },
        {
            title: 'ITR-6',
            description: 'Income Tax Return — Due 31 October every year',
            dueDate: getNextFyDate(9, 31)
        },
        {
            title: 'MCA Reports',
            description: 'MCA Annual Reports — Due 30 September every year',
            dueDate: getNextFyDate(8, 30)
        }
    ];

    for (const c of compliances) {
        await ComplianceTask.create({
            clientUid, companyId, checklistId, entityName,
            title: c.title, description: c.description, dueDate: c.dueDate, status: 'Upcoming'
        });
    }
};

// CASE 3: Client came from another firm — Nth year overall, 1st year with us.
// Requires ADT-1 (reappoint auditor) + AGM auto-calculated from inc date.
// On each April 1 thereafter, they become like Case 2.
exports.generateCase3Compliances = async (clientUid, companyId, checklistId, incDate, entityName = '') => {
    await ComplianceTask.deleteMany({ checklistId });

    const agmNumber = calculateAGMNumber(incDate);
    const agmDate = getNextFyDate(8, 30);

    const compliances = [
        {
            title: 'ADT-1',
            description: 'Auditor Reappointment — Due 14 days after onboarding',
            dueDate: addDays(new Date(), 14)
        },
        {
            title: `${AGM_ORDINAL(agmNumber)} AGM`,
            description: `Annual General Meeting — Due 30 September`,
            dueDate: agmDate
        },
        {
            title: 'MGT-7A',
            description: 'Annual Return — Due 60 days after AGM',
            dueDate: addDays(agmDate, 60)
        },
        {
            title: 'AOC-4',
            description: 'Financial Statements — Due 30 days after AGM',
            dueDate: addDays(agmDate, 30)
        },
        {
            title: 'DIR-3 KYC',
            description: 'Director KYC — Due 30 September every year',
            dueDate: getNextFyDate(8, 30)
        },
        {
            title: 'ITR-6',
            description: 'Income Tax Return — Due 31 October every year',
            dueDate: getNextFyDate(9, 31)
        },
        {
            title: 'MCA Reports',
            description: 'MCA Annual Reports — Due 30 September every year',
            dueDate: getNextFyDate(8, 30)
        }
    ];

    for (const c of compliances) {
        await ComplianceTask.create({
            clientUid, companyId, checklistId, entityName,
            title: c.title, description: c.description, dueDate: c.dueDate, status: 'Upcoming'
        });
    }
};

// Legacy: keep for backward compatibility (LLP/OPC still call generateCompliancesForPrivateLimited by old name)
exports.generateCompliancesForPrivateLimited = exports.generateCase1Compliances;



exports.generateCompliancesForLLP = async (clientUid, companyId, checklistId, incDate, entityName = '') => {
    // Delete any existing tasks for this checklist to prevent duplicates on reupload
    await ComplianceTask.deleteMany({ checklistId });

    // We need to fetch the User to check for GSTIN and TAN
    const User = require('../models/User');
    const user = await User.findById(clientUid);

    const year = incDate.getFullYear();
    const nextMay = new Date(year, 4, 30); // May 30
    if (nextMay < incDate) nextMay.setFullYear(year + 1);

    const nextOct = new Date(year, 9, 30); // Oct 30
    if (nextOct < incDate) nextOct.setFullYear(year + 1);
    
    const nextJuly = new Date(year, 6, 31); // July 31
    if (nextJuly < incDate) nextJuly.setFullYear(year + 1);

    const compliances = [
        {
            title: 'LLP Agreement Filing (Form 3)',
            description: 'Due within 30 days of incorporation',
            dueDate: addDays(incDate, 30)
        },
        {
            title: 'Form 11 (Annual Return)',
            description: 'Due 30 May every year',
            dueDate: nextMay
        },
        {
            title: 'Form 8 (Statement of Accounts & Solvency)',
            description: 'Due 30 October every year',
            dueDate: nextOct
        },
        {
            title: 'Income Tax Return (ITR)',
            description: 'As per Income Tax rules',
            dueDate: nextJuly
        }
    ];

    if (user && user.gstin) {
        // GST Returns due every month, e.g., 20th of next month
        const nextGst = new Date(year, incDate.getMonth() + 1, 20);
        compliances.push({
            title: 'GST Returns',
            description: 'Due 20th of every month',
            dueDate: nextGst
        });
    }

    if (user && user.tan) {
        // TDS Returns due quarterly, e.g., end of next month of quarter
        const nextTds = new Date(year, incDate.getMonth() + 3, 31);
        compliances.push({
            title: 'TDS Returns',
            description: 'Quarterly return',
            dueDate: nextTds
        });
    }

    for (const c of compliances) {
        await ComplianceTask.create({
            clientUid,
            companyId,
            checklistId,
            entityName,
            title: c.title,
            description: c.description,
            dueDate: c.dueDate,
            status: 'Upcoming'
        });
    }
};

exports.generateCompliancesForOPC = async (clientUid, companyId, checklistId, incDate, entityName = '') => {
    // Delete any existing tasks for this checklist to prevent duplicates on reupload
    await ComplianceTask.deleteMany({ checklistId });

    // Indian FY logic: FY ends Mar 31 of (year + 1)
    const year = incDate.getFullYear();
    const fyEndDate = new Date(year + 1, 2, 31); // March 31

    const compliances = [
        {
            title: 'ADT-1',
            description: 'First Auditor Appointment (Due 30 days after inc)',
            dueDate: addDays(incDate, 30)
        },
        {
            title: 'Share Certificates',
            description: 'Due 60 days after inc',
            dueDate: addDays(incDate, 60)
        },
        {
            title: 'INC-20A (Commencement of Business)',
            description: 'Due 180 days after inc',
            dueDate: addDays(incDate, 180)
        },
        {
            title: 'AOC-4',
            description: 'Due 180 days after close of Financial Year',
            dueDate: addDays(fyEndDate, 180)
        },
        {
            title: 'MGT-7A',
            description: 'Due 60 days after 6 months from close of Financial Year',
            dueDate: addDays(fyEndDate, 240)
        }
    ];

    for (const c of compliances) {
        await ComplianceTask.create({
            clientUid,
            companyId,
            checklistId,
            entityName,
            title: c.title,
            description: c.description,
            dueDate: c.dueDate,
            status: 'Upcoming'
        });
    }
};


exports.calculateStatus = (dueDate, completedAt) => {
    if (completedAt) return 'Completed';
    const today = new Date();
    const diffTime = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffTime < 0) return 'Overdue';
    if (diffTime <= 3) return 'Critical';
    if (diffTime <= 10) return 'Due Soon';
    return 'Upcoming';
};

exports.updateStatuses = async (clientUid) => {
    const tasks = await ComplianceTask.find({ clientUid, status: { $ne: 'Completed' } });
    const bulkOps = [];
    
    for (let task of tasks) {
        const newStatus = exports.calculateStatus(task.dueDate, null);
        if (task.status !== newStatus) {
            bulkOps.push({
                updateOne: {
                    filter: { _id: task._id },
                    update: { $set: { status: newStatus } }
                }
            });
        }
    }
    
    if (bulkOps.length > 0) {
        await ComplianceTask.bulkWrite(bulkOps);
    }
};
