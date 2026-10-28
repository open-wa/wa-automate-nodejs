import type { PluginServices } from '@open-wa/plugin-sdk';

export function makeServices(signal = new AbortController().signal): PluginServices {
  const services = new Map<string, Promise<{ value: unknown; dispose: () => unknown }>>();
  return { getOrCreate: async (name, create) => {
    let service = services.get(name);
    if (!service) { service = create(signal); services.set(name, service); }
    return (await service).value as any;
  } };
}
/** Deterministic answers for fixture facts. Real model behaviour is checked separately. */
export function fixtureAnswers(request: any, values: Record<string, string> = {}) {
  const spans = request.state.literalCandidates ?? [], correcting = values.action === 'correct-booking';
  const sources = request.state.conversation.filter((turn: any) => turn.role === 'user');
  const source = sources.findLast((turn: any) => /26 October 2026/.test(turn.content));
  const dateSource = source ? `u${sources.indexOf(source)}` : 'absent';
  const defaults: Record<string, string> = { date_source: dateSource, date_mode: source ? 'absolute' : 'absent', date_month: 'm10', date_day: 'd26', date_year: 'y2026', date_anchor: 'absent', date_weekday: 'absent', date_week: 'absent' };
  const kinds: Record<string, string> = { timeZone: 'zone', time: 'time', phone: 'phone', url: 'url', managementUrl: 'url', email: 'email', reference: 'reference', offset: 'offset', duration: 'duration' };
  return Object.fromEntries(Object.entries(request.questions).map(([name, question]: [string, any]) => {
    let choice = values[name] ?? defaults[name];
    if (name.startsWith('need_')) choice = values[name] ?? (name.slice(5) === values.action ? 'ready' : Object.hasOwn(question.criteria, 'no') ? 'no' : 'ready');
    if (name.startsWith('change_')) choice = correcting && name === 'change_time' ? 'change' : 'keep';
    if (name.startsWith('span_')) choice = spans.findLast((span: any) => span.kind === kinds[name.slice(5)] && (!correcting || span.turnId === request.state.sourceTurnId))?.id ?? 'absent';
    if (!choice || !Object.hasOwn(question.criteria, choice)) choice = Object.hasOwn(question.criteria, 'absent') ? 'absent' : Object.keys(question.criteria)[0];
    return [name, { type: 'choice', choice, confidence: 1, probabilities: Object.fromEntries(Object.keys(question.criteria).map(key => [key, key === choice ? 1 : 0])) }];
  }));
}
