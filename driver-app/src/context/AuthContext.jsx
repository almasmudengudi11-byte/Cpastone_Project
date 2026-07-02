import { createContext, useContext, useState, useCallback } from 'react';
import { connectSocket, disconnectSocket } from '../socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const stored = () => {
    try {
      const raw = localStorage.getItem('dr_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const [user, setUser] = useState(stored);

  const login = useCallback((token, userData) => {
    localStorage.setItem('dr_token', token);
    localStorage.setItem('dr_user', JSON.stringify(userData));
    setUser(userData);
    connectSocket(userData.id);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('dr_token');
    localStorage.removeItem('dr_user');
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
