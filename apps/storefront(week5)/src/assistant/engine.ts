import groundTruth from './ground-truth.json';
import { getOrderStatus } from '../lib/api';
import { maskOrderId } from '../lib/format';

interface GroundTruthItem {
  qid: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

interface SupportResponse {
  answer: string;
  citation?: string;
  orderId?: string;
  orderStatus?: any;
  confidence: 'high' | 'medium' | 'low';
}

// Extract order ID from query (format: [A-Z0-9]{10,})
function extractOrderId(query: string): string | null {
  const match = query.match(/\b[A-Z0-9]{10,}\b/);
  return match ? match[0] : null;
}

// Calculate keyword match score
function calculateScore(query: string, item: GroundTruthItem): number {
  const queryLower = query.toLowerCase();
  const queryTokens = queryLower.split(/\s+/).filter(t => t.length > 2);
  
  // Require at least one meaningful query token
  if (queryTokens.length === 0) {
    return 0;
  }
  
  let score = 0;
  let keywordMatches = 0;
  
  // Check keyword matches (weighted higher)
  for (const keyword of item.keywords) {
    const keywordLower = keyword.toLowerCase();
    if (queryLower.includes(keywordLower)) {
      score += 5;
      keywordMatches++;
    }
  }
  
  // If no direct keyword matches, check question overlap
  if (keywordMatches === 0) {
    const questionTokens = item.question.toLowerCase().split(/\s+/);
    let tokenMatches = 0;
    
    for (const token of queryTokens) {
      if (questionTokens.some(qt => qt.includes(token) || token.includes(qt))) {
        tokenMatches++;
        score += 1;
      }
    }
    
    // If very few token matches, lower the score further
    if (tokenMatches === 0) {
      score = 0;
    }
  }
  
  // Boost score for category match
  if (queryLower.includes(item.category.toLowerCase())) {
    score += 2;
  }
  
  return score;
}

// Find best matching Q&A
function findBestMatch(query: string): { item: GroundTruthItem; score: number } | null {
  let bestMatch: { item: GroundTruthItem; score: number } | null = null;
  
  for (const item of groundTruth as GroundTruthItem[]) {
    const score = calculateScore(query, item);
    
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { item, score };
    }
  }
  
  // Confidence threshold - require at least score of 5
  // Keyword match alone: 5 points
  // Token match alone: would be lower
  if (bestMatch && bestMatch.score >= 5) {
    return bestMatch;
  }
  
  return null;
}

// Main query processing function
export async function processQuery(query: string): Promise<SupportResponse> {
  // Check for empty query
  if (!query.trim()) {
    return {
      answer: 'Please enter a question and I\'ll do my best to help you.',
      confidence: 'low',
    };
  }
  
  // Extract order ID if present
  const orderId = extractOrderId(query);
  let orderStatus = null;
  
  if (orderId) {
    orderStatus = getOrderStatus(orderId);
  }
  
  // Find best matching Q&A
  const match = findBestMatch(query);
  
  if (!match) {
    return {
      answer: 'I apologize, but I can only answer questions about our policies, shipping, returns, seller information, and order tracking. Please rephrase your question or contact our support team for additional assistance.',
      confidence: 'low',
    };
  }
  
  const { item, score } = match;
  const confidence: 'high' | 'medium' | 'low' = score >= 10 ? 'high' : score >= 7 ? 'medium' : 'low';
  
  // Build response
  let answer = item.answer;
  
  // Add order status if available
  if (orderStatus) {
    const maskedId = maskOrderId(orderId!);
    answer = `**Order Status for ${maskedId}:**\n\n`;
    answer += `Status: ${orderStatus.status}\n`;
    answer += `Order Date: ${orderStatus.date}\n`;
    
    if (orderStatus.carrier) {
      answer += `Carrier: ${orderStatus.carrier}\n`;
      answer += `Tracking: ${orderStatus.trackingNumber}\n`;
    }
    
    if (orderStatus.eta) {
      answer += `Estimated Delivery: ${orderStatus.eta}\n`;
    }
    
    answer += `\n---\n\n${item.answer}`;
  }
  
  return {
    answer,
    citation: item.qid,
    orderId: orderId || undefined,
    orderStatus: orderStatus || undefined,
    confidence,
  };
}