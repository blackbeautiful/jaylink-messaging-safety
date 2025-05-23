import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthForm from '@/components/AuthForm';
import LogoImg from '@/assets/logo.svg';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  // Get the redirect path from location state, or default to dashboard
  const from = location.state?.from || '/dashboard';

  useEffect(() => {
    window.scrollTo(0, 0);

    // If user is already authenticated, redirect to dashboard or intended destination
    if (isAuthenticated && !loading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, from]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 bg-[url('https://images.unsplash.com/photo-1483058712412-4245e9b90334?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1800')] bg-cover bg-center bg-no-repeat bg-blend-overlay">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-block">
              {/* <img src={LogoImg} alt="Logo" width={120} height={40} /> */}
              <span className="font-bold text-3xl text-jaylink-800 dark:text-white">
                Jay<span className="text-jaylink-600">Link</span>
              </span>
            </Link>
          </div>

          {/* Auth form card */}
          <div className="bg-white dark:bg-gray-800 shadow-elevated rounded-2xl p-8">
            {/* Display any success messages passed via location state */}
            {location.state?.message && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 rounded-md text-sm">
                {location.state.message}
              </div>
            )}

            <AuthForm type="login" redirectPath={from} />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
