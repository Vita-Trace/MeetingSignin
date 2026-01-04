import { Routes, Route } from 'react-router-dom'
import QRCodePage from './pages/QRCodePage'
import AnimationPage from './pages/AnimationPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<QRCodePage />} />
      <Route path="/animation" element={<AnimationPage />} />
    </Routes>
  )
}

export default App
