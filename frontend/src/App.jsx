// frontend/src/App.jsx
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from './store/auth/authSlice';

function App() {
  const dispatch = useDispatch();
  const authLoading = useSelector((state) => state.auth.loading);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // Show a loading screen while checking auth status
  if (authLoading === 'pending') {
    return (
      <div className="flex justify-center items-center h-screen">
      <div className="border-4 border-blue-500 border-t-transparent border-solid rounded-full w-16 h-16 animate-spin"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

// (You can create a simple LoadingSpinner component or just return <div>Loading...</div>)
export default App;