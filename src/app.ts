import { Processor } from "./chip-8/processor";

const processor = new Processor();
processor.readRom('./roms/IBM Logo.ch8')

const data = processor.disassemble();
for(const x of data) {
  console.log(x);
}
const test = 1;
