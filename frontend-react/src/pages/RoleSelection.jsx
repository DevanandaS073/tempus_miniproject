import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoleSelection = () => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '2rem' }}>
            <h1>Welcome to Tempus</h1>
            <p>Select your role to proceed:</p>
            <div style={{ display: 'flex', gap: '2rem' }}>
                <button
                    onClick={() => navigate('/login?role=ADMIN')}
                    style={{ padding: '1rem 2rem', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                    Administrator
                </button>
                <button
                    onClick={() => navigate('/login?role=WORKER')}
                    style={{ padding: '1rem 2rem', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                    Worker
                </button>
            </div>
        </div>
    );
};

export default RoleSelection;
