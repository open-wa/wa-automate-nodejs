/**
 * The seam between a concept's flow and real lead handling. Concepts have no
 * backend, so submitLead keeps the lead in this tab (sessionStorage) and
 * resolves the way an API would, letting the flow show its confirmation. When a
 * concept is promoted, replace the body with the real call (CRM, the product's
 * API, email) and keep the signature, so no component changes.
 */
export type Lead = Record<string, string | number | boolean | undefined>;

export interface LeadReceipt {
  id: string;
  demo: boolean;
}

export async function submitLead(kind: string, lead: Lead): Promise<LeadReceipt> {
  const id = `demo_${Date.now().toString(36)}`;
  try {
    sessionStorage.setItem(`lead:${id}`, JSON.stringify({ kind, ...lead, at: new Date().toISOString() }));
  } catch {
    // Private mode or storage disabled: the demo flow still completes.
  }
  await new Promise((resolve) => setTimeout(resolve, 350));
  return { id, demo: true };
}
