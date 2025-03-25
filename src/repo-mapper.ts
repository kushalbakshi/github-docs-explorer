import { defaultConfig, commonDocsPaths, docIndicatorFiles, Config } from './config.js';
import { GitHubAPIClient } from './github-api.js';

export class RepositoryMapper {
  private config: Config;
  private gitHubClient: GitHubAPIClient;
  
  constructor(githubToken?: string, initialConfig = defaultConfig) {
    this.config = JSON.parse(JSON.stringify(initialConfig)); // Deep copy
    this.gitHubClient = new GitHubAPIClient(githubToken);
  }
  
  /**
   * Get docs path for a repository
   */
  async getDocsPath(repoIdentifier: string): Promise<string> {
    // Check if we already have a mapping
    const normalizedIdentifier = this.normalizeRepoIdentifier(repoIdentifier);
    if (this.config.repositories[normalizedIdentifier]) {
      return this.config.repositories[normalizedIdentifier].docsPath;
    }
    
    // Try to extract owner/repo from URL
    const { owner, repo } = this.gitHubClient.parseRepoUrl(repoIdentifier);
    
    // Auto-detect docs path
    const detectedPath = await this.gitHubClient.detectDocsFolder(
      owner, 
      repo,
      commonDocsPaths,
      docIndicatorFiles
    );
    
    if (detectedPath) {
      // Store the detected path in the config
      this.addRepoMapping(normalizedIdentifier, `https://github.com/${owner}/${repo}`, detectedPath);
      return detectedPath;
    }
    
    throw new Error(`Could not detect documentation path for repository: ${repoIdentifier}`);
  }
  
  /**
   * Add a new repository mapping
   */
  addRepoMapping(repoName: string, repoUrl: string, docsPath: string): void {
    const normalizedName = this.normalizeRepoIdentifier(repoName);
    this.config.repositories[normalizedName] = { url: repoUrl, docsPath };
  }
  
  /**
   * Get all repository mappings
   */
  getAllMappings(): Record<string, { url: string; docsPath: string }> {
    return { ...this.config.repositories };
  }
  
  /**
   * Normalize repository identifier to handle different input formats
   */
  private normalizeRepoIdentifier(identifier: string): string {
    // If it's a URL, extract the repo name
    const urlMatch = identifier.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (urlMatch) {
      return `${urlMatch[1]}/${urlMatch[2]}`;
    }
    
    // If it's already in the format owner/repo, return as is
    if (identifier.includes('/')) {
      return identifier;
    }
    
    // Otherwise, assume it's just a repo name with default owner
    return identifier;
  }
}
