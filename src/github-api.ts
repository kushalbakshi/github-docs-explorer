import axios from 'axios';
type AxiosInstance = any; // Simplified for now

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
  html_url: string;
}

export class GitHubAPIClient {
  private apiClient: AxiosInstance;
  
  constructor(token?: string) {
    this.apiClient = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        ...(token ? { Authorization: `token ${token}` } : {})
      }
    });
    
    // Add response interceptor for rate limit handling
    this.apiClient.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        if (error.response && error.response.status === 403 && error.response.headers['x-ratelimit-remaining'] === '0') {
          const resetTime = error.response.headers['x-ratelimit-reset'];
          const waitTime = new Date(resetTime * 1000).getTime() - Date.now();
          console.error(`GitHub API rate limit exceeded. Reset in ${Math.ceil(waitTime / 1000)} seconds.`);
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Parse GitHub repository URL to extract owner and repo name
   */
  parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
    // Handle URLs of format https://github.com/owner/repo
    const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (urlMatch) {
      return { owner: urlMatch[1], repo: urlMatch[2] };
    }
    
    // Handle simple owner/repo format
    const simpleMatch = repoUrl.match(/^([^\/]+)\/([^\/]+)$/);
    if (simpleMatch) {
      return { owner: simpleMatch[1], repo: simpleMatch[2] };
    }
    
    throw new Error(`Invalid GitHub repository URL or name: ${repoUrl}`);
  }
  
  /**
   * Get contents of a directory in a repository
   */
  async getDirectoryContents(owner: string, repo: string, path: string = ''): Promise<GitHubFile[]> {
    try {
      const response = await this.apiClient.get(`/repos/${owner}/${repo}/contents/${path}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching directory contents for ${owner}/${repo}/${path}:`, error);
      throw error;
    }
  }
  
  /**
   * Get content of a specific file
   */
  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    try {
      const response = await this.apiClient.get(`/repos/${owner}/${repo}/contents/${path}`);
      
      // GitHub API returns base64 encoded content
      if (response.data.encoding === 'base64' && response.data.content) {
        return Buffer.from(response.data.content, 'base64').toString('utf-8');
      }
      
      throw new Error(`Unexpected response format from GitHub API for file: ${path}`);
    } catch (error) {
      console.error(`Error fetching file content for ${owner}/${repo}/${path}:`, error);
      throw error;
    }
  }
  
  /**
   * Auto-detect documentation folder in a repository
   */
  async detectDocsFolder(owner: string, repo: string, commonPaths: string[], indicatorFiles: string[]): Promise<string | null> {
    // First check common paths
    for (const path of commonPaths) {
      try {
        await this.getDirectoryContents(owner, repo, path);
        
        // Check for indicator files in this directory
        for (const file of indicatorFiles) {
          try {
            await this.getFileContent(owner, repo, `${path}/${file}`);
            return path; // Found an indicator file, this is likely the docs folder
          } catch (error) {
            // Indicator file not found, continue checking
          }
        }
      } catch (error) {
        // Path doesn't exist, try next one
        continue;
      }
    }
    
    // If no match found with indicator files, return the first valid path
    for (const path of commonPaths) {
      try {
        await this.getDirectoryContents(owner, repo, path);
        return path; // Path exists
      } catch (error) {
        // Path doesn't exist, try next one
        continue;
      }
    }
    
    return null; // No documentation folder found
  }
}
