import api from './api.js'

/*
  All auth API calls in one place.
  Components never call axios directly — they call these functions.
  
  WHY this pattern?
  If the backend URL changes or the response format changes,
  you fix it in ONE place — not in 10 different components.
*/

export const authService = {
  register: async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password })
    return res.data  // { success, user }
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    return res.data  // { success, user }
  },

  logout: async () => {
    const res = await api.post('/auth/logout')
    return res.data
  },

  getMe: async () => {
    const res = await api.get('/auth/me')
    return res.data  // { success, user }
  },
}