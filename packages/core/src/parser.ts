import { Observable, map } from 'rxjs';
import { AttributeCommand } from './attribute';
import type { Opper } from './opper';

export interface AttributeCommandParser {
  weight(source: Observable<AttributeCommand>, opper: Opper): Observable<number>;
  overload(source: Observable<AttributeCommand>, opper: Opper): Observable<boolean>;
}

export class DefaultAttributeCommandParser implements AttributeCommandParser {
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
