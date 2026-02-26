import Loading from './components/Loading'
import DesktopShell from './components/DesktopShell'
import './index.css'
import { ErrorBook } from './pages/ErrorBook'
import { FriendLinks } from './pages/FriendLinks'
import GalleryPage from './pages/Gallery-N'
import MobilePage from './pages/Mobile'
import TypingPage from './pages/Typing'
import { isOpenDarkModeAtom } from '@/store'
import 'animate.css'
import { useAtomValue } from 'jotai'
import mixpanel from 'mixpanel-browser'
import process from 'process'
import React, { Suspense, lazy, useEffect, useState } from 'react'
import 'react-app-polyfill/stable'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

const AnalysisPage = lazy(() => import('./pages/Analysis'))
const LoginPage = lazy(() => import('./pages/Auth/Login'))
const SignUpPage = lazy(() => import('./pages/Auth/SignUp'))
const PremiumPage = lazy(() => import('./pages/Premium'))
const PaymentPage = lazy(() => import('./pages/Payment'))
const PaymentResultPage = lazy(() => import('./pages/Payment/Result'))
const ShareLandingPage = lazy(() => import('./pages/Share/Landing'))
const SettingsPage = lazy(() => import('./pages/Settings'))
const ArticlePage = lazy(() => import('./pages/Article'))
const ArticleGalleryPage = lazy(() => import('./pages/ArticleGallery'))

if (process.env.NODE_ENV === 'production') {
  // for prod
  mixpanel.init('bdc492847e9340eeebd53cc35f321691')
} else {
  // for dev
  mixpanel.init('5474177127e4767124c123b2d7846e2a', { debug: true })
}

function Root() {
  const darkMode = useAtomValue(isOpenDarkModeAtom)
  useEffect(() => {
    darkMode ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark')
  }, [darkMode])

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600)

  useEffect(() => {
    const handleResize = () => {
      const nextIsMobile = window.innerWidth <= 600
      if (!nextIsMobile) {
        window.location.href = '/'
      }
      setIsMobile(nextIsMobile)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <React.StrictMode>
      <BrowserRouter basename={REACT_APP_DEPLOY_ENV === 'pages' ? '/qwerty-learner' : ''}>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment/result" element={<PaymentResultPage />} />
            <Route path="/share/:resourceType/:token" element={<ShareLandingPage />} />
            {isMobile ? (
              <Route path="/*" element={<Navigate to="/mobile" />} />
            ) : (
              <Route element={<DesktopShell />}>
                <Route index element={<TypingPage />} />
                <Route path="/go-premium" element={<PremiumPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/analysis" element={<AnalysisPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/article" element={<ArticlePage />} />
                <Route path="/article/:id" element={<ArticlePage />} />
                <Route path="/article-gallery" element={<ArticleGalleryPage />} />
                <Route path="/error-book" element={<ErrorBook />} />
                <Route path="/friend-links" element={<FriendLinks />} />
                <Route path="/*" element={<Navigate to="/" />} />
              </Route>
            )}
            <Route path="/mobile" element={<MobilePage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </React.StrictMode>
  )
}

const container = document.getElementById('root')

container && createRoot(container).render(<Root />)
