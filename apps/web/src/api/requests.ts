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

export async function getRequests(
  projectId: string,
): Promise<ProjectRequest[]> {
  return apiRequest<ProjectRequest[]>(
    `/projects/${projectId}/requests`,
  );
}
