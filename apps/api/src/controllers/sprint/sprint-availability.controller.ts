import type { RequestHandler } from 'express';
import { HttpError } from '../../errors/http.error.js';
import type { ActorLocals } from '../../middlewares/auth/actor.middleware.js';
import type { SprintAvailabilityLocals } from '../../middlewares/sprint/validate-sprint-availability.middleware.js';
import { getSprintAvailability, updateDoctorAvailability } from '../../services/sprint/sprint.service.js';

export const setDoctorAvailabilityController: RequestHandler = async (req, res, next) => {
  try {
    const sprintId = req.params.sprintId;
    const doctorId = req.params.doctorId;
    if (!sprintId || !doctorId) {
      next(new HttpError(400, { error: 'Missing sprintId or doctorId route param' }));
      return;
    }

    const payload = (res.locals as SprintAvailabilityLocals).setDoctorAvailabilityRequest;
    const actor = (res.locals as ActorLocals).actor;
    if (!payload) {
      next(new HttpError(500, { error: 'Doctor availability payload not validated' }));
      return;
    }

    if (!actor) {
      next(new HttpError(500, { error: 'Actor not resolved' }));
      return;
    }

    if (actor.userId !== doctorId) {
      next(new HttpError(403, { error: 'Doctor can only manage own availability' }));
      return;
    }

    const result = await updateDoctorAvailability(sprintId, doctorId, payload.availability, actor);
    if ('error' in result) {
      if (result.error === 'SPRINT_NOT_FOUND') {
        next(new HttpError(404, { error: 'Sprint not found' }));
        return;
      }

      if (result.error === 'PERIOD_NOT_FOUND') {
        next(new HttpError(404, { error: 'Period not found for sprint' }));
        return;
      }

      if (result.error === 'PERIOD_MISMATCH') {
        next(new HttpError(400, { error: 'Availability period must match sprint period' }));
        return;
      }

      if (result.error === 'DAY_OUT_OF_RANGE') {
        next(new HttpError(400, { error: 'Availability day is outside sprint period range' }));
        return;
      }

      next(new HttpError(404, { error: 'Doctor not found in sprint' }));
      return;
    }

    res.status(200).json(result.sprint);
  } catch (error) {
    next(error);
  }
};

export const plannerOverrideAvailabilityController: RequestHandler = async (req, res, next) => {
  try {
    const sprintId = req.params.sprintId;
    if (!sprintId) {
      next(new HttpError(400, { error: 'Missing sprintId route param' }));
      return;
    }

    const payload = (res.locals as SprintAvailabilityLocals).plannerOverrideAvailabilityRequest;
    const actor = (res.locals as ActorLocals).actor;
    if (!payload) {
      next(new HttpError(500, { error: 'Planner override payload not validated' }));
      return;
    }

    if (!actor) {
      next(new HttpError(500, { error: 'Actor not resolved' }));
      return;
    }

    const result = await updateDoctorAvailability(sprintId, payload.doctorId, payload.availability, actor);
    if ('error' in result) {
      if (result.error === 'SPRINT_NOT_FOUND') {
        next(new HttpError(404, { error: 'Sprint not found' }));
        return;
      }

      if (result.error === 'PERIOD_NOT_FOUND') {
        next(new HttpError(404, { error: 'Period not found for sprint' }));
        return;
      }

      if (result.error === 'PERIOD_MISMATCH') {
        next(new HttpError(400, { error: 'Availability period must match sprint period' }));
        return;
      }

      if (result.error === 'DAY_OUT_OF_RANGE') {
        next(new HttpError(400, { error: 'Availability day is outside sprint period range' }));
        return;
      }

      next(new HttpError(404, { error: 'Doctor not found in sprint' }));
      return;
    }

    res.status(200).json(result.sprint);
  } catch (error) {
    next(error);
  }
};

export const listSprintAvailabilityController: RequestHandler = async (req, res, next) => {
  try {
    const sprintId = req.params.sprintId;
    if (!sprintId) {
      next(new HttpError(400, { error: 'Missing sprintId route param' }));
      return;
    }

    const items = await getSprintAvailability(sprintId);
    if (!items) {
      next(new HttpError(404, { error: 'Sprint not found' }));
      return;
    }

    res.status(200).json({ items });
  } catch (error) {
    next(error);
  }
};
