"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateAssistantState } from "./state";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9.\-_]/g, "-");
}

/**
 * Ensures a profile row exists for the authenticated user.
 *
 * The `assistants` table references `public.profiles(id)` via FK.
 * The `handle_new_user` trigger normally creates the profile automatically,
 * but it may be missing if the user signed up before the migration ran or if
 * the trigger did not fire (e.g. local dev / social login race condition).
 * We check first and only insert if the row is missing to avoid any RLS
 * conflicts — the INSERT policy requires auth.uid() = id.
 */
async function ensureProfile(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>,
  user: { id: string; email?: string; user_metadata?: Record<string, string> },
) {
  // Check if profile already exists (SELECT policy is present).
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) return selectError;
  if (existing) return null; // Profile is already there — nothing to do.

  // Profile is missing. We used to insert it here, but if an admin manually deleted
  // the profile from the database, we should not recreate it and let them continue.
  return new Error("Your account profile was not found or has been deleted. Please sign out.");
}

export async function createAssistantAction(
  _prevState: CreateAssistantState,
  formData: FormData,
): Promise<CreateAssistantState> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!supabase || !user) {
    return {
      success: false,
      message: "You must be signed in to create an assistant.",
    };
  }

  // Guarantee the profile row exists before touching any FK-dependent tables.
  const profileError = await ensureProfile(supabase, {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata as Record<string, string>,
  });

  if (profileError) {
    return {
      success: false,
      message: `Profile setup failed: ${profileError.message}`,
    };
  }

  const name = String(formData.get("name") ?? "").trim();
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim();
  const businessSummary = String(formData.get("businessSummary") ?? "").trim();
  const welcomeMessage = String(formData.get("welcomeMessage") ?? "").trim();
  const tone = String(formData.get("tone") ?? "helpful").trim();
  const urlSources = String(formData.get("urlSources") ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const plainTextSource = String(formData.get("plainTextSource") ?? "").trim();
  const files = formData
    .getAll("documents")
    .filter((item): item is File => item instanceof File && item.size > 0);

  if (!name || !businessSummary) {
    return {
      success: false,
      message: "Assistant name and business summary are required.",
    };
  }

  const slug = slugify(name);

  // Check limits before inserting
  const { data: usageData, error: usageError } = await supabase
    .rpc("get_user_usage", { p_user_id: user.id } as any)
    .single();

  const usage = usageData as any;

  if (usageError) {
    return {
      success: false,
      message: "Failed to verify account usage. Please try again.",
    };
  }

  if (usage && usage.assistants_count >= usage.assistant_limit) {
    return {
      success: false,
      message: `You have reached the limit of ${usage.assistant_limit} assistants for your ${usage.plan_name} plan. Please upgrade to create more.`,
    };
  }

  const { data: assistant, error: assistantError } = await supabase
    .from("assistants")
    .insert({
      user_id: user.id,
      name,
      slug,
      website_url: websiteUrl || null,
      business_summary: businessSummary,
      welcome_message: welcomeMessage || "Hi, I am your AI assistant. How can I help?",
      tone,
      status: urlSources.length || plainTextSource || files.length ? "training" : "draft",
    })
    .select("id")
    .single();

  if (assistantError || !assistant) {
    // Friendly handling for duplicate slug within the same account.
    if (assistantError?.code === "23505") {
      return {
        success: false,
        message: `An assistant named "${name}" already exists. Please choose a different name.`,
      };
    }
    return {
      success: false,
      message: assistantError?.message ?? "Failed to create assistant.",
    };
  }

  const trainingSourceRows: Array<Record<string, string | null>> = [];

  urlSources.forEach((sourceUrl) => {
    trainingSourceRows.push({
      assistant_id: assistant.id,
      source_type: "url",
      label: sourceUrl,
      source_url: sourceUrl,
      plain_text_content: null,
      storage_bucket: null,
      storage_path: null,
      mime_type: null,
      status: "pending",
    });
  });

  if (plainTextSource) {
    trainingSourceRows.push({
      assistant_id: assistant.id,
      source_type: "plain_text",
      label: "Manual context",
      source_url: null,
      plain_text_content: plainTextSource,
      storage_bucket: null,
      storage_path: null,
      mime_type: "text/plain",
      status: "pending",
    });
  }

  for (const file of files) {
    const filePath = `${user.id}/${assistant.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("assistant-documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return {
        success: false,
        message: uploadError.message,
      };
    }

    trainingSourceRows.push({
      assistant_id: assistant.id,
      source_type: "document",
      label: file.name,
      source_url: null,
      plain_text_content: null,
      storage_bucket: "assistant-documents",
      storage_path: filePath,
      mime_type: file.type || "application/octet-stream",
      status: "pending",
    });
  }

  if (trainingSourceRows.length > 0) {
    const { error: sourceError } = await supabase
      .from("training_sources")
      .insert(trainingSourceRows);

    if (sourceError) {
      return {
        success: false,
        message: sourceError.message,
      };
    }
  }

  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Assistant created. You can start training and testing it now.",
    assistantId: assistant.id,
  };
}
