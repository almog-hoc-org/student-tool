import { load, save } from './storage';

export const SUPPORT_STORAGE_KEY = 'support_requests';

export type SupportIssueType = 'bug' | 'data' | 'feature' | 'billing' | 'access' | 'other';
export type SupportTool = 'budget' | 'business_plan' | 'mortgage' | 'advisor' | 'chat' | 'account' | 'admin' | 'other';
export type SupportPriority = 'low' | 'normal' | 'high';
export type SupportStatus = 'open' | 'resolved';

export interface SupportRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  displayName: string;
  email: string;
  issueType: SupportIssueType;
  tool: SupportTool;
  subject: string;
  description: string;
  priority: SupportPriority;
  status: SupportStatus;
  contextPath: string;
}

function readRequests(): SupportRequest[] {
  return load<SupportRequest[]>(SUPPORT_STORAGE_KEY) ?? [];
}

export function getSupportRequests(): SupportRequest[] {
  return readRequests();
}

export function createSupportRequest(
  request: Omit<SupportRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
  userId?: string,
): SupportRequest[] {
  const next: SupportRequest = {
    ...request,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'open',
  };

  const requests = [...readRequests(), next];
  save(SUPPORT_STORAGE_KEY, requests, userId);
  return requests;
}

export function resolveSupportRequest(requestId: string, userId?: string): SupportRequest[] {
  const requests = readRequests().map(request => (
    request.id === requestId
      ? { ...request, status: 'resolved' as const, updatedAt: new Date().toISOString() }
      : request
  ));

  save(SUPPORT_STORAGE_KEY, requests, userId);
  return requests;
}
