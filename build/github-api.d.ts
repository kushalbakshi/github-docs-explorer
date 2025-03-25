export interface GitHubFile {
    name: string;
    path: string;
    type: 'file' | 'dir';
    download_url: string | null;
    html_url: string;
}
export declare class GitHubAPIClient {
    private apiClient;
    constructor(token?: string);
    /**
     * Parse GitHub repository URL to extract owner and repo name
     */
    parseRepoUrl(repoUrl: string): {
        owner: string;
        repo: string;
    };
    /**
     * Get contents of a directory in a repository
     */
    getDirectoryContents(owner: string, repo: string, path?: string): Promise<GitHubFile[]>;
    /**
     * Get content of a specific file
     */
    getFileContent(owner: string, repo: string, path: string): Promise<string>;
    /**
     * Auto-detect documentation folder in a repository
     */
    detectDocsFolder(owner: string, repo: string, commonPaths: string[], indicatorFiles: string[]): Promise<string | null>;
}
