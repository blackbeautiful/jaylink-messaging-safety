
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { WPUser } from '@/types/wordpress';

// Mock API service for now - we'll replace with real API calls later
const wpApiService = {
  login: async (username: string, password: string) => {
    // Simulate successful login
    return {
      token: 'sample-token',
      user_display_name: 'John Doe',
      user_email: 'john@example.com',
      user_nicename: 'johndoe'
    };
  },
  getCurrentUser: async () => {
    // Return mock user data
    return {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'administrator'
    };
  }
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: WPUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<WPUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check for existing authentication on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('wp_token');
    
    if (storedToken) {
      // Validate the token and get user data
      setToken(storedToken);
      setIsAuthenticated(true);
      
      const fetchUser = async () => {
        try {
          const userData = await wpApiService.getCurrentUser();
          if (userData) {
            setUser(userData as WPUser);
          } else {
            // Token might be invalid or expired
            handleLogout();
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          handleLogout();
        } finally {
          setLoading(false);
        }
      };
      
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (username: string, password: string) => {
    try {
      setLoading(true);
      const authResponse = await wpApiService.login(username, password);
      
      if (authResponse && 'token' in authResponse) {
        // Save the token and set user as authenticated
        const { token, user_display_name, user_email, user_nicename } = authResponse;
        
        localStorage.setItem('wp_token', token);
        setToken(token);
        setIsAuthenticated(true);
        
        // Fetch additional user data if needed
        const userData = await wpApiService.getCurrentUser();
        if (userData) {
          setUser(userData as WPUser);
        }
        
        toast({
          title: "Login successful",
          description: `Welcome, ${user_display_name || user_nicename}!`,
        });
        
        return true;
      }
      
      throw new Error('Authentication failed');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Invalid username or password. Please try again.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('wp_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        token,
        login: handleLogin,
        logout: handleLogout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
