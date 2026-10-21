
import { apiRequest } from './client';

export type MaterialType =
  | 'FILE'
  | 'LINK'
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO'
  | 'DOCUMENT'
  | 'REFERENCE'
  | 'SCREENSHOT'
  | 'OTHER';

export type MaterialVisibility = 'INTERNAL' | 'CLIENT';

export interface Material {
  id: string;
  projectId: string;
  createdById: string;
  title: string;
  description: string;
  type: MaterialType;
  visibility: MaterialVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialInput {
  title: string;
  description?: string;
  type: MaterialType;
  visibility: MaterialVisibility;
}

export async function getMaterials(
  projectId: string,
): Promise<Material[]> {
  return apiRequest<Material[]>(
    `/projects/${projectId}/materials`,
  );
}

export async function createMaterial(
  projectId: string,
  input: CreateMaterialInput,
): Promise<Material> {
  return apiRequest<Material>(
    `/projects/${projectId}/materials`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export interface CreateMaterialVersionInput {
  changeSummary?: string;
  provider?: string;
  externalUrl?: string;
  externalFileId?: string;
  externalVersionId?: string;
}

export interface MaterialVersion {
  id: string;
  materialId: string;
  createdById: string;
  versionNumber: number;
  changeSummary: string;
  provider: string | null;
  externalUrl: string | null;
  externalFileId: string | null;
  externalVersionId: string | null;
  createdAt: string;
}

export async function createMaterialVersion(
  projectId: string,
  materialId: string,
  input: CreateMaterialVersionInput,
): Promise<MaterialVersion> {
  return apiRequest<MaterialVersion>(
    `/projects/${projectId}/materials/${materialId}/versions`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function shareMaterial(
  projectId: string,
  materialId: string,
): Promise<Material> {
  return apiRequest<Material>(
    `/projects/${projectId}/materials/${materialId}/share`,
    {
      method: 'POST',
    },
  );
}
