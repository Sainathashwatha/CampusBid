import axios from 'axios'

/*
  WHY a central axios instance?
  ───────────────────────────────
  Instead of writing baseURL + credentials on every API call,
  we configure it once here. Every service file imports this.

  withCredentials: true  →  sends the httpOnly cookie with every request
                             without this, the browser strips the cookie
                             and the backend thinks you're not logged in

  baseURL: '/api'        →  Vite proxy forwards this to http://localhost:5000/api
                             In production, change to your deployed backend URL
*/
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,        // CRITICAL — sends cookie automatically
  headers: {
    'Content-Type': 'application/json',
  },
})

/*
  Global response interceptor:
  If backend returns 401 (not authenticated), redirect to login.
  This handles expired cookies automatically — user gets sent to
  login page instead of seeing a broken UI.
*/
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if not already on auth pages
      const isAuthPage = ['/login', '/register'].includes(window.location.pathname)
      if (!isAuthPage) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api