import type { RpcMessage, RpcRequest } from "./protocol";

type Listener = (data: unknown) => void;

/**
 * Main-thread side of a model worker. `call` returns a promise for one reply,
 * and `on` subscribes to events such as download progress. The worker is
 * created lazily so merely importing a feature never downloads anything.
 */
export class WorkerClient {
  private worker: Worker | null = null;
  private nextId = 1;
  private pending = new Map<number, { resolve(value: unknown): void; reject(error: Error): void }>();
  private listeners = new Map<string, Set<Listener>>();

  constructor(private readonly factory: () => Worker) {}

  call<T>(method: string, params: unknown = null, transfer: Transferable[] = []): Promise<T> {
    const worker = this.ensureWorker();
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
      worker.postMessage({ id, method, params } satisfies RpcRequest, transfer);
    });
  }

  on(event: string, listener: Listener): () => void {
    const set = this.listeners.get(event) ?? new Set();
    set.add(listener);
    this.listeners.set(event, set);
    return () => set.delete(listener);
  }

  /** Frees the model's memory. The next call starts a fresh worker. */
  terminate() {
    this.worker?.terminate();
    this.worker = null;
    for (const { reject } of this.pending.values()) reject(new Error("Worker stopped"));
    this.pending.clear();
  }

  get running(): boolean {
    return this.worker !== null;
  }

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;
    const worker = this.factory();
    worker.onmessage = (event: MessageEvent<RpcMessage>) => this.handle(event.data);
    worker.onerror = (event) => {
      event.preventDefault();
      const error = new Error(event.message || "The voice model stopped unexpectedly");
      for (const { reject } of this.pending.values()) reject(error);
      this.pending.clear();
      // A worker that failed to start or crashed never answers again. Drop it so the next call starts a fresh one.
      worker.terminate();
      if (this.worker === worker) this.worker = null;
    };
    this.worker = worker;
    return worker;
  }

  private handle(message: RpcMessage) {
    if (message.kind === "event") {
      this.listeners.get(message.event)?.forEach((listener) => listener(message.data));
      return;
    }
    const entry = this.pending.get(message.id);
    if (!entry) return;
    this.pending.delete(message.id);
    if (message.kind === "result") entry.resolve(message.result);
    else entry.reject(new Error(message.error));
  }
}
