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
export declare class DocsBrowser {
    private githubClient;
    private repoMapper;
    constructor(githubToken?: string);
    /**
     * Browse documentation files in a repository
     */
    browse(repoIdentifier: string, relativePath?: string): Promise<DocsBrowserResult>;
    /**
     * Add a new repository mapping
     */
    addRepositoryMapping(repoName: string, repoUrl: string, docsPath: string): void;
    /**
     * Get all repository mappings
     */
    getRepositoryMappings(): Record<string, {
        url: string;
        docsPath: string;
    }>;
}
