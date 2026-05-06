import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { AuthProvider } from '@/context/AuthContext'
import { ByteProvider } from '@/context/ByteContext'
import { VoiceEntryProvider } from '@/context/VoiceEntryContext'
import { HomePage } from '@/pages/HomePage'
import { LandingPage } from '@/pages/LandingPage'
import { MealDetailPage } from '@/pages/MealDetailPage'
import { MealsPage } from '@/pages/MealsPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ProgressPage } from '@/pages/ProgressPage'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'
import { SignInPage } from '@/pages/SignInPage'
import { VoicePage } from '@/pages/VoicePage'


export default function App() {
  return (
    <AuthProvider>
      <ByteProvider>
        <BrowserRouter>
          <VoiceEntryProvider>
            <Layout>
              <Routes>
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/" element={<LandingPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/voice" element={<VoicePage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/meals" element={<MealsPage />} />
                <Route path="/meals/:slot" element={<MealDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </VoiceEntryProvider>
        </BrowserRouter>
      </ByteProvider>
    </AuthProvider>
  )
}
