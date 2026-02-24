import { spawn } from 'node:child_process';
import type { SolveRequest, SolveResponse } from '@scheduler/domain';

const DEFAULT_ENGINE_BINARY = 'services/engine-cpp/build/scheduler_engine';

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
      try {
        resolve(JSON.parse(stdout) as SolveResponse);
      } catch (error) {
        reject(new Error(`Engine output is not valid JSON: ${String(error)}`));
      }
    });

    process.stdin.write(JSON.stringify(request));
    process.stdin.end();
  });
}
