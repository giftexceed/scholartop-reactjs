import React, { useState } from 'react'
import './Testimonials.css'
import next_icon from '../../assets/next-icon.webp'
import back_icon from '../../assets/back-icon.webp'
import user_1 from '../../assets/user-1.webp'
import user_2 from '../../assets/user-2.webp'
import user_3 from '../../assets/user-3.webp'
import user_4 from '../../assets/user-4.webp'
import { SITE } from '../../config/site'

const TESTIMONIALS = [
    { img: user_1, name: 'William Jackson', quote: `Choosing to pursue my degree at ${SITE.name} was one of the best decisions I've ever made.` },
    { img: user_2, name: 'Smith Brian', quote: 'The lecturers genuinely care. Small classes meant I always got feedback when I needed it.' },
    { img: user_3, name: 'John Brandon', quote: 'The career fair and internship support helped me land a job before I even graduated.' },
    { img: user_4, name: 'Becky Jhoe', quote: 'A welcoming campus with students from everywhere. I made friends for life here.' },
]

// The track is 200% wide and shows two slides at a time, so each step is 25%.
const MAX_STEP = 2

const Testimonials = () => {
    const [step, setStep] = useState(0);

    return (
        <div className='testimonials'>
            <button type="button" className='next-btn' aria-label="Next testimonial" onClick={() => setStep((s) => Math.min(s + 1, MAX_STEP))}>
                <img src={next_icon} alt="" width="20" height="20" />
            </button>
            <button type="button" className='back-btn' aria-label="Previous testimonial" onClick={() => setStep((s) => Math.max(s - 1, 0))}>
                <img src={back_icon} alt="" width="20" height="20" />
            </button>
            <div className="slider">
                <ul style={{ transform: `translateX(${-25 * step}%)` }}>
                    {TESTIMONIALS.map(({ img, name, quote }) => (
                        <li key={name}>
                            <div className="slide">
                                <div className="user-info">
                                    <img src={img} alt="" width="65" height="65" loading="lazy" decoding="async" />
                                    <div>
                                        <h3>{name}</h3>
                                        <span>{SITE.name}, USA</span>
                                    </div>
                                </div>
                                <p>{quote}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export default Testimonials
