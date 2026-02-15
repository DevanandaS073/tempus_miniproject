import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { decodeToken } from '../utils/auth';

const Login = () => {
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role') || 'WORKER'; // Default to worker if no role selected
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        // TODO: Replace with actual API call
        // Mock login for demonstration purposes
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                // Decode token to verify role matches selected intent (optional but good practice)
                const decoded = decodeToken(data.token);
                /* 
                   NOTE: In real app, the token's role dictates the destination, 
                   not the user's initial selection alone. Use the token's role. 
                */
                if (decoded.role === 'ADMIN') {
                    navigate('/admin-dashboard');
                } else if (decoded.role === 'WORKER') {
                    navigate('/worker-dashboard');
                } else {
                    setError('Unknown role');
                }
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Connection error');
            // Mock Fallback for DEV without Backend
            console.warn("Backend might be down. Using Mock Logic.");
            if (email === 'admin@test.com') {
                navigate('/admin-dashboard');
            } else {
                navigate('/worker-dashboard');
            }
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '5rem' }}>
            <h2>Login as {role}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default Login;
