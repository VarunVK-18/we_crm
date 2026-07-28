import Navbar from '../components/Navigation';
import ContactUs from '../components/ContactUs';
import Footer from '../components/Footer';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <ContactUs />
      <Footer />
    </div>
  );
}