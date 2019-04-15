const { readDir, stat, open } = Deno;
import { serveFile } from "./file.ts";
import {
  ServerRequest,
  setContentLength,
  Response
} from "https://deno.land/x/http/server.ts";

const dirViewerTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Deno File Server</title>
  <style>
    td {
      padding: 0 1rem;
    }
    td.mode {
      font-family: Courier;
    }
  </style>
</head>
<body>
  <h1>Index of <%DIRNAME%></h1>
  <table>
    <tr><th>Mode</th><th>Size</th><th>Name</th></tr>
    <%CONTENTS%>
  </table>
</body>
</html>
`;

function fileLenToString(len: number): string {
  const multipler = 1024;
  let base = 1;
  const suffix = ["B", "K", "M", "G", "T"];
  let suffixIndex = 0;

  while (base * multipler < len) {
    if (suffixIndex >= suffix.length - 1) {
      break;
    }
    base *= multipler;
    suffixIndex++;
  }

  return `${(len / base).toFixed(2)}${suffix[suffixIndex]}`;
}

function createDirEntryDisplay(
  name: string,
  path: string,
  size: number | null,
  mode: number | null,
  isDir: boolean
): string {
  const sizeStr = size === null ? "" : "" + fileLenToString(size!);
  return `
  <tr>
    <td><a href="${path}">${name}${isDir ? "/" : ""}</a></td>
    <td>${sizeStr}</td>
  </tr>
  `;
}

export async function serveDir(
  req: ServerRequest,
  dirPath: string,
  dirName: string
): Promise<Response> {
  // dirname has no prefix
  const listEntry: string[] = [];
  const fileInfos = await readDir(dirPath);
  for (const info of fileInfos) {
    if (info.name === "index.html" && info.isFile()) {
      // in case index.html as dir...
      return await serveFile(req, info.path);
    }
    // Yuck!
    let mode = null;
    try {
      mode = (await stat(info.path)).mode;
    } catch (e) {}
    listEntry.push(
      createDirEntryDisplay(
        info.name,
        dirName + "/" + info.name,
        info.isFile() ? info.len : null,
        mode,
        info.isDirectory()
      )
    );
  }

  const page = new TextEncoder().encode(
    dirViewerTemplate
      .replace("<%DIRNAME%>", dirName + "/")
      .replace("<%CONTENTS%>", listEntry.join(""))
  );

  const headers = new Headers();
  headers.set("content-type", "text/html");

  const res = {
    status: 200,
    body: page,
    headers
  };
  setContentLength(res);
  return res;
}
