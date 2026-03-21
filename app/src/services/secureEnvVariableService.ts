import { request } from './api';

type EnvVarMetadata = {
  id: number;
  key: string;
  description: string | null;
  sensitive: boolean;
  environment_id: number | null;
  collection_id: number | null;
  created_at: string;
  updated_at: string;
};

const BASE = '/env-vars';

export const listEnvVars = async (params: { environment_id?: string; collection_id?: string }) => {
  const query = new URLSearchParams();
  if (params.environment_id) {
    query.set('environment_id', params.environment_id);
  }
  if (params.collection_id) {
    query.set('collection_id', params.collection_id);
  }
  const url = `${BASE}${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await request<{ data: EnvVarMetadata[] }>(url, { method: 'GET' }, { auth: true });
  return response.body?.data ?? [];
};

export const revealEnvVar = async (id: number) => {
  const response = await request<{ data: { id: number; value: string } }>(`${BASE}/${id}/reveal`, {
    method: 'POST',
  });
  return response.body?.data?.value ?? '';
};
