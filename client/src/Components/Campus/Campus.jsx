import React from 'react'
import './Campus.css'
import gallery_1 from '../../assets/gallery-1.webp'
import gallery_2 from '../../assets/gallery-2.webp'
import gallery_3 from '../../assets/gallery-3.webp'
import gallery_4 from '../../assets/gallery-4.webp'
import white_arrow from '../../assets/white-arrow.webp'

const PHOTOS = [gallery_1, gallery_2, gallery_3, gallery_4]

const Campus = () => {
    return (
        <div className='campus'>
            <div className="gallery">
                {PHOTOS.map((src, i) => (
                    <img key={src} src={src} alt={`Campus photo ${i + 1}`} width="467" height="588" loading="lazy" decoding="async" />
                ))}
            </div>
            <button className='btn dark-btn'>See more here <img src={white_arrow} alt="" width="20" height="11" /></button>
        </div>
    )
}

export default Campus
