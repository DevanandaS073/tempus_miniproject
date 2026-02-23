import { useAuth } from '../context/AuthContext'

export default function useApi() {
    const { token } = useAuth()

    const fetchWithAuth = async (url, options = {}) => {
        const headers = {
            ...options.headers,
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }
        if (options.body && typeof options.body === 'string') {
            headers['Content-Type'] = headers['Content-Type'] || 'application/json'
        }

        const res = await fetch(url, { ...options, headers })
        return res
    }

    return { fetchWithAuth }
}
