import { createContext, useContext, useState, useCallback } from 'react';
import { connectSocket, disconnectSocket } from '../socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const stored = () => {
    try {
      const raw = localStorage.getItem('rs_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const [user, setUser] = useState(stored);

  const login = useCallback((token, userData) => {
    localStorage.setItem('rs_token', token);
    localStorage.setItem('rs_user', JSON.stringify(userData));
    setUser(userData);
    connectSocket(userData.id);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('rs_token');
    localStorage.removeItem('rs_user');
    setUser(null);
    disconnectSocket();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
