import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Tests() {
  const [tests, setTests] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTests = async () => {
      const { data, error } = await supabase.from("tests").select("*");
      if (data) setTests(data);
      if (error) console.error("Error fetching tests:", error);
    };
    fetchTests();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Mock Tests</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map(test => (
          <div key={test.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition duration-300 flex flex-col">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">{test.title}</h2>
            
            <div className="space-y-3 text-gray-700 mb-6 flex-grow">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 font-medium">Time Limit:</span>
                <span className="font-bold text-lg">{test.timeLimit} mins</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 font-medium">Questions:</span>
                <span className="font-bold text-lg">{test.questions?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 font-medium">Total Marks:</span>
                <span className="font-bold text-lg">{test.marks}</span>
              </div>
            </div>
            
            <div className="mt-auto">
              {user ? (
                <Link to={`/user/tests/${test.id}`} className="block text-center bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md">
                  Start Test
                </Link>
              ) : (
                <Link to="/login" className="block text-center bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition">
                  Login to Attempt
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
