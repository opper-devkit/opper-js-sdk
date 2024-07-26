import { Observable, map } from 'rxjs';
import { AttributeCommand } from './attribute';

export interface AttributeCommandParser {
  readonly id: number;
  weight(source: Observable<AttributeCommand>): Observable<number>;
  overload(source: Observable<AttributeCommand>): Observable<boolean>;
}

export class DefaultAttributeCommandParser implements AttributeCommandParser {
  readonly id = 1;

  weight(source: Observable<AttributeCommand>): Observable<number> {
    return source.pipe(
      map(cmd => +cmd.value[0])
    );
  }

  overload(source: Observable<AttributeCommand>): Observable<boolean> {
    return source.pipe(
      map(() => false) // TODO
    );
  }

}
