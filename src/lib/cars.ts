// Car sprites (Kenney.nl CC0 pixel cars) + a random picker. The chosen sprite is stored on the lane
// (see Lane type), so it stays stable across the lane's per-frame race renders while still varying
// from one page load to the next. Single source — import from here.

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

export function pickRandomCarSprite(): string {
  return CAR_SPRITES[Math.floor(Math.random() * CAR_SPRITES.length)]
}
