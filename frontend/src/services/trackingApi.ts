import { api } from './api';

export type VehicleTrackingResult = {
  plateNumber: string;
  ticketNumber: string;
  currentStep: string;
  updatedAt: string;
};

export const trackingApi = {
  searchVehicle: async (plateNumber: string): Promise<VehicleTrackingResult> => {
    const { data } = await api.get(`/tracking/search/${encodeURIComponent(plateNumber)}`);
    return data;
  },
};

