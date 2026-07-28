import { Linkedin, MessageCircle, InstagramIcon, LucideFacebook, LucideYoutube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white py-6 sm:py-8 lg:py-12 px-4 sm:px-6 border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 sm:gap-8 lg:gap-12">

          {/* Logo and Description Column */}
          <div className="lg:col-span-1 text-center sm:text-left">
            <div className="mb-3 sm:mb-4 lg:mb-6">
              <img src="/sdlogo.svg" alt="Startup Doctor" className="h-16 sm:h-20 lg:h-24 w-auto mb-2 sm:mb-3 lg:mb-4 mx-auto sm:mx-0" />
            </div>
          </div>

          {/* Overview Column */}
          <div className="lg:col-span-1">
            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4 text-xs sm:text-sm uppercase tracking-wide">OVERVIEW</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li><a href="https://aistartupdoctor.com/our-story.html" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors block py-1.5 sm:py-1">Our Story</a></li>
              <li><a href="https://aistartupdoctor.com/our-story.html" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors block py-1.5 sm:py-1">About us</a></li>
              <li><a href="#demo" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors block py-1.5 sm:py-1">Demo</a></li>
              <li><a href="#pricing" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors block py-1.5 sm:py-1">Pricing</a></li>
              <li><a href="/contact" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors block py-1.5 sm:py-1">Contact</a></li>
            </ul>
          </div>

          {/* Quick Links Column */}
          <div className="lg:col-span-1">
            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4 text-xs sm:text-sm uppercase tracking-wide">QUICK LINKS</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li><a href="/health-check" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors block py-1.5 sm:py-1">Start health check</a></li>
              <li><a href="/reports" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors block py-1.5 sm:py-1">Get Your Health Report</a></li>
              <li><a href="/dashboard" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors block py-1.5 sm:py-1">My Dashboard</a></li>
              <li><a href="#support-ticket" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors block py-1.5 sm:py-1">Create support ticket</a></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="lg:col-span-1">
            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4 text-xs sm:text-sm uppercase tracking-wide">RESOURCES</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li><a href="#what-is-startup-doctor" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors block py-1.5 sm:py-1">What is a Startup Doctor?</a></li>
              <li><a href="#become-certified" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors block py-1.5 sm:py-1">How to become a certificated Startup doctor?</a></li>
              <li><a href="#stay-legally-sound" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors block py-1.5 sm:py-1">How to stay legally sound?</a></li>
            </ul>
          </div>

          {/* Our Partners Column */}
          <div className="lg:col-span-1">
            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4 text-xs sm:text-sm uppercase tracking-wide">OUR PARTNERS</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li><a href="#ecosystem-partners" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors block py-1.5 sm:py-1">Our ecosystem partners</a></li>
              <li><a href="#incubators" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors block py-1.5 sm:py-1">Startup Doctor for Incubators</a></li>
              <li><a href="#apply-certification" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors block py-1.5 sm:py-1">Apply to Get Startup Doctor Certification</a></li>
            </ul>
          </div>

          {/* Chat With Us Column */}
          <div className="lg:col-span-1">
            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4 text-xs sm:text-sm uppercase tracking-wide">CHAT WITH US</h3>
            <a
              href="#support"
              className="inline-flex items-center justify-center px-4 py-2.5 sm:px-4 sm:py-2 bg-green-500 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-green-600 transition-colors min-h-[44px] sm:min-h-0"
            >
              <MessageCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Support</span>
            </a>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="mt-6 sm:mt-8 lg:mt-12 pt-5 sm:pt-6 lg:pt-8 border-t border-gray-100">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs lg:text-sm text-gray-500 text-center lg:text-left px-2">
              <span>© 2025 Startup Doctor™ | All Rights Reserved</span>
            </div>
            <div className="flex gap-2 sm:gap-3 lg:gap-4">
              <a href="https://www.linkedin.com/company/startup-doctor/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors p-2 sm:p-2.5 rounded-lg hover:bg-gray-50" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5 sm:w-5 sm:h-5" />
              </a>
              <a href="https://x.com/aistartupdoctor" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors p-2 sm:p-2.5 rounded-lg hover:bg-gray-50" aria-label="X (Twitter)">
                <svg className="w-5 h-5 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/aistartupdoctor/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors p-2 sm:p-2.5 rounded-lg hover:bg-gray-50" aria-label="Instagram">
                <InstagramIcon className="w-5 h-5 sm:w-5 sm:h-5" />
              </a>
              <a href="https://www.facebook.com/aistartupdoctor" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-700 transition-colors p-2 sm:p-2.5 rounded-lg hover:bg-gray-50" aria-label="Facebook">
                <LucideFacebook className="w-5 h-5 sm:w-5 sm:h-5" />
              </a>
              <a href="https://www.youtube.com/@AIStartupDoctor" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-600 transition-colors p-2 sm:p-2.5 rounded-lg hover:bg-gray-50" aria-label="YouTube">
                <LucideYoutube className="w-5 h-5 sm:w-5 sm:h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}