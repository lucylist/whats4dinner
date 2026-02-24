import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import Welcome from './pages/Welcome';
import { resolveRoom, generateRoomId, saveRoom, setRoomInUrl } from './utils/room';

function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const existing = resolveRoom();
    if (existing) {
      setRoomId(existing);
      setRoomInUrl(existing);
    }
    setChecked(true);
  }, []);

  const handleCreateRoom = () => {
    const id = generateRoomId();
    saveRoom(id);
    setRoomInUrl(id);
    setRoomId(id);
  };

  const handleJoinRoom = (code: string) => {
    saveRoom(code);
    setRoomInUrl(code);
    setRoomId(code);
  };

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest-800">
        <div className="animate-spin w-8 h-8 border-4 border-cobalt border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  if (!roomId) {
    return <Welcome onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
  }

  return (
    <AppProvider roomId={roomId}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/calendar" replace />} />
            <Route path="/calendar" element={<ThisWeek />} />
            <Route path="/meals" element={<MealsLibrary />} />
            <Route path="/meal-detail" element={<MealDetail />} />
            <Route path="/meal-form" element={<MealForm />} />
            <Route path="/plan-week" element={<PlanWeek />} />
            <Route path="/edit-plan" element={<EditPlan />} />
            <Route path="/fridge" element={<Fridge />} />
            <Route path="/add-ingredient" element={<AddIngredient />} />
            <Route path="/photo-scan" element={<PhotoScan />} />
            <Route path="/recommendations" element={<Recommendations />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppProvider>
  );
}

export default App;
