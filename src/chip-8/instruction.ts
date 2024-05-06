// http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#3.0
export interface Instruction {
  readonly index: number;      // Our index into the instruction set.
  readonly highNibble: number; // 1111000000000000
  readonly nnn: number;        // 0000111111111111
  readonly n: number;          // 0000000000001111
  readonly x: number;          // 0000111100000000
  readonly y: number;          // 0000000011110000
  readonly kk:number;          // 0000000011111111

  [key: string]: number;
}
