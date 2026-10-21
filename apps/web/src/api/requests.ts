
import { apiRequest } from './client';

export interface ProjectRequest {
  id: string;
  projectId: string;
  createdById: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface CreateRequestInput {
  title: string;
  description?: string;
  type:
    | 'GENERAL'
    | 'CHANGE'
    | 'NEW_FEATURE'
    | 'CONTENT'
    | 'DESIGN'
    | 'TECHNICAL'
    | 'QUESTION';
}

export async function getRequests(
  projectId: string,
): Promise<ProjectRequest[]> {
  return apiRequest<ProjectRequest[]>(
    `/projects/${projectId}/requests`,
  );
}

export async function createRequest(
  projectId: string,
  input: CreateRequestInput,
): Promise<ProjectRequest> {
  return apiRequest<ProjectRequest>(
    `/projects/${projectId}/requests`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}


export type RequestStatus =
  | 'NEW'
  | 'IN_PROGRESS'
  | 'WAITING_CLIENT'
  | 'COMPLETED'
  | 'CANCELLED';

export async function updateRequestStatus(
  projectId: string,
  requestId: string,
  status: RequestStatus,
): Promise<ProjectRequest> {
  return apiRequest<ProjectRequest>(
    `/projects/${projectId}/requests/${requestId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  );
}

