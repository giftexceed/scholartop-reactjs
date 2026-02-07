import React from 'react'
import './About.css'
import about_img from '../../assets/about.png'
import play_icon from '../../assets/play-icon.png'


const About = ({ setPlayState }) => {
    return (
        <div className='about'>
            <div className="about-left">
                <img src={about_img} alt="" className='about-img' />
                <img src={play_icon} alt="" className='play-icon' onClick={() => { setPlayState(true) }} />

            </div>
            <div className="about-right">
                <h3>ABOUT UNIVERSITY</h3>
                <h2>Nurturing Tomorrow's Leaders Today</h2>
                <p>
                    Founded on the principles of rigorous inquiry and creative thinking, our university provides a dynamic environment where students are challenged to push the boundaries of what’s possible. We blend world-class research with hands-on learning to ensure our graduates are prepared for the complexities of a global workforce.
                </p>
                <p>
                    Our faculty comprises industry experts and visionary scholars dedicated to mentorship. By fostering a culture of collaboration, we empower students to transform their passions into impactful careers that drive social and technological progress.
                </p>
                <p>
                    Beyond the classroom, our campus is a melting pot of ideas and cultures. We believe that true leadership is cultivated through diverse perspectives, ethical grounding, and a lifelong commitment to curiosity and excellence.
                </p>
            </div>


        </div>
    )
}

export default About