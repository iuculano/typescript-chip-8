import { Instruction } from './instruction';
import { OpcodeDecoder } from './opcode';

type Operation = (instruction: Instruction) => void;

const DISPLAY_WIDTH = 64;
const DISPLAY_HEIGHT = 32;

export class Processor {
  private memory!: Uint8Array;
  private registers!: Uint8Array;
  private display!: Uint8Array;
  private vf!: number;
  private addr!: number; // The I (index?) register
  private pc!: number;
  private stack!: Uint16Array;
  private sp!: number;
  private dt!: number;
  private st!: number;

  constructor() {
    this.reset();
  }

  // Reset the processor state.
  reset(): void {
    this.memory = new Uint8Array(0xFFFF);
    this.registers = new Uint8Array(16);
    this.display = new Uint8Array(DISPLAY_HEIGHT * DISPLAY_WIDTH);
    this.vf = 0;
    this.addr = 0;
    this.pc = 0x200;
    this.stack = new Uint16Array(16);
    this.sp = this.stack.length - 1;
    this.dt = 0;
    this.st = 0;
  }

  // Fetch the next opcode from memory.
  fetch(): number {
    // Chip-8 is big-endian, need to swap the byte order.
    // Each opcode is 2 bytes.
    const opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
    return opcode;
  }

  // Decode the opcode into an instruction.
  decode(opcode: number): Instruction {
    const instruction = OpcodeDecoder.decode(opcode);
    return instruction;
  }

  // Execute an instruction.
  execute(instruction: Instruction): void {
    const func = this.instructionSet.lookup(instruction.index);
    func(instruction.variables);
  }

  // Execute a processor cycle.
  step(): void {
    const opcode = this.fetch();
    const instruction = this.decode(opcode);
    this.execute(instruction);
  }
}
