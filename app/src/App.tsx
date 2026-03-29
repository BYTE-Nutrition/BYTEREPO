import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { ByteProvider } from '@/context/ByteContext'
import { HomePage } from '@/pages/HomePage'
import { MealDetailPage } from '@/pages/MealDetailPage'
import { MealsPage } from '@/pages/MealsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ProgressPage } from '@/pages/ProgressPage'
import { VoicePage } from '@/pages/VoicePage'

export default function App() {
  return (
    <ByteProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/voice" element={<VoicePage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/meals" element={<MealsPage />} />
            <Route path="/meals/:slot" element={<MealDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ByteProvider>
  )
}
