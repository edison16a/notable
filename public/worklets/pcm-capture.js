/*
 * Copies raw microphone samples off the audio thread. Each process() call
 * only sees 128 samples, so they are batched into roughly 64 ms chunks
 * before posting, which keeps message traffic low without adding lag.
 */
const BATCH_SIZE = 3072;

class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(BATCH_SIZE);
    this.filled = 0;
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) return true;
    let offset = 0;
    while (offset < channel.length) {
      const count = Math.min(channel.length - offset, BATCH_SIZE - this.filled);
      this.buffer.set(channel.subarray(offset, offset + count), this.filled);
      this.filled += count;
      offset += count;
      if (this.filled === BATCH_SIZE) {
        this.port.postMessage(this.buffer);
        this.buffer = new Float32Array(BATCH_SIZE);
        this.filled = 0;
      }
    }
    return true;
  }
}

registerProcessor("pcm-capture", PcmCaptureProcessor);
