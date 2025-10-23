// src/component/organisms/SupportPanel.tsx
// Updated with backend assistant integration

import { useState, FormEvent, useEffect, useRef } from 'react';
import { chatWithAssistant, type AssistantResponse } from '../../lib/api';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Spinner from '../atoms/Spinner';
import Badge from '../atoms/Badge';

interface SupportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  citations?: string[];
  confidence?: string;
  processingTime?: number;
}

export default function SupportPanel({ isOpen, onClose }: SupportPanelProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || isLoading) return;
    
    const userQuery = query.trim();
    setQuery('');
    setIsLoading(true);
    
    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: userQuery }]);
    
    try {
      // Call backend assistant
      const response: AssistantResponse = await chatWithAssistant(userQuery);
      
      // Add assistant response
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.text,
          intent: response.intent,
          citations: response.citations,
          confidence: response.confidence,
          processingTime: response.processingTime,
        },
      ]);
    } catch (error) {
      console.error('Assistant error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I apologize, but I encountered an error processing your request. Please try again or contact support@shoplite.com.',
          intent: 'error',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-panel-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 id="support-panel-title" className="text-xl font-bold text-gray-900">
              Karobot Support
            </h2>
            <p className="text-xs text-gray-500">AI-powered assistant</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close support panel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8 space-y-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-lg font-medium">Hi! I'm Karobot</p>
              <p className="text-sm px-4">
                I can help you with orders, products, shipping policies, returns, and more. What would you like to know?
              </p>
              <div className="text-xs text-gray-400 space-y-1 px-4">
                <p>Try asking:</p>
                <p>• "What's your return policy?"</p>
                <p>• "Track order [ORDER_ID]"</p>
                <p>• "Show me laptops"</p>
              </div>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 space-y-2 ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
                
                {/* Assistant metadata */}
                {message.role === 'assistant' && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                    {message.intent && (
                      <Badge variant="info" size="sm">
                        {message.intent.replace('_', ' ')}
                      </Badge>
                    )}
                    
                    {message.confidence && (
                      <Badge
                        variant={
                          message.confidence === 'high'
                            ? 'success'
                            : message.confidence === 'medium'
                            ? 'warning'
                            : 'default'
                        }
                        size="sm"
                      >
                        {message.confidence}
                      </Badge>
                    )}
                    
                    {message.processingTime && (
                      <span className="text-xs text-gray-500">
                        {message.processingTime}ms
                      </span>
                    )}
                  </div>
                )}
                
                {/* Citations */}
                {message.citations && message.citations.length > 0 && (
                  <div className="text-xs opacity-75 pt-1">
                    <span className="font-medium">Sources:</span>{' '}
                    {message.citations.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about orders, products, policies..."
              fullWidth
              disabled={isLoading}
              aria-label="Support question input"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!query.trim() || isLoading}
              aria-label="Send question"
            >
              Send
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}