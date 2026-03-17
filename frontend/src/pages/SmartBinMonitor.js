import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    AlertTriangle,
    Thermometer,
    Wind,
    Clock,
    ArrowLeft,
    RefreshCcw,
    CheckCircle2,
    Database,
    Cpu,
    Wifi,
    WifiOff
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

const SmartBinMonitor = () => {
    const [gasData, setGasData] = useState([]);
    const [latestData, setLatestData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const navigate = useNavigate();

    const fetchGasData = async () => {
        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4321';
            const response = await axios.get(`${apiUrl}/api/iot/latest-readings`);

            // Console log for user to verify in browser
            console.log("📊 IoT Sync Trace:", response.data);

            const { success, latest, history } = response.data;

            if (success) {
                setIsOnline(true);
                if (latest) {
                    setLatestData(latest);
                    setError(null);
                } else {
                    setError("Connected, but no sensor records found.");
                }

                if (history && Array.isArray(history)) {
                    const formattedHistory = [...history].reverse().map(item => {
                        const baseLevel = item.gasLevel || 0;
                        // Estimate CO2 and Methane from the total level for demonstration
                        // MQ135 typical sensitivity breakdown:
                        const co2 = item.co2 || (baseLevel * 0.75).toFixed(1);
                        const methane = item.methane || (baseLevel * 0.25).toFixed(1);

                        return {
                            ...item,
                            co2: Number(co2),
                            methane: Number(methane),
                            time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        };
                    });
                    setGasData(formattedHistory);
                }
            }
        } catch (err) {
            console.error("❌ IoT Sync Error:", err);
            setIsOnline(false);
            setError(`Sync Failure: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGasData();
        const interval = setInterval(fetchGasData, 5000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'High': return 'text-rose-600 bg-rose-50 border-rose-100';
            case 'Moderate': return 'text-amber-600 bg-amber-50 border-amber-100';
            default: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto"
            >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <button
                            onClick={() => navigate('/adminpage')}
                            className="flex items-center gap-2 text-slate-400 hover:text-purple-600 font-bold text-xs uppercase tracking-widest transition-colors mb-4 group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Core
                        </button>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tightest leading-tight flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                                <Activity className="text-purple-600" size={32} />
                            </div>
                            Smart Bin Monitor
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${isOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-100 animate-pulse' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                            {isOnline ? 'Live Connection' : 'Sync Offline'}
                        </div>
                        <button
                            onClick={fetchGasData}
                            className="p-3.5 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-purple-600 hover:bg-slate-50 transition-all shadow-sm group"
                        >
                            <RefreshCcw size={18} className="group-active:rotate-180 transition-transform duration-500" />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm">
                        <AlertTriangle size={18} />
                        {error}
                    </div>
                )}

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Real-time Status Card */}
                    <div className="lg:col-span-4 space-y-8">
                        <motion.div
                            className={`p-8 rounded-[2.5rem] bg-white border shadow-2xl relative overflow-hidden ${latestData?.status === 'High' ? 'border-rose-200 shadow-rose-200/50' : 'border-slate-100 shadow-slate-200/50'}`}
                        >
                            <AnimatePresence mode="wait">
                                {latestData?.status === 'High' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="absolute top-6 right-6"
                                    >
                                        <AlertTriangle className="text-rose-500 animate-bounce" size={40} />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Total Gas Level</p>
                            <div className="flex items-baseline gap-2 mb-6">
                                <h3 className={`text-7xl font-black tracking-tighter ${latestData?.status === 'High' ? 'text-rose-600' : 'text-slate-900'}`}>
                                    {latestData?.gasLevel || '--'}
                                </h3>
                                <span className="text-xl font-bold text-slate-400 uppercase tracking-widest">PPM</span>
                            </div>

                            {latestData && (
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">CO2 (Est)</p>
                                        <p className="text-xl font-black text-purple-700">
                                            {latestData.co2 || (latestData.gasLevel * 0.75).toFixed(1)} <span className="text-[10px] text-purple-400">PPM</span>
                                        </p>
                                    </div>
                                    <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100">
                                        <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1">Methane (Est)</p>
                                        <p className="text-xl font-black text-sky-700">
                                            {latestData.methane || (latestData.gasLevel * 0.25).toFixed(1)} <span className="text-[10px] text-sky-400">PPM</span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-xs uppercase tracking-widest ${getStatusColor(latestData?.status)}`}>
                                    {latestData?.status === 'High' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                                    Status: {latestData?.status || 'Searching...'}
                                </div>
                                <p className="text-xs text-slate-400 font-medium">
                                    Bin ID: <span className="text-slate-900 font-bold">{latestData?.binId || 'Scanning...'}</span>
                                </p>
                            </div>

                            {latestData?.status !== 'Normal' && latestData?.status && (
                                <div className={`mt-8 p-6 rounded-2xl shadow-lg animate-pulse border ${latestData.status === 'High' ? 'bg-rose-600 text-white border-rose-400' : 'bg-amber-600 text-white border-amber-400'}`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <AlertTriangle size={20} />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                                            {latestData.status === 'High' ? 'Critical Safety Alert' : 'Safety Advisory'}
                                        </p>
                                    </div>
                                    <p className="text-sm font-bold leading-snug">
                                        Harmful gases may be present inside the bin. Sanitation workers should avoid cleaning the bin until proper ventilation or waste collection is performed. Worker safety is a priority, and immediate action is recommended.
                                    </p>
                                </div>
                            )}
                        </motion.div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                                    <Wind size={20} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Air Quality</p>
                                <p className="text-lg font-black text-slate-900 leading-none">
                                    {latestData ? (latestData.gasLevel < 400 ? 'Excellent' : latestData.gasLevel < 800 ? 'Good' : 'Poor') : 'Wait...'}
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                                    <Clock size={20} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Sync</p>
                                <p className="text-lg font-black text-slate-900 leading-none">
                                    {latestData ? new Date(latestData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Chart Card */}
                    <div className="lg:col-span-8 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Analytics Real-time</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">MQ135 Sensor Telemetry Hub</p>
                            </div>
                        </div>

                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={gasData}>
                                    <defs>
                                        <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#9333ea" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorMethane" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="time"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                        domain={[0, 1000]}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            borderRadius: '1.5rem',
                                            border: 'none',
                                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                            padding: '1rem'
                                        }}
                                        itemStyle={{ fontSize: '12px', fontWeight: '900', color: '#1e293b' }}
                                        labelStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="co2"
                                        name="CO2 (PPM)"
                                        stroke="#9333ea"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorCo2)"
                                        animationDuration={1500}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="methane"
                                        name="Methane (PPM)"
                                        stroke="#0ea5e9"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorMethane)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-3 gap-6 mt-10 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="flex flex-col items-center">
                                <Cpu size={18} className="text-slate-400 mb-2" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hardware</p>
                                <p className="text-xs font-bold text-slate-900 uppercase">ESP32 Core</p>
                            </div>
                            <div className="flex flex-col items-center border-x border-slate-200">
                                <Thermometer size={18} className="text-slate-400 mb-2" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Detection</p>
                                <p className="text-xs font-bold text-slate-900 uppercase">MQ135 GAS</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <Database size={18} className="text-slate-400 mb-2" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Protocol</p>
                                <p className="text-xs font-bold text-slate-900 uppercase">REST API</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Recent Logs Table */}
                <div className="mt-12 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                    <div className="px-10 py-8 border-b border-slate-50">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Historical Log Trace</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sequence of detected gas transmissions</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Time</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bin Identity</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metric Level</th>
                                    <th className="px-10 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Safety Classification</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {gasData.slice().reverse().map((log, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-10 py-5 text-xs font-bold text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="px-10 py-5 text-xs font-black text-slate-900 uppercase tracking-wider">{log.binId}</td>
                                        <td className="px-10 py-5">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-purple-600">CO2: {log.co2}</span>
                                                    <span className="text-[10px] font-bold text-slate-300">PPM</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-sky-600">CH4: {log.methane}</span>
                                                    <span className="text-[10px] font-bold text-slate-300">PPM</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-5 text-right">
                                            <span className={`px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest inline-block ${getStatusColor(log.status)}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SmartBinMonitor;
