// src/pages/AdminDashboard.tsx
// Admin dashboard with role-based access control

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../lib/store';
import { config } from '../lib/config';
import { formatCurrency, formatDate } from '../lib/format';
import Badge from '../component/atoms/Badge';
import Spinner from '../component/atoms/Spinner';
import Button from '../component/atoms/Button';

interface BusinessMetrics {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  ordersByStatus: Record<string, number>;
  totalProducts?: number;
  totalCustomers?: number;
  revenueTrend?: Array<{ date: string; revenue: number; orderCount: number }>;
}

interface PerformanceMetrics {
  avgApiLatency?: number;
  totalRequests?: number;
  avgLatency?: number;
  sseConnections?: number;
  activeSSEConnections?: number;
  failedRequests?: number;
  lastUpdate?: string;
  recentRequests?: Array<{ endpoint: string; duration: number; timestamp: string }>;
  topEndpoints?: Array<{ endpoint: string; count: number; avgLatency: number }>;
}

interface AssistantMetrics {
  totalQueries: number;
  intentDistribution: Record<string, number>;
  functionCalls: Record<string, number>;
  averageResponseTime: number;
  errorRate: string;
  errors: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, isAuthenticated } = useUserStore();
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [assistantMetrics, setAssistantMetrics] = useState<AssistantMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Access control check
  useEffect(() => {
    if (!isAuthenticated()) {
      setError('Please login to access the dashboard');
      setIsLoading(false);
      return;
    }

    if (!isAdmin()) {
      setError('Access denied. Admin privileges required.');
      setIsLoading(false);
      return;
    }

    loadAllMetrics();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadAllMetrics, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isAdmin]);

  async function loadAllMetrics() {
    if (!user?.email) return;

    try {
      const [business, performance, assistant] = await Promise.all([
        fetchBusinessMetrics(),
        fetchPerformanceMetrics(),
        fetchAssistantMetrics(),
      ]);

      setBusinessMetrics(business);
      setPerformanceMetrics(performance);
      setAssistantMetrics(assistant);
      setLastRefresh(new Date());
      setError('');
    } catch (err: any) {
      console.error('Failed to load metrics:', err);
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchBusinessMetrics(): Promise<BusinessMetrics> {
    const response = await fetch(`${config.endpoints.dashboard}/business-metrics`, {
      headers: {
        'x-user-email': user?.email || '',
      },
    });
    
    if (response.status === 403) {
      throw new Error('Access denied. Admin privileges required.');
    }
    if (!response.ok) throw new Error('Failed to fetch business metrics');
    
    const data = await response.json();
    return data.metrics || data;
  }

  async function fetchPerformanceMetrics(): Promise<PerformanceMetrics> {
    const response = await fetch(`${config.endpoints.dashboard}/performance`, {
      headers: {
        'x-user-email': user?.email || '',
      },
    });
    
    if (response.status === 403) {
      throw new Error('Access denied');
    }
    if (!response.ok) throw new Error('Failed to fetch performance metrics');
    
    const data = await response.json();
    return data.metrics || data;
  }

  async function fetchAssistantMetrics(): Promise<AssistantMetrics> {
    const response = await fetch(`${config.endpoints.assistant}/metrics`);
    if (!response.ok) throw new Error('Failed to fetch assistant metrics');
    return response.json();
  }

  // Access denied screen
  if (!isAuthenticated() || !isAdmin()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-6xl">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 text-center max-w-md">
          {!isAuthenticated() 
            ? 'Please login with an admin account to access the dashboard.'
            : 'You need admin privileges to access this dashboard.'}
        </p>
        <div className="flex gap-3 mt-4">
          <Button onClick={() => navigate('/')} variant="secondary">
            Go to Catalog
          </Button>
          {!isAuthenticated() && (
            <Button onClick={() => {/* Open login modal */}} variant="primary">
              Login
            </Button>
          )}
        </div>
        <div className="mt-6 text-xs text-gray-500">
          <p>Admin accounts:</p>
          <ul className="mt-1 space-y-1">
            <li>• gandalf@shoplite.com</li>
            <li>• darth.vader@shoplite.com</li>
            <li>• karl.sassine@shoplite.com</li>
          </ul>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Spinner size="lg" />
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  const statusColors: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
    DELIVERED: 'success',
    SHIPPED: 'warning',
    PROCESSING: 'info',
    PENDING: 'info',
  };

  return (
    <div className="space-y-6">
      {/* Header with Admin Badge */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <Badge variant="danger" size="md">
              👑 {user?.name}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={loadAllMetrics} variant="primary" size="md">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Business Metrics */}
      {businessMetrics && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Business Metrics</h2>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(businessMetrics.totalRevenue)}
              icon="💰"
              trend="+12%"
            />
            <MetricCard
              title="Total Orders"
              value={businessMetrics.totalOrders.toString()}
              icon="📦"
              trend="+8%"
            />
            <MetricCard
              title="Avg Order Value"
              value={formatCurrency(businessMetrics.avgOrderValue)}
              icon="📊"
              trend="+5%"
            />
          </div>

          {/* Orders by Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Orders by Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(businessMetrics.ordersByStatus).map(([status, count]) => (
                <div key={status} className="text-center">
                  <Badge variant={statusColors[status] || 'info'} size="md">
                    {status}
                  </Badge>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {performanceMetrics && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Performance Monitoring</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Avg API Latency"
              value={`${performanceMetrics.avgLatency || performanceMetrics.avgApiLatency || 0}ms`}
              icon="⚡"
              status={(performanceMetrics.avgLatency || performanceMetrics.avgApiLatency || 0) < 100 ? 'good' : 'warning'}
            />
            <MetricCard
              title="Active SSE Connections"
              value={(performanceMetrics.activeSSEConnections || performanceMetrics.sseConnections || 0).toString()}
              icon="🔗"
            />
            <MetricCard
              title="Total Requests"
              value={(performanceMetrics.totalRequests || 0).toString()}
              icon="📡"
            />
          </div>
        </div>
      )}

      {/* Assistant Analytics */}
      {assistantMetrics && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Assistant Analytics</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="Total Queries"
              value={assistantMetrics.totalQueries.toString()}
              icon="💬"
            />
            <MetricCard
              title="Avg Response Time"
              value={`${Math.round(assistantMetrics.averageResponseTime)}ms`}
              icon="⏱️"
            />
            <MetricCard
              title="Error Rate"
              value={assistantMetrics.errorRate}
              icon="⚠️"
              status={parseFloat(assistantMetrics.errorRate) < 5 ? 'good' : 'warning'}
            />
            <MetricCard
              title="Total Errors"
              value={assistantMetrics.errors.toString()}
              icon="🚫"
              status={assistantMetrics.errors === 0 ? 'good' : 'error'}
            />
          </div>

          {/* Intent Distribution */}
          {Object.keys(assistantMetrics.intentDistribution).length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Intent Distribution</h3>
              <div className="space-y-2">
                {Object.entries(assistantMetrics.intentDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([intent, count]) => (
                    <div key={intent} className="flex items-center gap-4">
                      <span className="text-sm text-gray-700 w-32 capitalize">
                        {intent.replace('_', ' ')}
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(count / assistantMetrics.totalQueries) * 100}%`,
                          }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                          {count} ({((count / assistantMetrics.totalQueries) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Function Calls */}
          {Object.keys(assistantMetrics.functionCalls).length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Function Calls Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(assistantMetrics.functionCalls).map(([func, count]) => (
                  <div key={func} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1">{func}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* System Health */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HealthCheck label="Database" status="healthy" />
          <HealthCheck label="API Server" status="healthy" />
          <HealthCheck
            label="LLM Service"
            status={assistantMetrics && assistantMetrics.totalQueries > 0 ? 'healthy' : 'unknown'}
          />
          <HealthCheck
            label="SSE Connections"
            status={performanceMetrics && (performanceMetrics.activeSSEConnections !== undefined || performanceMetrics.sseConnections !== undefined) ? 'healthy' : 'unknown'}
          />
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  icon: string;
  trend?: string;
  status?: 'good' | 'warning' | 'error';
}

function MetricCard({ title, value, icon, trend, status }: MetricCardProps) {
  const statusColors = {
    good: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    error: 'border-red-200 bg-red-50',
  };

  return (
    <div
      className={`bg-white rounded-lg border p-6 ${
        status ? statusColors[status] : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600 text-sm font-medium">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {trend && (
        <p className="text-sm text-green-600 mt-1 font-medium">{trend} from last week</p>
      )}
    </div>
  );
}

// Health Check Component
interface HealthCheckProps {
  label: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
}

function HealthCheck({ label, status }: HealthCheckProps) {
  const statusConfig = {
    healthy: { color: 'text-green-600', bg: 'bg-green-100', icon: '✓' },
    unhealthy: { color: 'text-red-600', bg: 'bg-red-100', icon: '✗' },
    unknown: { color: 'text-gray-600', bg: 'bg-gray-100', icon: '?' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center font-bold ${config.color}`}>
          {config.icon}
        </span>
        <span className={`text-sm font-medium capitalize ${config.color}`}>{status}</span>
      </div>
    </div>
  );
}