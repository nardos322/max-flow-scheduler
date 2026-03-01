import type {
  CreatePeriodRequest,
  PeriodCatalog,
  ReplacePeriodDemandsRequest,
  UpdatePeriodRequest,
} from '@scheduler/domain';
import {
  createPeriod,
  deletePeriod,
  getPeriodById,
  listPeriods,
  replacePeriodDemands,
  updatePeriod,
} from './period.repository.js';

export { createPeriod, deletePeriod, getPeriodById, listPeriods, replacePeriodDemands, updatePeriod };

export function isDemandOutsidePeriodRange(period: Pick<PeriodCatalog, 'startsOn' | 'endsOn' | 'demands'>): boolean {
  return period.demands.some((demand) => demand.dayId < period.startsOn || demand.dayId > period.endsOn);
}

export type { CreatePeriodRequest, PeriodCatalog, ReplacePeriodDemandsRequest, UpdatePeriodRequest };
