import React from "react";
import "../styles/about.css";

const About = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        <h1 className="about-heading">About ECOLOOP 🌍</h1>

        <p className="about-text">
          ECOLOOP is an innovative waste management platform designed to
          encourage communities, organizations, and individuals to take an
          active role in reducing, tracking, and recycling waste. Our platform
          empowers people with tools and insights to create a cleaner, greener,
          and more sustainable world.
        </p>

        <h2 className="about-subheading">🌱 Our Mission</h2>
        <div className="mission-box">
          <p className="about-text">
            To revolutionize waste management by combining technology, community
            action, and sustainable practices — ensuring waste is not just
            disposed of, but transformed into opportunities for reuse,
            recycling, and renewal.
          </p>
        </div>

        <h2 className="about-subheading">♻️ What We Do</h2>
        <p className="about-text">
          ✅ Track waste generation in real-time. <br />
          ✅ Provide eco-friendly disposal and recycling tips. <br />
          ✅ Connect individuals with recycling plants and NGOs. <br />
          ✅ Educate people about reducing plastic, food, and electronic waste.{" "}
          <br />
          ✅ Encourage sustainable lifestyle choices.
        </p>

        <h2 className="about-subheading">🌟 Why ECOLOOP?</h2>
        <p className="about-text">
          At ECOLOOP, we believe that every piece of waste has a purpose. With
          collective effort, we can reduce the burden on landfills, protect our
          oceans, and create a healthier planet for future generations.
        </p>
      </div>
    </div>
  );
};

export default About;
