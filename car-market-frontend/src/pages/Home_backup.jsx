import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { carsAPI } from '../services/api';
import Hero from '../components/Hero';
import CarCard from '../components/CarCard';
import Footer from '../components/Footer';

const Home = () => {
  const [featuredCars, setFeaturedCars] = useState([]);
  const [latestCars, setLatestCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '', brand: '', type: '', minPrice: '', maxPrice: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await carsAPI.getAll();
        setFeaturedCars(response.data.slice(0, 4));
        setLatestCars(response.data.slice(4, 10));
      } catch (error) {
        console.error('Error fetching cars:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCars();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    navigate(`/cars?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Hero filters={filters} onChange={handleFilterChange} onSubmit={handleSearch} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gray-200 animate-pulse h-48"></div>
                <div className="p-5 space-y-3">
                  <div className="bg-gray-200 animate-pulse h-5 w-3/4 rounded"></div>
                  <div className="bg-gray-200 animate-pulse h-4 w-1/2 rounded"></div>
                  <div className="bg-gray-200 animate-pulse h-10 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero filters={filters} onChange={handleFilterChange} onSubmit={handleSearch} />

      {/* ============ FEATURED CARS ============ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Featured <span className="text-red-600">Cars</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Browse our selection of premium vehicles available now
            </p>
          </div>

          {/* Cars Grid - 4 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {featuredCars.slice(0, 4).map((car) => (
              <CarCard
                key={car.id}
                car={car}
                badge="Featured"
                badgeColor="bg-red-600"
              />
            ))}
          </div>

          {/* View All Cars Button */}
          <div className="text-center">
            <Link
              to="/cars"
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-red-600 text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              View All Cars
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ============ POPULAR BRANDS ============ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Popular <span className="text-red-600">Brands</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Explore vehicles from the world's most trusted automotive brands
            </p>
          </div>

          {/* Brands Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { name: 'BMW', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/2048px-BMW.svg.png' },
              { name: 'Mercedes', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mercedes-Logo_2010.svg/2048px-Mercedes-Logo_2010.svg.png' },
              { name: 'Audi', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Audi_logo_-_2016.svg/2048px-Audi_logo_-_2016.svg.png' },
              { name: 'Toyota', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Toyota_logo.svg/2048px-Toyota_logo.svg.png' },
              { name: 'Honda', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Honda_logo.svg/2048px-Honda_logo.svg.png' },
              { name: 'Ford', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Ford_logo_flat.svg/2048px-Ford_logo_flat.svg.png' },
            ].map((brand, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 flex items-center justify-center group hover:-translate-y-1">
                <div className="text-center">
                  <img src={brand.logo} alt={brand.name} className="h-12 w-auto mx-auto mb-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <span className="text-xs font-semibold text-gray-500 group-hover:text-gray-900 transition-colors">{brand.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHY CHOOSE US ============ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Why <span className="text-red-600">Choose Us</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Discover the benefits of using our platform
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Trusted Dealers',
                desc: 'All our dealers are verified and trusted by thousands of customers.'
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                ),
                title: 'Best Prices',
                desc: 'Compare prices from multiple dealers and get the best deals.'
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Fast Process',
                desc: 'Quick and easy car buying process with minimal paperwork.'
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'Secure Payment',
                desc: 'Safe and secure payment options with buyer protection.'
              },
            ].map((feature, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors duration-300">
                  <div className="group-hover:text-white transition-colors">{feature.icon}</div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS / WEBSITE INFO ============ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              How It <span className="text-red-600">Works</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Simple steps to get your dream car
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '1', title: 'Search', desc: 'Search and filter cars by brand, type, city, and price range.' },
              { num: '2', title: 'Choose', desc: 'Browse details and select the perfect car that matches your needs.' },
              { num: '3', title: 'Request', desc: 'Submit a purchase request with your contact information.' },
            ].map((step, i) => (
              <div key={i} className="relative text-center group">
                {/* Step Number */}
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors duration-300">
                  <span className="text-2xl font-black text-red-600 group-hover:text-white transition-colors">{step.num}</span>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>

                {/* Arrow */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 -right-3 z-10">
                    <svg className="w-6 h-6 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Customer <span className="text-red-600">Reviews</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              See what our customers say about their experience
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'John Smith',
                role: 'Business Owner',
                rating: 5,
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
                text: 'Excellent service! Found my dream car within days. The process was smooth and the team was very helpful.'
              },
              {
                name: 'Sarah Johnson',
                role: 'Marketing Manager',
                rating: 5,
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
                text: 'Best car buying experience ever. The selection is amazing and the prices are competitive. Highly recommend!'
              },
              {
                name: 'Michael Brown',
                role: 'Software Engineer',
                rating: 4,
                image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
                text: 'Great platform with verified dealers. Found a reliable car at a fair price. Will definitely use again.'
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-8 group">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <svg key={j} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-gray-600 text-sm leading-relaxed mb-6">"{testimonial.text}"</p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BLOG SECTION ============ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Latest <span className="text-red-600">Articles</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Stay updated with the latest automotive news and tips
            </p>
          </div>

          {/* Blog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Top 10 Luxury Cars of 2024',
                excerpt: 'Discover the most prestigious and high-performance luxury cars hitting the market this year.',
                image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600&h=400&fit=crop',
                date: 'Dec 15, 2024',
                category: 'Luxury'
              },
              {
                title: 'Electric Vehicles: The Future',
                excerpt: 'Why electric vehicles are revolutionizing the automotive industry and what it means for you.',
                image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&h=400&fit=crop',
                date: 'Dec 12, 2024',
                category: 'Electric'
              },
              {
                title: 'Car Buying Tips for Beginners',
                excerpt: 'Essential tips and tricks for first-time car buyers to make informed decisions.',
                image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=600&h=400&fit=crop',
                date: 'Dec 10, 2024',
                category: 'Tips'
              },
            ].map((article, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img src={article.image} alt={article.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">{article.category}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>{article.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">{article.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{article.excerpt}</p>
                  <Link to="/blog" className="inline-flex items-center gap-2 text-red-600 font-semibold text-sm hover:text-red-700 transition-colors">
                    Read More
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ LATEST CARS ============ */}
      <section className="py-24 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-14">
            <div className="relative">
              <span className="absolute -top-6 -left-2 text-6xl md:text-8xl font-black text-gray-200/50 select-none">02</span>
              <h2 className="relative text-3xl md:text-4xl font-black text-gray-900 font-heading">Latest <span className="text-red-600">Arrivals</span></h2>
              <p className="relative text-gray-500 mt-2 text-lg">Fresh stock just added to our inventory</p>
            </div>
            <Link to="/cars" className="mt-6 md:mt-0 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
              View All
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Cars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestCars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                badge="New"
                badgeColor="bg-green-600"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============ CALL TO ACTION ============ */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-gray-800 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1920&h=400&fit=crop" 
            alt="Luxury Car" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to Find Your <span className="text-red-500">Dream Car?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who found their perfect vehicle through our platform
          </p>
          <Link 
            to="/cars"
            className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-lg"
          >
            Explore Cars
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
