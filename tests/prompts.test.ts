import { describe, it, expect } from 'vitest';
import {
  constructUserPrompt,
  constructSystemPrompt,
  generateDemoPitchFallback,
  PitchGenerationParams,
} from '@/lib/ai/prompts';

describe('AI Pitch Prompts & Demo Generator', () => {
  const baseParams: PitchGenerationParams = {
    companyName: 'ZenithPay India',
    industry: 'Fintech',
    contactName: 'Vikram Sethi',
    eventName: 'Vivacity 2026',
    expectedAttendance: 25000,
    tierName: 'Gold Sponsor',
    tierPrice: 750000,
    tierBenefits: ['Secondary stage naming rights', '15x15 ft stall'],
    channel: 'email',
    tone: 'persuasive',
  };

  it('constructs system prompt containing strict anti-fabrication instructions', () => {
    const sys = constructSystemPrompt();
    expect(sys).toContain('CRITICAL ACCURACY GUIDELINES');
    expect(sys).toContain('NEVER fabricate company partnerships');
    expect(sys).toContain('Output your response as a valid JSON object');
  });

  it('constructs user prompt containing exact provided company and tier numbers', () => {
    const prompt = constructUserPrompt(baseParams);
    expect(prompt).toContain('ZenithPay India');
    expect(prompt).toContain('Vivacity 2026');
    expect(prompt).toContain('Gold Sponsor');
    expect(prompt).toContain('7,50,000');
    expect(prompt).toContain('Secondary stage naming rights');
  });

  it('generates email demo pitch with subject line and structured body', () => {
    const result = generateDemoPitchFallback(baseParams);
    expect(result.subject).toContain('Partnership Proposal');
    expect(result.subject).toContain('ZenithPay India');
    expect(result.body).toContain('Dear Vikram Sethi');
    expect(result.body).toContain('Vivacity 2026');
  });

  it('generates whatsapp demo pitch without subject and with conversational tone', () => {
    const result = generateDemoPitchFallback({
      ...baseParams,
      channel: 'whatsapp',
    });
    expect(result.subject).toBe('');
    expect(result.body).toContain('Hi Vikram Sethi! 👋');
    expect(result.body).toContain('🚀');
  });

  it('generates linkedin demo pitch concise under professional tone', () => {
    const result = generateDemoPitchFallback({
      ...baseParams,
      channel: 'linkedin',
      tone: 'professional',
    });
    expect(result.subject).toBe('');
    expect(result.body).toContain('Hi Vikram Sethi');
    expect(result.body).toContain('sponsorship committee of Vivacity 2026');
  });
});
