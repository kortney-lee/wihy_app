import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css'; // Assuming you have a CSS file for styling

const Sidebar: React.FC = () => {
    return (
        <div className="sidebar">
            <h2>Health Dashboard</h2>
            <ul>
                <li>
                    <Link to="/">Home</Link>
                </li>
                <li>
                    <Link to="/profile">Profile</Link>
                </li>
                <li>
                    <Link to="/dashboard">Dashboard</Link>
                </li>
                <li>
                    <Link to="/charts">Charts</Link>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;