import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated from localStorage
    const checkAuth = () => {
      const savedUser = localStorage.getItem('disaster_dashboard_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setIsAuthenticated(true);
        setUser(userData);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    // Demo login validation
    if (credentials.email === 'demo@disaster-dashboard.com' && credentials.password === 'demo123') {
      const userData = {
        id: 1,
        name: 'Demo User',
        email: credentials.email,
        region: 'EU'
      };
      
      // Save to localStorage
      localStorage.setItem('disaster_dashboard_user', JSON.stringify(userData));
      
      setIsAuthenticated(true);
      setUser(userData);
      return { success: true };
    } else {
      throw new Error('Invalid credentials. Use demo@disaster-dashboard.com / demo123');
    }
  };

  const logout = () => {
    localStorage.removeItem('disaster_dashboard_user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
