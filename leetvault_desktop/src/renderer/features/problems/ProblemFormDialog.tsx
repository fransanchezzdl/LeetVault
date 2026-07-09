import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { Difficulty, ProblemDraft, Status } from '@shared/types/problem';
import { Dialog } from '../../components/ui/Dialog';
import { Input, Textarea } from '../../components/ui/Input';
import { Select, SelectOption } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useUi } from '../../store/ui';
import { useCreateProblem, useProblem, useUpdateProblem } from './hooks';

interface FormData {
  number: string;
  title: string;
  difficulty: Difficulty;
  pattern: string;
  status: Status;
  solution: string;
  notes: string;
  date_solved: string;
}

const EMPTY: FormData = {
  number: '',
  title: '',
  difficulty: 'Medium',
  pattern: '',
  status: 'Solved',
  solution: '',
  notes: '',
  date_solved: '',
};

export function ProblemFormDialog() {
  const { t } = useTranslation(['problems', 'common']);
  const formOpenId = useUi((s) => s.formOpenId);
  const closeForm = useUi((s) => s.closeForm);
  const editingId = typeof formOpenId === 'number' ? formOpenId : null;
  const { data: existing } = useProblem(editingId);
  const { mutateAsync: createProblem } = useCreateProblem();
  const { mutateAsync: updateProblem } = useUpdateProblem();

  const { register, handleSubmit, reset, control, formState } = useForm<FormData>({ defaultValues: EMPTY });

  useEffect(() => {
    if (formOpenId == null) return;
    if (formOpenId === 'new') {
      reset(EMPTY);
    } else if (existing) {
      reset({
        number: existing.number?.toString() ?? '',
        title: existing.title,
        difficulty: existing.difficulty,
        pattern: existing.pattern ?? '',
        status: existing.status,
        solution: existing.solution ?? '',
        notes: existing.notes ?? '',
        date_solved: existing.date_solved ?? '',
      });
    }
  }, [formOpenId, existing, reset]);

  const onSubmit = async (data: FormData) => {
    const draft: ProblemDraft = {
      number: data.number ? Number(data.number) : undefined,
      title: data.title.trim(),
      difficulty: data.difficulty,
      pattern: data.pattern.trim() || undefined,
      status: data.status,
      solution: data.solution || undefined,
      notes: data.notes || undefined,
      date_solved: data.date_solved || undefined,
    };
    if (editingId != null) await updateProblem({ id: editingId, draft });
    else await createProblem(draft);
    closeForm();
  };

  return (
    <Dialog
      open={formOpenId != null}
      onOpenChange={(o) => !o && closeForm()}
      title={editingId != null ? t('problems:form.editTitle') : t('problems:form.newTitle')}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <div>
            <Label>{t('problems:form.number')}</Label>
            <Input type="number" min={1} max={9999} {...register('number')} />
          </div>
          <div className="col-span-3">
            <Label>{t('problems:form.title')}</Label>
            <Input {...register('title', { required: true, maxLength: 300 })} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>{t('problems:form.difficulty')}</Label>
            <Controller
              control={control}
              name="difficulty"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v as Difficulty)}>
                  <SelectOption value="Easy">Easy</SelectOption>
                  <SelectOption value="Medium">Medium</SelectOption>
                  <SelectOption value="Hard">Hard</SelectOption>
                </Select>
              )}
            />
          </div>
          <div>
            <Label>{t('problems:form.status')}</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v as Status)}>
                  <SelectOption value="Solved">{t('common:status.Solved')}</SelectOption>
                  <SelectOption value="In Progress">{t('common:status.InProgress')}</SelectOption>
                  <SelectOption value="To Review">{t('common:status.ToReview')}</SelectOption>
                </Select>
              )}
            />
          </div>
          <div>
            <Label>{t('problems:form.solvedOn')}</Label>
            <Input type="date" {...register('date_solved')} />
          </div>
        </div>

        <div>
          <Label>{t('problems:form.pattern')}</Label>
          <Input maxLength={100} {...register('pattern')} />
        </div>

        <div>
          <Label>{t('problems:form.solution')}</Label>
          <Textarea rows={8} className="font-mono text-xs" {...register('solution')} />
        </div>

        <div>
          <Label>{t('problems:form.notes')}</Label>
          <Textarea rows={3} {...register('notes')} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={closeForm}>
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" disabled={formState.isSubmitting}>
            {editingId != null ? t('problems:form.saveChanges') : t('common:actions.create')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-fg/[0.68]">{children}</label>;
}
