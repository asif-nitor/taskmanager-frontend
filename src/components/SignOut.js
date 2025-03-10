import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../services/api';

const SignOut = ({ setUser }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('SignOut - Cleared localStorage');
      setUser(null);
      navigate('/signin');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}
    >
      Sign Out
    </button>
  );
};

export default SignOut;