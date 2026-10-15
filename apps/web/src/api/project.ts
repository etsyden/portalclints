import { apiRequest } from './client';

export interface ProjectDetails {
  id: string;
  name: string;
  description: string | null;
  status: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectEvent {
  id: string;
  projectId: string;
  actorId: string | null;
  eventType: string;
  entityType: string;
  entityId: string | null;
  visibility: string;
  metadata: unknown;
  createdAt: string;
  actor?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

export async function getProject(
  projectId: string,
): Promise<ProjectDetails> {
  return apiRequest<ProjectDetails>(`/projects/${projectId}`);
}

export async function getProjectHistory(
  projectId: string,
): Promise<ProjectEvent[]> {
  return apiRequest<ProjectEvent[]>(
    `/projects/${projectId}/history`,
  );
}
