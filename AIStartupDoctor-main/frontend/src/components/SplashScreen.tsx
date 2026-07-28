import { useEffect, useState } from 'react';

interface SplashScreenProps {
    onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [logoLoaded, setLogoLoaded] = useState(true);

    useEffect(() => {
        // Show splash for minimum 2.5 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
            // Wait for fade out animation to complete before calling onComplete
            setTimeout(onComplete, 500);
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            className={`fixed inset-0 z-[9999] bg-white flex items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'
                }`}
        >
            <div className="text-center max-w-4xl mx-auto px-4">
                {/* Logo */}
                <div
                    className={`mb-8 transition-all duration-1000 ease-out ${logoLoaded ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
                        }`}
                >
                    <img
                        src="/sdlogo.svg"
                        alt="Startup Doctor"
                        className="h-32 w-auto mx-auto drop-shadow-lg"
                        onLoad={() => setLogoLoaded(true)}
                    />
                </div>

                {/* Subtitle
        <div
          className={`transition-all duration-1000 delay-200 ease-out ${
            logoLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p 
            className="text-2xl sm:text-3xl lg:text-4xl text-amber-800 mb-2 leading-relaxed"
            style={{ fontFamily: 'Allura, cursive' }}
          >
            The World's 1st
          </p>
        </div> */}

                {/* App Title
        <div
          className={`transition-all duration-1000 delay-400 ease-out ${
            logoLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Startup Doctor
          </h1>
        </div> */}

                {/* Loading Animation */}
                <div
                    className={`transition-all duration-1000 delay-800 ease-out ${logoLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                >
                    <div className="flex justify-center space-x-2 mb-4">
                        <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>

                </div>

                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-transparent to-gray-100"></div>
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-amber-100 to-transparent rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-l from-gray-100 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>
            </div>
        </div>
    );
}