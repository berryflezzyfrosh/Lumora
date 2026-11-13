import { supabase } from '@/lib/supabase';
import { toUserError } from '@/lib/errors';

export type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  username: string;
  display_name: string;
  plan: 'free' | 'pro';
};

export type AdminProject = {
  id: string;
  user_id: string;
  title: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminStats = {
  users: number;
  projects: number;
  proUsers: number;
};

const PAGE_SIZE = 25;
const PROJECT_COLUMNS = 'id, user_id, title, is_favorite, created_at, updated_at';

export async function getAdminStats(): Promise<AdminStats> {
  const [users, projects, proUsers] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('projects').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan', 'pro'),
  ]);

  if (users.error) throw toUserError('admin.stats.users', users.error);
  if (projects.error) throw toUserError('admin.stats.projects', projects.error);
  if (proUsers.error) throw toUserError('admin.stats.proUsers', proUsers.error);

  return {
    users: users.count ?? 0,
    projects: projects.count ?? 0,
    proUsers: proUsers.count ?? 0,
  };
}

export async function listAdminUsers(offset = 0): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc('admin_list_users', {
    page_size: PAGE_SIZE,
    page_offset: offset,
  });
  if (error) throw toUserError('admin.users.list', error);
  return (data ?? []) as AdminUser[];
}

export async function listAdminProjects(offset = 0): Promise<AdminProject[]> {
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_COLUMNS)
    .order('updated_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (error) throw toUserError('admin.projects.list', error);
  return (data ?? []) as AdminProject[];
}

export async function setAdminUserPlan(userId: string, plan: AdminUser['plan']): Promise<void> {
  const { error } = await supabase.rpc('admin_set_profile_plan', {
    target_profile_id: userId,
    target_plan: plan,
  });
  if (error) throw toUserError('admin.users.setPlan', error);
}

export async function removeAdminProject(projectId: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw toUserError('admin.projects.delete', error);
}

export const ADMIN_PAGE_SIZE = PAGE_SIZE;
