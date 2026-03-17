import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import {
  Recycle,
  Leaf,
  TrendingUp,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  Instagram,
  Twitter,
  Facebook,
  ShoppingBag,
  ClipboardCheck
} from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Home = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-cubic',
    });
  }, []);

  const features = [
    {
      icon: <Recycle className="w-8 h-8 text-emerald-500" />,
      title: "Smart Recycling",
      description: "Advanced AI-driven tracking for all types of household and industrial waste."
    },
    {
      icon: <Leaf className="w-8 h-8 text-green-500" />,
      title: "Eco Rewards",
      description: "Earn EcoPoints for every successful recycling action and redeem them for rewards."
    },
    {
      icon: <MapPin className="w-8 h-8 text-teal-500" />,
      title: "Local Collection",
      description: "Nearest collection points and real-time tracking of delivery partners in your ward."
    }
  ];

  const stats = [
    { label: "Active Users", value: "50K+" },
    { label: "Waste Recycled", value: "1.2M Tons" },
    { label: "EcoPoints Earned", value: "85M" },
    { label: "Cities Covered", value: "120+" }
  ];


  return (
    <div className="min-h-screen bg-[#fafdfb] font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1.5 bg-emerald-500 origin-left z-[100]"
        style={{ scaleX }}
      />

      {/* Modern Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/70 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Recycle className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tighter text-emerald-950 uppercase">EcoLoop</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-emerald-950/70 text-left">
            <a href="#features" className="hover:text-emerald-600 transition-colors text-left">Features</a>
            <a href="#stats" className="hover:text-emerald-600 transition-colors text-left">Impact</a>
            <button onClick={() => navigate('/application-options')} className="hover:text-emerald-600 transition-colors text-left flex items-center gap-1">
              <ClipboardCheck size={14} /> Apply
            </button>
            <button onClick={() => navigate('/market-shop')} className="hover:text-emerald-600 transition-colors text-left">Shop</button>
            <a href="/about" className="hover:text-emerald-600 transition-colors text-left">About</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-bold text-emerald-950 hover:text-emerald-600 px-4 py-2 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-200 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gradient-to-l from-emerald-50/50 to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 -z-10 w-1/3 h-1/2 bg-gradient-to-tr from-green-50/50 to-transparent rounded-full blur-[100px]" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-emerald-100">
              <ShieldCheck size={14} />
              Verified Green Technology
            </div>
            <h1 className="text-6xl lg:text-7xl font-black text-emerald-950 leading-[0.95] tracking-tighter mb-8">
              The Future of <br />
              <span className="text-emerald-600">Waste Recovery</span>
            </h1>
            <p className="text-lg text-emerald-950/60 font-medium leading-relaxed max-w-lg mb-10">
              EcoLoop empowers communities to manage waste with unprecedented transparency. Track every ounce of recycling and watch your impact grow in real-time.
            </p>
            <div className="flex flex-wrap gap-4 text-left">
              <button
                onClick={() => navigate('/products')}
                className="group flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95"
              >
                Shop Eco Products
                <ShoppingBag size={18} className="group-hover:translate-y-[-2px] transition-transform" />
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-emerald-950 text-white rounded-2xl font-bold hover:bg-emerald-900 transition-all active:scale-95"
              >
                Join the Revolution
              </button>
              <button
                onClick={() => navigate('/application-options')}
                className="px-8 py-4 bg-white text-emerald-900 border-2 border-emerald-900 rounded-2xl font-bold hover:bg-emerald-50 transition-all active:scale-95 flex items-center gap-2"
              >
                Join as Partner
                <ClipboardCheck size={18} />
              </button>
            </div>

            <div className="mt-12 flex items-center gap-4 relative">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-4 border-[#fafdfb] bg-emerald-100 flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-bold text-emerald-950/50 italic">
                Joined by <span className="text-emerald-950">2,400+</span> new users this week
              </p>

            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl shadow-emerald-200 border-8 border-white bg-white lg:h-[520px] flex items-center justify-center">

              <img
                src="/images/athe.png"
                alt="EcoLoop Hero Character"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/20 to-transparent pointer-events-none z-10" />
            </div>
            {/* Floating Card */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 z-20 bg-white p-6 rounded-3xl shadow-2xl border border-emerald-50 max-w-[200px]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <TrendingUp size={20} />
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-950/40 tracking-widest">Efficiency</span>
              </div>
              <p className="text-2xl font-black text-emerald-950">+88%</p>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Recycling Rate</p>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20" data-aos="fade-up">
            <h2 className="text-4xl md:text-5xl font-black text-emerald-950 tracking-tighter mb-6">
              Empowering a <span className="text-emerald-600">Cleaner</span> World
            </h2>
            <p className="text-emerald-950/50 font-medium">
              We've redesigned the entire recycling workflow from the ground up to make it as simple, transparent, and rewarding as possible.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-10 rounded-[2.5rem] bg-emerald-50/50 border border-emerald-100 hover:bg-white hover:shadow-2xl hover:shadow-emerald-100 transition-all group lg:first:mt-8 lg:last:mt-8"
                data-aos="fade-up"
                data-aos-delay={idx * 100}
              >
                <div className="mb-8 p-4 bg-white rounded-2xl w-fit shadow-sm group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black text-emerald-950 mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-emerald-950/60 font-medium leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section id="stats" className="py-24 px-6 bg-emerald-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-900/10 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center" data-aos="zoom-in" data-aos-delay={idx * 100}>
                <p className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-2">{stat.value}</p>
                <p className="text-emerald-400 font-bold uppercase text-[10px] tracking-[0.2em]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto text-center" data-aos="fade-up">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-10">
            <span className="text-4xl">♻️</span>
          </div>
          <h3 className="text-3xl md:text-5xl font-black text-emerald-950 italic leading-[1.1] tracking-tight">
            "The greatest threat to our planet is the belief that <span className="text-emerald-600 underline decoration-emerald-200">someone else</span> will save it."
          </h3>
          <p className="mt-8 text-emerald-950/40 font-black uppercase tracking-widest text-sm">— ROBERT SWAN</p>
        </div>
      </section>

      {/* Newsletter / CTA */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto bg-emerald-600 rounded-[3rem] p-12 md:p-20 relative overflow-hidden transition-all hover:shadow-[0_40px_100px_-20px_rgba(5,150,105,0.4)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full -ml-32 -mb-32 blur-3xl" />

          <div className="relative z-10 text-center max-w-2xl mx-auto text-white">

            <h2 className="text-4xl md:text-6xl font-black leading-none tracking-tighter mb-8">Ready to make <br />an impact?</h2>
            <p className="text-emerald-50/80 font-medium mb-12 text-lg">
              Download the app or register today to start your journey towards zero waste.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="bg-white text-emerald-700 font-black px-10 py-5 rounded-2xl hover:bg-emerald-50 transition-all active:scale-95 text-lg shadow-xl shadow-emerald-700/20"
              >
                Create Free Account
              </button>
              <button
                onClick={() => navigate('/about')}
                className="bg-emerald-700 text-white font-black px-10 py-5 rounded-2xl border border-emerald-500 hover:bg-emerald-800 transition-all active:scale-95 text-lg"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Redesign */}
      <footer className="pt-24 pb-12 px-6 bg-[#fafdfb] border-t border-emerald-100/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6 pointer-events-none">
                <div className="bg-emerald-600 p-2 rounded-lg">
                  <Recycle className="text-white w-5 h-5" />
                </div>
                <span className="text-2xl font-black tracking-tighter text-emerald-950 uppercase">EcoLoop</span>
              </div>
              <p className="text-emerald-950/50 font-medium max-w-sm mb-8 leading-relaxed">
                We are on a mission to digitize waste management and build a circular economy for everyone.
              </p>
              <div className="flex items-center gap-4 text-emerald-950/40">
                <a href="#!" className="hover:text-emerald-600 transition-colors"><Facebook size={20} /></a>
                <a href="#!" className="hover:text-emerald-600 transition-colors"><Twitter size={20} /></a>
                <a href="#!" className="hover:text-emerald-600 transition-colors"><Instagram size={20} /></a>
              </div>
            </div>

            <div>
              <h4 className="text-emerald-950 font-black uppercase text-xs tracking-widest mb-6 border-b border-emerald-100 pb-2">Navigation</h4>
              <ul className="space-y-4 text-sm font-bold text-emerald-950/60">
                <li><a href="/" className="hover:text-emerald-600 transition-colors">Home</a></li>
                <li><button onClick={() => navigate('/application-options')} className="hover:text-emerald-600 transition-colors text-left font-bold">Join as Partner</button></li>
                <li><a href="/about" className="hover:text-emerald-600 transition-colors">About</a></li>
                <li><button onClick={() => navigate('/market-shop')} className="hover:text-emerald-600 transition-colors text-left">Eco Shop</button></li>
                <li><a href="/events" className="hover:text-emerald-600 transition-colors">Global Events</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-emerald-950 font-black uppercase text-xs tracking-widest mb-6 border-b border-emerald-100 pb-2">Support</h4>
              <ul className="space-y-4 text-sm font-bold text-emerald-950/60 text-left">
                <li className="flex items-center gap-3"><Mail size={16} /> support@ecoloop.com</li>
                <li className="flex items-center gap-3"><Phone size={16} /> +1 (555) 000-0000</li>
                <li><a href="#!" className="hover:text-emerald-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#!" className="hover:text-emerald-600 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-emerald-100/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-950/30">
              © {new Date().getFullYear()} EcoLoop. Technology that heals the planet.
            </p>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-950/40 underline decoration-emerald-200">ISO 14001 Certified System</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
