import { DurableObject } from 'cloudflare:workers';

export class ProbeDurableObject extends DurableObject<Env> {
  private runQueue: Promise<unknown> = Promise.resolve();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async runPipeline(input: unknown): Promise<{ success: true; jobs: unknown[]; source: 'generated'; inputType: string }> {
    const queuedRun = this.runQueue.then(() =>
      Promise.resolve({
        success: true as const,
        jobs: [],
        source: 'generated' as const,
        inputType: typeof input,
      })
    );
    this.runQueue = queuedRun.then(
      () => undefined,
      () => undefined
    );
    return queuedRun;
  }

  async getLatestScripts(): Promise<null> {
    return null;
  }
}
