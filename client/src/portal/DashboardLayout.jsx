import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { countUnreadMessages } from '../data/api'
import { useLiveData } from '../data/useLiveData'
import { SITE } from '../config/site'
import BrandLogo from '../Components/BrandLogo/BrandLogo'
import ErrorBoundary from './components/ErrorBoundary'
import { Avatar, Icon } from './components/ui'

const NAV = [
    { to: '/dashboard', label: 'Overview', icon: 'home', end: true },
    { to: '/dashboard/students', label: 'Students', icon: 'users', admin: true },
    { to: '/dashboard/courses', label: 'Courses', icon: 'book' },
    { to: '/dashboard/gradebook', label: 'Gradebook', icon: 'grade', admin: true },
    { to: '/dashboard/attendance', label: 'Attendance', icon: 'calendar', admin: true },
    { to: '/dashboard/announcements', label: 'Announcements', icon: 'megaphone' },
    { to: '/dashboard/messages', label: 'Inbox', icon: 'inbox', admin: true, badge: 'unread' },
    { to: '/dashboard/users', label: 'User accounts', icon: 'student', admin: true },
    { to: '/dashboard/profile', label: 'My profile', icon: 'user' },
]

export default function DashboardLayout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const [open, setOpen] = useState(false)
    const isAdmin = user.role === 'admin'
    const unread = useLiveData(() => (isAdmin ? countUnreadMessages() : 0), [isAdmin], 0)

    const onLogout = () => {
        logout()
        navigate('/login', { replace: true })
    }

    return (
        <div className={`dash ${open ? 'nav-open' : ''}`}>
            <aside className='sidebar'>
                <Link to='/' className='brand' aria-label={`${SITE.name} home`}>
                    <BrandLogo />
                </Link>
                <nav aria-label='Dashboard'>
                    {NAV.filter((n) => !n.admin || isAdmin).map((n) => (
                        <NavLink key={n.to} to={n.to} end={n.end} className='side-link' onClick={() => setOpen(false)}>
                            <Icon name={n.icon} />
                            <span>{n.label}</span>
                            {n.badge === 'unread' && unread > 0 && <span className='side-badge'>{unread}</span>}
                        </NavLink>
                    ))}
                </nav>
                <button type='button' className='side-link logout' onClick={onLogout}>
                    <Icon name='logout' /> <span>Sign out</span>
                </button>
            </aside>
            <div className='scrim' onClick={() => setOpen(false)} aria-hidden='true' />

            <div className='dash-main'>
                <header className='topbar'>
                    <button type='button' className='icon-btn menu-toggle' onClick={() => setOpen(true)} aria-label='Open navigation'>
                        <Icon name='menu' />
                    </button>
                    <div className='topbar-title'>{isAdmin ? 'Administration' : 'Student portal'}</div>
                    <Link to='/dashboard/profile' className='topbar-user' title='My profile'>
                        <div className='topbar-user-text'>
                            <strong>{user.name}</strong>
                            <span>{isAdmin ? 'Administrator' : 'Student'}</span>
                        </div>
                        <Avatar name={user.name} />
                    </Link>
                </header>
                <main className='dash-content'>
                    <ErrorBoundary key={pathname}>
                        <Outlet />
                    </ErrorBoundary>
                </main>
            </div>
        </div>
    )
}
