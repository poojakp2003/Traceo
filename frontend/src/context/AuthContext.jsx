import React, { createContext, useContext, useEffect, useState } from "react";
import { acceptInstructions as acceptInstructionsApi, getMe, loginUser, logoutUser, signupUser } from "../api/auth";
import { ACCESS_KEY, clearTokens, saveTokens } from "../api/client";

export const CURRENT_INSTRUCTIONS_VERSION = "1.0.0";

export const isInstructionsAccepted = (user) => {
  if (!user) return false;
  const accepted = user.hasAcceptedInstructions ?? user.has_accepted_instructions;
  const version = user.instructionsVersion ?? user.instructions_version;
  return Boolean(accepted && version === CURRENT_INSTRUCTIONS_VERSION);
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(ACCESS_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount or token change
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const userData = await getMe();
          setUser(userData);
        } catch (err) {
          console.error("Failed to load user info:", err);
          // Only drop the session if the server rejected it, not on a network error
          if (err.response?.status === 401) {
            setToken(null);
            setUser(null);
            clearTokens();
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await loginUser(email, password);
    saveTokens(res.access_token, res.refresh_token);
    setToken(res.access_token);
    const userData = await getMe();
    setUser(userData);
    return userData;
  };

  const signup = async (email, password) => {
    await signupUser(email, password);
    // After successful signup, immediately log in
    return await login(email, password);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn("Logout API returned error or already expired", e);
    } finally {
      clearTokens();
      setToken(null);
      setUser(null);
    }
  };

  const acceptInstructions = async (version = CURRENT_INSTRUCTIONS_VERSION) => {
    const updatedUser = await acceptInstructionsApi(version);
    setUser(updatedUser);
    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        hasAcceptedInstructions: isInstructionsAccepted(user),
        loading,
        login,
        signup,
        logout,
        acceptInstructions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};