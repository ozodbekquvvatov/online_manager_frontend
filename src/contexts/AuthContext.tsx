
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
  console.log('🔐 signIn called:', { email, password });
  
  let originalAuthHeader: any = undefined;

  try {
    // Remove any existing authorization header for login request
    originalAuthHeader = axios.defaults.headers.common["Authorization"];
    delete axios.defaults.headers.common["Authorization"];

    console.log('📤 Sending login request to:', `${API_BASE_URL}/api/admin/login`);
    
    const response = await axios.post<{
      success?: boolean;
      token?: string;
      user?: User;
      message?: string;
    }>(`${API_BASE_URL}/api/admin/login`, {
      email,
      password,
    });

    console.log('✅ Login response received:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      dataKeys: Object.keys(response.data)
    });

    // DEBUG: Log the full response structure
    console.log('🔍 Response structure analysis:', {
      hasTokenProperty: 'token' in response.data,
      tokenValue: response.data.token,
      hasSuccessProperty: 'success' in response.data,
      successValue: response.data.success,
      hasUserProperty: 'user' in response.data,
      userKeys: response.data.user ? Object.keys(response.data.user) : []
    });

    // CHECK ALL POSSIBLE TOKEN LOCATIONS
    let token: string | null = null;
    
    // Option 1: Direct token property (your current check)
    if (response.data.token) {
      token = response.data.token;
      console.log('🔑 Token found in response.data.token:', token.substring(0, 20) + '...');
    }
    // Option 2: User object has api_token
    else if (response.data.user?.api_token) {
      token = response.data.user.api_token;
      console.log('🔑 Token found in response.data.user.api_token:', token.substring(0, 20) + '...');
    }
    // Option 3: Check if success is true but token in different format
    else if (response.data.success === true) {
      console.log('⚠️ Success is true but no token found. Checking response structure...');
      // Try to find token in any property
      const responseStr = JSON.stringify(response.data);
      if (responseStr.includes('api_token') || responseStr.includes('token')) {
        console.log('🔍 Token string found in response, but not at expected location');
      }
    }

    if (!token) {
      console.error('❌ NO TOKEN FOUND IN RESPONSE. Full response:', response.data);
      console.error('❌ Response keys:', Object.keys(response.data));
      if (response.data.user) {
        console.error('❌ User object keys:', Object.keys(response.data.user));
      }
      throw new Error('Login failed - no token in response');
    }

    // Store the token and set axios headers
    console.log('💾 Storing token:', token.substring(0, 20) + '...');
    setToken(token);

    // Store user data
    const userData = response.data.user || {
      id: 1,
      name: 'Admin',
      email: email,
      role: 'admin'
    };
    
    console.log('👤 User data to store:', userData);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);

    // Try to fetch profile (optional)
    try {
      console.log('📋 Attempting to fetch profile...');
      const profileResponse = await axios.get<{
        success: boolean;
        data: Profile;
      }>(`${API_BASE_URL}/api/admin/profile`);
      
      if (profileResponse.data.success && profileResponse.data.data) {
        console.log('✅ Profile fetched successfully');
        setProfile(profileResponse.data.data);
      }
    } catch (profileError: any) {
      console.warn('⚠️ Could not fetch profile:', profileError.message);
      // This is not critical, continue without profile
    }

    console.log('✅ Login completed successfully!');
    return;

  } catch (error: any) {
    console.error('🔥 signIn ERROR DETAILS:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });

    // Restore original auth header if it existed
    if (originalAuthHeader) {
      axios.defaults.headers.common["Authorization"] = originalAuthHeader;
    }

    // Better error messages
    if (error.response?.status === 401) {
      throw new Error('Invalid email or password');
    } else if (error.response?.status === 500) {
      throw new Error('Server error - please try again later');
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.message.includes('no token')) {
      // Add backend response details to the error
      const backendMsg = error.response?.data ? 
        ` Backend responded with: ${JSON.stringify(error.response.data)}` : 
        '';
      throw new Error(`Login failed - no token in response.${backendMsg}`);
    } else if (error.message.includes('Network Error')) {
      throw new Error('Cannot connect to server. Check your internet connection.');
    } else {
      throw new Error('Login failed. Please try again.');
    }
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
