import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const BlogDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Blog posts data
  const blogPosts = {
    1: {
      id: 1,
      title: 'Top 10 Tips for Buying a Used Car',
      date: 'May 20, 2024',
      category: 'Buying Guide',
      image: 'https://images.unsplash.com/photo-1469285994282-454ceb49e63c?w=1200&h=500&fit=crop',
      content: [
        'Buying a used car can be a smart way to save money, but it\'s important to know what to look for before making a purchase. Follow these 10 essential tips to ensure you get the best deal and a reliable vehicle.',
        'First, always set your budget before you start looking. This includes not just the purchase price, but also insurance, registration, and potential maintenance costs. Stick to your budget to avoid financial strain.',
        'Second, research the specific make and model you\'re interested in. Look up common issues, reliability ratings, and owner reviews. Knowledge is power when negotiating with sellers.',
        'Third, always get a vehicle history report. This will reveal any accidents, title issues, or odometer discrepancies. Services like Carfax or AutoCheck are worth the investment.',
        'Fourth, inspect the car thoroughly or hire a professional mechanic. Look for rust, check tire wear, test all electronics, and examine the undercarriage for damage.',
        'Fifth, take the car for a comprehensive test drive. Listen for unusual noises, check acceleration, test brakes, and drive on different road types including highways.',
        'Sixth, verify all maintenance records. A well-documented service history indicates a responsible previous owner and can predict future reliability.',
        'Seventh, check for recalls. Ensure any manufacturer recalls have been addressed before purchasing.',
        'Eighth, negotiate the price. Use your research and any issues found during inspection as leverage for a better deal.',
        'Ninth, understand the warranty options. Some used cars still have factory warranty, or you can purchase extended coverage.',
        'Tenth, get everything in writing. Make sure all agreements, promises, and terms are documented before signing.',
      ]
    },
    2: {
      id: 2,
      title: 'How to Maintain Your Car for Long Life',
      date: 'May 15, 2024',
      category: 'Maintenance',
      image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&h=500&fit=crop',
      content: [
        'Regular maintenance is the key to keeping your car running smoothly for years to come. With proper care, modern vehicles can easily surpass 200,000 miles.',
        'Oil changes are the most critical maintenance task. Follow your manufacturer\'s recommended intervals, typically every 5,000 to 7,500 miles with modern synthetic oils.',
        'Check your tire pressure monthly and rotate tires every 5,000 to 8,000 miles. Proper tire maintenance improves fuel economy and extends tire life.',
        'Replace air filters regularly. A clogged air filter reduces engine performance and fuel efficiency. Most filters should be changed every 15,000 to 30,000 miles.',
        'Keep up with brake maintenance. Have your brake pads inspected at each oil change and replace them when they reach minimum thickness.',
        'Maintain your battery. Clean terminals, ensure tight connections, and test the battery annually after three years of age.',
        'Follow the recommended service schedule in your owner\'s manual. This includes timing belt replacements, fluid changes, and other critical maintenance.',
        'Address warning lights immediately. Ignoring the check engine light can lead to costly repairs down the road.',
      ]
    },
    3: {
      id: 3,
      title: 'Best Luxury Cars to Buy in 2024',
      date: 'May 10, 2024',
      category: 'Car Reviews',
      image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1200&h=500&fit=crop',
      content: [
        'The luxury car segment in 2024 offers incredible options combining cutting-edge technology, superior comfort, and impressive performance. Here are our top picks for this year.',
        'The Mercedes-Benz S-Class continues to set the standard for luxury sedans. With its opulent interior, advanced driver assistance systems, and smooth ride, it remains the benchmark.',
        'BMW\'s 7 Series impresses with its bold styling and innovative technology features. The i7 electric variant offers silent luxury with zero emissions.',
        'The Audi A8 delivers understated elegance with a tech-forward interior and quattro all-wheel-drive confidence in all weather conditions.',
        'For SUV lovers, the Range Rover remains the ultimate choice, combining off-road capability with limousine-like comfort.',
        'The Porsche Panamera proves that performance and luxury can coexist, offering sports car handling with four-door practicality.',
        'Lexus continues to excel in reliability while offering competitive luxury features, making it a smart long-term investment.',
      ]
    },
    4: {
      id: 4,
      title: 'Best Fuel Efficient Cars in the Market',
      date: 'May 05, 2024',
      category: 'Car Reviews',
      image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&h=500&fit=crop',
      content: [
        'With rising fuel costs and environmental concerns, fuel efficiency has never been more important. Here are the best options for 2024.',
        'The Toyota Prius remains the hybrid champion, offering over 50 MPG in real-world driving with proven reliability spanning decades.',
        'Tesla\'s Model 3 leads the EV segment with over 350 miles of range and access to the extensive Supercharger network.',
        'The Hyundai Ioniq 6 achieves remarkable efficiency through aerodynamic design, offering up to 361 miles of electric range.',
        'For those preferring traditional engines, the Honda Civic achieves over 40 MPG highway with engaging driving dynamics.',
        'The Toyota Corolla Hybrid provides Prius-like efficiency in a more conventional sedan package at an affordable price point.',
        'For SUV buyers, the Toyota RAV4 Hybrid and Ford Escape Hybrid deliver over 40 MPG without sacrificing utility.',
      ]
    },
  };

  const post = blogPosts[id];

  // Similar posts (exclude current post)
  const similarPosts = Object.values(blogPosts)
    .filter(p => p.id !== parseInt(id))
    .slice(0, 3);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-500 mb-6">The article you are looking for does not exist.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image - Fixed Height */}
      <div className="w-full h-[400px] md:h-[450px] relative">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Main Content Container */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-20 relative z-10">
        {/* Article Card */}
        <article className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <Link to="/" className="hover:text-red-600 transition-colors">{t('navbar.home')}</Link>
            <span>/</span>
            <Link to="/" className="hover:text-red-600 transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-gray-900">{post.title}</span>
          </nav>

          {/* Category */}
          <span className="inline-block bg-red-50 text-red-600 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
            {post.category}
          </span>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {post.date}
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {Math.ceil(post.content.reduce((acc, p) => acc + p.length, 0) / 1000)} min read
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {post.content.map((paragraph, index) => (
              <p key={index} className="text-gray-600 leading-7 text-base">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Back Button */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Blog
            </Link>
          </div>
        </article>
      </div>

      {/* Similar Articles Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Similar Articles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {similarPosts.map((similarPost) => (
            <Link
              key={similarPost.id}
              to={`/blog/${similarPost.id}`}
              className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={similarPost.image}
                  alt={similarPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-400 mb-1">{similarPost.date}</p>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2">
                  {similarPost.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogDetails;
