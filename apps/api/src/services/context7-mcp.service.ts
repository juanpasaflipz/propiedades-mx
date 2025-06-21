import { container } from '../container';

const logger = container.get('logger');

export interface Context7Response {
  documentation: string;
  examples?: string[];
  version?: string;
}

class Context7MCPService {
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
        args: ['-y', '@upstash/context7-mcp@latest'],
      });

      this.client = new this.Client({
        name: 'propiedades-mx-context7',
        version: '1.0.0',
      }, {
        capabilities: {},
      });

      await this.client.connect(transport);
      this.connected = true;
      logger.info('Context7 MCP client connected successfully');
    } catch (error) {
      logger.error('Failed to connect Context7 MCP client:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.close();
      this.connected = false;
      logger.info('Context7 MCP client disconnected');
    }
  }

  async getDocumentation(library: string, _query?: string): Promise<Context7Response> {
    if (!this.client || !this.connected) {
      await this.connect();
    }

    try {
      // Context7 uses a different approach - it enhances prompts
      // For now, we'll return a placeholder implementation
      // In production, context7 would be used directly in Claude Desktop/Cursor
      const result = {
        content: [{
          type: 'text',
          text: `Documentation for ${library} would be fetched by Context7 MCP server when used with Claude Desktop or Cursor. Include "use context7" in your prompts.`
        }]
      };

      if (result.content[0].type !== 'text') {
        throw new Error('Unexpected response format from Context7');
      }

      const documentation = result.content[0].text;
      
      return {
        documentation,
        version: this.extractVersion(documentation),
        examples: this.extractCodeExamples(documentation),
      };
    } catch (error) {
      logger.error('Context7 documentation fetch failed:', error);
      throw error;
    }
  }

  private extractVersion(doc: string): string | undefined {
    // Extract version information from documentation if available
    const versionMatch = doc.match(/version[:\s]+(\d+\.\d+\.\d+)/i);
    return versionMatch ? versionMatch[1] : undefined;
  }

  private extractCodeExamples(doc: string): string[] {
    // Extract code blocks from documentation
    const codeBlocks: string[] = [];
    const codeRegex = /```[\w]*\n([\s\S]*?)```/g;
    let match;

    while ((match = codeRegex.exec(doc)) !== null) {
      codeBlocks.push(match[1].trim());
    }

    return codeBlocks;
  }

  async enhancePropertySearchWithDocs(searchQuery: string): Promise<any> {
    // Use Context7 to get updated documentation for property search libraries
    const libraries = ['postgresql', 'pgvector', 'typescript'];
    const enhancedContext: any = {};

    for (const lib of libraries) {
      try {
        const docs = await this.getDocumentation(lib, searchQuery);
        enhancedContext[lib] = docs;
      } catch (error) {
        logger.warn(`Failed to get ${lib} documentation:`, error);
      }
    }

    return enhancedContext;
  }
}

export const context7MCPService = new Context7MCPService();