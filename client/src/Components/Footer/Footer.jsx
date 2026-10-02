import React from 'react'
import './Footer.css'

const Footer = () => {
    return (
        <footer className='footer'>
            <p>© Copyright {new Date().getFullYear()} EasyPoint</p>
            <ul>
                <li>Terms of Services</li>
                <li>Privacy Policy</li>
            </ul>
        </footer>
    )
}

export default Footer
