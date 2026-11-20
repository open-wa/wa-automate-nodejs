import avif184 from '@/assets/mascots/wally-quickstart-184.avif?url';
import avif360 from '@/assets/mascots/wally-quickstart-360.avif?url';
import avif460 from '@/assets/mascots/wally-quickstart-460.avif?url';
import webp184 from '@/assets/mascots/wally-quickstart-184.webp?url';
import webp360 from '@/assets/mascots/wally-quickstart-360.webp?url';
import webp460 from '@/assets/mascots/wally-quickstart-460.webp?url';

// Resized from public/mascots/wally-quickstart-transparent.png (1254 px, 1.3 MB),
// which stays for the OG image renderer. The imports are fingerprinted under
// /assets/, so browsers cache them for a year.
const avifSet = `${avif184} 184w, ${avif360} 360w, ${avif460} 460w`;
const webpSet = `${webp184} 184w, ${webp360} 360w, ${webp460} 460w`;

/**
 * Wally at the quick-start desk. `sizes` describes the rendered CSS width so
 * the browser picks the smallest file for the screen's pixel density.
 */
export function WallyPicture({
  width,
  sizes = `${width}px`,
  alt,
  loading = 'eager',
}: Readonly<{
  width: number;
  sizes?: string;
  alt: string;
  /** `priority` asks for the image early because it is above the fold. */
  loading?: 'priority' | 'eager' | 'lazy';
}>) {
  return (
    <picture className="wally-picture">
      <source type="image/avif" srcSet={avifSet} sizes={sizes} />
      <source type="image/webp" srcSet={webpSet} sizes={sizes} />
      <img
        src={webp360}
        alt={alt}
        width={width}
        height={width}
        decoding="async"
        {...(loading === 'priority' ? { fetchPriority: 'high' as const } : {})}
        {...(loading === 'lazy' ? { loading: 'lazy' as const } : {})}
      />
    </picture>
  );
}
