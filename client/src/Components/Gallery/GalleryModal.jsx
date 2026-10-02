import React, { useEffect, useRef, useState } from 'react'
import './GalleryModal.css'
import { PHOTOS } from './photos'

// Full gallery: a grid of every photo, and a lightbox view with prev/next.
// Keyboard: ←/→ to navigate, Esc to go back to the grid / close.
const GalleryModal = ({ startIndex = null, onClose }) => {
    const dialog = useRef(null)
    const nextBtn = useRef(null)
    const [index, setIndex] = useState(startIndex)
    const viewing = index != null

    useEffect(() => {
        const el = dialog.current
        el.showModal()
        return () => el.close()
    }, [])

    const step = (delta) => setIndex((i) => (i + delta + PHOTOS.length) % PHOTOS.length)

    // Listen on window: the clicked thumbnail unmounts when the lightbox opens,
    // which drops focus out of the dialog.
    useEffect(() => {
        if (!viewing) return
        nextBtn.current?.focus()
        const onKey = (e) => {
            if (e.key === 'ArrowRight') step(1)
            if (e.key === 'ArrowLeft') step(-1)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [viewing])

    const onCancel = (e) => {
        // Esc in the lightbox returns to the grid; Esc in the grid closes.
        e.preventDefault()
        if (viewing && startIndex == null) setIndex(null)
        else onClose()
    }

    const photo = viewing ? PHOTOS[index] : null

    return (
        <dialog
            ref={dialog}
            className='gallery-modal'
            aria-label='Campus photo gallery'
            onCancel={onCancel}
            onClick={(e) => { if (e.target === dialog.current) onClose() }}
        >
            <div className='gallery-head'>
                <h2>{viewing ? `${index + 1} / ${PHOTOS.length}` : 'Campus Photos'}</h2>
                <div className='gallery-head-actions'>
                    {viewing && <button type='button' className='gallery-text-btn' onClick={() => setIndex(null)}>All photos</button>}
                    <button type='button' className='gallery-close' onClick={onClose} aria-label='Close gallery'>×</button>
                </div>
            </div>

            {viewing ? (
                <figure className='lightbox'>
                    <button type='button' className='lightbox-nav prev' onClick={() => step(-1)} aria-label='Previous photo'>‹</button>
                    <img key={photo.src} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} />
                    <button ref={nextBtn} type='button' className='lightbox-nav next' onClick={() => step(1)} aria-label='Next photo'>›</button>
                    <figcaption>{photo.alt}</figcaption>
                </figure>
            ) : (
                <ul className='gallery-grid'>
                    {PHOTOS.map((p, i) => (
                        <li key={p.src}>
                            <button type='button' onClick={() => setIndex(i)} aria-label={`View ${p.alt}`}>
                                <img src={p.src} alt='' width={p.width} height={p.height} loading='lazy' decoding='async' />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </dialog>
    )
}

export default GalleryModal
