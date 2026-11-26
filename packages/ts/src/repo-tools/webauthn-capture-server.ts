import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { b64urlEncode, webauthnChallenge } from '../index.js';

const PORT = 8787;
const MAX_BODY_BYTES = 64 * 1024;

const HTML_PATH = fileURLToPath(new URL('../../repo-tools-static/webauthn-capture.html', import.meta.url));
const SPIKE_OUTPUT_DIR = fileURLToPath(new URL('../../../../spike-output', import.meta.url));

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let aborted = false;

    req.on('data', (chunk: Buffer) => {
      if (aborted) return;
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        aborted = true;
        reject(new Error('payload_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!aborted) {
        resolve(Buffer.concat(chunks).toString('utf8'));
      }
    });
    req.on('error', (err) => {
      if (!aborted) reject(err);
    });
  });
}

function nextAssertionIndex(dir: string): number {
  if (!existsSync(dir)) return 1;
  let maxN = 0;
  for (const name of readdirSync(dir)) {
    const match = /^assertion-(\d+)\.json$/.exec(name);
    if (match?.[1]) {
      const n = Number(match[1]);
      if (Number.isInteger(n) && n > maxN) maxN = n;
    }
  }
  return maxN + 1;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(text);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/') {
      const html = readFileSync(HTML_PATH, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (req.method === 'POST' && req.url === '/challenge') {
      const bodyText = await readBody(req);
      const parsed = JSON.parse(bodyText) as { payload?: unknown };
      if (typeof parsed.payload !== 'object' || parsed.payload === null || Array.isArray(parsed.payload)) {
        sendJson(res, 400, { error: 'invalid_payload' });
        return;
      }
      const challenge = b64urlEncode(webauthnChallenge('pk.approval.decision', parsed.payload));
      sendJson(res, 200, { challenge });
      return;
    }

    if (req.method === 'POST' && req.url === '/save') {
      const bodyText = await readBody(req);
      const parsed = JSON.parse(bodyText) as unknown;
      mkdirSync(SPIKE_OUTPUT_DIR, { recursive: true });
      const n = nextAssertionIndex(SPIKE_OUTPUT_DIR);
      const filename = `assertion-${n}.json`;
      writeFileSync(join(SPIKE_OUTPUT_DIR, filename), `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
      sendJson(res, 200, { status: 'saved', n, file: filename });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  } catch (err) {
    if (err instanceof Error && err.message === 'payload_too_large') {
      sendJson(res, 413, { error: 'payload_too_large' });
      return;
    }
    sendJson(res, 400, { error: err instanceof Error ? err.message : 'bad_request' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`capture page on http://localhost:${PORT} (Ctrl+C to stop)`);
});
