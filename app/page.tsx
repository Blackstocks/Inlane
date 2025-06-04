"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
import React from 'react'

interface FormData {
  name: string;
  phone: string;
  email: string;
  area: string;
  custom_area: string;
  has_license: boolean | null;
}

interface ValidationErrors {
  name: string;
  phone: string;
  email: string;
  area: string;
  custom_area: string;
}

interface PaymentGatewayData {
  success: boolean;
  gatewayURL: string;
  formData: {
    MerchantId: string;
    TerminalId: string;
    BankId: string;
    EncData: string;
  };
  txnRefNo: string;
  userId: string;
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    area: '',
    custom_area: '',
    has_license: null
  })
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    name: '',
    phone: '',
    email: '',
    area: '',
    custom_area: ''
  })
  const [submitted, setSubmitted] = useState<boolean>(false)
  const [showLicenseQ, setShowLicenseQ] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [paymentInProgress, setPaymentInProgress] = useState<boolean>(false)

  const serviceableAreas = ['HSR Layout', 'Koramangala', 'Electronic City']
  const COURSE_AMOUNT = 1 // Fixed amount for the course

  // Email validation function - allows apostrophes
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+'"-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }

  // Phone number validation function
  const validatePhone = (phone: string): boolean => {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '')
    // Check if it's exactly 10 digits and starts with 6-9
    return cleanPhone.length === 10 && /^[6-9]\d{9}$/.test(cleanPhone)
  }

  // Real-time validation
  const validateField = (name: string, value: string) => {
    let error = ''
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          error = 'Name is required'
        } else if (value.trim().length < 2) {
          error = 'Name must be at least 2 characters'
        }
        break
      case 'phone':
        if (!value.trim()) {
          error = 'Phone number is required'
        } else if (!validatePhone(value)) {
          error = 'Please enter a valid 10-digit mobile number'
        }
        break
      case 'email':
        if (!value.trim()) {
          error = 'Email is required'
        } else if (!validateEmail(value)) {
          error = 'Please enter a valid email address'
        }
        break
      case 'area':
        if (!value) {
          error = 'Please select your area'
        }
        break
      case 'custom_area':
        if (formData.area === 'Other' && !value.trim()) {
          error = 'Please enter your area'
        }
        break
    }

    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Real-time validation
    validateField(name, value)

    if (name === 'area') {
      if (serviceableAreas.includes(value)) {
        setShowLicenseQ(true)
      } else {
        setShowLicenseQ(false)
        setFormData(prev => ({ ...prev, has_license: null }))
      }
      
      // Clear custom area validation when area changes
      if (value !== 'Other') {
        setValidationErrors(prev => ({ ...prev, custom_area: '' }))
      }
    }
  }

  const validateForm = (): boolean => {
    let isValid = true
    const errors: ValidationErrors = {
      name: '',
      phone: '',
      email: '',
      area: '',
      custom_area: ''
    }

    // Validate name
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
      isValid = false
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
      isValid = false
    }

    // Validate phone
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required'
      isValid = false
    } else if (!validatePhone(formData.phone)) {
      errors.phone = 'Please enter a valid 10-digit mobile number'
      isValid = false
    }

    // Validate email
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
      isValid = false
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address'
      isValid = false
    }

    // Validate area
    if (!formData.area) {
      errors.area = 'Please select your area'
      isValid = false
    }

    // Validate custom area
    if (formData.area === 'Other' && !formData.custom_area.trim()) {
      errors.custom_area = 'Please enter your area'
      isValid = false
    }

    setValidationErrors(errors)
    return isValid
  }

  const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      const cleanData = {
        name: formData.name.trim(),
        phone: formData.phone.replace(/\D/g, ''),
        email: formData.email.trim().toLowerCase(),
        area: formData.area,
        custom_area: formData.area === 'Other' ? formData.custom_area.trim() : '',
        has_license: formData.has_license
      }
      

      console.log('Submitting data:', cleanData)

      // If user has license and is in serviceable area, initiate payment
      if (formData.has_license === true && serviceableAreas.includes(formData.area)) {
        await initiatePayment(cleanData)
      } else {
        // For users without license or outside serviceable areas, just save to database
        const { data, error } = await supabase
          .from('users')
          .insert([cleanData])
          .select()

        if (error) {
          console.error('Supabase error:', error)
          alert(`Failed to submit: ${error.message}`)
        } else {
          console.log('Success:', data)
          setSubmitted(true)
        }
      }
    } catch (err) {
      console.error('Network error:', err)
      alert('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const initiatePayment = async (userData: FormData) => {
    try {
      setPaymentInProgress(true)
      
      // Create payment order
      const response = await fetch('/api/payment/create-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: COURSE_AMOUNT,
          customerName: userData.name,
          customerEmail: userData.email,
          customerPhone: userData.phone,
          userData: userData // Pass user data to store in database
        }),
      })
      
      const paymentData: PaymentGatewayData = await response.json()
      
      if (paymentData.success) {
        // Create form and submit to ICICI gateway
        submitToPaymentGateway(paymentData)
      } else {
        alert('Failed to create payment order')
        setPaymentInProgress(false)
      }
    } catch (error) {
      console.error('Payment initiation failed:', error)
      alert('Payment initiation failed')
      setPaymentInProgress(false)
    }
  }

  const submitToPaymentGateway = (paymentData: PaymentGatewayData) => {
    console.log('Submitting to payment gateway:', paymentData);
    
    // Create a form dynamically and submit to ICICI gateway
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentData.gatewayURL;
    form.target = '_self';
    
    // Add form data exactly as returned from API
    const fields = paymentData.formData;
    
    console.log('Form fields being submitted:', fields);
    
    Object.keys(fields).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = fields[key as keyof typeof fields];
      form.appendChild(input);
    });
    
    document.body.appendChild(form);
    console.log('Submitting form to:', form.action);
    form.submit();
  };

  if (paymentInProgress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ecffbd] via-white to-[#d9ff7a] flex items-center justify-center px-1">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00c281] mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-[#2e3cff] mb-2">Processing Payment</h2>
          <p className="text-[#6257ff]">Please wait while we redirect you to the payment gateway...</p>
          <p className="text-sm text-gray-600 mt-2">Amount: ₹{COURSE_AMOUNT}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ecffbd] via-white to-[#d9ff7a] flex items-center justify-center px-1">
        <div className="w-full max-w-sm lg:max-w-lg mx-auto lg:border lg:border-gray-200 lg:shadow-2xl lg:rounded-3xl lg:bg-white/90 lg:backdrop-blur-md lg:p-6">
          <div className="min-h-screen lg:min-h-0 relative overflow-hidden bg-gradient-to-br from-[#ecffbd] via-white to-[#d9ff7a] lg:bg-transparent lg:rounded-2xl">
            {/* Animated Background Elements */}
            <div className="absolute inset-0">
              <div className="absolute top-20 left-4 w-24 h-24 bg-[#00c281]/30 rounded-full animate-float"></div>
              <div className="absolute top-40 right-4 w-20 h-20 bg-[#00ce84]/20 rounded-full animate-float-delayed"></div>
              <div className="absolute bottom-32 left-1/4 w-32 h-32 bg-[#00ff91]/40 rounded-full animate-float-slow"></div>
              <div className="absolute bottom-20 right-4 w-24 h-24 bg-[#d1b3ff]/25 rounded-full animate-float"></div>
              
              <div className="absolute bottom-0 left-0 w-full">
                <svg className="w-full h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
                  <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
                        fill="#00c281" 
                        className="animate-wave opacity-30"></path>
                </svg>
              </div>
            </div>

            <div className="relative z-10 flex flex-col justify-center items-center min-h-screen lg:min-h-96 px-1">
              <div className="text-center max-w-sm lg:max-w-md">
                <div className="mb-8 animate-bounce-gentle">
                  <div className="w-24 h-24 bg-gradient-to-r from-[#00c281] to-[#00ce84] rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-[#2e3cff] mb-4 animate-fade-in" style={{fontFamily: 'Glancyr Medium, sans-serif'}}>Thank You!</h1>
                <p className="text-lg text-[#6257ff] animate-fade-in-delayed" style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}>Thank you for trusting us to be your driving buddy, we will get in touch with you soon to start your driving journey.</p>
              </div>
            </div>

            <footer className="absolute bottom-4 left-0 right-0 text-center text-sm text-gray-500 z-10 lg:relative lg:bottom-0 lg:mt-8">
              <a href="https://inlane.in/terms-and-conditions" className="hover:text-[#00c281] transition-colors">Terms & Conditions</a> | 
              <a href="https://inlane.in/privacy-policy" className="hover:text-[#00c281] transition-colors ml-1">Privacy Policy</a>
            </footer>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ecffbd] via-white to-[#d9ff7a] flex items-center justify-center px-1">
      <div className="w-full max-w-sm lg:max-w-lg mx-auto lg:border lg:border-gray-200 lg:shadow-2xl lg:rounded-3xl lg:bg-white/90 lg:backdrop-blur-md lg:p-6">
        <div className="min-h-screen lg:min-h-0 relative overflow-hidden bg-gradient-to-br from-[#ecffbd] via-white to-[#d9ff7a] lg:bg-transparent lg:rounded-2xl">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-4 w-16 h-16 border-2 border-[#00c281]/30 rounded-lg animate-spin-slow"></div>
            <div className="absolute top-32 right-6 w-14 h-14 bg-[#d1b3ff]/40 rounded-full animate-pulse-slow"></div>
            <div className="absolute top-64 left-1/3 w-10 h-10 border-2 border-[#ff9f2c]/25 rotate-45 animate-float"></div>
            <div className="absolute bottom-40 right-1/4 w-20 h-20 bg-[#6becff]/35 rounded-full animate-float-delayed"></div>
            
            <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-gradient-to-r from-[#00c281]/20 to-transparent rounded-full animate-float-slow blur-xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-l from-[#d1b3ff]/15 to-transparent rounded-full animate-float blur-xl"></div>
            
            <div className="absolute inset-0 opacity-5">
              <div className="grid grid-cols-8 lg:grid-cols-12 gap-6 p-3 h-full">
                {[...Array(48)].map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-[#00c281] rounded-full animate-pulse" style={{animationDelay: `${i * 0.1}s`}}></div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 min-h-screen lg:min-h-0 flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center px-1 lg:px-4 py-6">
              {/* Hero Image Container */}
              <div className="mb-6 animate-slide-in">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <Image 
                    src="/car-banner.jpeg" 
                    alt="LANE Driving Banner" 
                    width={600} 
                    height={300} 
                    className="w-full max-w-sm lg:max-w-md h-auto object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2e3cff]/20 to-transparent"></div>
                </div>
              </div>

              {/* Title and Tagline */}
              <div className="text-center mb-6 animate-fade-in-delayed px-1">
                <h1 className="text-3xl lg:text-4xl font-bold text-[#2e3cff] mb-3" style={{fontFamily: 'Glancyr Medium, sans-serif'}}>
                  By Your Side,<br/> Every Ride
                </h1>
                
                <p className="text-[#6257ff]/80 text-sm lg:text-base mt-2" style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}>
                  Turning nervous starts into confident strides - India&apos;s first online driving school
                </p>
              </div>

              {/* Form Container */}
              <div className="w-full animate-slide-up">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-3 lg:p-5 space-y-4">
                  
                  {/* Form Fields */}
                  <div className="space-y-3 lg:space-y-4">
                    {/* Name Field */}
                    <div>
                      <input 
                        className={`w-full p-3 lg:p-4 border-2 rounded-xl focus:outline-none transition-all duration-300 bg-white/70 backdrop-blur-sm hover:bg-white placeholder-gray-500 text-gray-800 ${
                          validationErrors.name 
                            ? 'border-red-400 focus:border-red-500' 
                            : 'border-[#00c281]/50 focus:border-[#00ce84]'
                        }`}
                        name="name" 
                        placeholder="Full Name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        disabled={isLoading}
                        style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}
                      />
                      {validationErrors.name && (
                        <p className="text-red-500 text-xs mt-1 px-1 animate-fade-in" style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}>
                          {validationErrors.name}
                        </p>
                      )}
                    </div>
                    
                    {/* Phone Field */}
                    <div>
                      <input 
                        className={`w-full p-3 lg:p-4 border-2 rounded-xl focus:outline-none transition-all duration-300 bg-white/70 backdrop-blur-sm hover:bg-white placeholder-gray-500 text-gray-800 ${
                          validationErrors.phone 
                            ? 'border-red-400 focus:border-red-500' 
                            : 'border-[#00c281]/50 focus:border-[#00ce84]'
                        }`}
                        name="phone" 
                        placeholder="Phone Number (10 digits)" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        disabled={isLoading}
                        maxLength={10}
                        style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}
                      />
                      {validationErrors.phone && (
                        <p className="text-red-500 text-xs mt-1 px-1 animate-fade-in" style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}>
                          {validationErrors.phone}
                        </p>
                      )}
                    </div>
                    
                    {/* Email Field */}
                    <div>
                      <input 
                        className={`w-full p-3 lg:p-4 border-2 rounded-xl focus:outline-none transition-all duration-300 bg-white/70 backdrop-blur-sm hover:bg-white placeholder-gray-500 text-gray-800 ${
                          validationErrors.email 
                            ? 'border-red-400 focus:border-red-500' 
                            : 'border-[#00c281]/50 focus:border-[#00ce84]'
                        }`}
                        name="email" 
                        type="email"
                        placeholder="Email Address" 
                        value={formData.email} 
                        onChange={handleChange} 
                        disabled={isLoading}
                        style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}
                      />
                      {validationErrors.email && (
                        <p className="text-red-500 text-xs mt-1 px-1 animate-fade-in" style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}>
                          {validationErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Area Field */}
                    <div>
                      <select 
                        className={`w-full p-3 lg:p-4 border-2 rounded-xl focus:outline-none transition-all duration-300 bg-white/70 backdrop-blur-sm hover:bg-white text-gray-800 ${
                          validationErrors.area 
                            ? 'border-red-400 focus:border-red-500' 
                            : 'border-[#00c281]/50 focus:border-[#00ce84]'
                        }`}
                        name="area" 
                        value={formData.area} 
                        onChange={handleChange}
                        disabled={isLoading}
                        style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}
                      >
                        <option value="" className="text-gray-500">Select Your Area</option>
                        {serviceableAreas.map(area => (
                          <option key={area} value={area}>{area}</option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                      {validationErrors.area && (
                        <p className="text-red-500 text-xs mt-1 px-1 animate-fade-in" style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}>
                          {validationErrors.area}
                        </p>
                      )}
                    </div>

                    {formData.area === 'Other' && (
                      <div className="animate-slide-down">
                        <input
                          className={`w-full p-3 lg:p-4 border-2 rounded-xl focus:outline-none transition-all duration-300 bg-white/70 backdrop-blur-sm hover:bg-white placeholder-gray-500 text-gray-800 ${
                            validationErrors.custom_area 
                              ? 'border-red-400 focus:border-red-500' 
                              : 'border-[#00c281]/50 focus:border-[#00ce84]'
                          }`}
                          name="custom_area"
                          placeholder="Enter your area"
                          value={formData.custom_area}
                          onChange={handleChange}
                          disabled={isLoading}
                          style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}
                        />
                        {validationErrors.custom_area && (
                          <p className="text-red-500 text-xs mt-1 px-1 animate-fade-in" style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}>
                            {validationErrors.custom_area}
                          </p>
                        )}
                        <p className="text-sm text-[#ff9f2c] mt-2 px-1 animate-fade-in" style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}>
                          ⚠️ We are currently not serving this location. Please fill out the form, and we&apos;ll get back to you with updates as soon as possible!!
                        </p>
                      </div>
                    )}

                    {showLicenseQ && (
                      <div className="space-y-3 animate-slide-down">
                        <label className="block font-semibold text-[#2e3cff] text-sm lg:text-base px-1" style={{fontFamily: 'Glancyr Medium, sans-serif'}}>
                          Do you have a 4-wheeler driving license?
                        </label>
                        <div className="flex gap-2 lg:gap-3">
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, has_license: true }))}
                            disabled={isLoading}
                            className={`flex-1 px-3 lg:px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 font-medium text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed ${
                              formData.has_license === true 
                                ? 'bg-[#00c281] text-white shadow-lg' 
                                : 'bg-[#ecffbd] text-[#2e3cff] hover:bg-[#d9ff7a]'
                            }`}
                            style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}
                          >
                            ✓ Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, has_license: false }))}
                            disabled={isLoading}
                            className={`flex-1 px-3 lg:px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 font-medium text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed ${
                              formData.has_license === false 
                                ? 'bg-[#00c281] text-white shadow-lg' 
                                : 'bg-[#ecffbd] text-[#2e3cff] hover:bg-[#d9ff7a]'
                            }`}
                            style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}
                          >
                            ✗ No
                          </button>
                        </div>
                        
                        {/* Message for No License */}
                        {formData.has_license === false && (
                          <div className="bg-[#6becff]/20 border border-[#6becff]/40 rounded-xl p-3 animate-fade-in">
                            <p className="text-sm text-[#2e3cff]" style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}>
                              📝 No worries! Please complete the form and we will get in touch with you for your driving license assistance along with your driving lessons.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submit Buttons */}
                    {showLicenseQ && formData.has_license === true && (
                      <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full px-3 lg:px-4 py-3 lg:py-4 mt-4 bg-gradient-to-r from-[#00c281] to-[#00ce84] text-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:from-[#00ff91] hover:to-[#00c281] shadow-lg font-semibold animate-slide-up text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        style={{fontFamily: 'Glancyr Medium, sans-serif'}}
                      >
                        {isLoading ? '⏳ Processing...' : `💳 Pay ₹${COURSE_AMOUNT} & Start Learning`}
                      </button>
                    )}

                    {(!showLicenseQ || formData.has_license === false) && (
                      <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full px-3 lg:px-4 py-3 lg:py-4 mt-4 bg-gradient-to-r from-[#00c281] to-[#00ce84] text-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:from-[#00ff91] hover:to-[#00c281] shadow-lg font-semibold animate-slide-up text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        style={{fontFamily: 'Glancyr Medium, sans-serif'}}
                      >
                        {isLoading ? '⏳ Processing...' : '🚗 Start Your Driving Journey'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="py-4 text-center text-sm text-gray-600 lg:relative lg:bottom-0 px-1" style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}>
              <a href="https://inlane.in/terms-and-conditions" className="hover:text-[#00c281] transition-colors">
                Terms & Conditions
              </a>
              {' '} | {' '}
              <a href="https://inlane.in/privacy-policy" className="hover:text-[#00c281] transition-colors">
                Privacy Policy
              </a>
            </footer>
          </div>

          {/* Custom Styles */}
          <style jsx>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-20px); }
            }
            @keyframes float-delayed {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-15px); }
            }
            @keyframes float-slow {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
            @keyframes spin-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes pulse-slow {
              0%, 100% { opacity: 0.4; }
              50% { opacity: 0.8; }
            }
            @keyframes wave {
              0% { transform: translateX(0); }
              50% { transform: translateX(-25%); }
              100% { transform: translateX(-50%); }
            }
            @keyframes fade-in {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fade-in-delayed {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes slide-in {
              from { opacity: 0; transform: translateX(-50px); }
              to { opacity: 1; transform: translateX(0); }
            }
            @keyframes slide-up {
              from { opacity: 0; transform: translateY(30px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes slide-down {
              from { opacity: 0; transform: translateY(-20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes bounce-gentle {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }

            .animate-float { animation: float 6s ease-in-out infinite; }
            .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
            .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
            .animate-spin-slow { animation: spin-slow 20s linear infinite; }
            .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
            .animate-wave { animation: wave 10s ease-in-out infinite; }
            .animate-fade-in { animation: fade-in 1s ease-out; }
            .animate-fade-in-delayed { animation: fade-in-delayed 1s ease-out 0.3s both; }
            .animate-slide-in { animation: slide-in 1s ease-out; }
            .animate-slide-up { animation: slide-up 0.6s ease-out; }
            .animate-slide-down { animation: slide-down 0.4s ease-out; }
            .animate-bounce-gentle { animation: bounce-gentle 2s ease-in-out infinite; }
          `}</style>
        </div>
      </div>
    </div>
  )
}
