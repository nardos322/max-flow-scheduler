import { SolverError } from '../errors/solver.error.js';
import { EngineRunnerError } from './engine-runner.service.js';

function looksLikeSolverInputError(stderr: string): boolean {
  const normalized = stderr.toLowerCase();
  return (
    normalized.includes('parse') ||
    normalized.includes('json') ||
    normalized.includes('out_of_range') ||
    normalized.includes('type_error') ||
    normalized.includes('invalid')
  );
}

export function mapEngineRunnerError(error: EngineRunnerError): SolverError {
  if (error.code === 'EXIT_NON_ZERO' && error.stderr && looksLikeSolverInputError(error.stderr)) {
    return new SolverError(422, 'SOLVER_UNPROCESSABLE', 'Solver rejected payload', error.stderr);
  }

  const message = error.code === 'TIMEOUT' ? 'Solver timed out' : 'Solver execution failed';
  return new SolverError(500, error.code, message, error.stderr);
}
