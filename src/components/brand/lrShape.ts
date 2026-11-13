export type PathCommand =
  | ['M', number, number]
  | ['L', number, number]
  | ['H', number]
  | ['V', number]
  | ['C', number, number, number, number, number, number]
  | ['Q', number, number, number, number]
  | ['Z'];

export const LETTER_L: PathCommand[] = [
  ['M', 343, 207],
  ['L', 462, 300],
  ['L', 455, 604],
  ['H', 622],
  ['L', 722, 710],
  ['H', 346],
  ['Z'],
];

export const LETTER_R: PathCommand[] = [
  ['M', 530, 270],
  ['H', 762],
  ['C', 858, 270, 906, 312, 906, 362],
  ['C', 906, 418, 862, 446, 812, 452],
  ['L', 998, 732],
  ['L', 818, 720],
  ['L', 686, 516],
  ['H', 600],
  ['V', 438],
  ['H', 530],
  ['Z'],
  ['M', 600, 332],
  ['H', 755],
  ['C', 785, 332, 805, 346, 805, 380],
  ['C', 805, 412, 785, 437, 755, 437],
  ['H', 600],
  ['Z'],
];

export const LOGO_VIEW_BOX = { x: 320, y: 190, width: 700, height: 560 };
export const LOGO_CENTER = { x: 670.5, y: 469.5 };

export function commandsToPath(commands: PathCommand[]) {
  return commands.map((command) => command.join(' ')).join(' ');
}
