/*
 * The message shapes shared by both sides of a model worker. Requests carry
 * an id so replies can arrive out of order, and events (download progress)
 * have no id because nobody is waiting on them.
 */

export interface RpcRequest {
  id: number;
  method: string;
  params: unknown;
}

export type RpcMessage =
  | { kind: "result"; id: number; result: unknown }
  | { kind: "error"; id: number; error: string }
  | { kind: "event"; event: string; data: unknown };
