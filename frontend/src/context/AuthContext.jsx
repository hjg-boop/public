import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import api, { apiErrorMessage } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem("cp_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.data.user);
        setProfile(res.data.data.profile);
      } catch {
        localStorage.removeItem("cp_token");
        localStorage.removeItem("cp_user");
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (identifier, password) => {
    try {
      const res = await api.post("/auth/login", { identifier, password });
      const { token, user: loggedInUser, profile: loggedInProfile } = res.data.data;
      localStorage.setItem("cp_token", token);
      localStorage.setItem("cp_user", JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      setProfile(loggedInProfile);
      return { success: true, user: loggedInUser };
    } catch (err) {
      return { success: false, message: apiErrorMessage(err) };
    }
  };

  const loginWithGoogle = useCallback(async (credential) => {
    try {
      const res = await api.post("/auth/google", { credential });
      const { token, user: loggedInUser, profile: loggedInProfile } = res.data.data;
      localStorage.setItem("cp_token", token);
      localStorage.setItem("cp_user", JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      setProfile(loggedInProfile);
      return { success: true, user: loggedInUser };
    } catch (err) {
      return { success: false, message: apiErrorMessage(err) };
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("cp_token");
    localStorage.removeItem("cp_user");
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, loading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
