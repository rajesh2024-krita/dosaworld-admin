import axios from 'axios';
import { OfferSection, ApiResponse } from '../Types/OfferSection';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Send FormData when creating/updating offer section
export const offerSectionService = {
  create: async (sectionData: FormData): Promise<ApiResponse<OfferSection>> => {
    console.log(FormData);
    const response = await api.post('/offer-sections', sectionData, {
      headers: { 'Content-Type': 'multipart/form-data' }, // important!
    });
    console.log(response);
    return response.data;
  },

  update: async (id: string, sectionData: FormData): Promise<ApiResponse<OfferSection>> => {
    const response = await api.put(`/offer-sections/${id}`, sectionData, {
      headers: { 'Content-Type': 'multipart/form-data' }, // important!
    });
    return response.data;
  },

  getAll: async (): Promise<ApiResponse<OfferSection[]>> => {
    const response = await api.get('/offer-sections');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<OfferSection>> => {
    const response = await api.get(`/offer-sections/${id}`);
    return response.data;
  },

  getActive: async (): Promise<ApiResponse<OfferSection>> => {
    const response = await api.get('/offer-sections/active');
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/offer-sections/${id}`);
    return response.data;
  },
};
