import { GitHubAPIClient, GitHubFile } from './github-api.js';
import { RepositoryMapper } from './repo-mapper.js';

export interface DocsBrowserResult {
  type: 'directory' | 'file';
  path: string;
  content?: string;
  items?: Array<{
    name: string;
    path: string;
    type: 'file' | 'dir';
    url: string;
  }>;
  repository: {
    name: string;
    url: string;
    docsPath: string;
  };
}

export class DocsBrowser {
  private githubClient: GitHubAPIClient;
  private repoMapper: RepositoryMapper;
  
  constructor(githubToken?: string) {
    this.githubClient = new GitHubAPIClient(githubToken);
    this.repoMapper = new RepositoryMapper(githubToken);
  }
  
  /**
   * Browse documentation files in a repository
   */
  async browse(repoIdentifier: string, relativePath: string = ''): Promise<DocsBrowserResult> {
    // Get repository info and docs path
    const { owner, repo } = this.githubClient.parseRepoUrl(repoIdentifier);
    const docsPath = await this.repoMapper.getDocsPath(repoIdentifier);
    
    // Construct the full path
    const fullPath = relativePath ? `${docsPath}/${relativePath}` : docsPath;
    
    try {
      // Try to get directory contents first
      const contents = await this.githubClient.getDirectoryContents(owner, repo, fullPath);
      
      // It's a directory, return listing
      return {
        type: 'directory',
        path: fullPath,
        items: contents.map(item => ({
          name: item.name,
          path: item.path,
          type: item.type,
          url: item.html_url
        })),
        repository: {
          name: `${owner}/${repo}`,
          url: `https://github.com/${owner}/${repo}`,
          docsPath
        }
      };
    } catch (error) {
      // If it's not a directory, try to get file content
      try {
        const content = await this.githubClient.getFileContent(owner, repo, fullPath);
        
        return {
          type: 'file',
          path: fullPath,
          content,
          repository: {
            name: `${owner}/${repo}`,
            url: `https://github.com/${owner}/${repo}`,
            docsPath
          }
        };
      } catch (fileError: unknown) {
        const errorMessage = fileError instanceof Error ? fileError.message : String(fileError);
        throw new Error(`Could not access path '${fullPath}' in repository ${owner}/${repo}: ${errorMessage}`);
      }
    }
  }
  
  /**
   * Add a new repository mapping
   */
  addRepositoryMapping(repoName: string, repoUrl: string, docsPath: string): void {
    this.repoMapper.addRepoMapping(repoName, repoUrl, docsPath);
  }
  
  /**
   * Get all repository mappings
   */
  getRepositoryMappings(): Record<string, { url: string; docsPath: string }> {
    return this.repoMapper.getAllMappings();
  }
}
