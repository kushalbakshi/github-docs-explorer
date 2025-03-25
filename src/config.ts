interface DocsMapping {
  url: string;
  docsPath: string;
}

export interface Config {
  repositories: Record<string, DocsMapping>;
}

// Initial configuration with known repositories
export const defaultConfig: Config = {
  repositories: {
    "datajoint-python": {
      url: "https://github.com/datajoint/datajoint-python",
      docsPath: "docs/src"
    }
  }
};

// Common documentation paths to check when auto-detecting
export const commonDocsPaths = [
  "docs",
  "doc",
  "documentation",
  "docs/src",
  "documentation/source",
  "site",
  "website"
];

// Common documentation indicators (files that indicate a documentation directory)
export const docIndicatorFiles = [
  "mkdocs.yml",
  "conf.py",
  "docusaurus.config.js",
  "sphinx.json",
  "README.md",
  "index.md",
  "index.html"
];
