import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'; // Added Link and Navigate
import './App.css';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import UserList from './components/UserList';
import SignOut from './components/SignOut';
import TaskList from './components/TaskList';
import UserDetails from './components/UserDetails';
import { ActionCableProvider } from './utils/ActionCableContext';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);
      console.log('App - Restored User:', parsedUser); // Debug
      console.log('App - Restored Token:', token); // Debug
      setUser(parsedUser); // Set user state to persist login
    }
  }, []);

  const isAdminOrManager = user && (user.role === 'admin' || user.role === 'manager');

  // ProtectedRoute with role-based access
  const ProtectedRoute = ({ children, restrictToAdminManager = false }) => {
    if (!user) {
      return <Navigate to="/signin" />;
    }
    if (restrictToAdminManager && !isAdminOrManager) {
      return <Navigate to="/tasks" />; // Redirect users to tasks
    }
    return children;
  };

  // const ProtectedRoute = ({ children }) => {
  //   return user ? children : <Navigate to="/signin" />;
  // };

  const CenteredLayout = ({ children }) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      {children}
    </div>
  );

  return (
    <Router>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h1>Task Manager</h1>
        {user ? (
          <div>
            {/* Conditional welcome message */}
            <p>
              Welcome, {user.email}
              {isAdminOrManager && ` (${user.role})`}
            </p>
            <nav style={{ marginBottom: '20px' }}>
              {/* Show Users link only for admin or manager */}
              {isAdminOrManager && (
                <Link to="/users" style={{ marginRight: '20px' }}>
                  Users
                </Link>
              )}
              <Link to="/tasks" style={{ marginRight: '20px' }}>
                Tasks
              </Link>
              <SignOut setUser={setUser} />
            </nav>
            <Routes>
              <Route
                path="/users"
                element={
                  <ProtectedRoute restrictToAdminManager={true}>
                    <UserList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ActionCableProvider>
                    <ProtectedRoute>
                      <TaskList />
                    </ProtectedRoute>
                  </ActionCableProvider>
                }
              />
              <Route
                path="/users/:userId"
                element={
                  <ProtectedRoute restrictToAdminManager={true}>
                    <UserDetails />
                  </ProtectedRoute>
                }
              />
              {/* Redirect any unmatched route to /tasks for logged-in users */}
              <Route
                path="*"
                element={<Navigate to="/tasks" />}
              />
            </Routes>
          </div>
        ) : (
          <>
            <nav style={{ marginBottom: '20px' }}>
              <Link to="/signin" style={{ marginRight: '20px' }}>
                Sign In
              </Link>
              <Link to="/signup">
                Sign Up
              </Link>
            </nav>
            <Routes>
              <Route
                path="/signin"
                element={
                  <CenteredLayout>
                    <SignIn setUser={setUser} />
                  </CenteredLayout>
                }
              />
              <Route
                path="/signup"
                element={
                  <CenteredLayout>
                    <SignUp setUser={setUser} />
                  </CenteredLayout>
                }
              />
              <Route
                path="*"
                element={
                  <CenteredLayout>
                    <SignIn setUser={setUser} />
                  </CenteredLayout>
                }
              />
            </Routes>
          </>
        )}
      </div>
    </Router>
  );
}

export default App;