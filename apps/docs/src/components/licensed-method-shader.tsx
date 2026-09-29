import { MeshGradient } from '@paper-design/shaders-react';
import type { LicenseTier } from '@/lib/site';

const colors = {
  insiders: ['#dceaff', '#8eb7ff', '#f4fdff', '#c6f1ff'],
  restricted: ['#ffe8a3', '#e7b64a', '#fffbee', '#ffd46b'],
};

export default function LicensedMethodShader({ tier }: { tier: LicenseTier }) {
  return <MeshGradient colors={colors[tier]} speed={0.12} distortion={0.4} swirl={0.25}
    grainMixer={0} grainOverlay={0.025} maxPixelCount={140000}
    width="100%" height="100%" className="licensed-method-canvas" />;
}
