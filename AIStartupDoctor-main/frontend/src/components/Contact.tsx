import { ArrowUpRight, Mail, Phone, MapPin } from 'lucide-react';

const Contact = () => {
  return (
    <section id="contact" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16 sm:mb-20">
          <p className="text-xs font-medium tracking-widest uppercase text-gray-500 mb-4 sm:mb-6">
            GET IN TOUCH
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Ready to Get
            <br />
            <span className="text-gray-400">Started?</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-10">
            Let's discuss how we can help your business stay compliant and grow with confidence.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Contact;