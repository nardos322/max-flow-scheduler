import type { CreateDoctorRequest, DoctorCatalog, UpdateDoctorRequest } from '@scheduler/domain';
import {
  createDoctor,
  deleteDoctor,
  getDoctorById,
  listDoctors,
  updateDoctor,
} from './doctor.repository.js';

export { createDoctor, listDoctors, getDoctorById, updateDoctor, deleteDoctor };

export async function ensureActiveDoctorsOrMissing(doctorIds: string[]): Promise<{ missing: string[] }> {
  const missing: string[] = [];

  for (const doctorId of doctorIds) {
    const doctor = await getDoctorById(doctorId);
    if (!doctor || !doctor.active) {
      missing.push(doctorId);
    }
  }

  return { missing };
}

export type { CreateDoctorRequest, DoctorCatalog, UpdateDoctorRequest };
