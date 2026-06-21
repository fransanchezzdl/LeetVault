import { Search, X } from 'lucide-react';
import { useUi } from '../../store/ui';
import { Input } from '../../components/ui/Input';
import { Select, SelectOption } from '../../components/ui/Select';

export function FilterBar() {
  const { search, setSearch, difficulty, setDifficulty, status, setStatus, pattern, setPattern } =
    useUi();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fgMuted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, número o patrón…"
          className="pl-9"
        />
      </div>

      <Select
        value={difficulty}
        onValueChange={(v) => setDifficulty(v as typeof difficulty)}
        className="w-36"
        aria-label="Dificultad"
      >
        <SelectOption value="all">Dificultad</SelectOption>
        <SelectOption value="Easy">Easy</SelectOption>
        <SelectOption value="Medium">Medium</SelectOption>
        <SelectOption value="Hard">Hard</SelectOption>
      </Select>

      <Select
        value={status}
        onValueChange={(v) => setStatus(v as typeof status)}
        className="w-40"
        aria-label="Estado"
      >
        <SelectOption value="all">Estado</SelectOption>
        <SelectOption value="Solved">Resuelto</SelectOption>
        <SelectOption value="In Progress">En progreso</SelectOption>
        <SelectOption value="To Review">Por revisar</SelectOption>
      </Select>

      {pattern ? (
        <button
          type="button"
          onClick={() => setPattern('')}
          className="inline-flex items-center gap-1 rounded-full border border-glass-stroke bg-white/5 px-3 py-1 text-xs text-fgSoft hover:bg-white/10"
        >
          Patrón: <span className="font-medium">{pattern}</span>
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}
