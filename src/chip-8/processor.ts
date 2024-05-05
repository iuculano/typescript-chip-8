import * as fs from 'fs';

const mnemonicTable = [
  'CLS',
  'RET',
  'SYS nnn',
  'JP nnn',
  'CALL nnn',
  'SE Vx, kk',
  'SNE Vx, kk',
  'SE Vx, Vy',
  'LD Vx, kk',
  'ADD Vx, kk',
  'LD Vx, Vy',
  'OR Vx, Vy',
  'AND Vx, Vy',
  'XOR Vx, Vy',
  'ADD Vx, Vy',
  'SUB Vx, Vy',
  'SHR Vx',
  'SUBN Vx, Vy',
  'SHL Vx',
  'SNE Vx, Vy',
  'LD I, kk',
  'JP V0, kk',
  'RND Vx, kk',
  'DRW Vx, Vy, n',
  'SKP Vx',
  'SKNP Vx',
  'LD Vx, DT',
  'LD Vx, K',
  'LD DT, Vx',
  'LD ST, Vx',
  'ADD I, Vx',
  'LD F, Vx',
  'LD B, Vx',
  'LD [I], Vx',
  'LD Vx, [I]',
];

interface DecodedInstruction {
  highNibble: number; // 1111000000000000
  nnn: number;        // 0000111111111111
  n: number;          // 0000000000001111
  x: number;          // 0000111100000000
  y: number;          // 0000000011110000
  kk:number;          // 0000000011111111

  [key: string]: number;
}

class Instruction {
  private index: number;
  private decoded: DecodedInstruction;

  constructor(index: number, decoded: DecodedInstruction) {
    this.index = index;
    this.decoded = decoded;
  }

  public get mnemonic() {
    const lookup = mnemonicTable[this.index];

    // There's no zero padding (and can't be like this)
    return lookup.replace(/(?:nnn|n|x|y|kk)/g,
      (placeholder) => this.decoded[placeholder].toString(16).toUpperCase()
    );
  }
}

export class Processor {
  memory!: Uint8Array;
  registers!: Uint8Array;
  display!: Uint8Array;
  vf!: number;
  addr!: number; // The I (index?) register
  pc!: number;
  stack!: Uint16Array;
  sp!: number;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.memory = new Uint8Array(0xFFFF);
    this.registers = new Uint8Array(16);
    this.display = new Uint8Array(64 * 32);
    this.vf = 0;
    this.addr = 0;
    this.pc = 0x200;
    this.stack = new Uint16Array(16);
    this.sp = this.stack.length - 1;
  }

  readRom(path: string): void {
    const data = fs.readFileSync(path);
    this.memory.set(data, 0x200);
  }

  private push(value: number): void {
    this.stack[this.sp] = value;
    this.sp -= 2;
  }

  private pop(): number {
    const data = this.stack[this.sp];
    this.sp += 2;

    return data;
  }

  fetch(): number {
    // Shuffle the opcode around, it's stored as big endian so the byte order
    // needs to be flipped.
    return (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
  }

  decode(opcode: number): Instruction {
    // Break it down into into the various encodings that are used.
    const decoded: DecodedInstruction = {
      highNibble: (opcode & 0xF000) >>> 12,
      nnn: opcode & 0x0FFF,
      n: opcode & 0x000F,
      x: (opcode & 0x0F00) >>> 8, // beware the >>
      y: (opcode & 0x00F0) >>> 4,
      kk: opcode & 0x00FF,
    }

    // Index lets us decouple variable parts into just being lookups.
    // For example, the disassembly, instruction implementations, etc.
    let index = 0;
    switch(decoded.highNibble) {
      case 0x00:
        switch (decoded.n) {
          case 0x00: index = 0; break; // 00E0 - CLS
          case 0x0E: index = 1; break; // 00EE - RET
          default: index = 2; break;   // 0nnn - SYS
        }
        break;

      case 0x01: index = 3; break; // 1nnn - JP addr
      case 0x02: index = 4; break; // 2nnn - CALL addr
      case 0x03: index = 5; break; // 3xkk - SE Vx, byte
      case 0x04: index = 6; break; // 4xkk - SNE Vx, byte
      case 0x05: index = 7; break; // 5xy0 - SE Vx, Vy
      case 0x06: index = 8; break; // 6xkk - LD Vx, byte
      case 0x07: index = 9; break; // 7xkk - ADD Vx, byte

      case 0x08:
        switch (decoded.n) {
          case 0x00: index = 10; break; // 8xy0 - LD Vx, Vy
          case 0x01: index = 11; break; // 8xy1 - OR Vx, Vy
          case 0x02: index = 12; break; // 8xy2 - AND Vx, Vy
          case 0x03: index = 13; break; // 8xy3 - XOR Vx, Vy
          case 0x04: index = 14; break; // 8xy4 - ADD Vx, Vy
          case 0x05: index = 15; break; // 8xy5 - SUB Vx, Vy
          case 0x06: index = 16; break; // 8xy6 - SHR Vx
          case 0x07: index = 17; break; // 8xy7 - SUBN Vx, Vy
          case 0x0E: index = 18; break; // 8xyE - SHL Vx
        }
        break;

      case 0x09: index = 19; break; // 9xy0 - SNE Vx, Vy
      case 0x0A: index = 20; break; // Annn - LD I, addr
      case 0x0B: index = 21; break; // Bnnn - JP V0, addr
      case 0x0C: index = 22; break; // Cxkk - RND Vx, byte
      case 0x0D: index = 23; break; // Dxyn - DRW Vx, Vy, nibble

      case 0x0E:
        switch (decoded.kk) {
          case 0x9E: index = 24; break; // Ex9E - SKP Vx
          case 0xA1: index = 25; break; // ExA1 - SKNP Vx
        }
        break;

      case 0x0F:
        switch (decoded.kk) {
          case 0x07: index = 26; break; // Fx07 - LD Vx, DT
          case 0x0A: index = 27; break; // Fx0A - LD Vx, K
          case 0x15: index = 28; break; // Fx15 - LD DT, Vx
          case 0x18: index = 29; break; // Fx18 - LD ST, Vx
          case 0x1E: index = 30; break; // Fx1E - ADD I, Vx
          case 0x29: index = 31; break; // Fx29 - LD F, Vx
          case 0x33: index = 32; break; // Fx33 - LD B, Vx
          case 0x55: index = 33; break; // Fx55 - LD [I], Vx
          case 0x65: index = 34; break; // Fx65 - LD Vx, [I]
        }
        break;
    }

    return new Instruction(index, decoded);
  }

  disassemble(): string[] {
    const pc = this.pc;
    const output: string[] = [];

    do {
      const opcode = this.fetch();
      this.pc += 2;

      if (opcode === 0) {
        continue;
      }

      const instr = this.decode(opcode);
      output.push(instr.mnemonic);
    } while (this.pc <= 0x0FFF);

    this.pc = pc;
    return output;
  }
}
