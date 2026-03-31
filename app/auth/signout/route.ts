import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await getSupabaseServerClient();
  await supabase?.auth.signOut();

  const origin = new URL(request.url).origin;
  return NextResponse.redirect(new URL("/login", origin));
}
