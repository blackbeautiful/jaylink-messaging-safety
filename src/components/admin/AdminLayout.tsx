import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CreditCard,
  DollarSign,
  FileText,
  Home,
  LogOut,
  Settings,
  User,
  Users,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from 'sonner';

// Import centralized API instance and utilities
import { adminApi, apiUtils } from '@/config/api';

interface AdminLayoutProps {
  children: ReactNode;
}

interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch admin user data on component mount
  useEffect(() => {
    const fetchAdminUser = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        
        if (!token) {
          // If no admin token, redirect to admin login
          navigate('/jayadminlink/login', { replace: true });
          return;
        }
        
        const response = await adminApi.get(apiUtils.endpoints.admin.me);
        
        if (response.data.success) {
          setAdminUser(response.data.data.admin);
          
          // Update the stored admin data to ensure it's fresh
          localStorage.setItem("adminUser", JSON.stringify(response.data.data.admin));
        } else {
          // If unsuccessful, redirect to admin login
          toast.error('Admin session expired. Please login again.');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          navigate('/jayadminlink/login', { replace: true });
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
        const errorMessage = apiUtils.handleError(error, 'Could not verify admin session. Please login again.');
        toast.error(errorMessage);
        
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/jayadminlink/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAdminUser();
  }, [navigate]);

  const sidebarLinks = [
    { name: 'Dashboard', icon: <Home size={20} />, path: '/jayadminlink/dashboard' },
    { name: 'User Management', icon: <Users size={20} />, path: '/jayadminlink/users' },
    { name: 'Service Costs', icon: <DollarSign size={20} />, path: '/jayadminlink/service-costs' },
    {
      name: 'Balance Management',
      icon: <CreditCard size={20} />,
      path: '/jayadminlink/balance-management',
    },
    { name: 'Transactions', icon: <FileText size={20} />, path: '/jayadminlink/transactions' },
    { name: 'Analytics', icon: <BarChart3 size={20} />, path: '/jayadminlink/analytics' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/jayadminlink/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    toast.success('You have been successfully logged out of admin panel.');
    navigate('/jayadminlink/login', { replace: true });
  };

  // Display admin name and email
  const adminName = adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : 'Admin';
  const adminEmail = adminUser ? adminUser.email : 'admin@example.com';

  // Show loading while fetching admin data
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-jaylink-600 dark:text-jaylink-400" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <Link to="/jayadminlink/dashboard" className="flex items-center space-x-2">
            <span className="font-bold text-xl text-jaylink-800 dark:text-white">
              Jay<span className="text-jaylink-600">Link</span> Admin
            </span>
          </Link>
        </div>

        <nav className="mt-6">
          <ul className="space-y-1 px-3">
            {sidebarLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                    currentPath === link.path
                      ? 'bg-jaylink-50 text-jaylink-700 dark:bg-jaylink-900/20 dark:text-jaylink-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span
                    className={`mr-3 ${
                      currentPath === link.path
                        ? 'text-jaylink-600 dark:text-jaylink-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {link.icon}
                  </span>
                  <span className="font-medium">{link.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-jaylink-100 flex items-center justify-center text-jaylink-600">
              <User size={20} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{adminName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{adminEmail}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full border-gray-200 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
            onClick={handleLogout}
          >
            <LogOut size={16} className="mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Portal</h1>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link
              to="/dashboard"
              className="text-sm text-jaylink-600 dark:text-jaylink-400 hover:text-jaylink-700 dark:hover:text-jaylink-300"
            >
              Go to User Dashboard
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;