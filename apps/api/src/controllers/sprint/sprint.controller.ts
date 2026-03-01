import type { RequestHandler } from 'express';
import { HttpError } from '../../errors/http.error.js';
import type { SprintLocals } from '../../middlewares/sprint/validate-sprint.middleware.js';
import {
  addDoctorToSprint,
  createSprint,
  findSprintOrNull,
  getAllSprints,
  removeDoctorFromSprint,
  updateSprintGlobalConfig,
} from '../../services/sprint/sprint.service.js';

export const createSprintController: RequestHandler = async (req, res, next) => {
  try {
    const payload = (res.locals as SprintLocals).createSprintRequest;
    if (!payload) {
      next(new HttpError(500, { error: 'Create sprint payload not validated' }));
      return;
    }

    const sprint = await createSprint(payload);
    res.status(201).json(sprint);
  } catch (error) {
    if (error instanceof Error && error.message === 'PERIOD_NOT_FOUND') {
      next(new HttpError(404, { error: 'Period not found' }));
      return;
    }

    if (error instanceof Error && error.message.startsWith('DOCTORS_NOT_FOUND:')) {
      const missing = error.message.slice('DOCTORS_NOT_FOUND:'.length).split(',').filter((item) => item.length > 0);
      next(new HttpError(404, { error: 'Doctor not found or inactive', details: missing }));
      return;
    }

    next(error);
  }
};

export const listSprintsController: RequestHandler = async (_req, res, next) => {
  try {
    res.status(200).json({ items: await getAllSprints() });
  } catch (error) {
    next(error);
  }
};

export const getSprintController: RequestHandler = async (req, res, next) => {
  try {
    const sprintId = req.params.sprintId;
    if (!sprintId) {
      next(new HttpError(400, { error: 'Missing sprintId route param' }));
      return;
    }

    const sprint = await findSprintOrNull(sprintId);
    if (!sprint) {
      next(new HttpError(404, { error: 'Sprint not found' }));
      return;
    }

    res.status(200).json(sprint);
  } catch (error) {
    next(error);
  }
};

export const updateSprintGlobalConfigController: RequestHandler = async (req, res, next) => {
  try {
    const payload = (res.locals as SprintLocals).updateGlobalConfigRequest;
    if (!payload) {
      next(new HttpError(500, { error: 'Update sprint config payload not validated' }));
      return;
    }

    const sprintId = req.params.sprintId;
    if (!sprintId) {
      next(new HttpError(400, { error: 'Missing sprintId route param' }));
      return;
    }

    const sprint = await updateSprintGlobalConfig(sprintId, payload.globalConfig);
    if (!sprint) {
      next(new HttpError(404, { error: 'Sprint not found' }));
      return;
    }

    res.status(200).json(sprint);
  } catch (error) {
    next(error);
  }
};

export const addSprintDoctorController: RequestHandler = async (req, res, next) => {
  try {
    const payload = (res.locals as SprintLocals).addSprintDoctorRequest;
    if (!payload) {
      next(new HttpError(500, { error: 'Add sprint doctor payload not validated' }));
      return;
    }

    const sprintId = req.params.sprintId;
    if (!sprintId) {
      next(new HttpError(400, { error: 'Missing sprintId route param' }));
      return;
    }

    const result = await addDoctorToSprint(sprintId, payload.doctorId);
    if ('error' in result) {
      if (result.error === 'SPRINT_NOT_FOUND') {
        next(new HttpError(404, { error: 'Sprint not found' }));
        return;
      }
      if (result.error === 'DOCTOR_NOT_FOUND_OR_INACTIVE') {
        next(new HttpError(404, { error: 'Doctor not found or inactive' }));
        return;
      }
      if (result.error === 'DOCTOR_ALREADY_IN_SPRINT') {
        next(new HttpError(409, { error: 'Doctor already in sprint' }));
        return;
      }
      next(new HttpError(422, { error: 'Sprint participants can only be edited in draft status' }));
      return;
    }

    res.status(200).json(result.sprint);
  } catch (error) {
    next(error);
  }
};

export const removeSprintDoctorController: RequestHandler = async (req, res, next) => {
  try {
    const sprintId = req.params.sprintId;
    const doctorId = req.params.doctorId;
    if (!sprintId || !doctorId) {
      next(new HttpError(400, { error: 'Missing sprintId or doctorId route param' }));
      return;
    }

    const result = await removeDoctorFromSprint(sprintId, doctorId);
    if ('error' in result) {
      if (result.error === 'SPRINT_NOT_FOUND') {
        next(new HttpError(404, { error: 'Sprint not found' }));
        return;
      }
      if (result.error === 'DOCTOR_NOT_IN_SPRINT') {
        next(new HttpError(404, { error: 'Doctor not found in sprint' }));
        return;
      }
      next(new HttpError(422, { error: 'Sprint participants can only be edited in draft status' }));
      return;
    }

    res.status(200).json(result.sprint);
  } catch (error) {
    next(error);
  }
};
