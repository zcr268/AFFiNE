import { notify } from '@affine/component';
import { SettingRow } from '@affine/component/setting-components';
import { Button } from '@affine/component/ui/button';
import { useAsyncCallback } from '@affine/core/components/hooks/affine-async-hooks';
import { useSystemOnline } from '@affine/core/components/hooks/use-system-online';
import { DesktopApiService } from '@affine/core/modules/desktop-api';
import type { Workspace } from '@affine/core/modules/workspace';
import { useI18n } from '@affine/i18n';
import { universalId } from '@affine/nbstore';
import track from '@affine/track';
import { LiveData, useLiveData, useService } from '@toeverything/infra';
import { useMemo, useState } from 'react';

interface ExportPanelProps {
  workspace: Workspace;
}

export const DesktopExportPanel = ({ workspace }: ExportPanelProps) => {
  const t = useI18n();
  const [saving, setSaving] = useState(false);
  const isOnline = useSystemOnline();
  const desktopApi = useService(DesktopApiService);
  const isLocalWorkspace = workspace.flavour === 'local';

  const docSyncState = useLiveData(
    useMemo(() => {
      return workspace
        ? LiveData.from(workspace.engine.doc.state$, null).throttleTime(500)
        : null;
    }, [workspace])
  );

  const blobSyncState = useLiveData(
    useMemo(() => {
      return workspace
        ? LiveData.from(workspace.engine.blob.state$, null).throttleTime(500)
        : null;
    }, [workspace])
  );

  const docSynced = !docSyncState?.syncing;
  const blobSynced =
    !blobSyncState || blobSyncState.synced === blobSyncState.total;
  const [fullSynced, setFullSynced] = useState(false);

  const shouldWaitForFullSync =
    isLocalWorkspace || !isOnline || (fullSynced && docSynced && blobSynced);
  const fullSyncing = fullSynced && (!docSynced || !blobSynced);

  const fullSync = useAsyncCallback(async () => {
    // NOTE: doc full sync is always started by default
    // await workspace.engine.doc.waitForSynced();
    workspace.engine.blob.fullDownload().catch(() => {
      /* noop */
    });
    setFullSynced(true);
  }, [workspace.engine.blob]);

  const onExport = useAsyncCallback(async () => {
    if (saving) {
      return;
    }
    setSaving(true);
    try {
      track.$.settingsPanel.workspace.export({
        type: 'workspace',
      });

      const result = await desktopApi.handler?.dialog.saveDBFileAs(
        universalId({
          peer: workspace.flavour,
          type: 'workspace',
          id: workspace.id,
        }),
        workspace.name$.getValue() ?? 'db'
      );
      if (result?.error) {
        throw new Error(result.error);
      } else if (!result?.canceled) {
        notify.success({ title: t['Export success']() });
      }
    } catch (e: any) {
      notify.error({ title: t['Export failed'](), message: e.message });
    } finally {
      setSaving(false);
    }
  }, [desktopApi, saving, t, workspace]);

  if (!shouldWaitForFullSync) {
    return (
      <SettingRow name={t['Export']()} desc={t['Full Sync Description']()}>
        <Button
          data-testid="export-affine-full-sync"
          onClick={fullSync}
          loading={fullSyncing}
        >
          {t['Full Sync']()}
        </Button>
      </SettingRow>
    );
  }

  const button =
    isLocalWorkspace || isOnline ? t['Export']() : t['Export(Offline)']();
  const desc =
    isLocalWorkspace || isOnline
      ? t['Export Description']()
      : t['Export Description(Offline)']();

  return (
    <SettingRow name={t['Export']()} desc={desc}>
      <Button
        data-testid="export-affine-backup"
        onClick={onExport}
        disabled={saving}
      >
        {button}
      </Button>
    </SettingRow>
  );
};
