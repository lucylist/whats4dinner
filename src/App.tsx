// Main App component with routing

import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

function App() {
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

export default App;
