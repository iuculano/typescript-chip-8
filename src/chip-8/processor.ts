import { Instruction } from './instruction';
import { InstructionSet } from './instruction-set';

export class Processor {
  public memory!: Uint8Array;
  public registers!: Uint8Array;
  public display!: Uint8Array;
  public vf!: number;
  public addr!: number; // The I (index?) register
  public pc!: number;
  public stack!: Uint16Array;
  public sp!: number;

  private instructionSet: InstructionSet;

  constructor() {
    this.reset();
    this.instructionSet = new InstructionSet(this);
  }

  // Reset the processor state.
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

  // Fetch the next opcode from memory.
  fetch(): number {
    // Chip-8 is big-endian, need to swap the byte order.
    // Each opcode is 2 bytes.
    const opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
    return opcode;
  }

  // Decode the opcode into an instruction.
  decode(opcode: number): Instruction {
    const instruction = new Instruction(opcode);
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
