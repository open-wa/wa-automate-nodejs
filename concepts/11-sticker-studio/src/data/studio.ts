/** Studio samples and the curated effect shelf. Effect names are real recipes from @open-wa/stickers 5.5. */
export const samples = [
  { id: "dog", label: "Dog", file: "dog.jpg", alt: "Sample photo: a scruffy terrier on a lilac backdrop (generated illustration)" },
  { id: "coffee", label: "Coffee", file: "coffee.jpg", alt: "Sample photo: a latte with a heart on a yellow backdrop (generated illustration)" },
  { id: "cake", label: "Cake", file: "cake.jpg", alt: "Sample photo: a pastel cake with three candles (generated illustration)" },
  { id: "highfive", label: "High five", file: "team-photo.jpg", alt: "Sample photo: four hands meeting in a high five (generated illustration)" },
] as const;

export const effects = [
  { name: "comic", hint: "Posterised with ink outlines", animated: false },
  { name: "sparkle", hint: "Twinkling four-point sparkles", animated: true },
  { name: "polaroid", hint: "Instant-photo frame", animated: false },
  { name: "stars", hint: "Cut to a five-point star", animated: false },
  { name: "vaporwave", hint: "Neon duotone and scanlines", animated: false },
  { name: "gold", hint: "Brown to gold to cream", animated: false },
  { name: "stamp", hint: "Two-tone ink with a perforated edge", animated: false },
  { name: "pixelate", hint: "32px grid", animated: false },
  { name: "kaleidoscope", hint: "Six mirrored sectors", animated: false },
  { name: "sketch", hint: "Pencil edges on paper", animated: false },
  { name: "squish", hint: "Bouncy squash", animated: true },
  { name: "rainbow", hint: "Cycling rainbow blend", animated: true },
  { name: "shake", hint: "Wobbly loop", animated: true },
  { name: "newspaper", hint: "Halftone front page", animated: false },
] as const;

export const defaultEffects = ["polaroid"];
