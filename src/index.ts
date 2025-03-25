#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { DocsBrowser } from './docs-browser.js';

interface BrowseDocsArgs {
  repository: string;
  path?: string;
}

interface AddRepoMappingArgs {
  name: string;
  url: string;
  docsPath: string;
}

interface GetSubjectsArgs {
  limit?: number;
}

// Validator functions
const isValidBrowseDocsArgs = (args: any): args is BrowseDocsArgs => {
  return typeof args === 'object' && 
         args !== null && 
         typeof args.repository === 'string' &&
         (args.path === undefined || typeof args.path === 'string');
};

const isValidAddRepoMappingArgs = (args: any): args is AddRepoMappingArgs => {
  return typeof args === 'object' && 
         args !== null && 
         typeof args.name === 'string' &&
         typeof args.url === 'string' &&
         typeof args.docsPath === 'string';
};

class GitHubDocsExplorerServer {
  private server: Server;
  private docsBrowser: DocsBrowser;

  constructor() {
    this.server = new Server({
      name: 'github-docs-explorer',
      version: '0.1.0',
      capabilities: {
        tools: {},
      }
    });

    // Get GitHub token from environment variable
    const githubToken = process.env.GITHUB_TOKEN;
    this.docsBrowser = new DocsBrowser(githubToken);

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error: any) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'browse_docs',
          description: 'Browse documentation files in a GitHub repository',
          inputSchema: {
            type: 'object',
            properties: {
              repository: {
                type: 'string',
                description: 'Repository name, owner/repo format, or full GitHub URL',
              },
              path: {
                type: 'string',
                description: 'Relative path within the docs directory (optional)',
              },
            },
            required: ['repository'],
          },
        },
        {
          name: 'add_repo_mapping',
          description: 'Add a new repository mapping',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Short name for the repository',
              },
              url: {
                type: 'string',
                description: 'Full GitHub URL for the repository',
              },
              docsPath: {
                type: 'string',
                description: 'Path to the documentation directory within the repository',
              },
            },
            required: ['name', 'url', 'docsPath'],
          },
        },
      ],
    }));

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      // Browse docs tool
      if (name === 'browse_docs') {
        if (!isValidBrowseDocsArgs(args)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Invalid arguments for browse_docs tool'
          );
        }

        try {
          const result = await this.docsBrowser.browse(args.repository, args.path || '');
          
          if (result.type === 'directory') {
            // Format directory listing
            const listing = result.items?.map(item => {
              return `${item.type === 'dir' ? '📁' : '📄'} ${item.name} - ${item.url}`;
            }).join('\n') || 'Empty directory';
            
            return {
              content: [
                {
                  type: 'text',
                  text: `### Directory: ${result.path}\n\n${listing}\n\nRepository: ${result.repository.name} (${result.repository.url})`,
                },
              ],
            };
          } else {
            // Return file content
            return {
              content: [
                {
                  type: 'text',
                  text: `### File: ${result.path}\n\nRepository: ${result.repository.name} (${result.repository.url})\n\n\`\`\`\n${result.content}\n\`\`\``,
                },
              ],
            };
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: 'text',
                text: `Error browsing docs: ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      }
      
      // Add repo mapping tool
      else if (name === 'add_repo_mapping') {
        if (!isValidAddRepoMappingArgs(args)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Invalid arguments for add_repo_mapping tool'
          );
        }

        try {
          this.docsBrowser.addRepositoryMapping(args.name, args.url, args.docsPath);
          
          return {
            content: [
              {
                type: 'text',
                text: `✅ Successfully added repository mapping:\n- Name: ${args.name}\n- URL: ${args.url}\n- Docs Path: ${args.docsPath}`,
              },
            ],
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: 'text',
                text: `Error adding repository mapping: ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      }
      
      else {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('GitHub Docs Explorer MCP server running on stdio');
  }
}

const server = new GitHubDocsExplorerServer();
server.run().catch(console.error);
