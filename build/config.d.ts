interface DocsMapping {
    url: string;
    docsPath: string;
}
export interface Config {
    repositories: Record<string, DocsMapping>;
}
export declare const defaultConfig: Config;
export declare const commonDocsPaths: string[];
export declare const docIndicatorFiles: string[];
export {};
