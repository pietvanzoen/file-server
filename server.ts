const { ErrorKind, stat, env } = Deno;
import {
  listenAndServe,
  ServerRequest,
  Response
} from "https://deno.land/x/http/server.ts";
import { normalize } from "https://deno.land/x/fs/path.ts";
import { serveFile } from "./file.ts";
import { serveDir } from "./dir.ts";
import { serverLog } from "./log.ts";

const { PORT = 4500, SERVE_DIR } = env();

if (!SERVE_DIR) {
  throw new Error("$SERVE_DIR is required");
}
const encoder = new TextEncoder();

async function serveFallback(req: ServerRequest, e: Error): Promise<Response> {
  if (
    e instanceof Deno.DenoError &&
    (e as Deno.DenoError<Deno.ErrorKind.NotFound>).kind === ErrorKind.NotFound
  ) {
    return {
      status: 404,
      body: encoder.encode("Not found")
    };
  } else {
    return {
      status: 500,
      body: encoder.encode("Internal server error")
    };
  }
}

listenAndServe(`0.0.0.0:${PORT}`, async req => {
  const fileName = req.url.replace(/\/$/, "");
  const filePath = normalize(SERVE_DIR + fileName);

  let response: Response;

  try {
    const fileInfo = await stat(filePath);
    if (fileInfo.isDirectory()) {
      response = await serveDir(req, filePath, fileName);
    } else {
      response = await serveFile(req, filePath);
    }
  } catch (e) {
    response = await serveFallback(req, e);
  } finally {
    serverLog(req, response);
    req.respond(response);
  }
});

console.log(`Server started at http://localhost:${PORT}`);
