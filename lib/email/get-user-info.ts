import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface UserInfo {
  email: string;
  name: string;
}

export async function getUserInfo(userId: string): Promise<UserInfo | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .single();

  if (error || !data?.email) return null;

  return {
    email: data.email,
    name: (data.full_name as string | null) ?? "there",
  };
}
