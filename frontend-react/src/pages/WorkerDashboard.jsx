import React from 'react';

const WorkerDashboard = () => {
    return (
        <div style={{ padding: '20px' }}>
            <h2>Worker Dashboard</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
                <div style={cardStyle}>
                    <h3>My Meetings</h3>
                    <p>Upcoming meetings...</p>
                </div>
                <div style={cardStyle}>
                    <h3>My Collision Alerts</h3>
                    <p>Schedule conflicts...</p>
                </div>
                <div style={cardStyle}>
                    <h3>My Certificates</h3>
                    <p>View certificates...</p>
                </div>
                <div style={cardStyle}>
                    <h3>Event Posters</h3>
                    <p>Generated posters...</p>
                </div>
                <div style={cardStyle}>
                    <h3>My Reports</h3>
                    <p>Submitted reports...</p>
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

export default WorkerDashboard;
