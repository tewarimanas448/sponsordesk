import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'fs';
import { POST } from '@/app/api/ai/pitch/route';

// Safely load GEMINI_API_KEY from .env.local if not already in process.env
if (!process.env.GEMINI_API_KEY && fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('GEMINI_API_KEY=')) {
      process.env.GEMINI_API_KEY = trimmed.substring('GEMINI_API_KEY='.length).trim();
    }
  }
}

describe('AI Pitch API Route (POST /api/ai/pitch)', () => {
  it('successfully handles null values for optional prospect and workspace fields', async () => {
    const payload = {
      companyName: 'Acme Corp',
      industry: null,
      websiteUrl: null,
      contactName: null,
      contactDesignation: null,
      fitRationale: null,
      eventName: 'Vivacity 2026',
      eventDescription: null,
      eventDates: null,
      expectedAttendance: null,
      audienceDescription: null,
      tierName: null,
      tierPrice: null,
      tierBenefits: null,
      channel: 'email',
      tone: 'persuasive',
      customCallToAction: null,
      forceDemo: true,
    };

    const req = new NextRequest('http://localhost:3000/api/ai/pitch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.source).toBe('demo');
    expect(data.body).toContain('Acme Corp');
    expect(data.body).toContain('Vivacity 2026');
  });

  it('coerces string numbers for attendance and tierPrice', async () => {
    const payload = {
      companyName: 'TechCorp India',
      eventName: 'Vivacity 2026',
      expectedAttendance: '15000',
      tierPrice: '500000',
      channel: 'linkedin',
      tone: 'professional',
      forceDemo: true,
    };

    const req = new NextRequest('http://localhost:3000/api/ai/pitch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.body).toContain('15,000');
    expect(data.body).toContain('5,00,000');
  });

  it('returns HTTP 400 with descriptive error when companyName is missing', async () => {
    const payload = {
      eventName: 'Vivacity 2026',
      channel: 'email',
      tone: 'persuasive',
    };

    const req = new NextRequest('http://localhost:3000/api/ai/pitch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain('companyName');
    expect(data.code).toBe('VALIDATION_ERROR');
    expect(data.details).toBeDefined();
  });

  it('returns HTTP 400 with descriptive error when eventName is empty', async () => {
    const payload = {
      companyName: 'Red Bull',
      eventName: '',
      channel: 'email',
      tone: 'persuasive',
    };

    const req = new NextRequest('http://localhost:3000/api/ai/pitch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain('eventName');
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns HTTP 400 when channel is not a valid enum value', async () => {
    const payload = {
      companyName: 'Red Bull',
      eventName: 'Vivacity 2026',
      channel: 'telegram',
      tone: 'persuasive',
    };

    const req = new NextRequest('http://localhost:3000/api/ai/pitch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain('channel');
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns HTTP 502 with error details when Gemini AI call fails, without mock pitch content', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    try {
      // Use an invalid key to trigger an authentic Gemini API error
      process.env.GEMINI_API_KEY = 'invalid-test-gemini-key-for-error-handling';

      const payload = {
        companyName: 'Red Bull',
        eventName: 'Vivacity 2026',
        channel: 'email',
        tone: 'persuasive',
        forceDemo: false,
      };

      const req = new NextRequest('http://localhost:3000/api/ai/pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await POST(req);
      expect(res.status).toBe(502);

      const data = await res.json();
      expect(data.error).toContain('Gemini AI generation failed');
      expect(data.code).toBe('AI_GENERATION_FAILED');
      // Crucial: Must NOT return mock pitch body or claim success
      expect(data.body).toBeUndefined();
      expect(data.success).toBeUndefined();
    } finally {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it('successfully generates live AI pitch when valid Gemini API key is configured', async () => {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key') {
      console.log('Skipping live Gemini test: no GEMINI_API_KEY configured');
      return;
    }

    const payload = {
      companyName: 'Boat Lifestyle',
      industry: 'Audio & Wearables',
      eventName: 'Vivacity 2026',
      expectedAttendance: 20000,
      tierName: 'Associate Sponsor',
      tierPrice: 350000,
      tierBenefits: ['Campus booth', 'Flyer inserts'],
      channel: 'email',
      tone: 'persuasive',
      forceDemo: false,
    };

    const req = new NextRequest('http://localhost:3000/api/ai/pitch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.source).toBe('gemini');
    expect(data.isDemoEngine).toBe(false);
    expect(data.subject).toBeTruthy();
    expect(data.body).toBeTruthy();
  }, 20000);
});
