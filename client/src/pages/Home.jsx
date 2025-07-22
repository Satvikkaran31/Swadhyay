import React, { useEffect, useState,useRef } from "react";
import "../styles/Home.css";
import BookingModal from "../components/BookingModal";
import profileimage from "../assets/profilepicture.png";
import Navbar from "../components/Navbar";
import TeamsBookingModal from "../components/TeamsBookingModal";
import { useLocation,useNavigate } from "react-router-dom";
import image_2 from "../assets/image_2.png"
import image_1 from "../assets/image_3.png"
import hero_image from "../assets/hero-page-5.webp"
import "../styles/learnMoreButton.css"
import Footer from "../components/Footer";
import { Link as ScrollLink } from 'react-scroll';
import FadeInSection from '../components/FadeInSection';
const suffixes = [
  <> <span className="highlight">25+ years</span> in people engagement</>,
  <> <span className="highlight">700+ hours</span> of leadership coaching</>,
  <> <span className="highlight">EFT</span> master practitioner</>,
  <><span className="highlight">ICF Professional</span> certified exec</>,
  <> Recruited <span className="highlight">150+ CXOs, CEOs</span></>,
  <> <span className="highlight">Senior Mentor</span> at Jagriti Yatra</>,
  <> <span className="highlight">ICF </span>team Coach</>
];

export default function Home({aboutRef}) {
  const [showModal, setShowModal] = useState(false);
  const [index, setIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  
 


  // Loop suffix phrases with fade
  useEffect(() => {
    const fadeDuration = 3000;
    const totalCycle = 3500;

    const fadeTimer = setTimeout(() => setFadeIn(false), fadeDuration - 1000);
    const switchTimer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % suffixes.length);
      setFadeIn(true);
    }, totalCycle);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(switchTimer);
    };
  }, [index]);

useEffect(() => {
  const paths = document.querySelectorAll(".handwriting-svg path");
  const initialDelay = 1.5; // initial delay
  const stepDelay = 0.1; // delay between each path

  paths.forEach((p, i) => {
    p.style.animationDelay = `${initialDelay + i * stepDelay}s`;
  });
}, []);

  return (
   <>
     <Navbar  />
    <div className="main" id="main">
      <div className="gradient-background">
   
  
      {showModal && <BookingModal onClose={() => setShowModal(false)} />}
     
      <div className="hero-left">
        <h1>Empower Your Life with Expert Coaching.</h1>
       
      
   


     <div className="typewriter-wrapper">
        {/* <span className="typed-name">Neha Sharma</span> */}
        <span className="suffix-container">
       
  <span className={`suffix ${fadeIn ? "fade-in" : "fade-out"}`}>
    {suffixes[index]}
  </span>

          </span>
      </div>
    <div className="home-about-me">
          <ScrollLink 
                  to="about" // Target name for the scroll
                  spy={true}
                  smooth={true}
                  offset={-70} // Adjust for sticky navbar height
                  duration={500}
                  className="learnmore"
                >
        <span className="learnmore__icon-wrapper">
            <svg
      viewBox="0 0 14 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="learnmore__icon-svg"
      width="10"
    >
      <path
        d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
        fill="currentColor"
      ></path>
            </svg>

    <svg
      viewBox="0 0 14 15"
      fill="none"
      width="10"
      xmlns="http://www.w3.org/2000/svg"
      className="learnmore__icon-svg learnmore__icon-svg--copy"
    >
      <path
        d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
        fill="currentColor"
      ></path>
    </svg>
  </span>
  Learn more
</ScrollLink>

    </div>    
          
      </div>
      
      <div className="hero-right">
        <div className="hero-image-wrapper">
        <img src={hero_image} alt="hero_image" 
        decoding="async" 
        loading="eager" 
        fetchpriority="high"/>
        </div>
      </div>
  
   </div>
 
  <section className="about-section" id="about"  >
     <FadeInSection>
      <section className="coaching-info" id="book-now">
         
        <div className="info-box">
          <h2>One-on-One Coaching</h2>
          <p>
            Personalized coaching focused on clarity, confidence, and mindset breakthroughs.
            Designed for individuals seeking focused guidance on personal or professional goals.
          </p>
        </div>
      
         
        <div className="info-box">
          <h2>Emotional Freedom Technique</h2>
          <p>
            A powerful tapping method to release stress, trauma, or emotional blocks and bring
            mental calm and healing. Ideal for anxiety, self-sabotage, and emotional release.
          </p>
        </div>
        
       
          <div className="info-box ">
          <h2>Group Coaching</h2>
          <p>
            Collaborative coaching sessions that harness the power of shared experiences and collective wisdom.
            Perfect for individuals seeking support, accountability, and growth in a dynamic group environment.
          </p>
        </div>
        <FadeInSection>
        <div className="book-now-box" id="book-now-box">
          <h2>Ready to Transform?</h2>
          <p>Choose your session type and book instantly.</p>
          <button className="book-now-btn" onClick={() => setShowModal(true)}>
            <span className="text">Book a Session</span>
            <span className="svg">
              <svg
      xmlns="http://www.w3.org/2000/svg"
      width="50"
      height="20"
      viewBox="0 0 42 20"
    >
    
      <path d="M6 12H18M18 12L13 7M18 12L13 17" strokeLinecap="round" />
     
    </svg>
            </span>
          </button>
        </div>
      </FadeInSection> 
      </section>
      </FadeInSection>
   <FadeInSection>
    <div className="about-goal" id="about-goal">
      <div className="about-goal-left-text">
            <span className="about-goal-left-text-heading">Our Mission</span>
            
    <h3 className="quote-text">
      "Who looks outside, dreams. Who looks inside, awakens."<br /> <span className="quote-author">- Carl Jung</span>
    </h3><br />
   
 
        <p> "Swadhyay", a Sanskrit word for self-study or reflection, is about deeply understanding oneself—our thoughts, beliefs, desires, values, and behaviors. This leads to greater self-awareness, a key trait in top leaders, fostering compassion and empathy.</p>
        <br />
        <p>We feel coaching as a process is one of the finest methodologies available today for deepening our insight and awareness about ourselves and connecting within. I am passionate about working with leaders, working professionals, women, youngsters, or anyone who is ready to go through an inner process and discover their own selves. In other words, anyone who is ready for Swadhyay.</p>

        <h3>Let's begin this journey together!</h3>
  </div>
  <FadeInSection>
  <div className="about-goal-right-column">
    {/* <div className="first-image">
      <img src={image_1} alt="image_1" />
    </div> */}
    <div className="second-image"> 
      <img src={image_2} alt="image_2" />
    </div>
  </div>
  </FadeInSection>
    </div>
  </FadeInSection>
      <FadeInSection>
    <div className="about-content" id="about-content">
      <div className="left-side">
      <div className="left-image">
        <img src={profileimage  } alt="Neha Sharma"/>
      </div>
      <div className="contact-info" id="contact-info">
        <h3>Contact Us:</h3> 
        <div className="contact-links">  
              <a href="https://www.linkedin.com/in/neha-sharma-00b69565?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"> <svg style={{ fill: '#0077B7' }} height="30" width="30" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" 
      viewBox="0 0 382 382" xmlSpace="preserve">
    <path  d="M347.445,0H34.555C15.471,0,0,15.471,0,34.555v312.889C0,366.529,15.471,382,34.555,382h312.889
      C366.529,382,382,366.529,382,347.444V34.555C382,15.471,366.529,0,347.445,0z M118.207,329.844c0,5.554-4.502,10.056-10.056,10.056
      H65.345c-5.554,0-10.056-4.502-10.056-10.056V150.403c0-5.554,4.502-10.056,10.056-10.056h42.806
      c5.554,0,10.056,4.502,10.056,10.056V329.844z M86.748,123.432c-22.459,0-40.666-18.207-40.666-40.666S64.289,42.1,86.748,42.1
      s40.666,18.207,40.666,40.666S109.208,123.432,86.748,123.432z M341.91,330.654c0,5.106-4.14,9.246-9.246,9.246H286.73
      c-5.106,0-9.246-4.14-9.246-9.246v-84.168c0-12.556,3.683-55.021-32.813-55.021c-28.309,0-34.051,29.066-35.204,42.11v97.079
      c0,5.106-4.139,9.246-9.246,9.246h-44.426c-5.106,0-9.246-4.14-9.246-9.246V149.593c0-5.106,4.14-9.246,9.246-9.246h44.426
      c5.106,0,9.246,4.14,9.246,9.246v15.655c10.497-15.753,26.097-27.912,59.312-27.912c73.552,0,73.131,68.716,73.131,106.472
      L341.91,330.654L341.91,330.654z"/>
    </svg></a> 


<a href="mailto:nehasharma@swadhyay.co">
<svg width="40" height="34" viewBox="7.086 -169.483 1277.149 1277.149" shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M1138.734 931.095h.283M1139.017 931.095h-.283"/><path d="M1179.439 7.087c57.543 0 104.627 47.083 104.627 104.626v30.331l-145.36 103.833-494.873 340.894L148.96 242.419v688.676h-37.247c-57.543 0-104.627-47.082-104.627-104.625V111.742C7.086 54.198 54.17 7.115 111.713 7.115l532.12 394.525L1179.41 7.115l.029-.028z" fill="#e75a4d"/><linearGradient id="a" gradientUnits="userSpaceOnUse" x1="1959.712" y1="737.107" x2="26066.213" y2="737.107" gradientTransform="matrix(.0283 0 0 -.0283 248.36 225.244)"><stop offset="0" stopColor="#f8f6ef"/><stop offset="1" stopColor="#e7e4d6"/></linearGradient><path fill="url(#a)" d="M111.713 7.087l532.12 394.525L1179.439 7.087z"/><path fill="#e7e4d7" d="M148.96 242.419v688.676h989.774V245.877L643.833 586.771z"/><path fill="#b8b7ae" d="M148.96 931.095l494.873-344.324-2.24-1.586L148.96 923.527z"/><path fill="#b7b6ad" d="M1138.734 245.877l.283 685.218-495.184-344.324z"/><path d="M1284.066 142.044l.17 684.51c-2.494 76.082-35.461 103.238-145.219 104.514l-.283-685.219 145.36-103.833-.028.028z" fill="#b2392f"/><linearGradient id="b" gradientUnits="userSpaceOnUse" x1="1959.712" y1="737.107" x2="26066.213" y2="737.107" gradientTransform="matrix(.0283 0 0 -.0283 248.36 225.244)"><stop offset="0" stopColor="#f8f6ef"/><stop offset="1" stopColor="#e7e4d6"/></linearGradient><path fill="url(#b)" d="M111.713 7.087l532.12 394.525L1179.439 7.087z"/><linearGradient id="c" gradientUnits="userSpaceOnUse" x1="1959.712" y1="737.107" x2="26066.213" y2="737.107" gradientTransform="matrix(.0283 0 0 -.0283 248.36 225.244)"><stop offset="0" stopColor="#f8f6ef"/><stop offset="1" stopColor="#e7e4d6"/></linearGradient><path fill="url(#c)" d="M111.713 7.087l532.12 394.525L1179.439 7.087z"/><linearGradient id="d" gradientUnits="userSpaceOnUse" x1="1959.712" y1="737.107" x2="26066.213" y2="737.107" gradientTransform="matrix(.0283 0 0 -.0283 248.36 225.244)"><stop offset="0" stopColor="#f8f6ef"/><stop offset="1" stopColor="#e7e4d6"/></linearGradient><path fill="url(#d)" d="M111.713 7.087l532.12 394.525L1179.439 7.087z"/><linearGradient id="e" gradientUnits="userSpaceOnUse" x1="1959.712" y1="737.107" x2="26066.213" y2="737.107" gradientTransform="matrix(.0283 0 0 -.0283 248.36 225.244)"><stop offset="0" stopColor="#f8f6ef"/><stop offset="1" stopColor="#e7e4d6"/></linearGradient><path fill="url(#e)" d="M111.713 7.087l532.12 394.525L1179.439 7.087z"/><linearGradient id="f" gradientUnits="userSpaceOnUse" x1="1959.712" y1="737.107" x2="26066.213" y2="737.107" gradientTransform="matrix(.0283 0 0 -.0283 248.36 225.244)"><stop offset="0" stopColor="#f8f6ef"/><stop offset="1" stopColor="#e7e4d6"/></linearGradient><path fill="url(#f)" d="M111.713 7.087l532.12 394.525L1179.439 7.087z"/><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="1959.712" y1="737.107" x2="26066.213" y2="737.107" gradientTransform="matrix(.0283 0 0 -.0283 248.36 225.244)"><stop offset="0" stopColor="#f8f6ef"/><stop offset="1" stopColor="#e7e4d6"/></linearGradient><path fill="url(#g)" d="M111.713 7.087l532.12 394.525L1179.439 7.087z"/><linearGradient id="h" gradientUnits="userSpaceOnUse" x1="1959.712" y1="737.107" x2="26066.213" y2="737.107" gradientTransform="matrix(.0283 0 0 -.0283 248.36 225.244)"><stop offset="0" stopColor="#f8f6ef"/><stop offset="1" stopColor="#e7e4d6"/></linearGradient><path fill="url(#h)" d="M111.713 7.087l532.12 394.525L1179.439 7.087z"/><path fill="#f7f5ed" d="M111.713 7.087l532.12 394.525L1179.439 7.087z"/></svg>

</a>

<a href="#"> <svg
    xmlns="http://www.w3.org/2000/svg"
    aria-label="WhatsApp"
    role="img"
    viewBox="0 0 512 512"
    width="33" // set size as needed
    height="30"
  >
    <rect width="512" height="512" rx="15%" fill="#25d366" />
    <path
      fill="#25d366"
      stroke="#ffffff"
      strokeWidth="26"
      d="M123 393l14-65a138 138 0 1150 47z"
    />
    <path
      fill="#ffffff"
      d="M308 273c-3-2-6-3-9 1l-12 16c-3 2-5 3-9 1-15-8-36-17-54-47-1-4 1-6 3-8l9-14c2-2 1-4 0-6l-12-29c-3-8-6-7-9-7h-8c-2 0-6 1-10 5-22 22-13 53 3 73 3 4 23 40 66 59 32 14 39 12 48 10 11-1 22-10 27-19 1-3 6-16 2-18"
    />
  </svg></a>
</div>
       
      </div>
      </div>
      <div className="right-text" id="right-text">
         <span className="about-neha">
          <h1>About Neha </h1>
         </span>
      <div className="about-neha-content">
      <p>
        Neha has built strong partnerships with executives, senior leadership teams, and organizations to drive impactful transformations in leadership, strategy, and sustainable growth. Through her work with Boards and senior teams, she has played a key role in guiding leadership transitions, executive development, and board effectiveness in complex and evolving business environments.
      </p>

      <h3>Career Highlights</h3>
      <p>
        Neha’s career spans over 25 years across diverse domains including human resources, executive search, consulting, private equity, investment banking, and sustainable development. 
        She was instrumental in evolving the Impact Practice from the ground up, recruiting and coaching over 30 country-level and 75 CXO-level professionals.
      </p>
      <p>
        She has led strategic talent initiatives across financial services, professional services, and advisory sectors. Additionally, she curated a unique Board Workshop in collaboration with industry stalwarts to prepare first-time Board members and aspirants.
      </p>

      <h3>Executive Coaching & Leadership Development</h3>
      <p>
        Deeply passionate about leadership development, executive coaching, and ethical decision-making, Neha is a PCC-certified professional coach with over 700 hours of coaching experience. She has worked with senior leaders across sectors to support behavioral shifts, leadership effectiveness, and strategic impact. She has also served as a Global Ethical Coach volunteer.
      </p>

      <h3>Academic & Mentorship Contributions</h3>
      <p>
        Neha has served as guest faculty in Organizational Development at a top business school in Delhi and actively mentors emerging leaders through Jagriti Yatra, an initiative focused on social entrepreneurship.
      </p>

      <h3>Current Portfolio</h3>
      <p>
        Neha has transitioned to a portfolio career, continuing Executive Search work with a focus on the impact and social sector at Executive Access. She also leads independent coaching engagements and serves as an Adjunct at Impactivate Solutions.
      </p>

      <h3>Academic and Professional Background</h3>
      <p>
        Neha holds a postgraduate degree in management, is certified as a PCC-level coach, and holds a Team Coach credential from the International Coaching Federation (ICF). She has also completed an advanced strategic human resources management program at IIM Ahmedabad.
      </p>
       </div>
      </div>
    
   

    </div>
    </FadeInSection>
</section>


   </div>
   <Footer />
   </> 
  );}
