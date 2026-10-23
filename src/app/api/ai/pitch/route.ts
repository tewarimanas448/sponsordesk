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
  industry: z.string().optional(),
  websiteUrl: z.string().optional(),
  contactName: z.string().optional(),
  contactDesignation: z.string().optional(),
  fitRationale: z.string().optional(),
  eventName: z.string().min(1, 'Event name is required'),
  eventDescription: z.string().optional(),
  eventDates: z.string().optional(),
  expectedAttendance: z.number().optional(),
  audienceDescription: z.string().optional(),
  tierName: z.string().optional(),
  tierPrice: z.number().optional(),
  tierBenefits: z.array(z.string()).optional(),
  channel: z.enum(['email', 'linkedin', 'whatsapp']),
  tone: z.enum(['professional', 'friendly', 'concise', 'persuasive']),
  customCallToAction: z.string().optional(),
  forceDemo: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = PitchRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const params: PitchGenerationParams = parseResult.data;
    const apiKey = process.env.GEMINI_API_KEY;

    // Check if demo is requested or API key is absent
    if (parseResult.data.forceDemo || !apiKey || apiKey.trim() === '' || apiKey === 'your-gemini-api-key') {
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

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      // Use gemini-1.5-flash or gemini-2.0-flash
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
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

      return NextResponse.json({
        success: true,
        source: 'gemini',
        subject: parsedJson.subject || '',
        body: parsedJson.body,
        isDemoEngine: false,
      });
    } catch (aiError: any) {
      console.warn('Gemini API call failed, falling back to demo engine:', aiError?.message);
      const fallback = generateDemoPitchFallback(params);
      return NextResponse.json({
        success: true,
        source: 'demo',
        subject: fallback.subject,
        body: fallback.body,
        isDemoEngine: true,
        warning: `AI generation failed (${aiError?.message || 'Unknown error'}). Used Demo Pitch Engine fallback.`,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error processing pitch request' },
      { status: 500 }
    );
  }
}
