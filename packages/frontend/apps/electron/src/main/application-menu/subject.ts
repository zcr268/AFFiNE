import { Subject } from 'rxjs';

export const applicationMenuSubjects = {
  newPageAction$: new Subject<'page' | 'edgeless'>(),
  openJournal$: new Subject<void>(),
  openAboutPageInSettingModal$: new Subject<void>(),
};
