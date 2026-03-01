import type { RequestHandler } from 'express';
import { HttpError } from '../errors/http.error.js';
import type { DoctorLocals } from '../middlewares/validate-doctor.middleware.js';
import {
  createDoctor,
  deleteDoctor,
  getDoctorById,
  listDoctors,
  updateDoctor,
} from '../services/doctor/doctor.service.js';

export const createDoctorController: RequestHandler = async (_req, res, next) => {
  try {
    const payload = (res.locals as DoctorLocals).createDoctorRequest;
    if (!payload) {
      next(new HttpError(500, { error: 'Create doctor payload not validated' }));
      return;
    }

    const doctor = await createDoctor(payload);
    res.status(201).json(doctor);
  } catch (error) {
    next(error);
  }
};

export const listDoctorsController: RequestHandler = async (_req, res, next) => {
  try {
    res.status(200).json({ items: await listDoctors() });
  } catch (error) {
    next(error);
  }
};

export const getDoctorController: RequestHandler = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId;
    if (!doctorId) {
      next(new HttpError(400, { error: 'Missing doctorId route param' }));
      return;
    }

    const doctor = await getDoctorById(doctorId);
    if (!doctor) {
      next(new HttpError(404, { error: 'Doctor not found' }));
      return;
    }

    res.status(200).json(doctor);
  } catch (error) {
    next(error);
  }
};

export const updateDoctorController: RequestHandler = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId;
    if (!doctorId) {
      next(new HttpError(400, { error: 'Missing doctorId route param' }));
      return;
    }

    const payload = (res.locals as DoctorLocals).updateDoctorRequest;
    if (!payload) {
      next(new HttpError(500, { error: 'Update doctor payload not validated' }));
      return;
    }

    const doctor = await updateDoctor(doctorId, payload);
    if (!doctor) {
      next(new HttpError(404, { error: 'Doctor not found' }));
      return;
    }

    res.status(200).json(doctor);
  } catch (error) {
    next(error);
  }
};

export const deleteDoctorController: RequestHandler = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId;
    if (!doctorId) {
      next(new HttpError(400, { error: 'Missing doctorId route param' }));
      return;
    }

    const deleted = await deleteDoctor(doctorId);
    if (!deleted) {
      next(new HttpError(404, { error: 'Doctor not found' }));
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
