import React from "react";
// HomeIcon component remains the same, using inline SVG (Lucide style)
const HomeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-7 w-7"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

// Reusable Card Component for Features
const FeatureCard = ({ icon, title, description, accentColor, animationDelay }) => {
  // Utility for dynamic classes based on the accentColor prop
  const accentClasses = {
    emerald: "border-emerald-500 hover:text-emerald-700",
    teal: "border-teal-500 hover:text-teal-700",
    blue: "border-sky-500 hover:text-sky-700",
    rose: "border-rose-500 hover:text-rose-700",
    amber: "border-amber-500 hover:text-amber-700",
    purple: "border-purple-500 hover:text-purple-700",
  };
  
  const iconColorClass = accentColor ? `text-${accentColor}-500` : 'text-gray-500';

  return (
    <div
      className={`group bg-white p-8 rounded-2xl shadow-xl border-t-4 ${accentClasses[accentColor] || "border-gray-300"} transition duration-500 transform hover:shadow-2xl hover:translate-y-[-4px] animate-fadeInUp cursor-pointer`}
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'both' }}
    >
      <div className={`text-5xl mb-4 transition-transform duration-500 group-hover:scale-110 ${iconColorClass}`}>{icon}</div>
      <h3 className="text-2xl font-extrabold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

// Reusable Component for Impact Metrics
const ImpactMetric = ({ value, label, icon, animationDelay }) => {
    return (
      <div
        className={`p-8 bg-sky-700/80 rounded-2xl shadow-2xl text-white backdrop-blur-sm border-b-4 border-yellow-300 animate-fadeInUp transform transition duration-500 hover:scale-[1.05] hover:bg-sky-700`}
        style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'both' }}
      >
        <div className="text-5xl font-extrabold text-yellow-300 mb-2 tracking-wider">{value}</div>
        <div className="text-lg font-medium opacity-80">{label}</div>
        <div className="text-3xl mt-2">{icon}</div>
      </div>
    );
};


const About = () => {
  return (
    // Fragment allows us to inject the necessary CSS for animations
    <>
      <style>
        {`
          /* Custom Keyframes for Tailwind JIT/Standalone */
          @keyframes fadeInDown {
            0% { opacity: 0; transform: translateY(-20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideInLeft {
            0% { opacity: 0; transform: translateX(-50px); }
            100% { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideInRight {
            0% { opacity: 0; transform: translateX(50px); }
            100% { opacity: 1; transform: translateX(0); }
          }
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }

          /* Apply custom animations via Tailwind classes */
          .animate-fadeInDown { animation: fadeInDown 1s ease-out; }
          .animate-fadeInUp { animation: fadeInUp 1s ease-out; }
          .animate-slideInLeft { animation: slideInLeft 1s ease-out; }
          .animate-slideInRight { animation: slideInRight 1s ease-out; }
          .animate-fadeIn { animation: fadeIn 1s ease-out; }

          /* Utility class for a subtle gradient overlay on the main title */
          .title-gradient-text {
            background-image: linear-gradient(to right, #10b981, #059669); /* emerald-500 to emerald-700 */
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-fill-color: transparent;
          }
        `}
      </style>

      {/* Main Container: Softer background for contrast */}
      <div className="min-h-screen bg-gray-100 py-16 px-4 sm:px-8 lg:px-16 font-sans">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section with Animation and HOME ICON */}
          <div className="text-center mb-24 relative">
            
            {/* HOME ICON - Professional positioning and color */}
            <a
              href="/" // Replace with your actual home route
              className="absolute top-0 left-0 text-gray-500 hover:text-emerald-600 transition duration-300 transform hover:scale-110 p-2 rounded-full hidden sm:block"
              aria-label="Go to Home"
            >
              <HomeIcon />
            </a>
            
            {/* Main Title - Bolder, use custom gradient class */}
            <h1 className="text-7xl font-extrabold text-gray-900 mb-6 tracking-tighter animate-fadeInDown">
              The Story of <span className="title-gradient-text">ECOLOOP</span> <span className="text-emerald-600">🌿</span>
            </h1>
            
            {/* Subtitle - Improved readability and slightly stronger color */}
            <p className="text-xl text-gray-700 max-w-4xl mx-auto animate-fadeInUp delay-200 leading-relaxed">
              An innovative waste management platform designed to track, reduce, and
              recycle waste for a cleaner, greener world. **We're building the circular future.**
            </p>
            
            {/* Decorative Separator - Wider and more defined */}
            <div className="w-32 h-1.5 bg-emerald-500 mx-auto mt-10 rounded-full shadow-md"></div>
          </div>

          {/* --- MISSION AND CORE VALUE SECTION --- */}
          
          <div className="grid lg:grid-cols-3 gap-12 mb-24">
            
            {/* Mission Card - Clean white, distinct green header, deep shadow */}
            <div className="lg:col-span-2 bg-white p-12 rounded-3xl shadow-2xl border-t-8 border-emerald-500 transition-all duration-500 hover:shadow-emerald-300/50 hover:translate-y-[-5px] animate-slideInLeft">
              <h2 className="text-4xl font-bold text-emerald-600 mb-5 flex items-center">
                <span className="text-5xl mr-4">🌱</span> Our Mission
              </h2>
              <p className="text-lg text-gray-700 leading-8">
                To revolutionize waste management by combining **technology**,
                **community action**, and **sustainable practices** — ensuring waste is
                not just disposed of, but transformed into opportunities for reuse,
                recycling, and renewal. We aim to empower every user to become a
                force for environmental change. Our goal is a **zero-waste future**.
              </p>
            </div>

            {/* Vision/Value Card - High contrast, powerful statement, slightly elevated */}
            <div className="lg:col-span-1 bg-sky-700 text-white p-12 rounded-3xl shadow-2xl transition-all duration-500 hover:shadow-sky-500/50 hover:translate-y-[-5px] animate-slideInRight">
              <h2 className="text-4xl font-bold mb-5 flex items-center">
                <span className="text-5xl mr-4 text-yellow-300">💡</span> Core Belief
              </h2>
              <p className="text-lg leading-7 font-medium">
                At ECOLOOP, we believe that **every piece of waste has a purpose**.
                Sustainability is not an option; it's our foundational commitment.
                We are driven by transparency, collective impact, and technological innovation.
              </p>
            </div>
          </div>

          {/* --- WHAT WE DO CARDS SECTION --- */}
          
          <div className="mb-24">
            <h2 className="text-5xl font-extrabold text-gray-800 text-center mb-16 tracking-tight">
              The <span className="text-emerald-600">ECOLOOP</span> Difference 🌍
            </h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {/* Feature cards with a more professional and diverse color palette */}
              <FeatureCard icon="📊" title="Real-Time Tracking" description="Monitor waste generation, recycling metrics, and environmental impact live, providing transparent data." accentColor="teal" animationDelay="200"/>
              <FeatureCard icon="💡" title="Eco-Tips & Education" description="Get personalized, eco-friendly disposal tips and continuous learning about waste reduction strategies." accentColor="emerald" animationDelay="400"/>
              <FeatureCard icon="🤝" title="Community Connection" description="Connect with local recycling plants, NGOs, and participate in community clean-up events easily." accentColor="blue" animationDelay="600"/>
              <FeatureCard icon="🗑️" title="Specialized Guides" description="Specific educational tracks for plastic, food, and electronic waste management tailored to your region." accentColor="rose" animationDelay="800"/>
              <FeatureCard icon="🏆" title="Incentivized Recycling" description="Earn valuable rewards, exclusive badges, and community recognition for achieving sustainability goals." accentColor="amber" animationDelay="1000"/>
              <FeatureCard icon="🧘" title="Sustainable Living" description="Encouraging and tracking progress on sustainable lifestyle choices beyond basic waste management." accentColor="purple" animationDelay="1200"/>
            </div>
          </div>

          {/* --- OUR IMPACT / KEY METRICS SECTION --- */}
          
          {/* Using a rich, deep sky blue for a powerful contrast */}
          <div className="bg-sky-600 p-16 rounded-3xl mb-20 shadow-2xl shadow-sky-400/50 animate-fadeIn border-t-8 border-yellow-300">
            <h2 className="text-5xl font-extrabold text-white text-center mb-12 tracking-tight">
                Measuring Our <span className="text-yellow-300">Impact</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-10 text-center">
              {/* Metrics are now defined using the ImpactMetric component for consistency */}
              <ImpactMetric value="150K+" label="Tons of Waste Recycled" icon="📦" animationDelay="100"/>
              <ImpactMetric value="200+" label="Active Community Campaigns" icon="🏘️" animationDelay="300"/>
              <ImpactMetric value="5K+" label="Users Tracking Daily Waste" icon="👤" animationDelay="500"/>
            </div>
          </div>
          
          {/* Footer CTA - More engaging, full-width button container */}
          <div className="text-center pt-10 border-t-2 border-gray-200">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-5 px-12 rounded-full text-xl shadow-xl transition duration-300 transform hover:scale-[1.05] focus:outline-none focus:ring-4 focus:ring-emerald-300 uppercase tracking-widest">
              Join the ECOLOOP Community Today!
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
