'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function DashboardGuestPage() {
  // State for form inputs
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNo: '',
    hasYoungerChildren: false,
    hasOlderChildren: false,
    youngerChildrenCount: 0,
    olderChildrenCount: 0,
    paymentScreenshot: null,
    paymentStatus: 'pending' // 'pending', 'processing', 'completed'
  });
  
  // State for payment form
  const [paymentFormData, setPaymentFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    nameOnCard: '',
    amount: '₹1,500.00'
  });
  
  // State for modal visibility
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Handle ESC key to close the modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        setIsPaymentModalOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  // Handle payment form input changes
  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData({
      ...paymentFormData,
      [name]: value
    });
  };
  
  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // File size validation (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      setFormData({
        ...formData,
        paymentScreenshot: file,
      });
    }
  };
  
  // Open payment modal
  const openPaymentModal = (e) => {
    e.preventDefault(); // Prevent form submission
    
    // Auto-fill the name from the guest form if available
    if (formData.name) {
      setPaymentFormData({
        ...paymentFormData,
        nameOnCard: formData.name
      });
    }
    
    setIsPaymentModalOpen(true);
  };
  
  // Close payment modal
  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };
  
  // Complete payment
  const handleCompletePayment = () => {
    // Form validation for payment
    if (!paymentFormData.cardNumber || !paymentFormData.expiryDate || !paymentFormData.cvc || !paymentFormData.nameOnCard) {
      alert('Please fill in all payment details');
      return;
    }
    
    // Simple card number validation
    if (paymentFormData.cardNumber.replace(/\s/g, '').length < 13) {
      alert('Please enter a valid card number');
      return;
    }
    
    // Show processing state briefly to simulate payment
    setFormData({
      ...formData,
      paymentStatus: 'processing'
    });
    
    // Simulate payment processing delay
    setTimeout(() => {
      setFormData({
        ...formData,
        paymentStatus: 'completed'
      });
      setIsPaymentModalOpen(false);
    }, 1000);
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.name || !formData.email || !formData.phoneNo) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (formData.paymentStatus !== 'completed') {
      alert('Please complete the payment before submitting');
      return;
    }
    
    if (!formData.paymentScreenshot) {
      alert('Please upload payment screenshot');
      return;
    }
    
    // Here you would typically send the data to your backend
    console.log('Form submitted:', formData);
    alert('Guest registration successful!');
  };
  
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Guest Management | Hotel Dashboard</title>
        <meta name="description" content="Hotel dashboard guest management page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Dashboard Navigation */}
      <nav className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-blue-600 font-bold text-xl">Hotel Dashboard</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a href="/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Overview
                </a>
                <a href="/dashboard/guest" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Guest Management
                </a>
                <a href="/dashboard/bookings" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Bookings
                </a>
                <a href="/dashboard/reports" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Reports
                </a>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <button type="button" className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <span className="sr-only">View notifications</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="ml-3 relative">
                <div>
                  <button type="button" className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" id="user-menu" aria-expanded="false" aria-haspopup="true">
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center">
                      <span className="font-medium text-blue-600">A</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-blue-600">
          <h1 className="text-xl font-bold text-white">Add New Guest</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6" id="guestForm">
          {/* Guest Information */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="phoneNo" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNo"
              name="phoneNo"
              required
              value={formData.phoneNo}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          {/* Children Information */}
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="hasYoungerChildren"
                  name="hasYoungerChildren"
                  type="checkbox"
                  checked={formData.hasYoungerChildren}
                  onChange={handleInputChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="hasYoungerChildren" className="font-medium text-gray-700">
                  Children (1-6 years)
                </label>
              </div>
            </div>
            
            {formData.hasYoungerChildren && (
              <div className="ml-7">
                <label htmlFor="youngerChildrenCount" className="block text-sm font-medium text-gray-700">
                  Number of Children (1-6 years)
                </label>
                <input
                  type="number"
                  id="youngerChildrenCount"
                  name="youngerChildrenCount"
                  min="0"
                  max="10"
                  value={formData.youngerChildrenCount}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            )}
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="hasOlderChildren"
                  name="hasOlderChildren"
                  type="checkbox"
                  checked={formData.hasOlderChildren}
                  onChange={handleInputChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="hasOlderChildren" className="font-medium text-gray-700">
                  Children (7-10 years)
                </label>
              </div>
            </div>
            
            {formData.hasOlderChildren && (
              <div className="ml-7">
                <label htmlFor="olderChildrenCount" className="block text-sm font-medium text-gray-700">
                  Number of Children (7-10 years)
                </label>
                <input
                  type="number"
                  id="olderChildrenCount"
                  name="olderChildrenCount"
                  min="0"
                  max="10"
                  value={formData.olderChildrenCount}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
          
          {/* Payment Button */}
          <div className="pt-4">
            <button
              type="button"
              onClick={openPaymentModal}
              disabled={formData.paymentStatus === 'completed' || formData.paymentStatus === 'processing'}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                formData.paymentStatus === 'completed' 
                  ? 'bg-green-500 cursor-not-allowed' 
                  : formData.paymentStatus === 'processing'
                    ? 'bg-yellow-500 cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              {formData.paymentStatus === 'completed' 
                ? 'Payment Completed' 
                : formData.paymentStatus === 'processing'
                  ? 'Processing Payment...'
                  : 'Pay Now'}
            </button>
          </div>
          
          {/* Payment Status and Screenshot Upload */}
          {formData.paymentStatus === 'completed' && (
            <div className="space-y-4 mt-4">
              <div className="px-4 py-3 bg-green-100 rounded-md">
                <p className="text-sm font-medium text-green-800">
                  Payment successful! Please upload the payment screenshot below.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Upload Payment Screenshot
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="paymentScreenshot"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="paymentScreenshot"
                          name="paymentScreenshot"
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>
              
              {formData.paymentScreenshot && (
                <div className="px-4 py-3 bg-gray-100 rounded-md">
                  <p className="text-sm font-medium text-gray-700">
                    File uploaded: {formData.paymentScreenshot.name}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={formData.paymentStatus !== 'completed' || !formData.paymentScreenshot}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                formData.paymentStatus === 'completed' && formData.paymentScreenshot
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  : 'bg-gray-400 cursor-not-allowed'
              } focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              Complete Registration
            </button>
          </div>
        </form>
      </div>
      
      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={closePaymentModal}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Complete Payment
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Please complete your payment through our secure Diplink payment gateway.
                      </p>
                      
                      {/* Mock Payment Form */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Card Number
                          </label>
                          <input
                            type="text"
                            name="cardNumber"
                            value={paymentFormData.cardNumber}
                            onChange={handlePaymentFormChange}
                            placeholder="1234 5678 9012 3456"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                          <p className="mt-1 text-xs text-gray-500">Enter your 16-digit card number</p>
                        </div>
                        
                        <div className="flex space-x-4">
                          <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700">
                              Expiry Date
                            </label>
                            <input
                              type="text"
                              name="expiryDate"
                              value={paymentFormData.expiryDate}
                              onChange={handlePaymentFormChange}
                              placeholder="MM/YY"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                          <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700">
                              CVC
                            </label>
                            <input
                              type="text"
                              name="cvc"
                              value={paymentFormData.cvc}
                              onChange={handlePaymentFormChange}
                              placeholder="123"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Name on Card
                          </label>
                          <input
                            type="text"
                            name="nameOnCard"
                            value={paymentFormData.nameOnCard}
                            onChange={handlePaymentFormChange}
                            placeholder="Enter name as on card"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Payment Amount
                          </label>
                          <div className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-700 sm:text-sm">
                            {paymentFormData.amount}
                          </div>
                        </div>
                        
                        <div className="mt-2 px-4 py-3 bg-blue-50 rounded-md">
                          <p className="text-sm text-blue-800">
                            <strong>Demo Mode:</strong> This is a demo payment form. Enter your payment details and click Pay Now to complete the payment.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCompletePayment}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Pay Now
                </button>
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}