import { promises as fs } from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  // Parse multipart form data
  const boundary = req.headers.get("content-type")?.split("boundary=")[1];
  if (!boundary) {
    return new Response(JSON.stringify({ message: "No boundary found" }), { status: 400 });
  }

  const buffer = await req.arrayBuffer();
  const parts = parseMultipart(Buffer.from(buffer), boundary);

  const uploadDir = path.join(process.cwd(), "public", "uploads", "rooms");
  await fs.mkdir(uploadDir, { recursive: true });

  const urls = [];
  for (const part of parts) {
    if (part.filename) {
      const filePath = path.join(uploadDir, part.filename);
      await fs.writeFile(filePath, part.data);
      urls.push(`/uploads/rooms/${part.filename}`);
    }
  }

  return new Response(JSON.stringify({ urls }), { status: 200 });
}

// Minimal multipart parser for Node.js (for Next.js API routes)
function parseMultipart(buffer, boundary) {
  const result = [];
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const parts = buffer
    .toString()
    .split(boundaryBuffer.toString())
    .filter(Boolean)
    .map((part) => part.trim());

  for (const part of parts) {
    if (!part || part === "--") continue;
    const [rawHeaders, ...rest] = part.split("\r\n\r\n");
    const headers = rawHeaders.split("\r\n");
    const disposition = headers.find((h) => h.startsWith("Content-Disposition"));
    if (!disposition) continue;
    const match = disposition.match(/name="([^"]+)"(?:; filename="([^"]+)")?/);
    if (!match) continue;
    const name = match[1];
    const filename = match[2];
    const data = Buffer.from(rest.join("\r\n\r\n").replace(/\r\n--$/, ""), "binary");
    result.push({ name, filename, data });
  }
  return result;
}
