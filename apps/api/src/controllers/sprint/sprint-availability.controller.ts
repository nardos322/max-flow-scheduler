import type { RequestHandler } from 'express';
import { HttpError } from '../../errors/http.error.js';
import type { ActorLocals } from '../../middlewares/auth/actor.middleware.js';
import type { SprintAvailabilityLocals } from '../../middlewares/sprint/validate-sprint-availability.middleware.js';
import { getSprintAvailability, updateDoctorAvailability } from '../../services/sprint/sprint.service.js';

export const setDoctorAvailabilityController: RequestHandler = (req, res, next) => {
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

  const result = updateDoctorAvailability(sprintId, doctorId, payload.availability, actor);
  if ('error' in result) {
    if (result.error === 'SPRINT_NOT_FOUND') {
      next(new HttpError(404, { error: 'Sprint not found' }));
      return;
    }

    next(new HttpError(404, { error: 'Doctor not found in sprint' }));
    return;
  }

  res.status(200).json(result.sprint);
};

export const plannerOverrideAvailabilityController: RequestHandler = (req, res, next) => {
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

  const result = updateDoctorAvailability(sprintId, payload.doctorId, payload.availability, actor);
  if ('error' in result) {
    if (result.error === 'SPRINT_NOT_FOUND') {
      next(new HttpError(404, { error: 'Sprint not found' }));
      return;
    }

    next(new HttpError(404, { error: 'Doctor not found in sprint' }));
    return;
  }

  res.status(200).json(result.sprint);
};

export const listSprintAvailabilityController: RequestHandler = (req, res, next) => {
  const sprintId = req.params.sprintId;
  if (!sprintId) {
    next(new HttpError(400, { error: 'Missing sprintId route param' }));
    return;
  }

  const items = getSprintAvailability(sprintId);
  if (!items) {
    next(new HttpError(404, { error: 'Sprint not found' }));
    return;
  }

  res.status(200).json({ items });
};
