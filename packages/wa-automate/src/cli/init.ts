/** Both CLI entry points use the same wizard, flags and project templates. */
export async function initProject(args: string[]): Promise<void> {
  const { initProject: createProject } = await import('@open-wa/create');
  await createProject(args);
}
