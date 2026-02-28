import type { SolveRequest, SolveResponse } from '@scheduler/domain';
import { solveWithEngine } from './engine-runner.service.js';

export async function solveScheduleWithEngine(request: SolveRequest): Promise<SolveResponse> {
  const engineBinary = process.env.SCHEDULER_ENGINE_BINARY;
  return solveWithEngine(request, engineBinary ? { engineBinary, timeoutMs: 5_000 } : { timeoutMs: 5_000 });
}
