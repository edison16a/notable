import type { RpcMessage, RpcRequest } from "./protocol";

export type Emit = (event: string, data: unknown) => void;

/** A handler can return a plain value, or a value plus buffers to transfer instead of copy. */
export type HandlerResult = unknown | { value: unknown; transfer: Transferable[] };
type Handler = (params: never, emit: Emit) => Promise<HandlerResult> | HandlerResult;

const TRANSFER = Symbol("transfer");

/** Marks a result so its buffers are moved to the main thread, not copied. Audio buffers can be large. */
export function withTransfer(value: unknown, transfer: Transferable[]): HandlerResult {
  return { [TRANSFER]: true, value, transfer };
}

/**
 * Worker side of the protocol. Calls run one at a time, in order. ONNX
 * sessions do not like overlapping runs, and a strict queue also means a
 * "load" always finishes before the first "generate" that follows it.
 */
export function serveRpc(handlers: Record<string, Handler>) {
  const scope = self as unknown as DedicatedWorkerGlobalScope;
  const emit: Emit = (event, data) => scope.postMessage({ kind: "event", event, data } satisfies RpcMessage);
  let queue: Promise<void> = Promise.resolve();

  scope.onmessage = (event: MessageEvent<RpcRequest>) => {
    const { id, method, params } = event.data;
    queue = queue.then(async () => {
      try {
        const handler = handlers[method];
        if (!handler) throw new Error(`Unknown method ${method}`);
        const output = (await handler(params as never, emit)) as Record<PropertyKey, unknown> | undefined;
        if (output && typeof output === "object" && TRANSFER in output) {
          scope.postMessage({ kind: "result", id, result: output.value } satisfies RpcMessage, output.transfer as Transferable[]);
        } else {
          scope.postMessage({ kind: "result", id, result: output } satisfies RpcMessage);
        }
      } catch (error) {
        scope.postMessage({ kind: "error", id, error: error instanceof Error ? error.message : String(error) } satisfies RpcMessage);
      }
    });
  };
}
