import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
// import './App.css';
import { ConfigProvider, theme as antdTheme } from 'antd';
import DarkModeToggle from './components/DarkModeToggle';
import { ThemeContext, ThemeProvider } from './utils/ThemeContext';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import UserList from './components/UserList';
import SignOut from './components/SignOut';
import TaskList from './components/TaskList';
import UserDetails from './components/UserDetails';
import { ActionCableProvider } from './utils/ActionCableContext';

function AppContent() {
  const [user, setUser] = useState(null);
  const { theme } = useContext(ThemeContext);
  const themeConfig = {
    algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      // Customize as needed
      colorPrimary: theme === 'dark' ? '#4a90e2' : '#007bff',
      colorBgBase: theme === 'dark' ? '#1a1a1a' : '#ffffff', 
      colorTextBase: theme === 'dark' ? '#ffffff' : '#000000',
    },
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }
  }, []);

  const isAdminOrManager = user && (user.role === 'admin' || user.role === 'manager');

  const ProtectedRoute = ({ children, restrictToAdminManager = false }) => {
    if (!user) {
      return <Navigate to="/signin" />;
    }
    if (restrictToAdminManager && !isAdminOrManager) {
      return <Navigate to="/tasks" />;
    }
    return children;
  };

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
    <ConfigProvider theme={themeConfig}>
    <DarkModeToggle />
    <Router>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h1>Task Manager</h1>
        {user ? (
          <div>
            <p>
              Welcome, {user.email}
              {isAdminOrManager && ` (${user.role})`}
            </p>
            <nav style={{ marginBottom: '20px' }}>
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
    </ConfigProvider>
  );
}

const App = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default App;