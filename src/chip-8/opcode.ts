import { Instruction } from "./instruction";

export type Opcode = number;

export class OpcodeDecoder {
  public static decode(opcode: Opcode): Instruction {
    // Can calculate these all up front, they'll be used to determine the
    // instruction we're working with.
    const highNibble = (opcode & 0xF000) >>> 12;
    const nnn = opcode & 0x0FFF;
    const n = opcode & 0x000F;
    const x = (opcode & 0x0F00) >>> 8;
    const y = (opcode & 0x00F0) >>> 4;
    const kk = opcode & 0x00FF;

    // Index lets us decouple variable parts into just being lookups.
    // For example, the disassembly, instruction implementations, etc.
    let index = 0;
    switch(highNibble) {
      case 0x00:
        switch (n) {
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
        switch (n) {
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
        switch (kk) {
          case 0x9E: index = 24; break; // Ex9E - SKP Vx
          case 0xA1: index = 25; break; // ExA1 - SKNP Vx
        }
        break;

      case 0x0F:
        switch (kk) {
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

    return {
      index: index,
      highNibble: highNibble,
      nnn: nnn,
      n: n,
      x: x,
      y: y,
      kk: kk,
    };
  }
}



//export class OpcodeDecoder {
//  private _index!: number;
//  private _variables!: InstructionVariables;
//
//  constructor(opcode: number) {
//    this.fromOpcode(opcode);
//  }
//
//  public static decode(opcode: number) {
//    // Break it down into into the various encodings that are used.
//    this._variables = {
//      highNibble: (opcode & 0xF000) >>> 12,
//      nnn: opcode & 0x0FFF,
//      n: opcode & 0x000F,
//      x: (opcode & 0x0F00) >>> 8, // beware the >>
//      y: (opcode & 0x00F0) >>> 4,
//      kk: opcode & 0x00FF,
//    }
//
//    // Index lets us decouple variable parts into just being lookups.
//    // For example, the disassembly, instruction implementations, etc.
//    let index = 0;
//    switch(this._variables.highNibble) {
//      case 0x00:
//        switch (this._variables.n) {
//          case 0x00: index = 0; break; // 00E0 - CLS
//          case 0x0E: index = 1; break; // 00EE - RET
//          default: index = 2; break;   // 0nnn - SYS
//        }
//        break;
//
//      case 0x01: index = 3; break; // 1nnn - JP addr
//      case 0x02: index = 4; break; // 2nnn - CALL addr
//      case 0x03: index = 5; break; // 3xkk - SE Vx, byte
//      case 0x04: index = 6; break; // 4xkk - SNE Vx, byte
//      case 0x05: index = 7; break; // 5xy0 - SE Vx, Vy
//      case 0x06: index = 8; break; // 6xkk - LD Vx, byte
//      case 0x07: index = 9; break; // 7xkk - ADD Vx, byte
//
//      case 0x08:
//        switch (this._variables.n) {
//          case 0x00: index = 10; break; // 8xy0 - LD Vx, Vy
//          case 0x01: index = 11; break; // 8xy1 - OR Vx, Vy
//          case 0x02: index = 12; break; // 8xy2 - AND Vx, Vy
//          case 0x03: index = 13; break; // 8xy3 - XOR Vx, Vy
//          case 0x04: index = 14; break; // 8xy4 - ADD Vx, Vy
//          case 0x05: index = 15; break; // 8xy5 - SUB Vx, Vy
//          case 0x06: index = 16; break; // 8xy6 - SHR Vx
//          case 0x07: index = 17; break; // 8xy7 - SUBN Vx, Vy
//          case 0x0E: index = 18; break; // 8xyE - SHL Vx
//        }
//        break;
//
//      case 0x09: index = 19; break; // 9xy0 - SNE Vx, Vy
//      case 0x0A: index = 20; break; // Annn - LD I, addr
//      case 0x0B: index = 21; break; // Bnnn - JP V0, addr
//      case 0x0C: index = 22; break; // Cxkk - RND Vx, byte
//      case 0x0D: index = 23; break; // Dxyn - DRW Vx, Vy, nibble
//
//      case 0x0E:
//        switch (this._variables.kk) {
//          case 0x9E: index = 24; break; // Ex9E - SKP Vx
//          case 0xA1: index = 25; break; // ExA1 - SKNP Vx
//        }
//        break;
//
//      case 0x0F:
//        switch (this._variables.kk) {
//          case 0x07: index = 26; break; // Fx07 - LD Vx, DT
//          case 0x0A: index = 27; break; // Fx0A - LD Vx, K
//          case 0x15: index = 28; break; // Fx15 - LD DT, Vx
//          case 0x18: index = 29; break; // Fx18 - LD ST, Vx
//          case 0x1E: index = 30; break; // Fx1E - ADD I, Vx
//          case 0x29: index = 31; break; // Fx29 - LD F, Vx
//          case 0x33: index = 32; break; // Fx33 - LD B, Vx
//          case 0x55: index = 33; break; // Fx55 - LD [I], Vx
//          case 0x65: index = 34; break; // Fx65 - LD Vx, [I]
//        }
//        break;
//    }
//
//    this._index = index;
//  }
//
//  public get index(): number {
//    return this._index;
//  }
//
//  public get variables(): InstructionVariables {
//    return this._variables;
//  }
////}
//
