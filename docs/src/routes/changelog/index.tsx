import { releases } from "virtual:changelog-data";
import { createFileRoute } from "@tanstack/react-router";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import {
  formatCommitMessage,
  formatDate,
  groupCommitsByType,
} from "@/lib/changelog";
import { baseOptions } from "@/lib/layout.shared";

export const Route = createFileRoute("/changelog/")({
  component: ChangelogPage,
});

function ChangelogPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">Changelog</h1>
        <p className="text-gray-11 mb-12">
          All notable changes to LLMOps are documented here.
        </p>

        <div className="space-y-16">
          {releases.map((release) => (
            <ReleaseEntry key={release.version} release={release} />
          ))}
        </div>
      </div>
    </HomeLayout>
  );
}

function ReleaseEntry({
  release,
}: {
  release: (typeof releases)[number];
}) {
  const groupedCommits = groupCommitsByType(release.commits);

  const sections = [
    { type: "feat", title: "New Features" },
    { type: "fix", title: "Bug Fixes" },
    { type: "docs", title: "Documentation" },
    { type: "refactor", title: "Refactoring" },
    { type: "other", title: "Other Changes" },
  ] as const;

  return (
    <article id={release.version} className="scroll-mt-20">
      <header className="mb-6">
        <div className="flex items-center gap-4 mb-1">
          <h2 className="text-2xl font-bold font-mono">{release.version}</h2>
          <time className="text-sm text-gray-10">
            {formatDate(release.date)}
          </time>
        </div>
        {release.title && (
          <h3 className="text-lg text-gray-11">{release.title}</h3>
        )}
        {release.description && (
          <p className="text-gray-10 mt-2">{release.description}</p>
        )}
      </header>

      {release.hasManualContent && (
        <div className="mb-6 p-4 bg-gray-2 border border-gray-4 rounded-lg">
          <p className="text-sm text-gray-11">
            <a
              href={`/docs/changelog/${release.version}`}
              className="text-blue-10 hover:text-blue-11 underline"
            >
              View detailed release notes →
            </a>
          </p>
        </div>
      )}

      {release.commits.length === 0 ? (
        <p className="text-gray-10">Maintenance release.</p>
      ) : (
        <div className="space-y-6">
          {sections.map(({ type, title }) => {
            const commits = groupedCommits[type];
            if (!commits || commits.length === 0) return null;

            return (
              <section key={type}>
                <h4 className="text-sm font-semibold text-gray-10 uppercase tracking-wide mb-3">
                  {title}
                </h4>
                <ul className="space-y-2">
                  {commits.map((commit) => (
                    <li
                      key={commit.hash}
                      className="flex items-start gap-3 text-gray-11"
                    >
                      <span className="text-gray-8 mt-1">•</span>
                      <span>{formatCommitMessage(commit.message)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </article>
  );
}
