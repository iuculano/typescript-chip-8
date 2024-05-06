import { Rom } from './chip-8/rom';
import { Disassembler } from './chip-8/disassembler';
import { OpcodeDecoder } from './chip-8/opcode';
import { Processor } from './chip-8/processor';

const rom = new Rom();
rom.fromFile('./roms/IBM Logo.ch8');

const cpu = new Processor();
cpu.mapRom(rom);

for (let i = 0; i < 1000; i++) {
  cpu.step(true);
}

//for (const opcode of rom.generateOpcodes()) {
//  const instruction = OpcodeDecoder.decode(opcode);
//  const output = Disassembler.disassemble(instruction);
//  console.log(output);
//}
