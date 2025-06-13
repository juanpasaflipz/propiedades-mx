'use client';

import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface ApiLog {
  id: number;
  api_provider: string;
  endpoint: string;
  method: string;
  response_status: number;
  response_time_ms: number;
  created_at: string;
  error_message?: string;
}

interface ApiStats {
  api_provider: string;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  avg_response_time: number;
  max_response_time: number;
  min_response_time: number;
}

interface ApiProvider {
  id: number;
  name: string;
  enabled: boolean;
  priority: number;
  rateLimit: number;
}

export default function AdminDashboard() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [stats, setStats] = useState<ApiStats[]>([]);
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'stats' | 'providers'>('stats');
  const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab, timeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'logs') {
        const response = await fetch('http://localhost:3003/api/admin/api-logs?limit=50');
        const data = await response.json();
        setLogs(data.logs || []);
      } else if (activeTab === 'stats') {
        const response = await fetch(`http://localhost:3003/api/admin/api-stats?timeRange=${timeRange}`);
        const data = await response.json();
        setStats(data.stats || []);
      } else if (activeTab === 'providers') {
        const response = await fetch('http://localhost:3003/api/admin/api-providers');
        const data = await response.json();
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProvider = async (id: number, updates: Partial<ApiProvider>) => {
    try {
      const response = await fetch(`http://localhost:3003/api/admin/api-providers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating provider:', error);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-yellow-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <ThemeToggle />
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-2 px-4 ${
              activeTab === 'stats'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600'
            }`}
          >
            API Statistics
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2 px-4 ${
              activeTab === 'logs'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600'
            }`}
          >
            API Logs
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`pb-2 px-4 ${
              activeTab === 'providers'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600'
            }`}
          >
            API Providers
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Statistics Tab */}
            {activeTab === 'stats' && (
              <div>
                <div className="mb-4">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as 'hour' | 'day' | 'week' | 'month')}
                    className="px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                  >
                    <option value="hour">Last Hour</option>
                    <option value="day">Last 24 Hours</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stats.map((stat) => (
                    <div
                      key={stat.api_provider}
                      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
                    >
                      <h3 className="text-xl font-semibold mb-4">{stat.api_provider}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Calls:</span>
                          <span className="font-medium">{stat.total_calls}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Success Rate:</span>
                          <span className="font-medium">
                            {stat.total_calls > 0
                              ? ((stat.successful_calls / stat.total_calls) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Response Time:</span>
                          <span className="font-medium">
                            {Math.round(stat.avg_response_time)}ms
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Failed Calls:</span>
                          <span className="font-medium text-red-600">{stat.failed_calls}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Endpoint
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Response Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{log.api_provider}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{log.endpoint}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{log.method}</td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${getStatusColor(log.response_status)}`}>
                          {log.response_status}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{log.response_time_ms}ms</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Providers Tab */}
            {activeTab === 'providers' && (
              <div className="space-y-4">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{provider.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Priority: {provider.priority} | Rate Limit: {provider.rateLimit} req/min
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={provider.enabled}
                            onChange={(e) =>
                              updateProvider(provider.id, { enabled: e.target.checked })
                            }
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">Enabled</span>
                        </label>
                        <input
                          type="number"
                          value={provider.priority}
                          onChange={(e) =>
                            updateProvider(provider.id, { priority: parseInt(e.target.value) })
                          }
                          className="w-16 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                          min="1"
                          max="10"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}