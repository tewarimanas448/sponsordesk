import { PitchChannel, PitchTone } from '@/types';

export interface PitchGenerationParams {
  companyName: string;
  industry?: string;
  websiteUrl?: string;
  contactName?: string;
  contactDesignation?: string;
  fitRationale?: string;
  eventName: string;
  eventDescription?: string;
  eventDates?: string;
  expectedAttendance?: number;
  audienceDescription?: string;
  tierName?: string;
  tierPrice?: number;
  tierBenefits?: string[];
  channel: PitchChannel;
  tone: PitchTone;
  customCallToAction?: string;
}

export function constructSystemPrompt(): string {
  return `You are SponsorDesk AI, an expert sponsorship strategist and copywriter helping collegiate festival and student organization committees craft compelling, tailored sponsorship proposals to corporate brands.

CRITICAL ACCURACY GUIDELINES:
1. NEVER fabricate company partnerships, marketing budgets, past campaigns, or unverified claims.
2. Only use the event details, attendance numbers, and tier benefits provided in the prompt.
3. Adapt the format and length strictly to the chosen communication channel:
   - For 'email': Provide an engaging, professional subject line and a structured email body with opening, event intro, value prop, tier benefits summary, call to action, and student team sign-off.
   - For 'linkedin': Keep it concise (under 250 words), professional, and easy to read on mobile. No subject line.
   - For 'whatsapp': Keep it conversational, punchy, well-formatted with emojis and bullet points, under 180 words. No subject line.
4. Output your response as a valid JSON object matching this schema:
{
  "subject": "Subject line string (required for email, empty string for linkedin/whatsapp)",
  "body": "The full pitch message body string"
}
Output ONLY the raw JSON without markdown code fences or backticks.`;
}

export function constructUserPrompt(params: PitchGenerationParams): string {
  return `Please generate a sponsorship pitch with the following parameters:

COMMUNICATION SPECIFICATIONS:
- Channel: ${params.channel.toUpperCase()}
- Tone: ${params.tone.toUpperCase()}
- Desired Call to Action: ${params.customCallToAction || 'A brief 15-minute introductory call or meeting'}

SPONSOR PROSPECT DETAILS:
- Company Name: ${params.companyName}
- Industry / Category: ${params.industry || 'Not specified'}
- Website: ${params.websiteUrl || 'Not specified'}
- Contact Person: ${params.contactName ? `${params.contactName} (${params.contactDesignation || 'Decision Maker'})` : 'Campus Partnerships Lead'}
- Why this brand is a strategic fit: ${params.fitRationale || 'Brand seeks high-intent youth/student consumer engagement'}

COLLEGE FESTIVAL DETAILS:
- Event Name: ${params.eventName}
- Event Description: ${params.eventDescription || 'Flagship college festival'}
- Event Dates: ${params.eventDates || 'Upcoming semester'}
- Expected Attendance: ${params.expectedAttendance ? `${params.expectedAttendance.toLocaleString('en-IN')} students` : 'Thousands of college students'}
- Target Audience Demographics: ${params.audienceDescription || 'College students and young adults aged 18-24'}

PROPOSED SPONSORSHIP PACKAGE:
- Sponsorship Tier: ${params.tierName || 'Custom Partner'}
- Package Investment: ${params.tierPrice ? `₹${params.tierPrice.toLocaleString('en-IN')}` : 'To be discussed'}
- Key Deliverables & Benefits:
${params.tierBenefits && params.tierBenefits.length > 0 ? params.tierBenefits.map((b) => `  * ${b}`).join('\n') : '  * Category branding & campus stall space'}

Remember to strictly return valid JSON: {"subject": "...", "body": "..."}`;
}

/**
 * Deterministic demo generator fallback when GEMINI_API_KEY is not configured
 */
export function generateDemoPitchFallback(params: PitchGenerationParams): { subject: string; body: string } {
  const contact = params.contactName || 'Partnership Team';
  const priceStr = params.tierPrice ? `₹${params.tierPrice.toLocaleString('en-IN')}` : 'competitive investment';
  const tierName = params.tierName || 'Strategic Partner';
  const event = params.eventName;
  const attendanceStr = params.expectedAttendance ? `${params.expectedAttendance.toLocaleString('en-IN')}+` : '20,000+';

  if (params.channel === 'whatsapp') {
    return {
      subject: '',
      body: `Hi ${contact}! 👋\n\nHope you're having a great week.\n\nReaching out from the organizing committee of ${event}. We've been following ${params.companyName}'s footprint in ${params.industry || 'the youth space'} and believe there is an exceptional synergy with our upcoming fest.\n\nWith ${attendanceStr} students gathering on campus, we'd love to invite ${params.companyName} as our ${tierName}.\n\nHighlights include:\n• Dedicated on-ground experiential activation zone\n• Direct youth brand engagement & digital campaign integration\n• Exclusive stage presence\n\nWould you be open to a quick 10-minute chat this week to share our deck and layout? 🚀\n\nBest regards,\nSponsorship Lead, ${event}`,
    };
  }

  if (params.channel === 'linkedin') {
    return {
      subject: '',
      body: `Hi ${contact},\n\nI hope this finds you well.\n\nI'm reaching out from the sponsorship committee of ${event}. We are hosting ${attendanceStr} college students for our annual festival, and we are currently finalizing category partners.\n\nGiven ${params.companyName}'s focus on ${params.industry || 'student and youth audiences'}, we would love to propose the ${tierName} package (${priceStr}). This offers prominent festival branding, experiential sampling stalls, and direct engagement with our student attendees.\n\nWould you be open to connecting for 15 minutes this week to discuss how we can tailor this partnership for ${params.companyName}?\n\nBest regards,\nSponsorship Committee, ${event}`,
    };
  }

  // Default Email
  return {
    subject: `Partnership Proposal: ${params.companyName} x ${event} — ${tierName}`,
    body: `Dear ${contact},\n\nI hope this email finds you well.\n\nOn behalf of the organizing committee, I am delighted to invite ${params.companyName} to partner with ${event} as our official ${tierName}.\n\nAbout ${event}:\n${params.eventDescription || 'Our annual flagship festival is one of the premier student-led events in the region.'} This edition is scheduled for ${params.eventDates || 'the upcoming term'} and is projected to host ${attendanceStr} students and young leaders.\n\nWhy ${params.companyName} is a strategic fit:\n${params.fitRationale || `As a leading brand in ${params.industry || 'your sector'}, this festival offers unparalleled real-world brand recall, experiential marketing opportunities, and direct engagement with a high-intent Gen-Z audience.`}\n\nProposed Sponsorship Tier: ${tierName} (${priceStr})\nKey Deliverables:\n${params.tierBenefits && params.tierBenefits.length > 0 ? params.tierBenefits.slice(0, 4).map((b) => `• ${b}`).join('\n') : '• Exclusive stall and stage visibility\n• Digital campaigns across our student network'}\n\nWe would welcome the opportunity to discuss this proposal in a brief 15-minute virtual meeting this week.\n\nThank you for your time and consideration.\n\nWarm regards,\n\nSponsorship & Corporate Relations Team\n${event}\nEmail: ${params.customCallToAction ? 'Please let us know your preferred slot' : 'sponsorship@festival.edu'}`,
  };
}
