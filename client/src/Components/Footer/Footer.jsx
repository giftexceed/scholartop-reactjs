import React from 'react'
import './Footer.css'
import { SITE } from '../../config/site'

const Footer = () => {
    return (
        <footer className='footer'>
            <p>© Copyright {new Date().getFullYear()} {SITE.name}</p>
            <ul>
                <li>Terms of Services</li>
                <li>Privacy Policy</li>
            </ul>
        </footer>
    )
}

export default Footer
