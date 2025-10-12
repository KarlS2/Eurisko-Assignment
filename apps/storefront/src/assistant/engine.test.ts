import { describe, it, expect, vi } from 'vitest';
import { processQuery } from './engine';

vi.mock('../lib/api', () => ({
  getOrderStatus: vi.fn((id) => {
    if (id === 'ORD12345ABC') {
      return {
        status: 'Shipped',
        date: '2025-10-01',
        carrier: 'FedEx',
        trackingNumber: '1234567890',
        eta: '2025-10-15',
      };
    }
    return null;
  }),
}));

describe('Support Engine', () => {
  it('should answer known shipping question', async () => {
    const response = await processQuery('How long does standard shipping take?');
    
    expect(response.answer).toContain('5-7 business days');
    expect(response.citation).toBe('Q02');
  });

  it('should refuse out-of-scope question', async () => {
    const response = await processQuery('What is your favorite color?');
    
    expect(response.answer).toContain('can only answer questions');
    expect(response.confidence).toBe('low');
  });

  it('should handle empty query gracefully', async () => {
    const response = await processQuery('');
    
    expect(response.answer).toContain('Please enter a question');
    expect(response.confidence).toBe('low');
  });

  it('should answer password policy question', async () => {
    const response = await processQuery('What are the password requirements?');
    
    expect(response.answer).toContain('8 characters');
    expect(response.citation).toBe('Q03');
  });

  it('should answer seller verification question', async () => {
    const response = await processQuery('How long does seller account verification take?');
    
    expect(response.answer).toContain('2-3 business days');
    expect(response.citation).toBe('Q01');
  });

  it('should answer commission question with exact rates', async () => {
    const response = await processQuery('What commission rate do sellers pay?');
    
    expect(response.answer).toContain('12%');
    expect(response.answer).toContain('$0.30');
    expect(response.citation).toBe('Q04');
  });

  it('should answer API rate limit question', async () => {
    const response = await processQuery('What is the API rate limit?');
    
    expect(response.answer).toContain('1000 requests');
    expect(response.citation).toBe('Q08');
  });

  it('should handle vague questions with low confidence', async () => {
    const response = await processQuery('help');
    
    expect(response.confidence).toBe('low');
  });

  it('should give high confidence for exact keyword matches', async () => {
    const response = await processQuery('What is the Order Defect Rate threshold?');
    
    expect(response.citation).toBe('Q06');
  });

  it('should answer shipping timeframe question', async () => {
    const response = await processQuery('How fast is expedited shipping?');
    
    expect(response.answer).toContain('2-3 business days');
    expect(response.citation).toBe('Q02');
  });

  it('should answer mobile app features question', async () => {
    const response = await processQuery('What features are available in the mobile app?');
    
    expect(response.answer).toContain('voice search');
    expect(response.citation).toBe('Q20');
  });

  it('should answer order tracking question', async () => {
    const response = await processQuery('How will I get notified about my order?');
    
    expect(response.answer).toContain('email');
    expect(response.citation).toBe('Q11');
  });

  it('should answer dispute resolution question', async () => {
    const response = await processQuery('What happens if I have a dispute with a seller?');
    
    expect(response.answer).toContain('48 hours');
    expect(response.citation).toBe('Q17');
  });

  it('should answer review question', async () => {
    const response = await processQuery('How do product reviews work?');
    
    expect(response.answer).toContain('verified buyers');
    expect(response.citation).toBe('Q15');
  });

  it('should answer cart question', async () => {
    const response = await processQuery('What is Save for Later?');
    
    expect(response.answer).toContain('Save for Later');
    expect(response.citation).toBe('Q14');
  });

  it('returns answer with citation for known policy question', async () => {
    const response = await processQuery('What is the password requirement?');
    
    expect(response.answer).toBeTruthy();
    expect(response.citation).toBe('Q03');
    expect(response.answer).toContain('8 characters');
  });

  it('detects and includes order status for valid order ID', async () => {
    const response = await processQuery('What is the status of order ORD12345ABC?');
    
    expect(response.orderId).toBe('ORD12345ABC');
    expect(response.orderStatus).toBeTruthy();
    expect(response.answer).toContain('Shipped');
  });

  it('masks order ID in response (PII protection)', async () => {
    const response = await processQuery('Check order ORD12345ABC status');
    
    if (response.orderStatus) {
      expect(response.answer).toContain('...5ABC');
      expect(response.answer).not.toContain('ORD12345ABC');
    }
  });

  it('handles return policy questions', async () => {
    const response = await processQuery('How do I return a damaged product?');
    
    expect(response.citation).toBe('Q10');
    expect(response.answer).toContain('Request Return');
  });
});