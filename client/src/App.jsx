import React, { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'

// The portal (Dexie + dashboard) is split into its own chunk so the public
// landing page stays light.
const Portal = lazy(() => import('./portal/Portal'))

const App = () => {
  return (
    <Routes>
      <Route path='/' element={<Landing />} />
      <Route
        path='/*'
        element={
          <Suspense fallback={<div className='page-loader' aria-label='Loading' />}>
            <Portal />
          </Suspense>
        }
      />
    </Routes>
  )
}

export default App
