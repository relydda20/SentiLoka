// frontend/src/pages/Login.jsx
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import sentilokaLogo from '../assets/sentiloka_logo.png';

// React Hook Form & Redux imports
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/auth/authSlice';

// Validation Schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get auth state from Redux
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Handle form submission
  const onSubmit = (data) => {
    if (loading !== 'pending') {
      dispatch(loginUser(data));
    }
  };

  // Redirect if login is successful
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex md:flex-row flex-col justify-center items-center bg-linear-to-br from-[#FAFAFA] to-[#FAF6E9] p-4 min-h-screen">
      {/* Left side - Logo */}
      <div className="hidden md:flex flex-col items-center md:mr-32 mb-8 md:mb-0">
        <img
          src={sentilokaLogo}
          alt="SentiLoka Logo"
          className="mb-4 w-96 h-96" // Adjusted size
        />
        <h1 className="font-mate font-semibold text-[#2f4c4a] text-7xl">
          Senti<span className="text-[#416c68]">Loka</span>
        </h1>
        <p className="mt-2 text-gray-600 text-sm">Every Review Matters!</p>
      </div>

      {/* Right side - Login card */}
      <div className="relative bg-[#2f4c4a] shadow-lg p-10 rounded-2xl w-full max-w-sm text-white">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="top-4 left-4 absolute text-gray-300 hover:text-white transition"
        >
          <ArrowLeft size={22} />
        </button>

        <h2 className="mb-6 font-semibold text-3xl text-center">
          Senti<span className="text-[#FAF6E9]">Loka</span>
        </h2>

        {/* Display API Error */}
        {error && (
          <div className="bg-red-900 mb-4 p-3 rounded-md text-red-100 text-sm text-center">
            {typeof error === 'string'
              ? error
              : 'Login failed. Please check your credentials.'}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-sm">Email</label>
            <input
              type="email"
              {...register('email')}
              className={`w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-gray-800 focus:ring-2 ${
                errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#b6d1ce]'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-red-300 text-xs">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm">Password</label>
            <input
              type="password"
              {...register('password')}
              className={`w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-gray-800 focus:ring-2 ${
                errors.password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#b6d1ce]'
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-red-300 text-xs">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="pt-5 border-[#E1E6C3] border-b w-full"></div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading === 'pending'}
              className="bg-[#ECE8D9] hover:bg-[#c9c1b3] disabled:bg-gray-400 mt-4 py-2 rounded-full w-[80%] font-semibold text-[#2f4c4a] transition disabled:cursor-not-allowed"
            >
              {loading === 'pending' ? 'Signing in...' : 'Login'}
            </button>
          </div>

          <div className="flex justify-center items-center mt-2">
            <span className="text-gray-300 text-sm">or</span>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/auth/google`;
              }}
              className="flex justify-center items-center bg-white hover:bg-gray-100 py-2 rounded-full w-[80%] text-gray-700 transition"
            >
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google"
                className="mr-2 w-5"
              />
              Login with Google
            </button>
          </div>
        </form>

        <p className="mt-6 text-[#FAF6E9] text-sm text-center">
          New here?{' '}
          <Link to="/register" className="text-[#FAF6E9] hover:underline">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;