import { apiRequest } from './client';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

export async function getProjects(): Promise<Project[]> {
  return apiRequest<Project[]>('/projects');
}

export async function getProject(projectId: string): Promise<Project> {
  return apiRequest<Project>(`/projects/${projectId}`);
}