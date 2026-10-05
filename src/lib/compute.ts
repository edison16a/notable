export type ComputeDevice = "webgpu" | "wasm";

interface GpuNavigator {
  gpu?: { requestAdapter(): Promise<unknown | null> };
}

/**
 * Picks WebGPU when the browser can hand us a real adapter, otherwise WASM.
 * Checking for `navigator.gpu` alone is not enough: some browsers expose the
 * object but return no adapter on unsupported hardware. Works in workers too.
 */
export async function pickComputeDevice(): Promise<ComputeDevice> {
  const nav = (typeof navigator === "undefined" ? undefined : navigator) as GpuNavigator | undefined;
  if (!nav?.gpu) return "wasm";
  try {
    const adapter = await nav.gpu.requestAdapter();
    return adapter ? "webgpu" : "wasm";
  } catch {
    return "wasm";
  }
}
