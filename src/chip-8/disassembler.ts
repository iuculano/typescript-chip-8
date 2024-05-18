import { Instruction } from './instruction';
import { formatHex } from './util';

// Lookup table for instruction mnemonics. An instruction, when decoded, will
// be assigned an index that corresponds to the mnemonic in this table.
const mnemonicTable = [
  'SYS nnn',
  'CLS',
  'RET',
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
  'LD I, nnn',
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

enum Placeholder {
  Address = 'nnn', // A 12-bit address, will always be three hex digits.
  Nibble = 'n',    // A nibble, will never be more than a single hex digit.
  RegisterX = 'x', // Represents a register, will always be a decimal digit.
  RegisterY = 'y', // Represents a register, will always be a decimal digit.
  Byte = 'kk',     // A byte, will always be two hex digits.
}

export class Disassembler {
  public static disassemble(instruction: Instruction): string {
    const lookup = mnemonicTable[instruction.index];
    if (!lookup) {
      // It should be impossible to ever return an invalid index - this would
      // mean there's a bug in the opcode decoding logic.
      throw new Error(`Invalid instruction index: ${instruction.index}`);
    }

    // Replace placeholders in the mnemonic with the actual values from the
    // instruction.
    return lookup.replace(/(?:nnn|n|x|y|kk)/g,
      (placeholder) => {
        switch (placeholder) {
          case Placeholder.Address:
            return formatHex(instruction.nnn, 3);

          case Placeholder.Nibble:
            return formatHex(instruction.n, 1);

          case Placeholder.RegisterX:
            return instruction.x.toString();

          case Placeholder.RegisterY:
            return instruction.y.toString();

          case Placeholder.Byte:
            return formatHex(instruction.kk, 2);

          default:
            return 'this should never be hit but i want typescript to not whine';
        }
      }
    );
  }
}
