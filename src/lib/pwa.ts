/** Pantallas de iPhone (puntos CSS × densidad) para las imágenes de arranque de iOS. */
export const SPLASH_SIZES = [
  { w: 440, h: 956, r: 3 }, // 16 Pro Max
  { w: 402, h: 874, r: 3 }, // 16 Pro
  { w: 430, h: 932, r: 3 }, // 14/15 Pro Max, 15/16 Plus
  { w: 393, h: 852, r: 3 }, // 14/15 Pro, 15, 16
  { w: 428, h: 926, r: 3 }, // 12/13 Pro Max, 14 Plus
  { w: 390, h: 844, r: 3 }, // 12, 13, 14
  { w: 375, h: 812, r: 3 }, // X, XS, 11 Pro, mini
  { w: 414, h: 896, r: 3 }, // XS Max, 11 Pro Max
  { w: 414, h: 896, r: 2 }, // XR, 11
  { w: 414, h: 736, r: 3 }, // 6/7/8 Plus
  { w: 375, h: 667, r: 2 }, // SE, 6/7/8
]

export const splashStartupImages = SPLASH_SIZES.map(({ w, h, r }) => ({
  url: `/splash?w=${w * r}&h=${h * r}`,
  media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
}))
