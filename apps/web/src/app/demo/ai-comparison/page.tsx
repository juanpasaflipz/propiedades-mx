'use client';

import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Search, Sparkles } from 'lucide-react';

export default function AIComparisonPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({
    openai: null,
    claude: null,
    optimized: null
  });

  const testAIProvider = async (provider: 'openai' | 'claude') => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
      const response = await axios.post(`${apiUrl}/api/ai/parse-search`, {
        query,
        provider
      });
      
      setResults(prev => ({
        ...prev,
        [provider]: response.data
      }));
    } catch (error) {
      console.error(`${provider} error:`, error);
      setResults(prev => ({
        ...prev,
        [provider]: { error: error.message }
      }));
    } finally {
      setLoading(false);
    }
  };

  const optimizeQuery = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
      const response = await axios.post(`${apiUrl}/api/ai/optimize-query`, {
        query
      });
      
      setResults(prev => ({
        ...prev,
        optimized: response.data
      }));
    } catch (error) {
      console.error('Optimization error:', error);
      setResults(prev => ({
        ...prev,
        optimized: { error: error.message }
      }));
    } finally {
      setLoading(false);
    }
  };

  const testAll = async () => {
    if (!query) return;
    
    // Test all providers in parallel
    await Promise.all([
      testAIProvider('openai'),
      testAIProvider('claude'),
      optimizeQuery()
    ]);
  };

  const exampleQueries = [
    'Casa en Polanco con 3 recámaras y alberca',
    'Departamento para rentar en Roma Norte menos de 20 mil',
    'Oficinas en Santa Fe arriba de 200 m2',
    'Terreno en Coyoacán para construir'
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-6xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6" />
              AI Search Comparison
            </CardTitle>
            <CardDescription>
              Compare OpenAI and Claude for property search parsing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter your search query..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && testAll()}
                />
                <Button onClick={testAll} disabled={!query || loading}>
                  <Search className="h-4 w-4 mr-2" />
                  Test All
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Try:</span>
                {exampleQueries.map((example, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="results" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="results">Parse Results</TabsTrigger>
            <TabsTrigger value="optimize">Query Optimization</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* OpenAI Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <Sparkles className="h-5 w-5" />
                    OpenAI Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results.openai ? (
                    <pre className="text-sm overflow-auto p-4 bg-muted rounded-lg">
                      {JSON.stringify(results.openai, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-muted-foreground">No results yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Claude Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Brain className="h-5 w-5" />
                    Claude Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results.claude ? (
                    <pre className="text-sm overflow-auto p-4 bg-muted rounded-lg">
                      {JSON.stringify(results.claude, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-muted-foreground">No results yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="optimize" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Query Optimization (OpenAI)</CardTitle>
                <CardDescription>
                  OpenAI can optimize search queries for better results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.optimized ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Original Query:</p>
                      <p className="p-3 bg-muted rounded-lg">{results.optimized.originalQuery}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Optimized Query:</p>
                      <p className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        {results.optimized.optimizedQuery}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No optimization results yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}