// src/lib/sse-client.ts
// Server-Sent Events client for real-time order tracking

import { config } from './config';
import type { OrderStatusEvent } from './api';

export type SSEEventHandler = (event: OrderStatusEvent) => void;
export type SSEErrorHandler = (error: Error) => void;
export type SSECloseHandler = () => void;

export interface SSEConnectionOptions {
  onEvent: SSEEventHandler;
  onError?: SSEErrorHandler;
  onClose?: SSECloseHandler;
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

/**
 * SSE Connection Manager
 * Handles connection, reconnection, and cleanup for Server-Sent Events
 */
export class SSEConnection {
  private eventSource: EventSource | null = null;
  private orderId: string;
  private options: Required<SSEConnectionOptions>;
  private reconnectAttempts = 0;
  private reconnectTimeoutId: number | null = null;
  private isManualClose = false;

  constructor(orderId: string, options: SSEConnectionOptions) {
    this.orderId = orderId;
    this.options = {
      onEvent: options.onEvent,
      onError: options.onError || (() => {}),
      onClose: options.onClose || (() => {}),
      reconnect: options.reconnect ?? true,
      reconnectDelay: options.reconnectDelay ?? 3000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 5,
    };
  }

  /**
   * Connect to SSE endpoint
   */
  connect(): void {
    if (this.eventSource) {
      console.warn('[SSE] Already connected');
      return;
    }

    this.isManualClose = false;
    const url = config.sse.orderStatus(this.orderId);

    console.log(`[SSE] Connecting to: ${url}`);

    try {
      this.eventSource = new EventSource(url);

      // Handle incoming messages
      this.eventSource.onmessage = (event) => {
        try {
          const data: OrderStatusEvent = JSON.parse(event.data);
          console.log('[SSE] Event received:', data);

          // Reset reconnect attempts on successful message
          this.reconnectAttempts = 0;

          // Call event handler
          this.options.onEvent(data);

          // If order is delivered, close connection
          if (data.status === 'DELIVERED') {
            console.log('[SSE] Order delivered, closing connection');
            this.close();
          }
        } catch (error) {
          console.error('[SSE] Failed to parse event data:', error);
          this.options.onError(new Error('Failed to parse event data'));
        }
      };

      // Handle connection opened
      this.eventSource.onopen = () => {
        console.log('[SSE] Connection opened');
        this.reconnectAttempts = 0;
      };

      // Handle errors
      this.eventSource.onerror = (error) => {
        console.error('[SSE] Connection error:', error);

        // Check if we should reconnect
        if (!this.isManualClose && this.options.reconnect) {
          this.handleReconnect();
        } else {
          this.options.onError(new Error('SSE connection error'));
        }
      };
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
      this.options.onError(
        error instanceof Error ? error : new Error('Failed to connect')
      );
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error(
        `[SSE] Max reconnect attempts (${this.options.maxReconnectAttempts}) reached`
      );
      this.options.onError(
        new Error('Failed to reconnect after multiple attempts')
      );
      this.close();
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `[SSE] Reconnecting in ${this.options.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`
    );

    // Close existing connection
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Schedule reconnect
    this.reconnectTimeoutId = window.setTimeout(() => {
      console.log('[SSE] Attempting to reconnect...');
      this.connect();
    }, this.options.reconnectDelay);
  }

  /**
   * Close connection
   */
  close(): void {
    this.isManualClose = true;

    // Clear reconnect timeout
    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    // Close EventSource
    if (this.eventSource) {
      console.log('[SSE] Closing connection');
      this.eventSource.close();
      this.eventSource = null;
    }

    // Call close handler
    this.options.onClose();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return (
      this.eventSource !== null &&
      this.eventSource.readyState === EventSource.OPEN
    );
  }

  /**
   * Get connection state
   */
  getState(): 'CONNECTING' | 'OPEN' | 'CLOSED' {
    if (!this.eventSource) return 'CLOSED';

    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING:
        return 'CONNECTING';
      case EventSource.OPEN:
        return 'OPEN';
      case EventSource.CLOSED:
        return 'CLOSED';
      default:
        return 'CLOSED';
    }
  }
}

/**
 * Helper function to create and connect to SSE
 */
export function connectToOrderStream(
  orderId: string,
  options: SSEConnectionOptions
): SSEConnection {
  const connection = new SSEConnection(orderId, options);
  connection.connect();
  return connection;
}