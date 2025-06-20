import { useState, useCallback } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';

interface MCPQueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
}

interface MCPSchemaInfo {
  tables: Array<{
    name: string;
    columns: Array<{
      name: string;
      type: string;
      nullable: boolean;
      primaryKey: boolean;
    }>;
  }>;
}

interface PropertyInsights {
  similarProperties: Array<{
    id: number;
    title: string;
    price: number;
    location: string;
    similarity_score: number;
  }>;
  neighborhoodStats: {
    total_properties: number;
    avg_price: number;
    min_price: number;
    max_price: number;
    avg_area: number;
  };
}

export const useMCP = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    headers: {
      Authorization: session?.user ? `Bearer ${session.user.token}` : '',
    },
  });

  const executeQuery = useCallback(async (query: string): Promise<MCPQueryResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post('/api/mcp/query', { query });
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to execute query');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const getSchema = useCallback(async (): Promise<MCPSchemaInfo | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/api/mcp/schema');
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get schema');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const searchNatural = useCallback(async (question: string): Promise<any> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post('/api/mcp/search/natural', { question });
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Natural language search failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const getDatabaseHealth = useCallback(async (): Promise<any> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/api/mcp/health');
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get database health');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const getPropertyInsights = useCallback(async (propertyId: number): Promise<PropertyInsights | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(`/api/mcp/insights/properties/${propertyId}`);
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get property insights');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  return {
    executeQuery,
    getSchema,
    searchNatural,
    getDatabaseHealth,
    getPropertyInsights,
    loading,
    error,
  };
};