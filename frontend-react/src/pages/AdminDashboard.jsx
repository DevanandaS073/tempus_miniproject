import React from 'react';

const AdminDashboard = () => {
    return (
        <div style={{ padding: '20px' }}>
            <h2>Admin Dashboard</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
                <div style={cardStyle}>
                    <h3>Stats</h3>
                    <p>Metrics overview...</p>
                </div>
                <div style={cardStyle}>
                    <h3>Calendar</h3>
                    <p>Schedule view...</p>
                </div>
                <div style={cardStyle}>
                    <h3>Create Meeting</h3>
                    <button>New Meeting</button>
                </div>
                <div style={cardStyle}>
                    <h3>Create Event</h3>
                    <button>New Event</button>
                </div>
                <div style={cardStyle}>
                    <h3>Automation Section</h3>
                    <p>Manage workflows...</p>
                </div>
                <div style={cardStyle}>
                    <h3>Reports</h3>
                    <p>Generate reports...</p>
                </div>
                <div style={cardStyle}>
                    <h3>User Management</h3>
                    <p>Manage users...</p>
                </div>
            </div>
        </div>
    );
};

const cardStyle = {
    border: '1px solid #ddd',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

export default AdminDashboard;
