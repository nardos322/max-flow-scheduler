import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { SolveRequest, SolveResponse } from '@scheduler/domain';

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_ENGINE_BINARY = fileURLToPath(
  new URL('../../../services/engine-cpp/build/scheduler_engine', import.meta.url),
);

export class EngineRunnerError extends Error {
  constructor(
    message: string,
    readonly code: 'SPAWN_FAILED' | 'EXIT_NON_ZERO' | 'INVALID_JSON' | 'TIMEOUT',
    readonly stderr?: string,
  ) {
    super(message);
    this.name = 'EngineRunnerError';
  }
}

export interface SolveWithEngineOptions {
  engineBinary?: string;
  timeoutMs?: number;
}

export async function solveWithEngine(
  request: SolveRequest,
  options: SolveWithEngineOptions = {},
): Promise<SolveResponse> {
  const { engineBinary = DEFAULT_ENGINE_BINARY, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  return new Promise((resolve, reject) => {
    const process = spawn(engineBinary, [], { stdio: ['pipe', 'pipe', 'pipe'] });

    let isSettled = false;
    let stdout = '';
    let stderr = '';

    const timeout = setTimeout(() => {
      if (isSettled) {
        return;
      }

      isSettled = true;
      process.kill('SIGKILL');
      reject(new EngineRunnerError(`Engine timed out after ${timeoutMs}ms`, 'TIMEOUT'));
    }, timeoutMs);

    const settle = (callback: () => void) => {
      if (isSettled) {
        return;
      }

      isSettled = true;
      clearTimeout(timeout);
      callback();
    };

    process.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    process.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    process.on('error', (error) => {
      settle(() => {
        reject(new EngineRunnerError(`Engine spawn failed: ${String(error)}`, 'SPAWN_FAILED'));
      });
    });

    process.on('close', (code) => {
      settle(() => {
        if (code !== 0) {
          reject(new EngineRunnerError(`Engine exited with code ${code}: ${stderr}`, 'EXIT_NON_ZERO', stderr));
          return;
        }

        try {
          resolve(JSON.parse(stdout) as SolveResponse);
        } catch (error) {
          reject(new EngineRunnerError(`Engine output is not valid JSON: ${String(error)}`, 'INVALID_JSON'));
        }
      });
    });

    process.stdin.write(JSON.stringify(request));
    process.stdin.end();
  });
}
