export type GoalStatus = 'active' | 'completed' | 'failed';
export type StakeType = 'vps' | 'physical' | 'service' | 'other';

export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  trustLevel: number;
  source: 'demo' | 'linuxdo';
}

export interface Task {
  id: string;
  goalId: string;
  title: string;
  date: string;
  minutes: number;
  doneAt: string | null;
  position: number;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  deadline: string;
  createdAt: string;
  status: GoalStatus;
  isPublic: boolean;
  stakeTitle: string;
  stakeType: StakeType;
  stakeDetail: string;
  evidence: string;
  tasks: Task[];
}

export interface CommunityGoal {
  id: string;
  title: string;
  deadline: string;
  createdAt: string;
  status: GoalStatus;
  stakeTitle: string;
  stakeType: StakeType;
  taskCount: number;
  doneCount: number;
  user: User;
}

export interface Giveaway {
  id: string;
  goalId: string;
  ownerId: string;
  title: string;
  description: string;
  type: StakeType;
  closesAt: string;
  drawnAt: string | null;
  winnerId: string | null;
  winnerName: string | null;
  delivery: 'pending' | 'sent' | 'received';
  entryCount: number;
  joined: boolean;
  ownerName: string;
  isDemo: boolean;
}

export interface AppState {
  user: User;
  today: string;
  goals: Goal[];
  community: CommunityGoal[];
  giveaways: Giveaway[];
  history: { date: string; count: number; minutes: number }[];
  streak: number;
  config: { linuxdo: boolean; demoEnabled: boolean };
}

export interface CreateGoalInput {
  title: string;
  description: string;
  deadline: string;
  isPublic: boolean;
  stakeTitle: string;
  stakeType: StakeType;
  stakeDetail: string;
}

export interface PlannedTask {
  title: string;
  date: string;
  minutes: number;
}

export interface ModelSettings {
  baseUrl: string;
  model: string;
  apiKey: string;
  dailyMinutes: number;
}
