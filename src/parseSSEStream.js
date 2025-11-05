import { EventSourceParserStream } from 'eventsource-parser/stream';

export async function* parseSSEStream(stream) {
  const sseStream = stream
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream());

  for await (const chunk of sseStream) {
    try {
      if (!chunk?.data) continue;

      const data = JSON.parse(chunk.data);

      // Expose both generic and custom event types
      yield {
        event: chunk.event || "message",
        type: data.type || chunk.event || "message",
        msg: data.msg || data.proof || data,
      };
    } catch (error) {
      console.error("Failed to process SSE message:", error.message);
    }
  }
}
