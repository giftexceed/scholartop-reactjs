import React, { useState } from 'react'
import './Contact.css'
import msg_icon from '../../assets/msg-icon.webp'
import mail_icon from '../../assets/mail-icon.webp'
import phone_icon from '../../assets/phone-icon.webp'
import location_icon from '../../assets/location-icon.webp'
import white_arrow from '../../assets/white-arrow.webp'
import { SITE } from '../../config/site'

const Contact = () => {
    const [result, setResult] = useState("");

    // Goes through the data API and appears in the dashboard inbox. The data layer
    // is loaded on demand so it doesn't weigh down the landing page.
    const onSubmit = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setResult("Sending....");
        try {
            const { sendContactMessage } = await import('../../data/api/messages');
            await sendContactMessage(Object.fromEntries(new FormData(form)));
            setResult("Form Submitted Successfully");
            form.reset();
        } catch {
            setResult("Something went wrong. Please try again.");
        }
    };

    return (
        <div className='contact'>
            <div className="contact-col">
                <h3>Send us a message <img src={msg_icon} alt="" width="35" height="28" loading="lazy" /></h3>
                <p>
                    Feel free to reach out through contact form or find our contact information below.
                </p>
                <ul>
                    <li>
                        <img src={mail_icon} alt="" width="25" height="19" loading="lazy" />
                        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
                    </li>
                    <li>
                        <img src={phone_icon} alt="" width="25" height="25" loading="lazy" />
                        <a href={`tel:${SITE.phone}`}>{SITE.phone}</a>
                    </li>
                    <li>
                        <img src={location_icon} alt="" width="25" height="34" loading="lazy" />
                        {SITE.location}
                    </li>
                </ul>
            </div>
            <div className="contact-col">
                <form onSubmit={onSubmit}>
                    <label htmlFor="contact-name">Your name</label>
                    <input id="contact-name" type="text" name='name' placeholder='Enter your name' autoComplete="name" required />
                    <label htmlFor="contact-phone">Phone number</label>
                    <input id="contact-phone" type="tel" name="phone" placeholder='Enter your mobile number' autoComplete="tel" required />
                    <label htmlFor="contact-message">Write your message here</label>
                    <textarea id="contact-message" name="message" rows="6" placeholder='Enter your message' required></textarea>
                    <button className='btn dark-btn'>Submit now <img src={white_arrow} alt="" width="20" height="11" /></button>
                </form>
                <span role="status">{result}</span>
            </div>
        </div>
    )
}

export default Contact
