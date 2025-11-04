// frontend/src/pages/Register.jsx
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import sentilokaLogo from '../assets/sentiloka_logo.png';

// React Hook Form & Redux imports
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../store/auth/authSlice';

// Validation Schema
const registerSchema = z
  .object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z
      .string()
      .email('Invalid email address')
      .regex(
        /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/,
        'Invalid email format'
      ),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'], // Error will be attached to confirmPassword field
  });

const Register = () => {
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
    resolver: zodResolver(registerSchema),
  });

  // Handle form submission
  const onSubmit = (data) => {
    if (loading !== 'pending') {
      // Don't send confirmPassword to the API
      const { confirmPassword, ...apiData } = data;
      dispatch(registerUser(apiData));
    }
  };

  // Redirect if registration is successful
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

      {/* Right side - Register card */}
      <div className="relative bg-[#2f4c4a] shadow-lg p-10 rounded-2xl w-full max-w-sm text-white">
        {/* Back button */}
        <button
          onClick={() => navigate('/login')}
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
              : 'Registration failed. Please try again.'}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-sm">Name</label>
            <input
              type="text"
              {...register('name')} // Mapped to 'name' for the backend
              className={`w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-gray-800 focus:ring-2 ${
                errors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#b6d1ce]'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-red-300 text-xs">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm">Email</label>
            <input
              type="email"
              {...register('email')}
              title="Masukkan alamat email yang valid (contoh: user@domain.com)"
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

          <div>
            <label className="block mb-1 font-medium text-sm">
              Confirm Password
            </label>
            <input
              type="password"
              {...register('confirmPassword')}
              className={`w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-gray-800 focus:ring-2 ${
                errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#b6d1ce]'
              }`}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-red-300 text-xs">
                {errors.confirmPassword.message}
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
              {loading === 'pending' ? 'Creating account...' : 'Sign Up'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-[#FAF6E9] text-sm text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-[#FAF6E9] hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;