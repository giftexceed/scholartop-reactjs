import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '../auth/AuthContext'
import AuthPage from './AuthPage'
import DashboardLayout from './DashboardLayout'
import Overview from './pages/Overview'
import Students from './pages/Students'
import Courses from './pages/Courses'
import Gradebook from './pages/Gradebook'
import Attendance from './pages/Attendance'
import Announcements from './pages/Announcements'
import Messages from './pages/Messages'
import Users from './pages/Users'
import Profile from './pages/Profile'
import './portal.css'

function RequireAuth({ children }) {
    const { user, loading } = useAuth()
    const location = useLocation()
    if (loading) return <div className='page-loader' aria-label='Loading' />
    if (!user) return <Navigate to='/login' replace state={{ from: location.pathname }} />
    return children
}

function AdminOnly({ children }) {
    const { user } = useAuth()
    return user?.role === 'admin' ? children : <Navigate to='/dashboard' replace />
}

function GuestOnly({ children }) {
    const { user, loading } = useAuth()
    if (loading) return <div className='page-loader' aria-label='Loading' />
    return user ? <Navigate to='/dashboard' replace /> : children
}

const admin = (el) => <AdminOnly>{el}</AdminOnly>

export default function Portal() {
    return (
        <AuthProvider>
            <Routes>
                <Route path='login' element={<GuestOnly><AuthPage mode='login' /></GuestOnly>} />
                <Route path='register' element={<GuestOnly><AuthPage mode='register' /></GuestOnly>} />
                <Route path='dashboard' element={<RequireAuth><DashboardLayout /></RequireAuth>}>
                    <Route index element={<Overview />} />
                    <Route path='courses' element={<Courses />} />
                    <Route path='announcements' element={<Announcements />} />
                    <Route path='profile' element={<Profile />} />
                    <Route path='students' element={admin(<Students />)} />
                    <Route path='gradebook' element={admin(<Gradebook />)} />
                    <Route path='attendance' element={admin(<Attendance />)} />
                    <Route path='messages' element={admin(<Messages />)} />
                    <Route path='users' element={admin(<Users />)} />
                    <Route path='*' element={<Navigate to='/dashboard' replace />} />
                </Route>
                <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
        </AuthProvider>
    )
}
