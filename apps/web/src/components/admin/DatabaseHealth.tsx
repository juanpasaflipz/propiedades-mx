import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Users, 
  Home, 
  Activity,
  HardDrive,
  BarChart3
} from 'lucide-react';
import { useMCP } from '@/hooks/useMCP';

export const DatabaseHealth: React.FC = () => {
  const { getDatabaseHealth, loading, error } = useMCP();
  const [healthData, setHealthData] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchHealth = async () => {
    const data = await getDatabaseHealth();
    if (data) {
      setHealthData(data);
    }
  };

  useEffect(() => {
    fetchHealth();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const formatBytes = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const getHealthStatus = (metrics: any): 'healthy' | 'warning' | 'critical' => {
    if (!metrics) return 'healthy';
    
    const { total_properties, active_properties, database_size_bytes } = metrics;
    const activeRatio = active_properties / total_properties;
    const dbSizeGB = database_size_bytes / (1024 * 1024 * 1024);
    
    if (activeRatio < 0.5 || dbSizeGB > 50) return 'warning';
    if (activeRatio < 0.3 || dbSizeGB > 100) return 'critical';
    
    return 'healthy';
  };

  if (loading && !healthData) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load database health metrics: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!healthData) return null;

  const { metrics, timestamp } = healthData;
  const status = getHealthStatus(metrics);
  const statusColors = {
    healthy: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    critical: 'text-red-600 bg-red-100',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Database Health</h2>
          <p className="text-muted-foreground">
            Last updated: {new Date(timestamp).toLocaleString()}
          </p>
        </div>
        <Badge className={statusColors[status]}>
          {status.toUpperCase()}
        </Badge>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Properties
            </CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.total_properties.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.active_properties.toLocaleString()} active
            </p>
            <Progress 
              value={(metrics.active_properties / metrics.total_properties) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.total_users.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Database Size
            </CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(metrics.database_size_bytes)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Embedding Quality
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.avg_embedding_similarity * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average similarity score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Rate
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((metrics.active_properties / metrics.total_properties) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Properties currently listed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              System Status
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>PostgreSQL</span>
                <Badge variant="outline" className="text-green-600">Connected</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>MCP Server</span>
                <Badge variant="outline" className="text-green-600">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>pgvector</span>
                <Badge variant="outline" className="text-green-600">Enabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};