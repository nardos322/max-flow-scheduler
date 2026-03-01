import { spawn } from 'node:child_process';
import { solveResponseSchema, type SolveRequest, type SolveResponse } from '@scheduler/domain';

const DEFAULT_ENGINE_BINARY = 'services/engine-cpp/build/scheduler_engine';

export function parseSolveResponsePayload(payload: unknown): SolveResponse {
  const parsed = solveResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error('Engine response contract mismatch');
  }

  return parsed.data;
}

export async function solveWithEngine(
  request: SolveRequest,
  engineBinary = DEFAULT_ENGINE_BINARY,
): Promise<SolveResponse> {
  return new Promise((resolve, reject) => {
    const process = spawn(engineBinary, [], { stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    process.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    process.on('error', reject);

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Engine exited with code ${code}: ${stderr}`));
        return;
      }
      let payload: unknown;
      try {
        payload = JSON.parse(stdout) as unknown;
      } catch (error) {
        reject(new Error(`Engine output is not valid JSON: ${String(error)}`));
        return;
      }

      try {
        resolve(parseSolveResponsePayload(payload));
      } catch (error) {
        reject(error);
      }
    });

    process.stdin.write(JSON.stringify(request));
    process.stdin.end();
  });
}
