import { logInfo } from './logger';

// ─────────────────────────────────────────────────────────────────────────────
// File d'attente de génération — limite la concurrence des tâches lourdes
// (appels au SDK Claude Code). Si plusieurs coachs génèrent en même temps, les
// requêtes au-delà de la limite sont mises en file et exécutées dès qu'un slot
// se libère, évitant la surcharge. In-process (par instance serverless).
// ─────────────────────────────────────────────────────────────────────────────

interface QueuedTask<T> {
  run: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (err: unknown) => void;
}

class ConcurrencyQueue {
  private active = 0;
  private readonly queue: QueuedTask<unknown>[] = [];

  constructor(private readonly limit: number) {}

  get pending(): number {
    return this.queue.length;
  }
  get running(): number {
    return this.active;
  }

  enqueue<T>(run: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ run, resolve, reject } as QueuedTask<unknown>);
      this.drain();
    });
  }

  private drain(): void {
    if (this.active >= this.limit) return;
    const task = this.queue.shift();
    if (!task) return;

    this.active++;
    if (this.queue.length > 0) {
      logInfo('[queue] tâche mise en file', { pending: this.queue.length, running: this.active });
    }
    Promise.resolve()
      .then(task.run)
      .then(
        (value) => task.resolve(value),
        (err) => task.reject(err)
      )
      .finally(() => {
        this.active--;
        this.drain();
      });
  }
}

// Limite globale : 2 générations lourdes simultanées par instance.
const generationQueue = new ConcurrencyQueue(
  Number(process.env.AURAPOST_GENERATION_CONCURRENCY ?? '2')
);

/** Exécute une tâche de génération via la file d'attente (concurrence limitée). */
export function enqueueGeneration<T>(run: () => Promise<T>): Promise<T> {
  return generationQueue.enqueue(run);
}

/** État de la file (monitoring / health). */
export function generationQueueStatus() {
  return { running: generationQueue.running, pending: generationQueue.pending };
}
