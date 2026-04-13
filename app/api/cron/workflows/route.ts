import { NextResponse } from 'next/server';
import { resumePausedRuns } from '@/lib/agent/workflow-executor';

/**
 * GET /api/cron/workflows
 * Runs every minute (Vercel Cron). Resumes all paused workflow_runs whose next_run_at has passed.
 * Protected by CRON_SECRET env var.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await resumePausedRuns();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[Cron:workflows]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
