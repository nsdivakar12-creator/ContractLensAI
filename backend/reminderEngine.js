// Idea 8 — Automatic Deadline & Renewal Reminder Engine
// Extracts dates, renewal deadlines, cancellation windows & payment due dates,
// explains consequences, and generates downloadable RFC-5545 .ics Calendar files!

const MONTHS = {
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2, april: 3, apr: 3,
  may: 4, june: 5, jun: 5, july: 6, jul: 6, august: 7, aug: 7, september: 8, sep: 8, sept: 8,
  october: 9, oct: 9, november: 10, nov: 10, december: 11, dec: 11
};

function parseHumanDate(str) {
  // Format 1: "30 December 2026" or "1 October 2026"
  const m1 = str.match(/(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{4})/i);
  if (m1) {
    return new Date(Number(m1[3]), MONTHS[m1[2].toLowerCase()], Number(m1[1]));
  }
  // Format 2: "December 30, 2026"
  const m2 = str.match(/(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (m2) {
    return new Date(Number(m2[3]), MONTHS[m2[1].toLowerCase()], Number(m2[2]));
  }
  return null;
}

function formatReadableDate(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function extractContractReminders(analysis) {
  const text = analysis.originalText || '';
  const reminders = [];
  const seen = new Set();

  const pushUnique = (item) => {
    const key = `${item.type}-${item.displayDate}`;
    if (seen.has(key)) return;
    seen.add(key);
    reminders.push(item);
  };

  // 1. Scan explicit calendar dates
  const dateRegex = /(?:\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b)/gi;
  let dm;
  while ((dm = dateRegex.exec(text)) !== null) {
    const raw = dm[0];
    const parsed = parseHumanDate(raw);
    if (!parsed) continue;
    const around = text.slice(Math.max(0, dm.index - 85), Math.min(text.length, dm.index + raw.length + 95)).replace(/\s+/g, ' ').trim();

    if (/until|expir|terminat|end|renew|maturity/i.test(around)) {
      const isAutoRenew = /automatically\s+renew|auto[- ]?renew/i.test(text);
      pushUnique({
        id: `rem-end-${reminders.length + 1}`,
        type: isAutoRenew ? 'renewal' : 'expiry',
        urgency: isAutoRenew ? 'red' : 'yellow',
        title: isAutoRenew ? 'Renewal Deadline Approaching' : 'Contract Expiration / Maturity Date',
        displayDate: formatReadableDate(parsed),
        isoDate: toIsoDate(parsed),
        alertMessage: isAutoRenew
          ? `Your agreement may renew automatically on ${formatReadableDate(parsed)}. Check your cancellation or renewal conditions before the deadline.`
          : `Your agreement reaches its end/maturity date on ${formatReadableDate(parsed)}.`,
        consequence: isAutoRenew
          ? 'If you do not take action before the cancellation notice window closes, the contract may lock you into another full term under its renewal conditions.'
          : 'Confirm final settlement, deposit return, or written renewal well in advance.',
        contextQuote: around
      });
    } else if (/prior|before|cancel|non-renewal|notice/i.test(around)) {
      pushUnique({
        id: `rem-cancel-${reminders.length + 1}`,
        type: 'cancellation',
        urgency: 'red',
        title: 'Last Day to Send Cancellation Notice',
        displayDate: formatReadableDate(parsed),
        isoDate: toIsoDate(parsed),
        alertMessage: `You must send written non-renewal notice on or before ${formatReadableDate(parsed)}.`,
        consequence: 'Missing this cutoff triggers automatic renewal and any built-in price/rent hike.',
        contextQuote: around
      });
    }
  }

  // 2. Scan recurring monthly payment due dates (e.g., "1st day of every month", "5th of every month")
  const dueMatch = text.match(/(?:on\s+or\s+before\s+the|due\s+on\s+the|due\s+date\s*\(?)\s*(\d{1,2}(?:st|nd|rd|th))\s*(?:day\s+)?of\s+(?:each|every)\s+(?:calendar\s+)?month/i);
  if (dueMatch) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(parseInt(dueMatch[1], 10) || 1);
    pushUnique({
      id: 'rem-payment-due',
      type: 'payment',
      urgency: 'yellow',
      title: `Monthly Payment Due (${dueMatch[1]} of Every Month)`,
      displayDate: `${dueMatch[1]} of every month`,
      isoDate: toIsoDate(nextMonth),
      alertMessage: `Recurring payment is due on the ${dueMatch[1]} of every month.`,
      consequence: 'Late payments can trigger immediate penalty fees, daily charges, or default interest spikes.',
      contextQuote: text.slice(Math.max(0, dueMatch.index - 40), Math.min(text.length, dueMatch.index + 95)).trim()
    });
  }

  // 3. Scan notice period / lock-in / payout windows
  const windowRegex = /(ninety|sixty|thirty|90|60|30|24|12)\s*\(?\d*\)?\s*(days?|months?)\s+(?:prior|written\s+notice|following\s+termination|after\s+vacating|installments)/gi;
  let wm;
  while ((wm = windowRegex.exec(text)) !== null) {
    const around = text.slice(Math.max(0, wm.index - 55), Math.min(text.length, wm.index + wm[0].length + 65)).replace(/\s+/g, ' ').trim();
    const isDeposit = /vacating|deposit/i.test(around);
    const isPostExit = /following\s+termination/i.test(around);
    const future = new Date();
    future.setDate(future.getDate() + 30);

    pushUnique({
      id: `rem-win-${reminders.length + 1}`,
      type: isDeposit ? 'deposit' : isPostExit ? 'restriction' : 'notice',
      urgency: isPostExit || /90|ninety|60|sixty/i.test(wm[1]) ? 'red' : 'yellow',
      title: isDeposit
        ? `Security Deposit Refund Window (${wm[0].replace(/\s+/g, ' ')})`
        : isPostExit
        ? `Post-Exit Restriction Window (${wm[0].replace(/\s+/g, ' ')})`
        : `Notice Period Requirement (${wm[0].replace(/\s+/g, ' ')})`,
      displayDate: wm[0].replace(/\s+/g, ' '),
      isoDate: toIsoDate(future),
      alertMessage: isDeposit
        ? `Track your security deposit refund carefully — this contract claims up to ${wm[0]} after vacating.`
        : isPostExit
        ? `Post-exit clause attempts to restrict you for ${wm[0]}.`
        : `Requires ${wm[0]} advance notice before cancelling or exiting.`,
      consequence: 'Set a calendar reminder at least 15 days ahead of any notice cutoff so you are never caught off guard.',
      contextQuote: around
    });
  }

  // Ensure at least one helpful reminder exists
  if (reminders.length === 0) {
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + 30);
    reminders.push({
      id: 'rem-review-30',
      type: 'review',
      urgency: 'green',
      title: '30-Day Post-Signing Contract Check-In',
      displayDate: formatReadableDate(fallbackDate),
      isoDate: toIsoDate(fallbackDate),
      alertMessage: 'Verify that all billing, payout rates, and promised conditions match your signed copy.',
      consequence: 'Catching discrepancies in the first 30 days gives you maximum leverage to fix them.',
      contextQuote: analysis.title
    });
  }

  return reminders;
}

/**
 * Generates a real RFC-5545 .ics calendar file compatible with Google Calendar, Apple Calendar & Outlook
 */
export function generateIcsCalendar({ title, alertMessage, consequence, isoDate, contractTitle }) {
  const cleanDate = (isoDate || toIsoDate(new Date())).replace(/-/g, '');
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `contractlens-${Date.now()}@contractlens.ai`;
  const esc = (s = '') => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ContractLens AI//Deadline Reminder//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART;VALUE=DATE:${cleanDate}`,
    `SUMMARY:${esc(`[ContractLens Alert] ${title} — ${contractTitle}`)}`,
    `DESCRIPTION:${esc(`${alertMessage}\n\nWhy this matters: ${consequence}\n\nGenerated by ContractLens AI`)}`,
    'BEGIN:VALARM',
    'TRIGGER:-P7D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(`Upcoming Contract Deadline: ${title}`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}
