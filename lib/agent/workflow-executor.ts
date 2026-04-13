import crypto from 'crypto';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';

export interface WorkflowStep {
  type: 'webhook' | 'email' | 'slack' | 'wait';
  // webhook
  url?: string;
  secret?: string;
  // email
  to_field?: 'visitor_email';  // field from trigger payload to use as recipient
  to_static?: string;          // or a hardcoded email
  subject?: string;
  body_template?: string;       // supports {{name}}, {{email}}, {{action}} placeholders
  // slack
  webhook_url?: string;
  message_template?: string;
  // wait
  seconds?: number;
}

interface TriggerContext {
  action: string;
  reason: string;
  visitor_email?: string;
  visitor_name?: string;
  session_id?: string;
  assistant_id?: string;
}

/**
 * Start a new workflow run for all active workflows that match trigger_action.
 * Called fire-and-forget from executor.ts.
 */
export async function startWorkflowsForAction(
  triggerAction: string,
  assistantId: string,
  context: TriggerContext
): Promise<void> {
  const db = getSupabaseAdminClient();
  if (!db) return;

  const { data: workflows } = await db
    .from('agent_workflows')
    .select('*')
    .eq('assistant_id', assistantId)
    .eq('trigger_action', triggerAction)
    .eq('is_active', true);

  if (!workflows?.length) return;

  for (const wf of workflows) {
    const { data: run } = await db
      .from('workflow_runs')
      .insert({
        workflow_id: wf.id,
        assistant_id: assistantId,
        session_id: context.session_id || null,
        visitor_email: context.visitor_email || null,
        trigger_payload: context,
        current_step: 0,
        status: 'running',
      })
      .select('id')
      .single();

    if (run) {
      // Increment run count
      db.from('agent_workflows').update({ run_count: wf.run_count + 1 }).eq('id', wf.id);
      // Execute immediately (async, non-blocking)
      executeRun(run.id, wf.steps as WorkflowStep[], 0, context).catch(() => {});
    }
  }
}

/**
 * Called by the cron job to resume paused runs.
 */
export async function resumePausedRuns(): Promise<void> {
  const db = getSupabaseAdminClient();
  if (!db) return;

  const { data: runs } = await db
    .from('workflow_runs')
    .select('id, workflow_id, current_step, trigger_payload, visitor_email')
    .eq('status', 'paused')
    .lte('next_run_at', new Date().toISOString())
    .limit(50);

  if (!runs?.length) return;

  for (const run of runs) {
    const { data: wf } = await db
      .from('agent_workflows')
      .select('steps')
      .eq('id', run.workflow_id)
      .single();

    if (!wf) continue;

    const context: TriggerContext = {
      ...(run.trigger_payload as TriggerContext),
      visitor_email: run.visitor_email || undefined,
    };

    executeRun(run.id, wf.steps as WorkflowStep[], run.current_step, context).catch(() => {});
  }
}

async function executeRun(
  runId: string,
  steps: WorkflowStep[],
  startStep: number,
  context: TriggerContext
): Promise<void> {
  const db = getSupabaseAdminClient();
  if (!db) return;

  let stepIndex = startStep;

  while (stepIndex < steps.length) {
    const step = steps[stepIndex];

    if (step.type === 'wait') {
      const seconds = step.seconds ?? 3600;
      const nextRunAt = new Date(Date.now() + seconds * 1000).toISOString();
      await db.from('workflow_runs').update({
        current_step: stepIndex + 1,
        status: 'paused',
        next_run_at: nextRunAt,
      }).eq('id', runId);
      return; // Cron will resume at stepIndex + 1
    }

    try {
      await executeStep(step, context);
    } catch {
      // Step failure — log but continue to next step
    }

    stepIndex++;
  }

  // All steps done
  await db.from('workflow_runs').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
  }).eq('id', runId);
}

async function executeStep(step: WorkflowStep, context: TriggerContext): Promise<void> {
  if (step.type === 'webhook' && step.url) {
    const body = JSON.stringify({ ...context, timestamp: Date.now() });
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (step.secret) {
      const sig = crypto.createHmac('sha256', step.secret).update(body).digest('hex');
      headers['X-AYS-Signature'] = `sha256=${sig}`;
    }
    await fetch(step.url, { method: 'POST', headers, body, signal: AbortSignal.timeout(8000) });

  } else if (step.type === 'email') {
    const to = step.to_static || context.visitor_email;
    if (!to || !step.subject || !step.body_template) return;
    const html = interpolate(step.body_template, context);
    await sendEmail(to, interpolate(step.subject, context), html);

  } else if (step.type === 'slack' && step.webhook_url) {
    const text = interpolate(step.message_template || '', context);
    await fetch(step.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(5000),
    });
  }
}

function interpolate(template: string, ctx: TriggerContext): string {
  return template
    .replace(/\{\{name\}\}/g, ctx.visitor_name || 'there')
    .replace(/\{\{email\}\}/g, ctx.visitor_email || '')
    .replace(/\{\{action\}\}/g, ctx.action || '')
    .replace(/\{\{reason\}\}/g, ctx.reason || '');
}
