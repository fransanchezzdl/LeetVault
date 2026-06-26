import { useTranslation } from 'react-i18next';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { useUi } from '../../store/ui';
import { useDeleteProblem, useProblem } from './hooks';

export function DeleteProblemDialog() {
  const { t } = useTranslation(['problems', 'common']);
  const deleteId = useUi((s) => s.deleteId);
  const closeDelete = useUi((s) => s.closeDelete);
  const { data: problem } = useProblem(deleteId);
  const { mutateAsync: removeProblem, isPending } = useDeleteProblem();

  const onConfirm = async () => {
    if (deleteId == null) return;
    await removeProblem(deleteId);
    closeDelete();
  };

  return (
    <Dialog
      open={deleteId != null}
      onOpenChange={(o) => !o && closeDelete()}
      title={t('problems:delete.title')}
      size="sm"
    >
      <p className="text-sm text-fgSoft">
        {problem
          ? t('problems:delete.message', {
              label: `${problem.number != null ? `#${problem.number} · ` : ''}${problem.title}`,
            })
          : t('problems:delete.messageGeneric')}
      </p>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={closeDelete} disabled={isPending}>
          {t('common:actions.cancel')}
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isPending}>
          {isPending ? t('problems:delete.deleting') : t('common:actions.delete')}
        </Button>
      </div>
    </Dialog>
  );
}
