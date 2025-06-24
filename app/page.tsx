"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";


// --- Car Preloader Component ---
function CarPreloader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <svg width="160" height="80" viewBox="0 0 160 80" fill="none">
        {/* Road */}
        <rect y="60" width="160" height="8" rx="4" fill="#00c281" opacity="0.15" />
        {/* Car body */}
        <rect x="40" y="40" width="80" height="24" rx="10" fill="#00c281" className="car-bounce" />
        {/* Car roof */}
        <rect x="60" y="28" width="40" height="18" rx="7" fill="#fff" stroke="#00c281" strokeWidth="3" className="car-bounce" />
        {/* Wheels */}
        <circle cx="55" cy="65" r="10" fill="#fff" stroke="#00c281" strokeWidth="4" className="wheel-spin" />
        <circle cx="105" cy="65" r="10" fill="#fff" stroke="#00c281" strokeWidth="4" className="wheel-spin" />
        {/* Motion lines */}
        <rect x="30" y="55" width="12" height="3" rx="1.5" fill="#00c281" opacity="0.5" className="motion-left" />
        <rect x="118" y="55" width="12" height="3" rx="1.5" fill="#00c281" opacity="0.5" className="motion-right" />
      </svg>
      <span className="mt-6 text-[#00c281] font-bold text-xl animate-pulse">Starting your journey...</span>
      <style jsx>{`
        .wheel-spin {
          transform-origin: center;
          animation: wheel-spin 0.5s linear infinite;
        }
        @keyframes wheel-spin {
          100% { transform: rotate(360deg);}
        }
        .car-bounce {
          animation: car-bounce 1.2s ease-in-out infinite;
        }
        @keyframes car-bounce {
          0%,100% { transform: translateY(0);}
          50% { transform: translateY(-7px);}
        }
        .motion-left {
          animation: motion-left 1s linear infinite;
        }
        .motion-right {
          animation: motion-right 1s linear infinite;
        }
        @keyframes motion-left {
          0% { opacity: 0; transform: translateX(0);}
          30% { opacity: 1;}
          100% { opacity: 0; transform: translateX(-20px);}
        }
        @keyframes motion-right {
          0% { opacity: 0; transform: translateX(0);}
          30% { opacity: 1;}
          100% { opacity: 0; transform: translateX(20px);}
        }
        .animate-pulse {
          animation: pulse 1.2s infinite;
        }
        @keyframes pulse {
          0%,100% { opacity: 1;}
          50% { opacity: 0.6;}
        }
      `}</style>
    </div>
  );
}

// --- Main Form Component ---
function MainForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    area: "",
    custom_area: "",
    has_license: null,
  });
  const [validationErrors, setValidationErrors] = useState({
    name: "",
    phone: "",
    email: "",
    area: "",
    custom_area: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [showLicenseQ, setShowLicenseQ] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentInProgress, setPaymentInProgress] = useState(false);

  const serviceableAreas = ["HSR Layout", "Koramangala", "Electronic City"];
  const COURSE_AMOUNT = 1;

  // Validation functions
  const validateEmail = (email) =>
    /^[a-zA-Z0-9._%+'"-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  const validatePhone = (phone) => {
    const cleanPhone = phone.replace(/\D/g, "");
    return cleanPhone.length === 10 && /^[6-9]\d{9}$/.test(cleanPhone);
  };

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "name":
        if (!value.trim()) error = "Name is required";
        else if (value.trim().length < 2) error = "Name must be at least 2 characters";
        break;
      case "phone":
        if (!value.trim()) error = "Phone number is required";
        else if (!validatePhone(value)) error = "Please enter a valid 10-digit mobile number";
        break;
      case "email":
        if (!value.trim()) error = "Email is required";
        else if (!validateEmail(value)) error = "Please enter a valid email address";
        break;
      case "area":
        if (!value) error = "Please select your area";
        break;
      case "custom_area":
        if (formData.area === "Other" && !value.trim()) error = "Please enter your area";
        break;
    }
    setValidationErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
    if (name === "area") {
      if (serviceableAreas.includes(value)) setShowLicenseQ(true);
      else {
        setShowLicenseQ(false);
        setFormData((prev) => ({ ...prev, has_license: null }));
      }
      if (value !== "Other") setValidationErrors((prev) => ({ ...prev, custom_area: "" }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const errors = {
      name: "",
      phone: "",
      email: "",
      area: "",
      custom_area: "",
    };
    if (!formData.name.trim()) {
      errors.name = "Name is required";
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
      isValid = false;
    }
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
      isValid = false;
    } else if (!validatePhone(formData.phone)) {
      errors.phone = "Please enter a valid 10-digit mobile number";
      isValid = false;
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }
    if (!formData.area) {
      errors.area = "Please select your area";
      isValid = false;
    }
    if (formData.area === "Other" && !formData.custom_area.trim()) {
      errors.custom_area = "Please enter your area";
      isValid = false;
    }
    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const cleanData = {
        name: formData.name.trim(),
        phone: formData.phone.replace(/\D/g, ""),
        email: formData.email.trim().toLowerCase(),
        area: formData.area,
        custom_area: formData.area === "Other" ? formData.custom_area.trim() : "",
        has_license: formData.has_license,
      };
      if (formData.has_license === true && serviceableAreas.includes(formData.area)) {
        await initiatePayment(cleanData);
      } else {
        const { error } = await supabase.from("users").insert([cleanData]).select();
        if (error) alert(`Failed to submit: ${error.message}`);
        else setSubmitted(true);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const initiatePayment = async () => {
    try {
      setPaymentInProgress(true);
      setTimeout(() => {
        setPaymentInProgress(false);
        setSubmitted(true);
      }, 2000);
    } catch {
      alert("Payment initiation failed");
      setPaymentInProgress(false);
    }
  };

  // Payment loading state
  if (paymentInProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <CarPreloader />
        <span className="mt-6 text-[#00c281] font-bold text-xl animate-pulse">Processing Payment...</span>
      </div>
    );
  }

  // Submission success
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center max-w-md w-full">
          <div className="mb-4">
            <svg width="56" height="56" fill="none">
              <circle cx="28" cy="28" r="28" fill="#00c281" />
              <path
                d="M18 29l8 8 12-16"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#00c281] mb-2">
            Thank You!
          </h1>
          <p className="text-gray-700 mb-4 text-center">
            Thank you for trusting us to be your driving buddy. We&apos;ll get in touch soon to start your driving journey.
          </p>
          <div className="flex gap-2 text-sm text-gray-500">
            <a href="https://inlane.in/terms-and-conditions" className="hover:text-[#00c281]">Terms & Conditions</a>
            <span>|</span>
            <a href="https://inlane.in/privacy-policy" className="hover:text-[#00c281]">Privacy Policy</a>
          </div>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#ecffbd] to-[#00c281] px-2 relative overflow-hidden">
      {/* Animated floating background elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-[#00c281]/10 rounded-full animate-float" />
      <div className="absolute bottom-20 right-16 w-40 h-40 bg-[#00c281]/20 rounded-full animate-float-slow" />
      <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-[#00c281]/10 rounded-full animate-float-delayed" />
      <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
        <svg width="100%" height="100%">
          <rect x="10%" y="80%" width="80%" height="10" rx="5" fill="#00c281" />
        </svg>
      </div>
      {/* Main Card */}
      <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-2xl p-6 border border-[#00c281]/10 z-10">
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/car-banner.jpeg"
            alt="Driving School Banner"
            width={320}
            height={120}
            className="rounded-xl mb-2"
            priority
          />
          <h1 className="text-2xl font-bold text-[#00c281] text-center mb-1">
            By Your Side, Every Ride
          </h1>
          <p className="text-gray-700 text-center text-sm">
            Turning nervous starts into confident strides &ndash; India&apos;s first online driving school
          </p>
        </div>
        <div className="space-y-4">
          <input
            className={`w-full p-3 border-2 rounded-xl bg-white placeholder-gray-500 text-gray-800 focus:outline-none focus:border-[#00c281] ${
              validationErrors.name ? "border-red-400" : "border-[#00c281]/30"
            }`}
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            disabled={isLoading}
          />
          {validationErrors.name && (
            <p className="text-red-500 text-xs">{validationErrors.name}</p>
          )}

          <input
            className={`w-full p-3 border-2 rounded-xl bg-white placeholder-gray-500 text-gray-800 focus:outline-none focus:border-[#00c281] ${
              validationErrors.phone ? "border-red-400" : "border-[#00c281]/30"
            }`}
            name="phone"
            placeholder="Phone Number (10 digits)"
            value={formData.phone}
            onChange={handleChange}
            disabled={isLoading}
            maxLength={10}
          />
          {validationErrors.phone && (
            <p className="text-red-500 text-xs">{validationErrors.phone}</p>
          )}

          <input
            className={`w-full p-3 border-2 rounded-xl bg-white placeholder-gray-500 text-gray-800 focus:outline-none focus:border-[#00c281] ${
              validationErrors.email ? "border-red-400" : "border-[#00c281]/30"
            }`}
            name="email"
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
          />
          {validationErrors.email && (
            <p className="text-red-500 text-xs">{validationErrors.email}</p>
          )}

          <select
            className={`w-full p-3 border-2 rounded-xl bg-white text-gray-800 focus:outline-none focus:border-[#00c281] ${
              validationErrors.area ? "border-red-400" : "border-[#00c281]/30"
            }`}
            name="area"
            value={formData.area}
            onChange={handleChange}
            disabled={isLoading}
          >
            <option value="">Select Your Area</option>
            {serviceableAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>
          {validationErrors.area && (
            <p className="text-red-500 text-xs">{validationErrors.area}</p>
          )}

          {formData.area === "Other" && (
            <>
              <input
                className={`w-full p-3 border-2 rounded-xl bg-white placeholder-gray-500 text-gray-800 focus:outline-none focus:border-[#00c281] ${
                  validationErrors.custom_area
                    ? "border-red-400"
                    : "border-[#00c281]/30"
                }`}
                name="custom_area"
                placeholder="Enter your area"
                value={formData.custom_area}
                onChange={handleChange}
                disabled={isLoading}
              />
              {validationErrors.custom_area && (
                <p className="text-red-500 text-xs">
                  {validationErrors.custom_area}
                </p>
              )}
              <p className="text-xs text-[#00c281] mt-1">
                ⚠️ We are currently not serving this location. Please fill out the form, and we&apos;ll get back to you as soon as possible!
              </p>
            </>
          )}

          {showLicenseQ && (
            <div>
              <label className="block font-semibold text-[#00c281] mb-1">
                Do you have a 4-wheeler driving license?
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, has_license: true }))
                  }
                  disabled={isLoading}
                  className={`flex-1 py-2 rounded-xl font-medium ${
                    formData.has_license === true
                      ? "bg-[#00c281] text-white shadow"
                      : "bg-white border border-[#00c281] text-[#00c281]"
                  }`}
                >
                  ✓ Yes
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, has_license: false }))
                  }
                  disabled={isLoading}
                  className={`flex-1 py-2 rounded-xl font-medium ${
                    formData.has_license === false
                      ? "bg-[#00c281] text-white shadow"
                      : "bg-white border border-[#00c281] text-[#00c281]"
                  }`}
                >
                  ✗ No
                </button>
              </div>
              {formData.has_license === false && (
                <div className="bg-[#00c281]/10 border border-[#00c281]/20 rounded-xl p-2 mt-2">
                  <p className="text-xs text-[#00c281]">
                    📝 No worries! Please complete the form and we will get in touch with you for your driving license assistance along with your driving lessons.
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-3 mt-2 bg-gradient-to-r from-[#00c281] to-[#24e68a] text-white rounded-xl font-semibold transition-all hover:from-[#24e68a] hover:to-[#00c281] shadow-lg text-base disabled:opacity-50"
          >
            {isLoading
              ? "⏳ Processing..."
              : showLicenseQ && formData.has_license === true
              ? `💳 Pay ₹${COURSE_AMOUNT} & Start Learning`
              : "🚗 Start Your Driving Journey"}
          </button>
        </div>
        <footer className="mt-6 text-center text-xs text-gray-500">
          <a
            href="https://inlane.in/terms-and-conditions"
            className="hover:text-[#00c281]"
          >
            Terms & Conditions
          </a>{" "}
          |{" "}
          <a
            href="https://inlane.in/privacy-policy"
            className="hover:text-[#00c281]"
          >
            Privacy Policy
          </a>
        </footer>
      </div>
      <style jsx>{`
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float 10s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 8s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}

// --- Main Page Component ---
export default function Home() {
  // Only preloader state here
  const [preloading, setPreloading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setPreloading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (preloading) return <CarPreloader />;

  return <MainForm />;
}
