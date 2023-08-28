import { Observable, bufferCount, filter, map } from 'rxjs';
import { AttributeCommand } from './interface';

export interface AttributeCommandParser {
  readonly id: number;
  readonly name: string;
  weight(source: Observable<AttributeCommand>): Observable<number>;
  stableWeight(source: Observable<AttributeCommand>): Observable<number>;
  unstableWeight(source: Observable<AttributeCommand>): Observable<number>;
  overload(source: Observable<AttributeCommand>): Observable<boolean>;
}

export class DefaultAttributeCommandParser implements AttributeCommandParser {
  readonly id = 1;
  readonly name = 'default';

  weight(source: Observable<AttributeCommand>): Observable<number> {
    return source.pipe(
      map(cmd => +cmd.value[0]),
      filter(o => typeof o === 'number')
    );
  }

  stableWeight(source: Observable<AttributeCommand>): Observable<number> {
    return source.pipe(
      bufferCount(3, 1),
      filter(buf => buf.every(cmd => cmd.value[2] === '1')),
      map(buf => buf.at(-1)!), // 取出最后一个
      source => this.weight(source)
    );
  }

  unstableWeight(source: Observable<AttributeCommand>): Observable<number> {
    return source.pipe(
      bufferCount(3, 1),
      filter(buf => buf.every(cmd => cmd.value[2] === '0')),
      map(buf => buf.at(-1)!), // 取出最后一个
      source => this.weight(source)
    );
  }

  overload(source: Observable<AttributeCommand>): Observable<boolean> {
    return source.pipe(
      map(() => false) // TODO
    );
  }

}
