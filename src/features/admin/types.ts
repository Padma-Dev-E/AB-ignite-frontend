export type AdminQuiz = {
  id: number;
  title: string;
  category: string;
  level: string;
  objective: string;
  passMark: number;
  timeLimitSeconds: number | null;
  version: number;
  questionCount: number;
};

export type AdminChallenge = {
  id: number;
  title: string;
  question: string;
  deadlineAt: string;
  points: number;
  participants: number;
  joined: boolean;
};

export type AdminReward = {
  id: number;
  name: string;
  description: string | null;
  kind: "catalogue" | "earned";
  cost: number;
  emoji: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: "employee" | "admin" | "maintainer" | "business_owner";
  businessProfile: string | null;
  department: string;
  jobTitle: string | null;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  deactivatedAt: string | null;
  createdAt: string;
};

export type AdminAuditEvent = {
  id: number;
  createdAt: string;
  actorUserId: number | null;
  sessionId: number | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  ipHash?: string | null;
};
export type AdminIdea = { id: number; reference: string; title: string; summary: string; category: string; status: string; priorityBand: string | null; priorityScore: number | null; aiValidationScore?: number | null; aiValidationAttempts?: number; submittedWithLowAiScore?: boolean; assignedUserId?: number | null; assignedOwnerName?: string | null; authorId: number; authorName: string; department: string; createdAt: string; updatedAt: string };
export type BusinessOwnerOption = { id: number; name: string; department: string; businessProfile: string | null };
export type AdminSettings = { priority: Record<string, string>; pointRules: Array<{ id: number; code: string; name: string; points: number; active: boolean }>; recommendationRules: Array<{ id: number; topic: string; thresholdPercent: number; reasonTemplate: string; active: boolean }>; levels: Array<{ id: number; name: string; description: string | null; minimumPoints: number; sortOrder: number }>; departments: string[] };

export type AdminEvaluationDetail = {
  idea: AdminIdea & { problem: string | null; solution: string | null; benefits: string | null; risks: string | null; kind: string };
  submission: {
    answers: Record<string, string> | null;
    metrics: Record<string, string | number> | null;
    breakdown: Array<{ key: string; score: string | number | null; weight: number; explanation: string | null }> | null;
    score: number;
    minimumScore: number;
    validationPassed: boolean;
    aiValidationScore: number | null;
    aiValidationAttempts: number;
    submittedWithLowAiScore: boolean;
    differentiation: string | null;
    submittedAt: string;
  } | null;
  assessment: { jobKey: string; completedAt: string | null; result: unknown } | null;
  route: (Record<string, unknown> & { createdAt: string }) | null;
  ownerMatch: ({ eventType: string; createdAt: string; source?: string; confidence?: number; rationale?: string; reasonCode?: string; businessOwnerId?: number } & Record<string, unknown>) | null;
  controlReview: { required: string[]; approved: string[]; pending: string[] } | null;
};

export type AdminAiDebugExchange = {
  id: number;
  runId: number;
  jobKey: string;
  runStatus: string;
  attempt: number;
  responseStatus: number | null;
  responseStatusText: string | null;
  responseTruncated: boolean;
  durationMs: number;
  processingStage: string;
  errorCode: string | null;
  errorMessage: string | null;
  requestPayload: string | null;
  responsePayload: string | null;
  createdAt: string;
  expiresAt: string;
};

export type AdminAiDiagnostics = {
  enabled: boolean;
  retentionHours: number;
  exchanges: AdminAiDebugExchange[];
};

export type AdminAiRun = {
  id: number;
  ideaId: number;
  jobKey: string;
  jobVersion: string;
  model: string;
  status: string;
  attemptCount: number;
  errorCode: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

export type AdminFeedbackResponse = {
  id: number;
  campaignId: number;
  userId: number;
  userName: string;
  category: string;
  message: string;
  response: string | null;
  createdAt: string;
  respondedAt: string | null;
};
