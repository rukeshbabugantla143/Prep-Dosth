import { Mail, Phone, MapPin } from "lucide-react";

export default function Contact() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full font-sans">
      <h1 className="text-4xl font-black text-gray-900 mb-12 text-center">Contact Us</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Get in Touch</h2>
          <p className="text-gray-600 mb-8">
            Have questions about our courses, mock tests, or need technical support? Our team is here to help you.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Phone Support</h3>
                <p className="text-gray-600">1800 203 0577 (Toll Free)</p>
                <p className="text-sm text-gray-500">Mon-Sat, 9 AM to 8 PM</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-green-50 p-3 rounded-full text-[#15b86c]">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Email Us</h3>
                <p className="text-gray-600">support@govprep.com</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-purple-50 p-3 rounded-full text-purple-600">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Office Address</h3>
                <p className="text-gray-600">123 Education Hub, Knowledge Park<br />New Delhi, 110001, India</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Send a Message</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15b86c] outline-none" placeholder="Your Name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15b86c] outline-none" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15b86c] outline-none" placeholder="How can we help you?"></textarea>
            </div>
            <button type="button" className="w-full bg-[#15b86c] text-white py-3 rounded-lg font-bold hover:bg-[#12a15e] transition">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
