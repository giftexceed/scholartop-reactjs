import React, { useState } from 'react'
import Navbar from '../Components/Navbar/Navbar'
import Hero from '../Components/Hero/Hero'
import Programs from '../Components/Programs/Programs'
import Title from '../Components/Title/Title'
import About from '../Components/About/About'
import Campus from '../Components/Campus/Campus'
import Testimonials from '../Components/Testimonials/Testimonials'
import Contact from '../Components/Contact/Contact'
import Footer from '../Components/Footer/Footer'
import VideoPlayer from '../Components/VideoPlayer/VideoPlayer'

const Landing = () => {
  const [playState, setPlayState] = useState(false)

  return (
    <div>
      <Navbar />
      <Hero />
      <main className="container">
        <section id="program" className="anchor">
          <Title subTitle='Our Program' title='What We Offer' />
          <Programs />
        </section>
        <section id="about" className="anchor">
          <About setPlayState={setPlayState} />
        </section>
        <section id="campus" className="anchor">
          <Title subTitle='Gallery' title='Campus Photos' />
          <Campus />
        </section>
        <section id="testimonials" className="anchor">
          <Title subTitle='TESTIMONIALS' title='What Students Says' />
          <Testimonials />
        </section>
        <section id="contact" className="anchor">
          <Title subTitle='Contact us' title='Get in Touch' />
          <Contact />
        </section>
        <Footer />
      </main>
      {playState && <VideoPlayer setPlayState={setPlayState} />}
    </div>
  )
}

export default Landing
