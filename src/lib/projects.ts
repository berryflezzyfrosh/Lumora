import { supabase } from '@/lib/supabase';
import { toUserError } from '@/lib/errors';

export type Project = {
  id: string;
  title: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

const PROJECT_COLUMNS = 'id, title, is_favorite, created_at, updated_at';

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_COLUMNS)
    .order('updated_at', { ascending: false });
  if (error) throw toUserError('projects.list', error);
  return (data ?? []) as Project[];
}

export async function createProject(title: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ title })
    .select(PROJECT_COLUMNS)
    .single();
  if (error) throw toUserError('projects.create', error);
  return data as Project;
}

export async function renameProject(id: string, title: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(PROJECT_COLUMNS)
    .single();
  if (error) throw toUserError('projects.rename', error);
  return data as Project;
}

export async function setProjectFavorite(id: string, isFavorite: boolean): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update({ is_favorite: isFavorite })
    .eq('id', id)
    .select(PROJECT_COLUMNS)
    .single();
  if (error) throw toUserError('projects.favorite', error);
  return data as Project;
}

export async function duplicateProject(id: string): Promise<Project> {
  const { data: source, error: readError } = await supabase
    .from('projects')
    .select('title, document')
    .eq('id', id)
    .single();
  if (readError) throw toUserError('projects.duplicate.read', readError);

  const { data, error } = await supabase
    .from('projects')
    .insert({ title: `${source.title} (copy)`.slice(0, 120), document: source.document })
    .select(PROJECT_COLUMNS)
    .single();
  if (error) throw toUserError('projects.duplicate', error);
  return data as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw toUserError('projects.delete', error);
}
