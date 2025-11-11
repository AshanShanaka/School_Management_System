import Image from "next/image";
import LoginForm from "./LoginForm";

const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Main Container */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
          {/* Logo and Brand */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="EduNova Logo"
                  width={48}
                  height={48}
                  className="animate-spin-slow hover:animate-spin transition-all duration-300"
                />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                EduNova
              </h1>
            </div>
            <p className="text-gray-500 text-sm">Welcome back! Please sign in to your account</p>
          </div>

          {/* Login Form */}
          <LoginForm />
          
          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              © 2025 EduNova. All rights reserved.
            </p>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-200/30 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-indigo-200/30 rounded-full blur-xl"></div>
      </div>
    </div>
  );
};

export default LoginPage;
