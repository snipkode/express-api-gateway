import React from 'react';
import { 
  Building2, 
  Shield, 
  Zap, 
  Globe, 
  Users, 
  BarChart3, 
  ArrowRight, 
  CheckCircle,
  Star,
  Play
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const features = [
  {
    icon: Building2,
    title: 'Multi-Tenant Architecture',
    description: 'Isolate and manage multiple tenants with complete data separation and customizable configurations.'
  },
  {
    icon: Shield,
    title: 'Advanced Security',
    description: 'Role-based access control, JWT authentication, and comprehensive security policies for enterprise-grade protection.'
  },
  {
    icon: Zap,
    title: 'High Performance',
    description: 'Optimized API gateway with intelligent routing, caching, and rate limiting for maximum throughput.'
  },
  {
    icon: Globe,
    title: 'Dynamic Proxy',
    description: 'Seamless service discovery and dynamic routing with real-time configuration updates.'
  },
  {
    icon: Users,
    title: 'User Management',
    description: 'Comprehensive user administration with granular permissions and tenant-specific role assignments.'
  },
  {
    icon: BarChart3,
    title: 'Analytics & Monitoring',
    description: 'Real-time metrics, performance monitoring, and detailed analytics for all your services.'
  }
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'CTO, TechCorp',
    content: 'This gateway manager transformed how we handle our multi-tenant architecture. Setup was incredibly smooth.',
    rating: 5
  },
  {
    name: 'Michael Rodriguez',
    role: 'DevOps Lead, StartupXYZ',
    content: 'The best solution we\'ve found for managing complex service architectures. Highly recommended!',
    rating: 5
  },
  {
    name: 'Emily Johnson',
    role: 'Platform Engineer, Enterprise Inc',
    content: 'Excellent performance and reliability. The admin interface is intuitive and feature-rich.',
    rating: 5
  }
];

const stats = [
  { value: '99.9%', label: 'Uptime' },
  { value: '10M+', label: 'API Calls/Day' },
  { value: '500+', label: 'Active Tenants' },
  { value: '<50ms', label: 'Avg Response Time' }
];

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Building2 className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Multi-Tenant
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Gateway</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              The ultimate solution for managing complex multi-tenant architectures. 
              Streamline your services, secure your APIs, and scale with confidence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={onGetStarted}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <span className="text-lg font-semibold">Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button className="flex items-center space-x-2 text-gray-700 px-8 py-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 hover:bg-gray-50">
                <Play className="w-5 h-5" />
                <span className="text-lg font-semibold">Watch Demo</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage your services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for modern architectures with enterprise-grade features and developer-friendly tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-200 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why choose our Multi-Tenant Gateway?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Designed for scalability, security, and simplicity. Our platform grows with your business.
              </p>
              
              <div className="space-y-4">
                {[
                  'Complete tenant isolation and data security',
                  'Real-time monitoring and analytics',
                  'Automatic scaling and load balancing',
                  'Developer-friendly API documentation',
                  'Enterprise-grade support and SLA'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-blue-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-16 bg-green-100 rounded"></div>
                    <div className="h-16 bg-purple-100 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by industry leaders
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers are saying about their experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to transform your architecture?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of developers who trust our Multi-Tenant Gateway for their critical infrastructure.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200 shadow-lg"
            >
              Start Free Trial
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Multi-Tenant Gateway</span>
              </div>
              <p className="text-gray-400 mb-4">
                The ultimate solution for managing complex multi-tenant architectures with enterprise-grade security and performance.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Multi-Tenant Gateway. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}