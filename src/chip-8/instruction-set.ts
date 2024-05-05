import { Processor } from './processor';
import { InstructionVariables } from './instruction';

type Operation = (data: InstructionVariables) => void;

export class InstructionSet {
  private processor: Processor;
  private operationTable: Operation[] = [
    this.cls,
    this.ret,
    this.call,
    this.se_vkk,
    this.sne_vkk,
    this.se_xy,
    this.ld_xkk,
    this.add_xkk,
    this.ld_xy,
    this.or_xy,
    this.and_xy,
    this.xor_xy,
    this.add_xy,
    this.sub_xy,
    this.shr_x,
  ];

  constructor(processor: Processor) {
    this.processor = processor;
  }

  public lookup(index: number): Operation {
    return this.operationTable[index];
  }

  // Couple helpers.
  private push(value: number): void {
    this.processor.stack[this.processor.sp] = value;
    this.processor.sp--;
  }

  private pop(): number {
    const data = this.processor.stack[this.processor.sp];
    this.processor.sp++;

    return data;
  }

  // http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#3.1
  // https://en.wikipedia.org/wiki/CHIP-8
  private cls(data: InstructionVariables): void {
    this.processor.display.fill(0);
  }

  private ret(data: InstructionVariables): void {
    this.processor.pc = this.pop();
  }

  private call(data: InstructionVariables): void {
    this.push(this.processor.pc);
    this.processor.pc = data.nnn;
  }

  private se_vkk(data: InstructionVariables): void {
    if (this.processor.registers[data.x] === data.kk) {
      this.processor.pc += 2;
    }
  }

  private sne_vkk(data: InstructionVariables): void {
    if (this.processor.registers[data.x] !== data.kk) {
      this.processor.pc += 2;
    }
  }

  private se_xy(data: InstructionVariables): void {
    if (this.processor.registers[data.x] === this.processor.registers[data.y]) {
      this.processor.pc += 2;
    }
  }

  private ld_xkk(data: InstructionVariables): void {
    this.processor.registers[data.x] = data.kk;
  }

  private add_xkk(data: InstructionVariables): void {
    this.processor.registers[data.x] += data.kk;
  }

  private ld_xy(data: InstructionVariables): void {
    this.processor.registers[data.x] = this.processor.registers[data.y];
  }

  private or_xy(data: InstructionVariables): void {
    this.processor.registers[data.x] |= this.processor.registers[data.y];
  }

  private and_xy(data: InstructionVariables): void {
    this.processor.registers[data.x] &= this.processor.registers[data.y];
  }

  private xor_xy(data: InstructionVariables): void {
    this.processor.registers[data.x] ^= this.processor.registers[data.y];
  }

  private add_xy(data: InstructionVariables): void {
    const result = this.processor.registers[data.x] + this.processor.registers[data.y];

    this.processor.vf = result > 0xFF ? 1 : 0;;
    this.processor.registers[data.x] = result & 0xFF;
  }

  // Is this right?
  private sub_xy(data: InstructionVariables): void {
    this.processor.vf = this.processor.registers[data.x] > this.processor.registers[data.y] ? 1 : 0;
    this.processor.registers[data.x] -= this.processor.registers[data.y];
  }

  private shr_x(data: InstructionVariables): void {
    this.processor.vf = this.processor.registers[data.x] & 0x01;
    this.processor.registers[data.x] >>= 1;
  }
}
