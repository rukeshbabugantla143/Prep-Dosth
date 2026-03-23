import { Crown, CheckCircle2 } from "lucide-react";

export default function Premium() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 flex items-center justify-center gap-3">
          <Crown className="text-yellow-500" size={40} /> PrepDosth Pass Pro
        </h1>
        <p className="text-xl text-gray-600 font-medium">
          Unlock your true potential with unlimited access to premium content, mock tests, and paid courses.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:border-yellow-400 transition">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Railway Premium Content</h3>
          <ul className="space-y-3 text-gray-600 mb-8">
            <li className="flex items-center gap-2"><CheckCircle2 className="text-[#15b86c]" size={18} /> RRB NTPC Special Notes</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-[#15b86c]" size={18} /> Group D Video Lectures</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-[#15b86c]" size={18} /> ALP Technical Guides</li>
          </ul>
          <button className="w-full py-3 rounded-lg font-bold border-2 border-gray-200 text-gray-700 hover:border-gray-300 transition">Explore Railway</button>
        </div>

        <div className="bg-gradient-to-b from-yellow-50 to-white p-8 rounded-2xl shadow-md border border-yellow-200 relative transform md:-translate-y-4">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
            Most Popular
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Premium Mock Tests</h3>
          <ul className="space-y-3 text-gray-600 mb-8">
            <li className="flex items-center gap-2"><CheckCircle2 className="text-yellow-500" size={18} /> 70,000+ Mock Tests</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-yellow-500" size={18} /> 17,000+ Previous Papers</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-yellow-500" size={18} /> All India Rank Prediction</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-yellow-500" size={18} /> Detailed Solutions</li>
          </ul>
          <button className="w-full py-3 rounded-lg font-bold bg-yellow-500 text-white hover:bg-yellow-600 transition shadow-lg shadow-yellow-500/30">Get Pass Pro</button>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:border-yellow-400 transition">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Paid Courses</h3>
          <ul className="space-y-3 text-gray-600 mb-8">
            <li className="flex items-center gap-2"><CheckCircle2 className="text-[#15b86c]" size={18} /> Live Interactive Classes</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-[#15b86c]" size={18} /> Doubt Solving Sessions</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-[#15b86c]" size={18} /> PDF Study Materials</li>
          </ul>
          <button className="w-full py-3 rounded-lg font-bold border-2 border-gray-200 text-gray-700 hover:border-gray-300 transition">View Courses</button>
        </div>
      </div>
    </div>
  );
}
