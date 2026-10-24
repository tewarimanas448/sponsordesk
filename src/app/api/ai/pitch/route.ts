import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  constructSystemPrompt,
  constructUserPrompt,
  generateDemoPitchFallback,
  PitchGenerationParams,
} from '@/lib/ai/prompts';

const PitchRequestSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  industry: z.string().nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactDesignation: z.string().nullable().optional(),
  fitRationale: z.string().nullable().optional(),
  eventName: z.string().min(1, 'Event name is required'),
  eventDescription: z.string().nullable().optional(),
  eventDates: z.string().nullable().optional(),
  expectedAttendance: z.coerce.number().nullable().optional(),
  audienceDescription: z.string().nullable().optional(),
  tierName: z.string().nullable().optional(),
  tierPrice: z.coerce.number().nullable().optional(),
  tierBenefits: z.array(z.string()).nullable().optional(),
  channel: z.enum(['email', 'linkedin', 'whatsapp']),
  tone: z.enum(['professional', 'friendly', 'concise', 'persuasive']),
  customCallToAction: z.string().nullable().optional(),
  forceDemo: z.boolean().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = PitchRequestSchema.safeParse(body);

    if (!parseResult.success) {
      const fieldIssues = parseResult.error.issues
        .map((issue) => `${issue.path.join('.') || 'parameter'}: ${issue.message}`)
        .join(', ');
      console.warn(`[SponsorDesk AI] HTTP 400 - Validation failed: ${fieldIssues}`);
      return NextResponse.json(
        {
          error: `Invalid request parameters: ${fieldIssues}`,
          code: 'VALIDATION_ERROR',
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const raw = parseResult.data;
    const params: PitchGenerationParams = {
      companyName: raw.companyName.trim(),
      industry: raw.industry || undefined,
      websiteUrl: raw.websiteUrl || undefined,
      contactName: raw.contactName || undefined,
      contactDesignation: raw.contactDesignation || undefined,
      fitRationale: raw.fitRationale || undefined,
      eventName: raw.eventName.trim(),
      eventDescription: raw.eventDescription || undefined,
      eventDates: raw.eventDates || undefined,
      expectedAttendance:
        raw.expectedAttendance !== null && raw.expectedAttendance !== undefined
          ? raw.expectedAttendance
          : undefined,
      audienceDescription: raw.audienceDescription || undefined,
      tierName: raw.tierName || undefined,
      tierPrice:
        raw.tierPrice !== null && raw.tierPrice !== undefined
          ? raw.tierPrice
          : undefined,
      tierBenefits: raw.tierBenefits || undefined,
      channel: raw.channel,
      tone: raw.tone,
      customCallToAction: raw.customCallToAction || undefined,
    };
    const apiKey = process.env.GEMINI_API_KEY;

    // Check if demo is requested or API key is absent
    if (raw.forceDemo || !apiKey || apiKey.trim() === '' || apiKey === 'your-gemini-api-key') {
      const fallback = generateDemoPitchFallback(params);
      return NextResponse.json({
        success: true,
        source: 'demo',
        subject: fallback.subject,
        body: fallback.body,
        isDemoEngine: true,
        note: !apiKey || apiKey === 'your-gemini-api-key'
          ? 'Generated via SponsorDesk Demo Pitch Engine. To use live Google Gemini AI, configure GEMINI_API_KEY in your environment.'
          : undefined,
      });
    }

    const candidateModels = Array.from(
      new Set(
        [
          process.env.GEMINI_MODEL,
          'gemini-3.5-flash',
          'gemini-3.5-flash-lite',
          'gemini-3-flash-preview',
        ].filter((m): m is string => Boolean(m && m.trim()))
      )
    );

    const genAI = new GoogleGenerativeAI(apiKey);
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
          systemInstruction: constructSystemPrompt(),
        });

        const userPrompt = constructUserPrompt(params);
        const result = await model.generateContent(userPrompt);
        const responseText = result.response.text();

        let parsedJson: { subject?: string; body: string };
        try {
          parsedJson = JSON.parse(responseText);
        } catch {
          // Fallback cleanup if response has markdown fences
          const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
          parsedJson = JSON.parse(cleaned);
        }

        if (!parsedJson || typeof parsedJson.body !== 'string') {
          throw new Error('Gemini response did not contain a valid pitch body');
        }

        console.info(
          `[SponsorDesk AI] Successfully generated pitch using Gemini model "${modelName}" (${parsedJson.body.length} chars)`
        );

        return NextResponse.json({
          success: true,
          source: 'gemini',
          subject: parsedJson.subject || '',
          body: parsedJson.body,
          isDemoEngine: false,
        });
      } catch (err: any) {
        lastError = err;
        const status = err?.status || 502;
        const msg = err?.message || 'Error generating content';
        console.warn(
          `[SponsorDesk AI] Model "${modelName}" failed (HTTP ${status}): ${msg}. Trying fallback if available.`
        );
      }
    }

    const finalStatus = lastError?.status || 502;
    const finalMessage = lastError?.message || 'Failed to generate pitch with Gemini AI';
    console.error(`[SponsorDesk AI] HTTP ${finalStatus} - All candidate models failed: ${finalMessage}`);

    return NextResponse.json(
      {
        error: `Gemini AI generation failed: ${finalMessage}`,
        code: 'AI_GENERATION_FAILED',
      },
      { status: 502 }
    );
  } catch (error: any) {
    const errorMsg = error?.message || 'Internal server error processing pitch request';
    console.error(`[SponsorDesk AI] HTTP 500 - Internal Server Error: ${errorMsg}`);
    return NextResponse.json(
      { error: errorMsg, code: 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}
