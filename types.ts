
export interface ProblemData {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  markdown: string;
  sources: Array<{ title: string; uri: string }>;
}

export type AgentStep = 'idle' | 'searching' | 'analyzing' | 'formatting' | 'syncing' | 'completed';

export interface AppState {
  step: AgentStep;
  problem: ProblemData | null;
  error: string | null;
  vaultName: string;
  autoSync: boolean;
  history: string[];
}
