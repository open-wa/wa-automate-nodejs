import * as React from 'react';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import * as AccordionComponents from 'fumadocs-ui/components/accordion';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import {
  GetLicenseButton,
  LicenseBadge,
  LicensedFeatureCallout,
  type LicenseTier,
} from '@/components/licensing';
import {
  Callout,
  ComparisonTable,
  FAQ,
  Step,
  Steps,
  PackageManagerTabs,
} from '@/components/docs-primitives';

function flattenText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return flattenText(node.props.children);
  }

  return '';
}

function getHeadingLicenseMeta(text: string): {
  title: string;
  tier: LicenseTier | null;
} {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  const match = trimmed.match(/^(.*?)(?:\s+[—-]\s+)(insiders|restricted)\s*$/i);

  if (!match) {
    return {
      title: text,
      tier: null,
    };
  }

  return {
    title: match[1].trim(),
    tier: match[2].toLowerCase() as LicenseTier,
  };
}

function getBlockquoteLicenseTier(text: string): LicenseTier | null {
  const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();

  if (!normalized.startsWith('license:')) return null;
  if (normalized.includes('insiders license')) return 'insiders';
  if (normalized.includes('restricted license')) return 'restricted';

  return null;
}

function LicenseAwareBlockquote(
  props: React.ComponentPropsWithoutRef<'blockquote'>,
) {
  const text = flattenText(props.children);
  const tier = getBlockquoteLicenseTier(text);

  if (tier) {
    return <LicensedFeatureCallout tier={tier} className="my-6" />;
  }

  return (
    <blockquote
      {...props}
      className="my-6 rounded-2xl border-backstitch bg-card px-5 py-4 text-muted-foreground relative overflow-hidden shadow-stipple"
    >
      <div className="absolute inset-0 bg-dither opacity-[0.05] pointer-events-none" />
      <div className="relative z-10">{props.children}</div>
    </blockquote>
  );
}

function createLicensedHeading(
  BaseHeading: React.ElementType,
) {
  return function LicensedHeading(props: { children?: React.ReactNode }) {
    const meta = getHeadingLicenseMeta(flattenText(props.children));

    if (!meta.tier) {
      return <BaseHeading {...props} />;
    }

    return (
      <BaseHeading {...props}>
        <span className="inline-flex flex-wrap items-center gap-2 align-middle">
          <span>{meta.title}</span>
          <LicenseBadge tier={meta.tier} />
        </span>
      </BaseHeading>
    );
  };
}

const BaseH2 =
  (defaultMdxComponents.h2 as React.ElementType | undefined) ??
  ((props: React.ComponentPropsWithoutRef<'h2'>) => <h2 {...props} />);
const BaseH3 =
  (defaultMdxComponents.h3 as React.ElementType | undefined) ??
  ((props: React.ComponentPropsWithoutRef<'h3'>) => <h3 {...props} />);
const BaseH4 =
  (defaultMdxComponents.h4 as React.ElementType | undefined) ??
  ((props: React.ComponentPropsWithoutRef<'h4'>) => <h4 {...props} />);

export const docsMdxComponents = {
  ...defaultMdxComponents,
  ...AccordionComponents,
  ...TabsComponents,
  blockquote: LicenseAwareBlockquote,
  h2: createLicensedHeading(BaseH2),
  h3: createLicensedHeading(BaseH3),
  h4: createLicensedHeading(BaseH4),
  TypeTable,
  GetLicenseButton,
  LicenseBadge,
  LicensedFeatureCallout,
  Callout,
  ComparisonTable,
  FAQ,
  Step,
  Steps,
  PackageManagerTabs,
};
