
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  full_name?: string;
  api_token?: string;
}

interface Profile {
  id: number;
  name: string;
  email: string;
  role: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

  const API_BASE_URL = 'https://onlinemanagerbackend-production.up.railway.app';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Get token from localStorage
  const getToken = (): string | null => {
    return localStorage.getItem("admin_token") || localStorage.getItem("token");
  };

  // Set token in localStorage and axios headers
  const setToken = (token: string) => {
    localStorage.setItem("admin_token", token);
    localStorage.setItem("token", token);

    // Set axios default header
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  // Remove token from localStorage and axios headers
  const removeToken = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
  };

  // Setup axios interceptors
  useEffect(() => {
    // Request interceptor to add token to all requests
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          removeToken();
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const checkAuth = async () => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      // Set the token for axios
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const response = await axios.get<{ authenticated: boolean; user: User }>(
        `${API_BASE_URL}/api/admin/check-auth`
      );

      if (response.data.authenticated && response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);

        // Also fetch profile
        try {
          const profileResponse = await axios.get<{
            success: boolean;
            data: Profile;
          }>(`${API_BASE_URL}/api/admin/profile`);
          if (profileResponse.data.success && profileResponse.data.data) {
            setProfile(profileResponse.data.data);
          }
        } catch (profileError) {}
      } else {
        throw new Error("Not authenticated - invalid response");
      }
    } catch (error: any) {
      // Clear invalid token
      removeToken();
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await axios.get<{ success: boolean; data: Profile }>(
        `${API_BASE_URL}/api/admin/profile`
      );
      if (response.data.success && response.data.data) {
        setProfile(response.data.data);
      }
    } catch (error) {}
  };

  const signIn = async (email: string, password: string) => {
    // Declare here so it's available in both try and catch scopes
    let originalAuthHeader: any = undefined;

    try {
      // Remove any existing authorization header for login request
      originalAuthHeader = axios.defaults.headers.common["Authorization"];
      delete axios.defaults.headers.common["Authorization"];

      const response = await axios.post<{
        success: boolean;
        token: string;
        user: User;
      }>(`${API_BASE_URL}/api/admin/login`, {
        email,
        password,
      });

      if (response.data.success && response.data.token) {
        // Store the token and set axios headers
        setToken(response.data.token);

        // Store user data
        const userData = response.data.user;
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);

        // Fetch profile data
        try {
          const profileResponse = await axios.get<{
            success: boolean;
            data: Profile;
          }>(`${API_BASE_URL}/api/admin/profile`);
          if (profileResponse.data.success && profileResponse.data.data) {
            setProfile(profileResponse.data.data);
          }
        } catch (profileError) {}
      } else {
          const responseData = response.data as any;
        throw new Error(
         responseData.message || "Login failed - no token in response"
        );
      }
    } catch (error: any) {
      // Restore original auth header if it existed
      if (originalAuthHeader) {
        axios.defaults.headers.common["Authorization"] = originalAuthHeader;
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/admin/logout`);
    } catch (error: any) {
    } finally {
      removeToken();
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    }
  };

  // Initialize auth state and setup axios
  useEffect(() => {
    // Set initial axios headers if token exists
    const token = getToken();
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    profile,
    loading,
    isAuthenticated,
    signIn,
    signOut,
    refreshProfile,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export helper functions for external use
export const getAuthHeaders = (): HeadersInit => {
  const token =
    localStorage.getItem("admin_token") || localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getAuthAxiosConfig = () => {
  const token =
    localStorage.getItem("admin_token") || localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// Export a fetch wrapper for convenience
export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token =
    localStorage.getItem("admin_token") || localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
};
