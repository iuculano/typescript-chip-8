import { Instruction } from './instruction';
import { OpcodeDecoder } from './opcode';
import { Rom } from './rom';
import { Disassembler } from './disassembler';

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

  mapRom(rom: Rom): void {
    this.memory.set(rom.data, 0x200);
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

    // Load the character set into memory at 0x0050.
    // http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#2.4
    this.memory.set([
      0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
      0x20, 0x60, 0x20, 0x20, 0x70, // 1
      0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
      0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
      0x90, 0x90, 0xF0, 0x10, 0x10, // 4
      0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
      0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
      0xF0, 0x10, 0x20, 0x40, 0x40, // 7
      0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
      0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
      0xF0, 0x90, 0xF0, 0x90, 0x90, // A
      0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
      0xF0, 0x80, 0x80, 0x80, 0xF0, // C
      0xE0, 0x90, 0x90, 0x90, 0xE0, // D
      0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
      0xF0, 0x80, 0xF0, 0x80, 0x80, // F
    ], 0x0050);
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
    const func = this.operationTable[instruction.index]
    func(instruction);
  }

  // Execute a processor cycle.
  step(trace?: boolean): void {
    const opcode = this.fetch();
    const instruction = this.decode(opcode);

    this.execute(instruction);
    this.pc += 2;

    // Horrorshow
    if (trace) {
      const output = Disassembler.disassemble(instruction);

      const pc = `${(this.pc - 2).toString(16).toUpperCase().padStart(4, '0')}`;
      const mnemonic = `${Disassembler.disassemble(instruction).padStart(16, ' ')}`;

      let registers = '';
      for (let i = 0; i < this.registers.length - 1; i++) {
        registers += `${this.registers[i].toString(16).toUpperCase().padStart(2, '0')} `;
      }
      registers.trim();

      const vf = `${this.vf.toString(16).toUpperCase().padStart(2, '0')}`;
      const sp = `${this.sp.toString(16).toUpperCase().padStart(2, '0')}`;
      const addr = `${this.addr.toString(16).toUpperCase().padStart(4, '0')}`;

      console.log(`${pc} | ${mnemonic} | ${registers} | ${vf} | ${sp} | ${addr}`);
    }
  }

  // The instruction set.
  private operationTable: Operation[] = [
    this.sys.bind(this),
    this.cls.bind(this),
    this.ret.bind(this),
    this.jp_nnn.bind(this),
    this.call_nnn.bind(this),
    this.se_xkk.bind(this),
    this.sne_xkk.bind(this),
    this.se_xy.bind(this),
    this.ld_xkk.bind(this),
    this.add_xkk.bind(this),
    this.ld_xy.bind(this),
    this.or_xy.bind(this),
    this.and_xy.bind(this),
    this.xor_xy.bind(this),
    this.add_xy.bind(this),
    this.sub_xy.bind(this),
    this.shr_x.bind(this),
    this.subn_xy.bind(this),
    this.shl_x.bind(this),
    this.sne_xy.bind(this),
    this.ld_nnn.bind(this),
    this.jp_v0_nnn.bind(this),
    this.rnd_xkk.bind(this),
    this.drw_xyn.bind(this),
    this.skp_x.bind(this),
    this.sknp_x.bind(this),
    this.ld_x_dt.bind(this),
    this.ld_x_k.bind(this),
    this.ld_dt_x.bind(this),
    this.ld_st_x.bind(this),
    this.add_i_x.bind(this),
    this.ld_f_x.bind(this),
    this.ld_b_x.bind(this),
    this.ld_i_x.bind(this),
    this.ld_x_i.bind(this)
  ];

  // Couple helpers.
  private push(value: number): void {
    this.stack[this.sp] = value;
    this.sp--;
  }

  private pop(): number {
    const data = this.stack[this.sp];
    this.sp++;

    return data;
  }

  // http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#3.1
  // https://en.wikipedia.org/wiki/CHIP-8
  private sys(instruction: Instruction): void {
    // console.log('Ignoring SYS instruction.');
  }

  private cls(instruction: Instruction): void {
    this.display.fill(0);
  }

  private ret(instruction: Instruction): void {
    this.pc = this.pop();
  }

  private jp_nnn(instruction: Instruction): void {
    // Fudge PC by 2 to account for the increment that will happen after
    this.pc = instruction.nnn - 2;
  }

  private call_nnn(instruction: Instruction): void {
    this.push(this.pc);
    this.pc = instruction.nnn;
  }

  private se_xkk(instruction: Instruction): void {
    if (this.registers[instruction.x] === instruction.kk) {
      this.pc += 2;
    }
  }

  private sne_xkk(instruction: Instruction): void {
    if (this.registers[instruction.x] !== instruction.kk) {
      this.pc += 2;
    }
  }

  private se_xy(instruction: Instruction): void {
    if (this.registers[instruction.x] === this.registers[instruction.y]) {
      this.pc += 2;
    }
  }

  private ld_xkk(instruction: Instruction): void {
    this.registers[instruction.x] = instruction.kk;
  }

  private add_xkk(instruction: Instruction): void {
    this.registers[instruction.x] += instruction.kk;
  }

  private ld_xy(instruction: Instruction): void {
    this.registers[instruction.x] = this.registers[instruction.y];
  }

  private or_xy(instruction: Instruction): void {
    this.registers[instruction.x] |= this.registers[instruction.y];
  }

  private and_xy(instruction: Instruction): void {
    this.registers[instruction.x] &= this.registers[instruction.y];
  }

  private xor_xy(instruction: Instruction): void {
    this.registers[instruction.x] ^= this.registers[instruction.y];
  }

  private add_xy(instruction: Instruction): void {
    const result = this.registers[instruction.x] + this.registers[instruction.y];

    this.vf = result > 0xFF ? 1 : 0;
    this.registers[instruction.x] = result & 0xFF;
  }

  // I think the Cowgod reference is wrong here and it should be a ">=" for
  // the flag check. If they're equal, there is still no borrow is needed.
  private sub_xy(instruction: Instruction): void {
    this.vf = this.registers[instruction.x] >= this.registers[instruction.y] ? 1 : 0;
    this.registers[instruction.x] = this.registers[instruction.x] - this.registers[instruction.y];
  }

  private shr_x(instruction: Instruction): void {
    this.vf = this.registers[instruction.x] & 0x01;
    this.registers[instruction.x] >>= 1;
  }

  private subn_xy(instruction: Instruction): void {
    this.vf = this.registers[instruction.y] >= this.registers[instruction.x] ? 1 : 0;
    this.registers[instruction.x] = this.registers[instruction.y] - this.registers[instruction.x];
  }

  private shl_x(instruction: Instruction): void {
    this.vf = this.registers[instruction.x] & 0x8000;
    this.registers[instruction.x] <<= 1;
  }

  private sne_xy(instruction: Instruction): void {
    if (this.registers[instruction.x] !== this.registers[instruction.y]) {
      this.pc += 2;
    }
  }

  private ld_nnn(instruction: Instruction): void {
    this.addr = instruction.nnn;
  }

  private jp_v0_nnn(instruction: Instruction): void {
    this.pc = this.registers[0] + instruction.nnn;
  }

  private rnd_xkk(instruction: Instruction): void {
    this.registers[instruction.x] = Math.round(Math.random() * 255) & instruction.kk;
  }

  private drw_xyn(instruction: Instruction): void {
    // Each row of a sprite is a byte.
    const xOffset = this.registers[instruction.x];
    const yOffset = this.registers[instruction.y];

    for (let y = 0; y < instruction.n; y++) {
      // I register points to sprite data we're drawing - sprite can be n bytes.
      const spriteByte = this.memory[this.addr + y];

      // Walk the bits in the sprite
      for (let x = 0; x < 8; x++) {
        // Each bit in the byte represents a pixel in the row, check if the
        // appropriate bit is set for the current pixel.
        const bit = (spriteByte & (0x80 >>> x)) ? 1 : 0;

        const wrappedX = (x + xOffset) % DISPLAY_WIDTH;
        const wrappedY = (y + yOffset) % DISPLAY_HEIGHT;
        const displayPointer = (wrappedY * DISPLAY_WIDTH) + wrappedX;

        const currentPixel = this.display[displayPointer];
        const result = currentPixel ^ bit;

        // If result is 0, we blew away a pixel and need to set the VF flag.
        this.vf = (result === 0) ? 1 : 0;
        this.display[displayPointer] = result;
      }
    }
  }

  private skp_x(instruction: Instruction): void {
    // Just stub this out - we have no input implementation yet.
    // This should probably be sufficient to at least boot ROMs.
    console.log('Stubbed instruction: SKP');
  }

  private sknp_x(instruction: Instruction): void {
    // Ditto ^^^
    console.log('Stubbed instruction: SKNP');
  }

  private ld_x_dt(instruction: Instruction): void {
    // TODO:
    // There's no display timer emulated, this will always read 0 currently...
    this.registers[instruction.x] = this.dt;
  }

  private ld_x_k(instruction: Instruction): void {
    // There's no key input yet...
    // this.isHalted = true;
    //this.registers[instruction.x] = this.key;
  }

  private ld_dt_x(instruction: Instruction): void {
    // There's no sound timer yet...
    this.dt = this.registers[instruction.x];
  }

  private ld_st_x(instruction: Instruction): void {
    // There's no sound timer yet...
    this.st = this.registers[instruction.x];
  }

  private add_i_x(instruction: Instruction): void {
    this.addr = this.addr + this.registers[instruction.x];
  }

  private ld_f_x(instruction: Instruction): void {
    // Each character is 5 bytes long, account for this offset.
    this.addr = this.registers[instruction.x] * 5;
  }


  private ld_b_x(instruction: Instruction): void {
    console.log('Stubbed instruction: LD B, Vx');
  }

  private ld_i_x(instruction: Instruction): void {
    // This is a write from registers to memory.
    for (let i = 0; i <= instruction.x; i++) {
      this.memory[this.addr + i] = this.registers[i];
    }
  }

  private ld_x_i(instruction: Instruction): void {
    // This is a read from memory to registers.
    for (let i = 0; i <= instruction.x; i++) {
      this.registers[i] = this.memory[this.addr + i];
    }
  }
}
