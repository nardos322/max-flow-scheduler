import type { RequestHandler } from 'express';
import { HttpError } from '../../errors/http.error.js';
import type { SprintLocals } from '../../middlewares/sprint/validate-sprint.middleware.js';
import {
  createSprint,
  findSprintOrNull,
  getAllSprints,
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
