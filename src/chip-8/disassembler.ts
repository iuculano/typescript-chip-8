import { Instruction, InstructionVariables } from './instruction';

// Lookup table for instruction mnemonics. An instruction, when decoded, will
// be assigned an index that corresponds to the mnemonic in this table.
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

export class Disassembler {
  public static disassemble(instruction: Instruction): string {
    const lookup = mnemonicTable[instruction.index];

    return lookup.replace(/(?:nnn|n|x|y|kk)/g,
      (placeholder) => {
        switch (placeholder) {
          // A 12-bit address, will always be three hex digits.
          case 'nnn': return '$' + instruction.variables.nnn.toString(16).toUpperCase().padStart(3, '0');

          // A nibble, will never be more than a single hex digit.
          case 'n': return '$' + instruction.variables.n.toString(16).toUpperCase();

          // Treat register numbers as decimal.
          case 'x': return instruction.variables.x.toString();
          case 'y': return instruction.variables.y.toString();

          // A byte, will always be two hex digits.
          case 'kk': return '$' + instruction.variables.kk.toString(16).toUpperCase().padStart(2, '0');

          default:
            return 'this should never be hit but i want typescript to not whine';
        }
      }
    );
  }
}
