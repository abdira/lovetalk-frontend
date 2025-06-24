import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext'; // assuming you have this for auth & axios

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { user: authUser, axiosInstance } = useContext(AuthContext); // from your AuthContext

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch full user profile on authUser change
  useEffect(() => {
    const fetchUser = async () => {
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get('/api/user/profile'); // your backend API
        setUser(response.data.user);
      } catch (err) {
        setError('Failed to load user profile.');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [authUser, axiosInstance]);

  // You can add updateUser function to update user state locally after profile changes
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <UserContext.Provider value={{ user, loading, error, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

