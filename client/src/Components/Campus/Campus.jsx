import React, { Suspense, lazy, useState } from 'react'
import './Campus.css'
import white_arrow from '../../assets/white-arrow.webp'
import { PHOTOS } from '../Gallery/photos'

// Loaded only when someone opens the gallery.
const GalleryModal = lazy(() => import('../Gallery/GalleryModal'))

const PREVIEW = PHOTOS.slice(0, 4)

const Campus = () => {
    // null = closed; { start: null } = grid; { start: n } = photo n in the lightbox
    const [gallery, setGallery] = useState(null)

    return (
        <div className='campus'>
            <div className="gallery">
                {PREVIEW.map((p, i) => (
                    <button key={p.src} type="button" className="gallery-thumb" onClick={() => setGallery({ start: i })} aria-label={`View ${p.alt}`}>
                        <img src={p.src} alt="" width={p.width} height={p.height} loading="lazy" decoding="async" />
                    </button>
                ))}
            </div>
            <button className='btn dark-btn' onClick={() => setGallery({ start: null })}>
                See more here <img src={white_arrow} alt="" width="20" height="11" />
            </button>
            {gallery && (
                <Suspense fallback={null}>
                    <GalleryModal startIndex={gallery.start} onClose={() => setGallery(null)} />
                </Suspense>
            )}
        </div>
    )
}

export default Campus
