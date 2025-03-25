import { defaultConfig, commonDocsPaths, docIndicatorFiles } from './config.js';
import { GitHubAPIClient } from './github-api.js';
export class RepositoryMapper {
    constructor(githubToken, initialConfig = defaultConfig) {
        this.config = JSON.parse(JSON.stringify(initialConfig)); // Deep copy
        this.gitHubClient = new GitHubAPIClient(githubToken);
    }
    /**
     * Get docs path for a repository
     */
    async getDocsPath(repoIdentifier) {
        // Check if we already have a mapping
        const normalizedIdentifier = this.normalizeRepoIdentifier(repoIdentifier);
        if (this.config.repositories[normalizedIdentifier]) {
            return this.config.repositories[normalizedIdentifier].docsPath;
        }
        // Try to extract owner/repo from URL
        const { owner, repo } = this.gitHubClient.parseRepoUrl(repoIdentifier);
        // Auto-detect docs path
        const detectedPath = await this.gitHubClient.detectDocsFolder(owner, repo, commonDocsPaths, docIndicatorFiles);
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
    addRepoMapping(repoName, repoUrl, docsPath) {
        const normalizedName = this.normalizeRepoIdentifier(repoName);
        this.config.repositories[normalizedName] = { url: repoUrl, docsPath };
    }
    /**
     * Get all repository mappings
     */
    getAllMappings() {
        return { ...this.config.repositories };
    }
    /**
     * Normalize repository identifier to handle different input formats
     */
    normalizeRepoIdentifier(identifier) {
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
//# sourceMappingURL=repo-mapper.js.map