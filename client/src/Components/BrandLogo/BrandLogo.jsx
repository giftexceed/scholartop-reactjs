import React from 'react'
import './BrandLogo.css'
import { SITE } from '../../config/site'

// Text + icon logo. Inherits `color`, so it works on any background.
const BrandLogo = ({ size = 'md' }) => {
    return (
        <span className={`brand-logo brand-logo-${size}`}>
            <svg viewBox='0 0 64 64' aria-hidden='true' focusable='false'>
                <path fill='currentColor' d='M32 10 4 23l28 13 22-10.2V40h4V23z' />
                <path fill='currentColor' d='M15 32.5V43c0 4.4 7.6 8 17 8s17-3.6 17-8V32.5L32 40.5z' />
            </svg>
            <span className='brand-logo-text'>Top<b>Scholars</b></span>
        </span>
    )
}

export default BrandLogo
