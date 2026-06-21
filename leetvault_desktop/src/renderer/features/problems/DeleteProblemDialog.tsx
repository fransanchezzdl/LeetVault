import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { useUi } from '../../store/ui';
import { useDeleteProblem, useProblem } from './hooks';

export function DeleteProblemDialog() {
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
      title="Eliminar problema"
      size="sm"
    >
      <p className="text-sm text-fgSoft">
        {problem ? (
          <>
            ¿Eliminar{' '}
            <span className="font-medium text-fg">
              {problem.number != null ? `#${problem.number} · ` : ''}
              {problem.title}
            </span>
            ? Esta acción no se puede deshacer.
          </>
        ) : (
          '¿Eliminar este problema? Esta acción no se puede deshacer.'
        )}
      </p>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={closeDelete} disabled={isPending}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isPending}>
          {isPending ? 'Eliminando…' : 'Eliminar'}
        </Button>
      </div>
    </Dialog>
  );
}
