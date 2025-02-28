import { LiveData, Service } from '@toeverything/infra';

import type { VirtualKeyboardProvider } from '../providers/virtual-keyboard';

export class VirtualKeyboardService extends Service {
  readonly visible$ = new LiveData(false);

  readonly height$ = new LiveData(0);

  constructor(
    private readonly virtualKeyboardProvider: VirtualKeyboardProvider
  ) {
    super();
    this._observe();
  }

  private _observe() {
    this.disposables.push(
      this.virtualKeyboardProvider.onChange(info => {
        this.visible$.next(info.visible);
        this.height$.next(info.height);
      })
    );
  }
}
