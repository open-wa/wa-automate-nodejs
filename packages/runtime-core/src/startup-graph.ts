import { Effect } from 'effect';
import { StartupGraphError } from './errors.js';

export interface StartupNode<A = unknown> {
  readonly id: string;
  readonly dependsOn?: ReadonlyArray<string>;
  readonly optional?: boolean;
  readonly run: (
    completed: ReadonlyMap<string, unknown>,
  ) => Effect.Effect<A, unknown>;
}

export interface StartupNodeResult {
  readonly id: string;
  readonly durationMs: number;
  readonly optional: boolean;
  readonly result: unknown;
}

export interface StartupGraphResult {
  readonly values: ReadonlyMap<string, unknown>;
  readonly phases: ReadonlyArray<StartupNodeResult>;
  readonly criticalPathMs: number;
}

export const validateStartupGraph = (
  nodes: ReadonlyArray<StartupNode>,
): Effect.Effect<void, StartupGraphError> =>
  Effect.try({
    try: () => {
    const ids = new Set(nodes.map((node) => node.id));
    if (ids.size !== nodes.length) {
      throw new StartupGraphError({
        detail: 'startup graph contains duplicate node ids',
        nodes: nodes.map((node) => node.id),
      });
    }

    for (const node of nodes) {
      for (const dependency of node.dependsOn ?? []) {
        if (!ids.has(dependency)) {
          throw new StartupGraphError({
            detail: `${node.id} depends on missing node ${dependency}`,
            nodes: [node.id, dependency],
          });
        }
      }
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const visit = (id: string) => {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        throw new StartupGraphError({
          detail: `startup graph contains a cycle at ${id}`,
          nodes: [...visiting, id],
        });
      }
      visiting.add(id);
      for (const dependency of byId.get(id)?.dependsOn ?? []) visit(dependency);
      visiting.delete(id);
      visited.add(id);
    };
      for (const node of nodes) visit(node.id);
    },
    catch: (error) =>
      error instanceof StartupGraphError
        ? error
        : new StartupGraphError({
            detail: String(error),
            nodes: nodes.map((node) => node.id),
          }),
  });

export const runStartupGraph = (
  nodes: ReadonlyArray<StartupNode>,
  options: {
    readonly concurrency?: number;
    readonly onPhase?: (phase: StartupNodeResult) => void;
    readonly onComplete?: (result: StartupGraphResult) => void;
  } = {},
): Effect.Effect<StartupGraphResult, unknown> =>
  Effect.gen(function* () {
    yield* validateStartupGraph(nodes);
    const startedAt = Date.now();
    const pending = new Map(nodes.map((node) => [node.id, node]));
    const values = new Map<string, unknown>();
    const phases: StartupNodeResult[] = [];

    while (pending.size > 0) {
      const ready = [...pending.values()].filter((node) =>
        (node.dependsOn ?? []).every((dependency) => values.has(dependency)),
      );
      if (ready.length === 0) {
        return yield* Effect.fail(
          new StartupGraphError({
            detail: 'startup graph made no progress',
            nodes: [...pending.keys()],
          }),
        );
      }

      const results = yield* Effect.all(
        ready.map((node) =>
          Effect.gen(function* () {
            const nodeStartedAt = Date.now();
            const exit = yield* Effect.exit(
              node.run(values).pipe(
                Effect.withSpan(`openwa.startup.${node.id}`, {
                  attributes: {
                    'startup.node': node.id,
                    'startup.optional': node.optional ?? false,
                  },
                }),
              ),
            );
            return { node, nodeStartedAt, exit } as const;
          }),
        ),
        { concurrency: options.concurrency ?? 4 },
      );

      for (const { node, nodeStartedAt, exit } of results) {
        pending.delete(node.id);
        if (exit._tag === 'Failure') {
          if (!node.optional) return yield* Effect.failCause(exit.cause);
          values.set(node.id, exit);
          phases.push({
            id: node.id,
            durationMs: Date.now() - nodeStartedAt,
            optional: true,
            result: exit,
          });
          options.onPhase?.(phases.at(-1)!);
          continue;
        }
        values.set(node.id, exit.value);
        phases.push({
          id: node.id,
          durationMs: Date.now() - nodeStartedAt,
          optional: node.optional ?? false,
          result: exit.value,
        });
        options.onPhase?.(phases.at(-1)!);
      }
    }

    const result = {
      values,
      phases,
      criticalPathMs: Date.now() - startedAt,
    };
    options.onComplete?.(result);
    return result;
  });
