import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Film, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  Tv,
  Layers,
  Award,
  ChevronRight,
  Clock,
  FileCheck
} from 'lucide-react';
import { api } from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';

const AMENITY_OPTIONS = [
  { id: 'IMAX', label: 'IMAX Certified', icon: Tv },
  { id: 'DOLBY_ATMOS', label: 'Dolby Atmos 7.1', icon: Sparkles },
  { id: 'FOUR_DX', label: '4DX Motion Seats', icon: Layers },
  { id: 'SCREEN_X', label: 'ScreenX 270°', icon: Tv },
  { id: 'RECLINER', label: 'Luxury Recliners', icon: Award },
  { id: 'PARKING', label: 'Onsite Parking', icon: Building2 },
  { id: 'WHEELCHAIR', label: 'Wheelchair Friendly', icon: ShieldCheck },
  { id: 'CAFE', label: 'Gourmet F&B Cafe', icon: Sparkles },
];

export const TheaterManagerSignup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredData, setRegisteredData] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    // Manager Details
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    jobTitle: 'General Manager',
    
    // Theatre Details
    theatreName: '',
    legalEntityName: '',
    gstNumber: '',
    theatrePhone: '',
    theatreEmail: '',
    screenCount: '3',
    totalCapacity: '450',
    
    // Location
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    
    // Amenities
    amenities: ['DOLBY_ATMOS', 'RECLINER'],
    
    // Agreements
    agreedToTerms: false,
    agreedToAuthority: false,
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const toggleAmenity = (id) => {
    setFormData(prev => {
      const exists = prev.amenities.includes(id);
      return {
        ...prev,
        amenities: exists 
          ? prev.amenities.filter(item => item !== id)
          : [...prev.amenities, id]
      };
    });
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) return 'Please enter your full name.';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) return 'Please provide a valid work email address.';
    if (!formData.mobileNumber.trim()) return 'Please provide your mobile contact number.';
    if (!formData.password || formData.password.length < 6) return 'Password must be at least 6 characters long.';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const validateStep2 = () => {
    if (!formData.theatreName.trim()) return 'Please enter the cinema/theatre name.';
    if (!formData.addressLine.trim()) return 'Please provide the street address of the theatre.';
    if (!formData.city.trim()) return 'Please specify the city.';
    if (!formData.state.trim()) return 'Please specify the state.';
    return null;
  };

  const handleNextStep = () => {
    setErrorMessage('');
    if (step === 1) {
      const error = validateStep1();
      if (error) {
        setErrorMessage(error);
        return;
      }
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 2) {
      const error = validateStep2();
      if (error) {
        setErrorMessage(error);
        return;
      }
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setErrorMessage('');
    setStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.agreedToTerms || !formData.agreedToAuthority) {
      setErrorMessage('Please confirm authorization and agree to the Theatre Partner Terms.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        password: formData.password,
        role: 'THEATRE_MANAGER',
        theatreName: formData.theatreName,
        legalEntityName: formData.legalEntityName || `${formData.theatreName} Cinemas Pvt Ltd`,
        gstNumber: formData.gstNumber || undefined,
        theatrePhone: formData.theatrePhone || formData.mobileNumber,
        theatreEmail: formData.theatreEmail || formData.email,
        addressLine: formData.addressLine,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode || undefined,
        amenities: formData.amenities,
      };

      const result = await api.registerTheatreManager(payload);

      if (result.success) {
        setRegisteredData(result.data);
        setIsSuccess(true);
        // Automatically login the manager session
        if (result.data.accessToken && result.data.user) {
          login(result.data.accessToken, result.data.user);
        }
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit theatre manager application. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060608] text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-yellow-500 selection:text-black">
      {/* Cinematic Ambient Glow Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-yellow-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-red-600/10 blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to CineVerse
          </Link>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400">Looking to book movie tickets?</span>
            <Link 
              to="/signup" 
              className="text-yellow-500 hover:text-yellow-400 font-semibold underline underline-offset-4"
            >
              Customer Sign Up
            </Link>
          </div>
        </div>

        {/* Hero Branding Card */}
        <div className="bg-gradient-to-r from-neutral-900/90 via-black/80 to-neutral-900/90 border border-white/10 rounded-3xl p-6 sm:p-10 mb-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-white">
            <Building2 size={240} />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-bold tracking-wide uppercase mb-4">
              <Building2 size={14} />
              CineVerse Partner Network
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Register as a <span className="text-yellow-500">Theater Manager</span>
            </h1>
            
            <p className="text-neutral-300 text-sm sm:text-base mt-3 leading-relaxed">
              Onboard your cinema to CineVerse. Configure screens, design seating layouts, schedule shows, and tap into millions of active moviegoers.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle2 size={16} className="text-yellow-500 shrink-0" />
                <span>Zero Listing Fee</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle2 size={16} className="text-yellow-500 shrink-0" />
                <span>Real-Time Seat Locks</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle2 size={16} className="text-yellow-500 shrink-0" />
                <span>QR Gate Scanner App</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle2 size={16} className="text-yellow-500 shrink-0" />
                <span>Automated Payouts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step Progression Bar */}
        {!isSuccess && (
          <div className="bg-neutral-900/40 border border-white/10 rounded-2xl p-4 mb-8 backdrop-blur-md">
            <div className="flex items-center justify-between max-w-xl mx-auto">
              {/* Step 1 */}
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step === 1 
                    ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' 
                    : step > 1 
                      ? 'bg-emerald-500 text-black' 
                      : 'bg-white/10 text-neutral-400'
                }`}>
                  {step > 1 ? <CheckCircle2 size={18} /> : '1'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-white">Manager Profile</p>
                  <p className="text-[11px] text-neutral-400">Account info</p>
                </div>
              </div>

              <div className={`h-[2px] flex-1 mx-4 transition-colors ${step > 1 ? 'bg-yellow-500' : 'bg-white/10'}`} />

              {/* Step 2 */}
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step === 2 
                    ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' 
                    : step > 2 
                      ? 'bg-emerald-500 text-black' 
                      : 'bg-white/10 text-neutral-400'
                }`}>
                  {step > 2 ? <CheckCircle2 size={18} /> : '2'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-white">Theatre Details</p>
                  <p className="text-[11px] text-neutral-400">Venue & Screens</p>
                </div>
              </div>

              <div className={`h-[2px] flex-1 mx-4 transition-colors ${step > 2 ? 'bg-yellow-500' : 'bg-white/10'}`} />

              {/* Step 3 */}
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step === 3 
                    ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' 
                    : 'bg-white/10 text-neutral-400'
                }`}>
                  3
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-white">Amenities & Review</p>
                  <p className="text-[11px] text-neutral-400">Verification</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Notification Alert */}
        {errorMessage && (
          <div className="mb-6 bg-red-500/15 border border-red-500/40 text-red-200 px-5 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in duration-200">
            <AlertCircle size={20} className="text-red-400 shrink-0" />
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Main Content Area */}
        {isSuccess ? (
          /* SUCCESS SCREEN */
          <div className="bg-neutral-900/70 border border-white/10 rounded-3xl p-8 sm:p-12 text-center backdrop-blur-xl animate-in zoom-in-95 duration-400 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/60 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 size={44} />
            </div>

            <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-bold uppercase tracking-wider">
              Application Status: PENDING
            </span>

            <h2 className="text-3xl font-black text-white mt-4 tracking-tight">
              Theatre Onboarding Submitted!
            </h2>

            <p className="text-neutral-300 max-w-lg mx-auto text-sm sm:text-base mt-3 leading-relaxed">
              Congratulations <span className="text-white font-bold">{formData.fullName}</span>! Your theatre 
              <span className="text-yellow-500 font-bold"> "{formData.theatreName}"</span> has been registered in the CineVerse system.
            </p>

            <div className="bg-black/50 border border-white/10 rounded-2xl p-6 max-w-md mx-auto my-8 text-left space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-neutral-400">Account Role</span>
                <span className="font-bold text-white">THEATRE_MANAGER</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-neutral-400">Login Email</span>
                <span className="font-bold text-white">{formData.email}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-neutral-400">Cinema Venue</span>
                <span className="font-bold text-yellow-500">{formData.theatreName}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-neutral-400">City / State</span>
                <span className="font-bold text-white">{formData.city}, {formData.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Onboarding State</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-yellow-400">
                  <Clock size={14} /> PENDING REVIEW
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <button
                onClick={() => navigate('/admin')}
                className="w-full sm:w-auto flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3.5 px-6 rounded-xl transition shadow-[0_0_20px_rgba(234,179,8,0.3)] flex items-center justify-center gap-2"
              >
                Go to Manager Dashboard
                <ArrowRight size={18} />
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-sm font-semibold transition"
              >
                View Live Movies
              </button>
            </div>
          </div>
        ) : (
          /* MULTI-STEP SIGNUP FORM */
          <form onSubmit={handleSubmit} className="bg-neutral-900/60 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl">
            
            {/* STEP 1: Manager Information */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <User className="text-yellow-500" size={20} />
                    Manager Credentials & Identity
                  </h2>
                  <p className="text-neutral-400 text-xs mt-1">
                    Your personal manager credentials will be used to log in and administer screens, shows, and pricing.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div>
                    <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-2">
                      Manager Full Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={e => handleChange('fullName', e.target.value)}
                        placeholder="Marcus Vance"
                        className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-neutral-500 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Business Email */}
                  <div>
                    <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-2">
                      Work Email Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => handleChange('email', e.target.value)}
                        placeholder="manager@cineplex.com"
                        className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-neutral-500 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-2">
                      Mobile / WhatsApp Number <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type="tel"
                        required
                        value={formData.mobileNumber}
                        onChange={e => handleChange('mobileNumber', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-neutral-500 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Job Designation */}
                  <div>
                    <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-2">
                      Position / Role in Theatre
                    </label>
                    <select
                      value={formData.jobTitle}
                      onChange={e => handleChange('jobTitle', e.target.value)}
                      className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl px-4 py-3.5 text-sm text-white outline-none transition"
                    >
                      <option value="General Manager">General Manager</option>
                      <option value="Cinema Owner / Partner">Cinema Owner / Partner</option>
                      <option value="Head of Operations">Head of Operations</option>
                      <option value="Programming / Show Manager">Programming / Show Manager</option>
                    </select>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-2">
                      Password (min. 6 chars) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={e => handleChange('password', e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl pl-12 pr-12 py-3.5 text-sm text-white placeholder-neutral-500 outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-2">
                      Confirm Password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={e => handleChange('confirmPassword', e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl pl-12 pr-12 py-3.5 text-sm text-white placeholder-neutral-500 outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3.5 px-8 rounded-xl transition flex items-center gap-2 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                  >
                    Next: Theatre Details
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Theatre Profile & Venue Location */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Building2 className="text-yellow-500" size={20} />
                    Theatre & Business Details
                  </h2>
                  <p className="text-neutral-400 text-xs mt-1">
                    Provide the public branding and operational location details of your cinema property.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Theatre Public Name */}
                  <div className="md:col-span-2">
                    <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-2">
                      Theatre / Cinema Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Film size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type="text"
                        required
                        value={formData.theatreName}
                        onChange={e => handleChange('theatreName', e.target.value)}
                        placeholder="e.g. CineVerse Grand IMAX & Multiplex"
                        className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-neutral-500 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Legal Entity Name */}
                  <div>
                    <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-2">
                      Legal Entity / Registered Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.legalEntityName}
                      onChange={e => handleChange('legalEntityName', e.target.value)}
                      placeholder="e.g. CineSphere Media & Entertainment Ltd"
                      className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl px-4 py-3.5 text-sm text-white placeholder-neutral-500 outline-none transition"
                    />
                  </div>

                  {/* GST / Tax Registration Number */}
                  <div>
                    <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-2">
                      GSTIN / Business Tax ID
                    </label>
                    <input
                      type="text"
                      value={formData.gstNumber}
                      onChange={e => handleChange('gstNumber', e.target.value)}
                      placeholder="e.g. 27AABCT3518Q1ZV"
                      className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl px-4 py-3.5 text-sm text-white placeholder-neutral-500 outline-none transition uppercase"
                    />
                  </div>

                  {/* Screen Count */}
                  <div>
                    <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-2">
                      Number of Screens / Auditoriums
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={formData.screenCount}
                      onChange={e => handleChange('screenCount', e.target.value)}
                      className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl px-4 py-3.5 text-sm text-white outline-none transition"
                    />
                  </div>

                  {/* Approximate Total Seating */}
                  <div>
                    <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-2">
                      Total Seating Capacity
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="10000"
                      value={formData.totalCapacity}
                      onChange={e => handleChange('totalCapacity', e.target.value)}
                      placeholder="e.g. 600"
                      className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl px-4 py-3.5 text-sm text-white outline-none transition"
                    />
                  </div>

                  {/* Address Line */}
                  <div className="md:col-span-2">
                    <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-2">
                      Premise Address / Street Line <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type="text"
                        required
                        value={formData.addressLine}
                        onChange={e => handleChange('addressLine', e.target.value)}
                        placeholder="e.g. Level 4, Phoenix MarketCity, Whitefield Main Road"
                        className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-neutral-500 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-2">
                      City <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={e => handleChange('city', e.target.value)}
                      placeholder="e.g. Bengaluru"
                      className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl px-4 py-3.5 text-sm text-white placeholder-neutral-500 outline-none transition"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-2">
                      State / Province <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={e => handleChange('state', e.target.value)}
                      placeholder="e.g. Karnataka"
                      className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl px-4 py-3.5 text-sm text-white placeholder-neutral-500 outline-none transition"
                    />
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-2">
                      Postal Code / PIN
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={e => handleChange('postalCode', e.target.value)}
                      placeholder="e.g. 560048"
                      className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl px-4 py-3.5 text-sm text-white placeholder-neutral-500 outline-none transition"
                    />
                  </div>

                  {/* Cinema Desk Phone */}
                  <div>
                    <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-2">
                      Box Office / Desk Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.theatrePhone}
                      onChange={e => handleChange('theatrePhone', e.target.value)}
                      placeholder="e.g. 080 4912 3456"
                      className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl px-4 py-3.5 text-sm text-white placeholder-neutral-500 outline-none transition"
                    />
                  </div>
                </div>

                <div className="pt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="border border-white/15 hover:bg-white/5 text-neutral-300 font-semibold py-3.5 px-6 rounded-xl transition flex items-center gap-2"
                  >
                    <ArrowLeft size={18} />
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3.5 px-8 rounded-xl transition flex items-center gap-2 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                  >
                    Next: Amenities & Verification
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Amenities & Final Verification */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="text-yellow-500" size={20} />
                    Cinema Amenities & Visual Formats
                  </h2>
                  <p className="text-neutral-400 text-xs mt-1">
                    Select the experience features available at your cinema to showcase to customers.
                  </p>
                </div>

                {/* Amenity Badges Multi-select */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {AMENITY_OPTIONS.map(amenity => {
                    const isSelected = formData.amenities.includes(amenity.id);
                    const Icon = amenity.icon;
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => toggleAmenity(amenity.id)}
                        className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                          isSelected
                            ? 'bg-yellow-500/15 border-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                            : 'bg-black/40 border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Icon size={20} className={isSelected ? 'text-yellow-400' : 'text-neutral-500'} />
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-yellow-500 bg-yellow-500' : 'border-neutral-600'
                          }`}>
                            {isSelected && <CheckCircle2 size={12} className="text-black stroke-[3]" />}
                          </div>
                        </div>
                        <span className="text-xs font-bold">{amenity.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Onboarding Notice Card */}
                <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-2xl p-5 text-xs text-neutral-300 space-y-2">
                  <div className="flex items-center gap-2 text-yellow-400 font-bold">
                    <FileCheck size={16} />
                    CineVerse Partner Verification Notice
                  </div>
                  <p className="leading-relaxed">
                    By submitting this registration, your theatre will be created under status 
                    <span className="text-yellow-400 font-semibold"> PENDING</span>. You will immediately receive access to the Manager Dashboard to configure your screens, seat grids, and pricing. Public ticket bookings will be activated once your entity details are verified by our Super Admin team.
                  </p>
                </div>

                {/* Authorizations and Agreements */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.agreedToAuthority}
                      onChange={e => handleChange('agreedToAuthority', e.target.checked)}
                      className="mt-1 w-4 h-4 rounded accent-yellow-500 cursor-pointer"
                    />
                    <span className="text-xs text-neutral-300 group-hover:text-white transition">
                      I certify that I am an authorized representative of <strong className="text-yellow-400">{formData.theatreName || 'this theatre'}</strong> and have legal capacity to onboard the venue to CineVerse.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.agreedToTerms}
                      onChange={e => handleChange('agreedToTerms', e.target.checked)}
                      className="mt-1 w-4 h-4 rounded accent-yellow-500 cursor-pointer"
                    />
                    <span className="text-xs text-neutral-300 group-hover:text-white transition">
                      I accept the CineVerse <a href="#terms" className="text-yellow-500 underline">Theatre Partner Terms & Conditions</a> and Cinema Ticketing Service Agreement.
                    </span>
                  </label>
                </div>

                {/* Bottom Navigation */}
                <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={loading}
                    className="border border-white/15 hover:bg-white/5 text-neutral-300 font-semibold py-3.5 px-6 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <ArrowLeft size={18} />
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !formData.agreedToTerms || !formData.agreedToAuthority}
                    className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-extrabold py-4 px-9 rounded-xl transition flex items-center gap-2 shadow-[0_0_25px_rgba(234,179,8,0.4)]"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Creating Account & Registering Theatre...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Submit Theatre Application
                        <CheckCircle2 size={18} />
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

          </form>
        )}

        {/* Footer Links & Back to Login */}
        <div className="mt-8 text-center text-xs text-neutral-400">
          Already registered as a Theatre Manager?{' '}
          <button 
            type="button"
            onClick={() => {
              navigate('/');
              // Opens login modal via custom event or user interaction
              setTimeout(() => {
                const btn = document.querySelector('[data-auth-trigger="login"]');
                if (btn) btn.click();
              }, 100);
            }} 
            className="text-yellow-500 hover:underline font-bold"
          >
            Sign in to Manager Portal
          </button>
        </div>

      </div>
    </div>
  );
};
