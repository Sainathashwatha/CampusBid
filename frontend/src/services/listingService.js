import api from './api.js'

export const listingService = {
  getListings: async (filters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v) })
    const res = await api.get(`/listings?${params}`)
    return res.data
  },

  getListing: async (id) => {
    const res = await api.get(`/listings/${id}`)
    return res.data
  },

 
  createListing: async (data) => {
    const isFormData = data instanceof FormData
    const res = await api.post('/listings', data, {
      headers: isFormData
        ? { 'Content-Type': undefined }  // let axios set multipart/form-data + boundary
        : { 'Content-Type': 'application/json' },
    })
    return res.data
  },

  getMyListings: async () => {
    const res = await api.get('/listings/mine')
    return res.data
  },

  deleteListing: async (id) => {
    const res = await api.delete(`/listings/${id}`)
    return res.data
  },
}