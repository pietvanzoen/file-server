const { stat, open } = Deno;
import { ServerRequest, Response } from "https://deno.land/x/http/server.ts";
import { contentType } from "https://deno.land/x/media_types/mod.ts";
import { extname } from "https://deno.land/x/fs/path.ts";

export async function serveFile(
  req: ServerRequest,
  filename: string
): Promise<Response> {
  const file = await open(filename);
  const fileInfo = await stat(filename);
  const headers = new Headers();
  headers.set("content-length", fileInfo.len.toString());
  headers.set("content-type", contentType(extname(filename)) || "text/plain");
  headers.set("last-modified", new Date(fileInfo.modified * 1000).toString());

  return {
    status: 200,
    body: file,
    headers
  };
}
