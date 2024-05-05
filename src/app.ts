import { Rom } from "./chip-8/rom";
import { Disassembler } from "./chip-8/disassembler";
import { Instruction } from "./chip-8/instruction";

const rom = new Rom();
rom.fromFile('./roms/IBM Logo.ch8');

for (const opcode of rom.generateOpcodes()) {
  const instruction = new Instruction(opcode);
  const output = Disassembler.disassemble(instruction);
  console.log(output);
}
