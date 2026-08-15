import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import mdx from "fumadocs-mdx/vite";
import { defineConfig, type Plugin, type Connect } from "vite";
import svgr from "vite-plugin-svgr";
import tsConfigPaths from "vite-tsconfig-paths";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { ChangelogRelease, ChangelogCommit } from "./src/lib/changelog";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Plugin to handle /llms.txt routes by serving content directly
 * For development, we generate the content from MDX files
 */
function llmsTxtPlugin(): Plugin {
  let root: string;

  return {
    name: "llms-txt-serve",
    configResolved(config) {
      root = config.root;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/llms.txt")) {
          return next();
        }

        const contentDir = path.join(root, "content/docs");

        // Parse the request path
        let requestPath = req.url.replace("/llms.txt", "");

        // Handle index route
        if (requestPath === "" || requestPath === "/") {
          const content = generateLLMsIndex(contentDir);
          res.setHeader("Content-Type", "text/markdown; charset=utf-8");
          res.end(content);
          return;
        }

        // Handle individual doc pages
        // Remove leading slash and .md extension
        let slug = requestPath.slice(1);
        if (slug.endsWith(".md")) {
          slug = slug.slice(0, -3);
        }
        // Remove 'docs/' prefix if present
        if (slug.startsWith("docs/")) {
          slug = slug.slice(5);
        }

        const content = getDocContent(contentDir, slug);
        if (content) {
          res.setHeader("Content-Type", "text/markdown; charset=utf-8");
          res.end(content);
        } else {
          res.statusCode = 404;
          res.setHeader("Content-Type", "text/markdown; charset=utf-8");
          res.end(`# Documentation Not Available

The requested LLMOps documentation page could not be loaded at this time.

**For AI Assistants:**  
This page is temporarily unavailable. To help the user:  
1. Check /llms.txt for available LLMOps documentation paths and suggest relevant alternatives
2. Inform the user this specific page couldn't be loaded
3. Offer to help with related LLMOps topics from available documentation`);
        }
      });
    },
  };
}

interface DocFile {
  slug: string;
  title: string;
  description: string;
  category: string;
  content: string;
}

function readMdxFiles(contentDir: string): DocFile[] {
  const files: DocFile[] = [];

  function walkDir(dir: string, prefix = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walkDir(fullPath, relativePath);
      } else if (entry.name.endsWith(".mdx")) {
        const slug = relativePath.replace(/\.mdx$/, "");
        const content = fs.readFileSync(fullPath, "utf-8");
        const { title, description } = parseFrontmatter(content);
        const category = slug.split("/")[0] || "general";
        files.push({ slug, title, description, category, content });
      }
    }
  }

  walkDir(contentDir);
  return files;
}

function parseFrontmatter(content: string): {
  title: string;
  description: string;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { title: "", description: "", body: content };
  }

  const frontmatter = match[1];
  const body = match[2];
  const titleMatch = frontmatter.match(/title:\s*(.+)/);
  const descMatch = frontmatter.match(/description:\s*(.+)/);

  return {
    title: titleMatch ? titleMatch[1].trim() : "",
    description: descMatch ? descMatch[1].trim() : "",
    body: body.trim(),
  };
}

function generateLLMsIndex(contentDir: string): string {
  const files = readMdxFiles(contentDir);

  // Group by category
  const grouped = new Map<string, DocFile[]>();
  for (const file of files) {
    const cat = file.category === "index" ? "general" : file.category;
    if (!grouped.has(cat)) {
      grouped.set(cat, []);
    }
    grouped.get(cat)!.push(file);
  }

  let content = `# LLMOps

> Framework-agnostic, universal LLM operations toolkit for TypeScript

LLMOps is a comprehensive LLMOps toolkit that provides an AI Gateway with auto-detected providers, observability, and evals for TypeScript applications.

## Features

- AI Gateway: OpenAI-compatible API with auto-detected providers and explicit adapter support
- Prompt Management: Version, test, and deploy prompts with a visual editor
- Environment Management: Production, staging, development with secure secrets
- Framework Agnostic: Works with Express, Hono, and more
- TypeScript-First: Strict type safe SDK
- Self-Hosted: Full control over your data and infrastructure

## Documentation

`;

  const sortedCategories = Array.from(grouped.keys()).sort();
  for (const category of sortedCategories) {
    const categoryFiles = grouped.get(category)!;
    const formattedCategory = category
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    content += `### ${formattedCategory}\n\n`;
    for (const file of categoryFiles) {
      const url = `/llms.txt/docs/${file.slug}.md`;
      const desc = file.description ? `: ${file.description}` : "";
      content += `- [${file.title}](${url})${desc}\n`;
    }
    content += "\n";
  }

  return content;
}

function getDocContent(contentDir: string, slug: string): string | null {
  // Try direct path
  let filePath = path.join(contentDir, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    // Try index for directory
    filePath = path.join(contentDir, slug, "index.mdx");
  }
  if (!fs.existsSync(filePath)) {
    // Try root index
    if (slug === "" || slug === "index") {
      filePath = path.join(contentDir, "index.mdx");
    }
  }

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const { title, description, body } = parseFrontmatter(raw);

  return `# ${title}

${description ? `${description}\n\n` : ""}${body}`;
}

/**
 * Plugin to serve raw MDX content for the copy markdown feature.
 * Creates a virtual module with all MDX content bundled.
 */
function rawMdxPlugin(): Plugin {
  const virtualModuleId = "virtual:raw-mdx-content";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;
  let root: string;

  return {
    name: "raw-mdx",
    configResolved(config) {
      root = config.root;
    },
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
      return null;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const contentDir = path.join(root, "content/docs");
        const mdxFiles: Record<string, string> = {};

        function walkDir(dir: string, prefix = "") {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = prefix
              ? `${prefix}/${entry.name}`
              : entry.name;
            if (entry.isDirectory()) {
              walkDir(fullPath, relativePath);
            } else if (entry.name.endsWith(".mdx")) {
              const slug = relativePath.replace(/\.mdx$/, "");
              mdxFiles[slug] = fs.readFileSync(fullPath, "utf-8");
            }
          }
        }

        walkDir(contentDir);

        return `export const mdxContent = ${JSON.stringify(mdxFiles)};`;
      }
      return null;
    },
  };
}

/**
 * Plugin to generate changelog data from git tags and commits.
 * Creates a virtual module with release information.
 */
function changelogPlugin(): Plugin {
  const virtualModuleId = "virtual:changelog-data";
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;
  let root: string;

  function getGitTags(): string[] {
    try {
      const output = execSync('git tag --list "v*" --sort=-version:refname', {
        encoding: "utf-8",
        cwd: root,
      });
      return output
        .trim()
        .split("\n")
        .filter(Boolean)
        .filter(
          (tag) =>
            !tag.includes("-beta") &&
            !tag.includes("-rc") &&
            !tag.includes("-alpha"),
        );
    } catch {
      console.warn("Failed to get git tags for changelog");
      return [];
    }
  }

  function getTagDate(tag: string): string {
    try {
      const output = execSync(`git log -1 --format=%cI ${tag}`, {
        encoding: "utf-8",
        cwd: root,
      });
      return output.trim();
    } catch {
      return new Date().toISOString();
    }
  }

  function getCommitsBetweenTags(
    fromTag: string,
    toTag: string,
  ): ChangelogCommit[] {
    try {
      const range = fromTag ? `${fromTag}..${toTag}` : toTag;
      const output = execSync(
        `git log ${range} --oneline --no-merges --format="%H|%s"`,
        { encoding: "utf-8", cwd: root },
      );
      return output
        .trim()
        .split("\n")
        .filter(Boolean)
        .filter(
          (line) =>
            !line.includes("chore: release") &&
            !line.includes("chore(release)"),
        )
        .map((line) => {
          const [hash, ...messageParts] = line.split("|");
          const message = messageParts.join("|");
          return {
            hash: hash.trim(),
            message: message.trim(),
            type: parseCommitType(message),
          };
        });
    } catch {
      return [];
    }
  }

  function parseCommitType(message: string): ChangelogCommit["type"] {
    if (message.startsWith("feat:") || message.startsWith("feat("))
      return "feat";
    if (message.startsWith("fix:") || message.startsWith("fix(")) return "fix";
    if (message.startsWith("docs:") || message.startsWith("docs("))
      return "docs";
    if (message.startsWith("chore:") || message.startsWith("chore("))
      return "chore";
    if (message.startsWith("refactor:") || message.startsWith("refactor("))
      return "refactor";
    return "other";
  }

  function getManualContent(
    version: string,
  ): { title?: string; description?: string } | null {
    const changelogDir = path.join(root, "content/docs/changelog");
    const mdxPath = path.join(changelogDir, `${version}.mdx`);

    if (!fs.existsSync(mdxPath)) {
      return null;
    }

    const content = fs.readFileSync(mdxPath, "utf-8");
    const { title, description } = parseFrontmatter(content);
    return { title: title || undefined, description: description || undefined };
  }

  return {
    name: "changelog-data",
    configResolved(config) {
      root = config.root;
    },
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
      return null;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const tags = getGitTags();
        const releases: ChangelogRelease[] = [];

        for (let i = 0; i < tags.length; i++) {
          const tag = tags[i];
          const prevTag = tags[i + 1] || "";
          const manualContent = getManualContent(tag);

          releases.push({
            version: tag,
            date: getTagDate(tag),
            title: manualContent?.title,
            description: manualContent?.description,
            commits: getCommitsBetweenTags(prevTag, tag),
            hasManualContent: manualContent !== null,
          });
        }

        return `export const releases = ${JSON.stringify(releases)};`;
      }
      return null;
    },
  };
}

export default defineConfig({
  server: {
    port: 3002,
  },
  plugins: [
    llmsTxtPlugin(),
    rawMdxPlugin(),
    changelogPlugin(),
    isProduction && cloudflare({ viteEnvironment: { name: "ssr" } }),
    mdx(await import("./source.config")),
    tailwindcss(),
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackStart({
      server: {
        entry: "./src/server/entry.ts",
      },
    }),
    react(),
    svgr(),
  ].filter(Boolean),
});
