import { Rom } from './chip-8/rom';
import { Disassembler } from './chip-8/disassembler';
import { OpcodeDecoder } from './chip-8/opcode';

const rom = new Rom();
rom.fromFile('./roms/IBM Logo.ch8');

for (const opcode of rom.generateOpcodes()) {
  const instruction = OpcodeDecoder.decode(opcode);
  const output = Disassembler.disassemble(instruction);
  console.log(output);
}
