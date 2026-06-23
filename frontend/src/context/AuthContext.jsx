import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('agoramind_token');
    const username = localStorage.getItem('agoramind_username');
    const isAdmin = localStorage.getItem('agoramind_is_admin') === 'true';
    if (token && username) {
      setUser({ token, username, isAdmin });
    }
    setLoading(false);
  }, []);

  const login = (token, username, isAdmin = false) => {
    localStorage.setItem('agoramind_token', token);
    localStorage.setItem('agoramind_username', username);
    localStorage.setItem('agoramind_is_admin', isAdmin);
    setUser({ token, username, isAdmin });
  };

  const logout = () => {
    localStorage.removeItem('agoramind_token');
    localStorage.removeItem('agoramind_username');
    localStorage.removeItem('agoramind_is_admin');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
