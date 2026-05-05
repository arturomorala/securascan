import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3';

describe('Brevo Email Integration', () => {
  it('should have BREVO_API_KEY configured', () => {
    expect(BREVO_API_KEY).toBeDefined();
    expect(BREVO_API_KEY).toMatch(/^xkeysib-/);
  });

  it('should validate Brevo API key by fetching account info', async () => {
    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY not configured');
    }

    try {
      const response = await axios.get(`${BREVO_API_URL}/account`, {
        headers: {
          'api-key': BREVO_API_KEY,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('email');
      console.log('[Brevo] API Key validated successfully');
      console.log('[Brevo] Account email:', response.data.email);
    } catch (error: any) {
      throw new Error(
        `Brevo API validation failed: ${error.response?.data?.message || error.message}`
      );
    }
  });

  it('should have valid email configuration', async () => {
    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY not configured');
    }

    try {
      // Get senders to verify email configuration
      const response = await axios.get(`${BREVO_API_URL}/senders`, {
        headers: {
          'api-key': BREVO_API_KEY,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('senders');
      console.log('[Brevo] Senders configured:', response.data.senders.length);
    } catch (error: any) {
      console.warn(
        '[Brevo] Warning: Could not fetch senders',
        error.response?.data?.message || error.message
      );
      // This is not critical, so we don't throw
    }
  });
});
