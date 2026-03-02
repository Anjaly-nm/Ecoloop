import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  Recycle,
  Target,
  Eye,
  Heart,
  Globe,
  Zap,
  ShieldCheck,
  Users,
  ArrowRight,
  TrendingUp,
  Award,
  ChevronRight,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Instagram
} from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";

const About = () => {
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
      easing: "ease-out-cubic",
    });
    window.scrollTo(0, 0);
  }, []);

  const coreValues = [
    {
      icon: <Target className="w-8 h-8 text-emerald-500" />,
      title: "Impact Driven",
      description: "We focus on measurable environmental results, not just promises."
    },
    {
      icon: <Globe className="w-8 h-8 text-teal-500" />,
      title: "Circular Economy",
      description: "Building systems where waste is a resource, not an endpoint."
    },
    {
      icon: <Zap className="w-8 h-8 text-amber-500" />,
      title: "Tech-Forward",
      description: "Using AI and real-time data to optimize waste recovery cycles."
    },
    {
      icon: <Heart className="w-8 h-8 text-rose-500" />,
      title: "Community Led",
      description: "Empowering every citizen to be a hero in their own neighborhood."
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafdfb] font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1.5 bg-emerald-500 origin-left z-[100]"
        style={{ scaleX }}
      />

      {/* Navigation (Consistent with Home Page) */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/70 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="bg-emerald-600 p-2 rounded-lg text-white">
              <Recycle className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tighter text-emerald-950 uppercase">EcoLoop</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-emerald-950/70 text-left">
            <button onClick={() => navigate("/")} className="hover:text-emerald-600 transition-colors">Home</button>
            <button onClick={() => navigate("/shop")} className="hover:text-emerald-600 transition-colors">Shop</button>
            <button onClick={() => navigate("/login")} className="hover:text-emerald-600 transition-colors">Sign In</button>
          </div>

          <button
            onClick={() => navigate("/register")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-200 active:scale-95"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden bg-emerald-950">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-900/20 rounded-full blur-[120px] -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-emerald-400/10 rounded-full blur-[100px] -ml-40 -mb-40" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-400/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-emerald-400/20">
              <ShieldCheck size={14} />
              Sustainability First
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-8">
              Healing the Planet,<br />
              <span className="text-emerald-400">One Cycle</span> at a Time.
            </h1>
            <p className="text-xl text-emerald-100/60 font-medium max-w-3xl mx-auto leading-relaxed">
              EcoLoop was founded on the belief that waste is a design flaw. We're building the infrastructure for a zero-waste world through intelligence, community, and action.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story / Mission Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1" data-aos="fade-right">
            <h2 className="text-4xl md:text-5xl font-black text-emerald-950 tracking-tighter mb-8 leading-tight text-left">
              A Mission with <span className="text-emerald-600 underline underline-offset-8 decoration-emerald-200">Global Ambition.</span>
            </h2>
            <div className="space-y-6 text-emerald-950/60 font-medium leading-relaxed text-lg text-left text-left">
              <p>
                EcoLoop started in 2024 with a simple observation: millions of tons of waste are mismanaged daily because the systems are invisible to the people who create them.
              </p>
              <p>
                Our mission is to make the waste cycle transparent. By connecting citizens directly with recovery facilities and automating tracking, we turn individuals from "waste producers" into "resource managers."
              </p>
              <p>
                Today, we operate in 120+ cities, empowering thousands of delivery heroes and millions of households to reclaim the future of our environment.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-6">
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                <div className="text-3xl font-black text-emerald-950 mb-1">98%</div>
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Accuracy Rate</div>
              </div>
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                <div className="text-3xl font-black text-emerald-950 mb-1">12M+</div>
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Tons Recovered</div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 relative" data-aos="fade-left">
            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl shadow-emerald-100 border-8 border-white">
              <img
                src="/images/about.png"
                alt="Recycling Process"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/20 to-transparent" />
            </div>
            {/* Overlay card */}
            <div className="absolute -bottom-10 -right-10 bg-white p-8 rounded-[2rem] shadow-2xl border border-emerald-50 max-w-sm hidden md:block">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Award size={24} />
                </div>
                <div>
                  <h4 className="font-black text-emerald-950 leading-none mb-1 text-left">Award Winning</h4>
                  <p className="text-xs font-bold text-emerald-950/40 uppercase tracking-widest text-left">Global Green Innovation 2025</p>
                </div>
              </div>
              <p className="text-sm text-emerald-950/60 font-medium text-left">Recognized for revolutionizing urban waste logistics with real-time AI.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-24 px-6 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20" data-aos="fade-up">
            <h2 className="text-4xl md:text-5xl font-black text-emerald-950 tracking-tighter mb-6">
              Values that <span className="text-emerald-600">Drive Deco</span>
            </h2>
            <p className="text-emerald-950/40 font-bold uppercase tracking-widest text-xs italic">OUR CONSTITUTION FOR A GREENER EARTH</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {coreValues.map((value, idx) => (
              <div
                key={idx}
                className="p-10 rounded-[2.5rem] bg-[#fafdfb] border border-emerald-100 hover:bg-white hover:shadow-2xl hover:shadow-emerald-100 transition-all group"
                data-aos="fade-up"
                data-aos-delay={idx * 100}
              >
                <div className="mb-8 p-4 bg-white rounded-2xl w-fit shadow-sm group-hover:scale-110 transition-transform">
                  {value.icon}
                </div>
                <h3 className="text-xl font-black text-emerald-950 mb-3 tracking-tight">{value.title}</h3>
                <p className="text-emerald-950/60 font-medium text-sm leading-relaxed text-left">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the Vision Section */}
      <section className="py-24 px-6 lg:px-12 bg-emerald-50/50">
        <div className="max-w-7xl mx-auto bg-white rounded-[4rem] p-12 lg:p-24 shadow-2xl shadow-emerald-100 border border-emerald-50">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div data-aos="fade-right">
              <div className="w-20 h-2 bg-emerald-600 rounded-full mb-10" />
              <h2 className="text-4xl md:text-6xl font-black text-emerald-950 tracking-tighter mb-8 leading-[0.95] text-left">
                Transparency <br />is our <span className="text-emerald-600 italic">North Star.</span>
              </h2>
              <p className="text-lg text-emerald-950/60 font-medium leading-relaxed mb-10 text-left text-left">
                We don't just dump waste into black bins. We provide every stakeholder—from the child recycling a toy to the government administrator tracking city health—with the data they need to make better decisions.
              </p>
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-3 bg-emerald-950 text-white px-8 py-4 rounded-2xl font-bold hover:bg-emerald-900 transition-all active:scale-95 group text-left"
              >
                Back to Dashboard
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4" data-aos="fade-up">
              <div className="space-y-4">
                <img src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=400" className="rounded-3xl w-full h-40 object-cover grayscale hover:grayscale-0 transition-all duration-500 shadow-xl" alt="Vision 1" />
                <img src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=400" className="rounded-3xl w-full h-64 object-cover grayscale hover:grayscale-0 transition-all duration-500 shadow-xl" alt="Vision 2" />
              </div>
              <div className="space-y-4 pt-8">
                <img src="https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&q=80&w=400" className="rounded-3xl w-full h-64 object-cover grayscale hover:grayscale-0 transition-all duration-500 shadow-xl" alt="Vision 3" />
                <img src="https://images.unsplash.com/photo-1536939459926-301728717817?auto=format&fit=crop&q=80&w=400" className="rounded-3xl w-full h-40 object-cover grayscale hover:grayscale-0 transition-all duration-500 shadow-xl" alt="Vision 4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ / Help section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center" data-aos="fade-up">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-10">
            <span className="text-4xl text-emerald-600">💬</span>
          </div>
          <h2 className="text-4xl font-black text-emerald-950 tracking-tighter mb-6">Have Questions?</h2>
          <p className="text-emerald-950/60 font-medium mb-10">Our sustainability experts are ready to help you navigate through your green journey.</p>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-3 px-6 py-4 bg-emerald-50 rounded-2xl border border-emerald-100 hover:border-emerald-300 transition-colors cursor-pointer group">
              <Mail className="text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-emerald-900">support@ecoloop.com</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 bg-emerald-50 rounded-2xl border border-emerald-100 hover:border-emerald-300 transition-colors cursor-pointer group">
              <Phone className="text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-emerald-900">+1 (555) 000-0000</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer (Consistent with Home Page) */}
      <footer className="pt-24 pb-12 px-6 bg-[#fafdfb] border-t border-emerald-100/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-20 text-left">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6 pointer-events-none">
                <div className="bg-emerald-600 p-2 rounded-lg text-white">
                  <Recycle className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black tracking-tighter text-emerald-950 uppercase">EcoLoop</span>
              </div>
              <p className="text-emerald-950/50 font-medium max-w-sm mb-8 leading-relaxed">
                We are on a mission to digitize waste management and build a circular economy for everyone.
              </p>
              <div className="flex items-center gap-4 text-emerald-950/40">
                <Facebook size={20} className="hover:text-emerald-600 cursor-pointer transition-colors" />
                <Twitter size={20} className="hover:text-emerald-600 cursor-pointer transition-colors" />
                <Instagram size={20} className="hover:text-emerald-600 cursor-pointer transition-colors" />
              </div>
            </div>

            <div>
              <h4 className="text-emerald-950 font-black uppercase text-xs tracking-widest mb-6 border-b border-emerald-100 pb-2">Quick Links</h4>
              <ul className="space-y-4 text-sm font-bold text-emerald-950/60">
                <li><button onClick={() => navigate("/")} className="hover:text-emerald-600 transition-colors">Home</button></li>
                <li><button onClick={() => navigate("/shop")} className="hover:text-emerald-600 transition-colors">Eco Shop</button></li>
                <li><button onClick={() => navigate("/events")} className="hover:text-emerald-600 transition-colors">Global Events</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-emerald-950 font-black uppercase text-xs tracking-widest mb-6 border-b border-emerald-100 pb-2">Legal</h4>
              <ul className="space-y-4 text-sm font-bold text-emerald-950/60 text-left text-left">
                <li className="hover:text-emerald-600 cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-emerald-600 cursor-pointer transition-colors">Terms of Service</li>
                <li className="hover:text-emerald-600 cursor-pointer transition-colors">Cookie Policy</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-emerald-100/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-950/30">
              © {new Date().getFullYear()} EcoLoop. Technology for a cleaner planet.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-950/40 underline decoration-emerald-200 decoration-2">Eco-Certified System</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
