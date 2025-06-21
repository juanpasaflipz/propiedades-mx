import { z } from 'zod';
import logger from '../utils/logger';
import { config } from '../config';

export interface MCPQueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
}

export interface MCPSchemaInfo {
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

class MCPService {
  private client: any = null;
  private connected = false;
  private Client: any = null;
  private StdioClientTransport: any = null;

  async connect(): Promise<void> {
    if (this.connected) return;
    
    // Dynamic import for ES modules
    if (!this.Client || !this.StdioClientTransport) {
      const clientModule = await import('@modelcontextprotocol/sdk/client/index.js');
      const stdioModule = await import('@modelcontextprotocol/sdk/client/stdio.js');
      this.Client = clientModule.Client;
      this.StdioClientTransport = stdioModule.StdioClientTransport;
    }

    try {
      const transport = new this.StdioClientTransport({
        command: 'npx',
        args: [
          '-y',
          '@modelcontextprotocol/server-postgres',
          config.database.url
        ],
      });

      this.client = new this.Client({
        name: 'propiedades-mx-api',
        version: '1.0.0',
      }, {
        capabilities: {},
      });

      await this.client.connect(transport);
      this.connected = true;
      logger.info('MCP client connected successfully');
    } catch (error) {
      logger.error('Failed to connect MCP client:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.close();
      this.connected = false;
      logger.info('MCP client disconnected');
    }
  }

  async executeQuery(query: string): Promise<MCPQueryResult> {
    if (!this.client || !this.connected) {
      await this.connect();
    }

    try {
      const result = await this.client!.callTool({
        name: 'query',
        arguments: { sql: query },
      });

      if (result.content[0].type !== 'text') {
        throw new Error('Unexpected response format');
      }

      const data = JSON.parse(result.content[0].text);
      return {
        columns: data.columns || [],
        rows: data.rows || [],
        rowCount: data.rows?.length || 0,
      };
    } catch (error) {
      logger.error('MCP query execution failed:', error);
      throw error;
    }
  }

  async getSchemaInfo(): Promise<MCPSchemaInfo> {
    if (!this.client || !this.connected) {
      await this.connect();
    }

    try {
      const result = await this.client!.callTool({
        name: 'list-tables',
        arguments: {},
      });

      if (result.content[0].type !== 'text') {
        throw new Error('Unexpected response format');
      }

      const tables = JSON.parse(result.content[0].text);
      const schemaInfo: MCPSchemaInfo = { tables: [] };

      for (const table of tables) {
        const schemaResult = await this.client!.callTool({
          name: 'describe-table',
          arguments: { table: table.table },
        });

        if (schemaResult.content[0].type === 'text') {
          const columns = JSON.parse(schemaResult.content[0].text);
          schemaInfo.tables.push({
            name: table.table,
            columns: columns.map((col: any) => ({
              name: col.column,
              type: col.type,
              nullable: col.nullable === 'YES',
              primaryKey: col.primaryKey || false,
            })),
          });
        }
      }

      return schemaInfo;
    } catch (error) {
      logger.error('Failed to get schema info:', error);
      throw error;
    }
  }

  async analyzePropertyQuery(naturalLanguageQuery: string): Promise<string> {
    // Use MCP to help generate SQL from natural language
    const schemaContext = await this.getSchemaInfo();
    
    // This is a simplified example - you'd want to use an LLM here
    // to convert natural language to SQL based on schema
    const sqlQuery = `
      SELECT p.*, 
             pe.embedding <-> (SELECT embedding FROM property_embeddings WHERE property_id = 1 LIMIT 1) as similarity
      FROM properties p
      JOIN property_embeddings pe ON p.id = pe.property_id
      WHERE p.active = true
      ORDER BY similarity
      LIMIT 10
    `;
    
    return sqlQuery;
  }

  async getDatabaseHealth(): Promise<any> {
    const healthQuery = `
      SELECT 
        (SELECT count(*) FROM properties) as total_properties,
        (SELECT count(*) FROM properties WHERE active = true) as active_properties,
        (SELECT count(*) FROM users) as total_users,
        (SELECT avg(similarity) FROM (
          SELECT pe1.embedding <-> pe2.embedding as similarity
          FROM property_embeddings pe1, property_embeddings pe2
          WHERE pe1.property_id != pe2.property_id
          LIMIT 100
        ) as similarities) as avg_embedding_similarity,
        pg_database_size(current_database()) as database_size_bytes
    `;

    return this.executeQuery(healthQuery);
  }
}

export const mcpService = new MCPService();