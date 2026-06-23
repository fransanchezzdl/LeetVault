export type EventName =
  | 'app_opened'
  | 'view_opened'
  | 'problem_created'
  | 'problem_updated'
  | 'problem_deleted'
  | 'review_rated'
  | 'review_session_finished'
  | 'extension_saved'
  | 'interview_started'
  | 'interview_finished'
  | 'interview_aborted'
  | 'groq_key_set'
  | 'analytics_opted_out'
  | 'update_prompt_shown'
  | 'update_prompt_action';

export type EventProps = {
  app_opened: { is_first_launch: boolean };
  view_opened: {
    view: 'problems' | 'review' | 'stats' | 'roadmap' | 'help' | 'interview' | 'settings';
  };
  problem_created: {
    difficulty: 'Easy' | 'Medium' | 'Hard';
    status: 'Solved' | 'In Progress' | 'To Review';
    has_pattern: boolean;
  };
  problem_updated: {
    difficulty: 'Easy' | 'Medium' | 'Hard';
    status: 'Solved' | 'In Progress' | 'To Review';
  };
  problem_deleted: Record<string, never>;
  review_rated: { quality: 0 | 2 | 3 | 4 | 5 };
  review_session_finished: { count: number };
  extension_saved: { action: 'created' | 'updated' };
  interview_started: {
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'unknown';
    language: string;
  };
  interview_finished: {
    duration_sec: number;
    verdict: string;
    had_evaluation: boolean;
    language: string;
  };
  interview_aborted: { elapsed_sec: number };
  groq_key_set: Record<string, never>;
  analytics_opted_out: Record<string, never>;
  update_prompt_shown: { latest: string };
  update_prompt_action: { action: 'opened' | 'dismissed' };
};
