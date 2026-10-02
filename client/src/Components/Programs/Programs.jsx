import React from 'react'
import './Programs.css'
import program_1 from '../../assets/program-1.webp'
import program_2 from '../../assets/program-2.webp'
import program_3 from '../../assets/program-3.webp'
import program_icon_1 from '../../assets/program-icon-1.webp'
import program_icon_2 from '../../assets/program-icon-2.webp'
import program_icon_3 from '../../assets/program-icon-3.webp'

const PROGRAMS = [
    { img: program_1, icon: program_icon_1, label: 'Graduation Degree' },
    { img: program_2, icon: program_icon_2, label: 'Master Degree' },
    { img: program_3, icon: program_icon_3, label: 'Post Graduation' },
]

const Programs = () => {
    return (
        <div className='programs'>
            {PROGRAMS.map(({ img, icon, label }) => (
                <div className="program" key={label}>
                    <img src={img} alt={label} width="842" height="846" loading="lazy" decoding="async" />
                    <div className="caption">
                        <img src={icon} alt="" loading="lazy" />
                        <p>{label}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Programs
