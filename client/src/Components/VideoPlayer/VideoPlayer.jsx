import React, { useEffect } from 'react'
import './VideoPlayer.css'
import video from '../../assets/college-video.mp4'

// Mounted only while open, so the video is never downloaded until requested.
const VideoPlayer = ({ setPlayState }) => {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') setPlayState(false) }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [setPlayState])

    const closePlayer = (e) => {
        if (e.target === e.currentTarget) {
            setPlayState(false);
        }
    }

    return (
        <div className='video-player' role="dialog" aria-label="Campus video" onClick={closePlayer}>
            <video src={video} autoPlay muted controls playsInline></video>
        </div>
    )
}

export default VideoPlayer
