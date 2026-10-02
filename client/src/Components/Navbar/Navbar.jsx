import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Navbar.css'
import logo from '../../assets/logo.webp'
import menu_icon from '../../assets/menu-icon.webp'

const LINKS = [
    ['#hero', 'Home'],
    ['#program', 'Program'],
    ['#about', 'About Us'],
    ['#campus', 'Campus'],
    ['#testimonials', 'Testimonials'],
]

const Navbar = () => {
    const [sticky, setSticky] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);

    useEffect(() => {
        const onScroll = () => setSticky(window.scrollY > 50);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [])

    const closeMenu = () => setMobileMenu(false);

    return (
        <nav className={`site-nav container ${sticky ? 'dark-nav' : ''}`}>
            <a href="#hero" aria-label="EasyPoint home">
                <img src={logo} alt="EasyPoint" className='logo' width="180" height="37" />
            </a>
            <ul className={mobileMenu ? '' : 'hide-mobile-menu'}>
                {LINKS.map(([href, label]) => (
                    <li key={href}><a href={href} onClick={closeMenu}>{label}</a></li>
                ))}
                <li><Link to='/login' onClick={closeMenu}>Portal</Link></li>
                <li>
                    <a href="#contact" className='btn' onClick={closeMenu}>Contact us</a>
                </li>
            </ul>
            <button
                type="button"
                className='menu-icon'
                aria-label={mobileMenu ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenu}
                onClick={() => setMobileMenu((open) => !open)}
            >
                <img src={menu_icon} alt="" width="30" height="24" />
            </button>
        </nav>
    )
}

export default Navbar
