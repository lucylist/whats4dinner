import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import MealsLibrary from './pages/MealsLibrary';
import MealDetail from './pages/MealDetail';
import MealForm from './pages/MealForm';
import ThisWeek from './pages/ThisWeek';
import PlanWeek from './pages/PlanWeek';
import EditPlan from './pages/EditPlan';
import Fridge from './pages/Fridge';
import AddIngredient from './pages/AddIngredient';
import Recommendations from './pages/Recommendations';
import PhotoScan from './pages/PhotoScan';
import { ChefHat } from 'lucide-react';

function LoginScreen() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ChefHat className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">What's for dinner?</h1>
          <p className="text-gray-500">Your family meal planner</p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-xl px-6 py-3.5 text-gray-700 font-medium hover:bg-gray-50 hover:shadow-md transition-all shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        <p className="text-xs text-gray-400 mt-6">
          Sign in to sync meals, plans & fridge with your family
        </p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<MealsLibrary />} />
            <Route path="/meal-detail" element={<MealDetail />} />
            <Route path="/meal-form" element={<MealForm />} />
            <Route path="/this-week" element={<ThisWeek />} />
            <Route path="/plan-week" element={<PlanWeek />} />
            <Route path="/edit-plan" element={<EditPlan />} />
            <Route path="/fridge" element={<Fridge />} />
            <Route path="/add-ingredient" element={<AddIngredient />} />
            <Route path="/photo-scan" element={<PhotoScan />} />
            <Route path="/recommendations" element={<Recommendations />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
