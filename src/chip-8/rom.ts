import * as fs from 'fs';

export class Rom {
  private _data!: Buffer;

  constructor(path?: string) {
    if (path) {
      this.fromFile(path);
    }
  }

  public fromFile(path: string): void {
    this._data = fs.readFileSync(path);
  }

  public *generateOpcodes(): Generator<number> {
    for (let i = 0; i < this._data.length; i += 2) {
      yield (this._data[i] << 8) | this._data[i + 1];
    }
  }

  public get data(): Buffer {
    return this._data;
  }
}
