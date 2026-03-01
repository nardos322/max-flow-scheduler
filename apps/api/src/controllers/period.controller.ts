import type { RequestHandler } from 'express';
import { HttpError } from '../errors/http.error.js';
import type { PeriodLocals } from '../middlewares/validate-period.middleware.js';
import {
  createPeriod,
  deletePeriod,
  getPeriodById,
  isDemandOutsidePeriodRange,
  listPeriods,
  replacePeriodDemands,
  updatePeriod,
} from '../services/period/period.service.js';

export const createPeriodController: RequestHandler = async (_req, res, next) => {
  try {
    const payload = (res.locals as PeriodLocals).createPeriodRequest;
    if (!payload) {
      next(new HttpError(500, { error: 'Create period payload not validated' }));
      return;
    }

    const period = await createPeriod(payload);
    res.status(201).json(period);
  } catch (error) {
    next(error);
  }
};

export const listPeriodsController: RequestHandler = async (_req, res, next) => {
  try {
    res.status(200).json({ items: await listPeriods() });
  } catch (error) {
    next(error);
  }
};

export const getPeriodController: RequestHandler = async (req, res, next) => {
  try {
    const periodId = req.params.periodId;
    if (!periodId) {
      next(new HttpError(400, { error: 'Missing periodId route param' }));
      return;
    }

    const period = await getPeriodById(periodId);
    if (!period) {
      next(new HttpError(404, { error: 'Period not found' }));
      return;
    }

    res.status(200).json(period);
  } catch (error) {
    next(error);
  }
};

export const updatePeriodController: RequestHandler = async (req, res, next) => {
  try {
    const periodId = req.params.periodId;
    if (!periodId) {
      next(new HttpError(400, { error: 'Missing periodId route param' }));
      return;
    }

    const payload = (res.locals as PeriodLocals).updatePeriodRequest;
    if (!payload) {
      next(new HttpError(500, { error: 'Update period payload not validated' }));
      return;
    }

    const period = await updatePeriod(periodId, payload);
    if (!period) {
      next(new HttpError(404, { error: 'Period not found' }));
      return;
    }

    if (isDemandOutsidePeriodRange(period)) {
      next(new HttpError(422, { error: 'Existing demands are outside updated period range' }));
      return;
    }

    res.status(200).json(period);
  } catch (error) {
    next(error);
  }
};

export const replacePeriodDemandsController: RequestHandler = async (req, res, next) => {
  try {
    const periodId = req.params.periodId;
    if (!periodId) {
      next(new HttpError(400, { error: 'Missing periodId route param' }));
      return;
    }

    const payload = (res.locals as PeriodLocals).replacePeriodDemandsRequest;
    if (!payload) {
      next(new HttpError(500, { error: 'Replace period demands payload not validated' }));
      return;
    }

    const period = await getPeriodById(periodId);
    if (!period) {
      next(new HttpError(404, { error: 'Period not found' }));
      return;
    }

    const outOfRange = payload.demands.some((demand) => demand.dayId < period.startsOn || demand.dayId > period.endsOn);
    if (outOfRange) {
      next(new HttpError(400, { error: 'Demand day is outside period range' }));
      return;
    }

    const updated = await replacePeriodDemands(periodId, payload);
    if (!updated) {
      next(new HttpError(404, { error: 'Period not found' }));
      return;
    }

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const deletePeriodController: RequestHandler = async (req, res, next) => {
  try {
    const periodId = req.params.periodId;
    if (!periodId) {
      next(new HttpError(400, { error: 'Missing periodId route param' }));
      return;
    }

    const deleted = await deletePeriod(periodId);
    if (!deleted) {
      next(new HttpError(404, { error: 'Period not found' }));
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
