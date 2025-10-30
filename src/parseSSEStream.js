import { EventSourceParserStream } from 'eventsource-parser/stream';

export async function* parseSSEStream(stream) {
  const sseStream = stream
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream())

  for await (const chunk of sseStream) {
      try {
        
        const parsedResponse = parse(chunk.data);
        yield parsedResponse;

      } catch (error) {
        console.error("Failed to process SSE message :", error.message);
      }
    
  }
}

function parse(rawResponse) {
  try {
    const parsed = JSON.parse(rawResponse);

    return {
      type: parsed.type,
      msg: parsed.msg,
    };
  } catch (error) {
    console.error("Failed to parse message :", error.message);
    throw new Error("Failed to parse message.");
  }
}
