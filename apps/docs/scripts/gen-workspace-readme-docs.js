import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../../..');
const docsRoot = path.join(repoRoot, 'apps/docs/content/docs');
const outputRoot = path.join(docsRoot, 'reference/workspaces');
const generatorPath = 'apps/docs/scripts/gen-workspace-readme-docs.js';

const workspaceRoots = [
  { key: 'apps', title: 'Apps', singularTitle: 'app', dir: path.join(repoRoot, 'apps') },
  { key: 'packages', title: 'Packages', singularTitle: 'package', dir: path.join(repoRoot, 'packages') },
  { key: 'integrations', title: 'Integrations', singularTitle: 'integration', dir: path.join(repoRoot, 'integrations') },
];

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeFileIfChanged(filePath, content) {
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === content) return false;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return true;
}

function titleFromPackage(workspaceName, packageJson) {
  return packageJson?.name ?? workspaceName;
}

function descriptionFromPackage(title, packageJson) {
  return packageJson?.description ?? `${title} workspace in the open-wa v5 monorepo.`;
}

function buildMissingReadme(workspace) {
  const scripts = Object.keys(workspace.packageJson?.scripts ?? {});
  const scriptLines = scripts.length > 0
    ? scripts.map((script) => `- \`pnpm --filter ${workspace.title} ${script}\``).join('\n')
    : '- No package-level scripts are defined.';

  return [
    `# ${workspace.title}`,
    '',
    workspace.description,
    '',
    'Part of the [@open-wa v5 monorepo](https://github.com/open-wa/wa-automate-nodejs).',
    '',
    '## Development',
    '',
    scriptLines,
    '',
    '## Documentation',
    '',
    'See the [docs site](https://docs.openwa.dev).',
    '',
    '## License',
    '',
    '[H-DNH V1.0](https://github.com/open-wa/wa-automate-nodejs/blob/main/LICENSE.md) - Hippocratic + Do Not Harm',
    '',
  ].join('\n');
}

function getWorkspaces(root) {
  return fs
    .readdirSync(root.dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => {
      const workspaceDir = path.join(root.dir, entry.name);
      const packageJson = readJson(path.join(workspaceDir, 'package.json'));
      const title = titleFromPackage(entry.name, packageJson);
      const description = descriptionFromPackage(title, packageJson);

      return {
        rootKey: root.key,
        rootTitle: root.title,
        slug: entry.name,
        dir: workspaceDir,
        relativeDir: path.relative(repoRoot, workspaceDir),
        readmePath: path.join(workspaceDir, 'README.md'),
        packageJson,
        title,
        description,
      };
    })
    .sort((left, right) => left.slug.localeCompare(right.slug));
}

function ensureReadme(workspace) {
  if (fs.existsSync(workspace.readmePath)) return false;
  return writeFileIfChanged(workspace.readmePath, buildMissingReadme(workspace));
}

function frontmatter(workspace) {
  return [
    '---',
    `title: ${JSON.stringify(workspace.title)}`,
    `description: ${JSON.stringify(workspace.description)}`,
    '---',
    '',
  ].join('\n');
}

function buildWorkspacePage(workspace) {
  const readme = fs.readFileSync(workspace.readmePath, 'utf8').trimEnd();
  return [
    frontmatter(workspace).trimEnd(),
    '',
    `> Generated from \`${workspace.relativeDir}/README.md\` by \`${generatorPath}\`. Do not edit this page directly.`,
    '',
    readme,
    '',
  ].join('\n');
}

function buildGroupIndex(root, workspaces) {
  const links = workspaces.map((workspace) => `- [${workspace.title}](./${workspace.slug}) - ${workspace.description}`);
  return [
    '---',
    `title: ${JSON.stringify(root.title)}`,
    `description: ${JSON.stringify(`README reference pages for ${root.key} workspaces.`)}`,
    '---',
    '',
    `# ${root.title}`,
    '',
    `These pages are generated from direct child README files under \`${root.key}/\`.`,
    '',
    ...links,
    '',
  ].join('\n');
}

function naturalJoin(items) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

function buildRootIndex(allWorkspaces) {
  const counts = workspaceRoots.map((root) => {
    const count = allWorkspaces.filter((workspace) => workspace.rootKey === root.key).length;
    return { ...root, count };
  });

  const dirList = naturalJoin(counts.map(({ key }) => `\`${key}/\``));
  const countPhrases = naturalJoin(
    counts
      .filter(({ count }) => count > 0)
      .map(({ count, singularTitle }) => `${count} ${singularTitle} workspace${count === 1 ? '' : 's'}`)
  );

  return [
    '---',
    'title: "Workspace Reference"',
    'description: "Generated README reference pages for apps, packages, and integrations in the open-wa monorepo."',
    '---',
    '',
    '# Workspace Reference',
    '',
    `This section is generated from README files in direct child directories under ${dirList}. It includes ${countPhrases}.`,
    '',
    ...counts.map(({ key, title }) => `- [${title}](./${key})`),
    '',
    `Run \`pnpm --filter docs workspace-docs\` to refresh these pages after changing a workspace README.`,
    '',
  ].join('\n');
}

function writeMeta(filePath, title, pages) {
  writeFileIfChanged(filePath, `${JSON.stringify({ title, pages }, null, 2)}\n`);
}

function ensureReferenceMeta() {
  const metaPath = path.join(docsRoot, 'reference/meta.json');
  const meta = readJson(metaPath) ?? { title: 'API Reference', pages: ['index'] };
  const pages = Array.isArray(meta.pages) ? [...meta.pages] : ['index'];

  if (!pages.includes('workspaces')) {
    const indexPosition = pages.indexOf('index');
    pages.splice(indexPosition === -1 ? 0 : indexPosition + 1, 0, 'workspaces');
  }

  writeFileIfChanged(metaPath, `${JSON.stringify({ ...meta, pages }, null, 2)}\n`);
}

function generateDocs() {
  const grouped = workspaceRoots.map((root) => ({ root, workspaces: getWorkspaces(root) }));
  const allWorkspaces = grouped.flatMap((group) => group.workspaces);
  let createdReadmes = 0;

  for (const workspace of allWorkspaces) {
    if (ensureReadme(workspace)) createdReadmes += 1;
  }

  fs.rmSync(outputRoot, { recursive: true, force: true });
  writeFileIfChanged(path.join(outputRoot, 'index.mdx'), buildRootIndex(allWorkspaces));
  writeMeta(path.join(outputRoot, 'meta.json'), 'Workspace Reference', ['index', ...workspaceRoots.map((root) => root.key)]);

  for (const group of grouped) {
    const groupDir = path.join(outputRoot, group.root.key);
    writeFileIfChanged(path.join(groupDir, 'index.mdx'), buildGroupIndex(group.root, group.workspaces));
    writeMeta(path.join(groupDir, 'meta.json'), group.root.title, ['index', ...group.workspaces.map((workspace) => workspace.slug)]);

    for (const workspace of group.workspaces) {
      writeFileIfChanged(path.join(groupDir, `${workspace.slug}.mdx`), buildWorkspacePage(workspace));
    }
  }

  ensureReferenceMeta();
  console.log(`Generated ${allWorkspaces.length} workspace README docs (${createdReadmes} README files created).`);
}

generateDocs();
