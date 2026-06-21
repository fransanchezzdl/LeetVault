import type { Database, Statement } from 'better-sqlite3';

export interface Statements {
  selectAllOrdered: Statement;
  selectById: Statement;
  selectByNumber: Statement;
  selectDue: Statement;
  selectNextReview: Statement;
  countDue: Statement;
  countAll: Statement;
  insertProblem: Statement;
  updateProblem: Statement;
  deleteProblem: Statement;
  updateSr: Statement;
  selectByPattern: Statement;
  selectSrFields: Statement;
  selectStatus: Statement;
  enterReview: Statement;
  leaveReview: Statement;
  clearSr: Statement;
  groupByDifficulty: Statement;
  groupByPattern: Statement;
  groupByDate: Statement;
}

let _stmts: Statements | null = null;

export function bindStatements(db: Database): Statements {
  _stmts = {
    selectAllOrdered: db.prepare(
      'SELECT * FROM problems ORDER BY date_solved DESC, id DESC'
    ),
    selectById: db.prepare('SELECT * FROM problems WHERE id = ?'),
    selectByNumber: db.prepare('SELECT * FROM problems WHERE number = ? LIMIT 1'),
    selectDue: db.prepare(
      `SELECT * FROM problems
       WHERE sr_next_review <= ? AND status = 'To Review'
       ORDER BY sr_next_review ASC`
    ),
    selectNextReview: db.prepare(
      `SELECT sr_next_review FROM problems
       WHERE sr_next_review > ? AND status = 'To Review'
       ORDER BY sr_next_review ASC LIMIT 1`
    ),
    countDue: db.prepare(
      `SELECT COUNT(*) AS n FROM problems
       WHERE sr_next_review <= ? AND status = 'To Review'`
    ),
    countAll: db.prepare('SELECT COUNT(*) AS n FROM problems'),
    insertProblem: db.prepare(
      `INSERT INTO problems
         (number, title, difficulty, pattern, status, solution, notes, date_solved, sr_next_review)
       VALUES (@number, @title, @difficulty, @pattern, @status, @solution, @notes, @date_solved, @sr_next_review)`
    ),
    updateProblem: db.prepare(
      `UPDATE problems SET
         number = @number,
         title = @title,
         difficulty = @difficulty,
         pattern = @pattern,
         status = @status,
         solution = @solution,
         notes = @notes,
         date_solved = @date_solved
       WHERE id = @id`
    ),
    selectStatus: db.prepare('SELECT status FROM problems WHERE id = ?'),
    enterReview: db.prepare(
      `UPDATE problems SET
         sr_interval = 1,
         sr_repetitions = 0,
         sr_ease = 2.5,
         sr_next_review = ?
       WHERE id = ?`
    ),
    leaveReview: db.prepare(
      `UPDATE problems SET
         sr_interval = 1,
         sr_repetitions = 0,
         sr_ease = 2.5,
         sr_next_review = NULL
       WHERE id = ?`
    ),
    clearSr: db.prepare(
      `UPDATE problems SET
         sr_interval = 1,
         sr_repetitions = 0,
         sr_ease = 2.5,
         sr_next_review = NULL,
         status = 'Solved'
       WHERE id = ?`
    ),
    deleteProblem: db.prepare('DELETE FROM problems WHERE id = ?'),
    updateSr: db.prepare(
      `UPDATE problems SET
         sr_interval = @sr_interval,
         sr_repetitions = @sr_repetitions,
         sr_ease = @sr_ease,
         sr_next_review = @sr_next_review
       WHERE id = @id`
    ),
    selectByPattern: db.prepare(
      'SELECT * FROM problems WHERE pattern = ? ORDER BY date_solved DESC'
    ),
    selectSrFields: db.prepare(
      'SELECT sr_interval, sr_repetitions, sr_ease FROM problems WHERE id = ?'
    ),
    groupByDifficulty: db.prepare(
      'SELECT difficulty, COUNT(*) AS cnt FROM problems GROUP BY difficulty'
    ),
    groupByPattern: db.prepare(
      `SELECT pattern, COUNT(*) AS cnt FROM problems
       WHERE pattern != '' AND pattern IS NOT NULL
       GROUP BY pattern ORDER BY cnt DESC LIMIT 10`
    ),
    groupByDate: db.prepare(
      `SELECT date_solved, COUNT(*) AS cnt FROM problems
       WHERE date_solved IS NOT NULL
       GROUP BY date_solved ORDER BY date_solved`
    ),
  };
  return _stmts;
}

export function stmts(): Statements {
  if (!_stmts) throw new Error('Statements not bound — call bindStatements(db) first');
  return _stmts;
}

export function clearStatements(): void {
  _stmts = null;
}
