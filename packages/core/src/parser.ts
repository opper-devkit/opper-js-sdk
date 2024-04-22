import { Observable, bufferCount, filter, map } from 'rxjs';
import { AttributeCommand } from './attribute';

export interface AttributeCommandParser {
  readonly id: number;
  weight(source: Observable<AttributeCommand>): Observable<number>;
  stableWeight(source: Observable<AttributeCommand>): Observable<number>;
  unstableWeight(source: Observable<AttributeCommand>): Observable<number>;
  overload(source: Observable<AttributeCommand>): Observable<boolean>;
}

export class DefaultAttributeCommandParser implements AttributeCommandParser {
  readonly id = 1;

  weight(source: Observable<AttributeCommand>): Observable<number> {
    return source.pipe(
      map(cmd => +cmd.value[0])
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
      bufferCount(5, 1),
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
