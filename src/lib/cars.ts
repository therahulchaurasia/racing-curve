// Car sprites (Kenney.nl CC0 pixel cars) + a deterministic per-lane picker: the same lane id always
// maps to the same car, stable across renders. Single source — import from here.

export const CAR_SPRITES = [
  "/assets/cars/buggy.png",
  "/assets/cars/formula.png",
  "/assets/cars/police.png",
  "/assets/cars/sedan_vintage.png",
  "/assets/cars/sports_race.png",
  "/assets/cars/sports_red.png",
  "/assets/cars/sports_yellow.png",
  "/assets/cars/vintage.png",
]

export function pickCarSprite(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return CAR_SPRITES[Math.abs(h) % CAR_SPRITES.length]
}
