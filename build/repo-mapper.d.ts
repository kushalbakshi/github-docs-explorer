import { Config } from './config.js';
export declare class RepositoryMapper {
    private config;
    private gitHubClient;
    constructor(githubToken?: string, initialConfig?: Config);
    /**
     * Get docs path for a repository
     */
    getDocsPath(repoIdentifier: string): Promise<string>;
    /**
     * Add a new repository mapping
     */
    addRepoMapping(repoName: string, repoUrl: string, docsPath: string): void;
    /**
     * Get all repository mappings
     */
    getAllMappings(): Record<string, {
        url: string;
        docsPath: string;
    }>;
    /**
     * Normalize repository identifier to handle different input formats
     */
    private normalizeRepoIdentifier;
}
