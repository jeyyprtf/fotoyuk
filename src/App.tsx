import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { LangProvider } from './hooks/useLang'
import { Shell } from './components/Shell'
import { Home } from './pages/Home'
import { Booth } from './pages/Booth'
import { Gallery } from './pages/Gallery'
import { Privacy, Terms } from './pages/Legal'

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Home />} />
            <Route path="booth" element={<Booth />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="terms" element={<Terms />} />
            <Route path="privacy" element={<Privacy />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Analytics />
    </LangProvider>
  )
}
