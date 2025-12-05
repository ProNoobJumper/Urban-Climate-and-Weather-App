import React from 'react';
import { Cloud, TrendingUp, MapPin, Users, ArrowRight, Sparkles, Database, Zap, Shield, BarChart3, Globe, CheckCircle } from 'lucide-react';

const LandingPage = ({ onLoginClick, onRegisterClick }) => {
  return (
    <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Hero Section */}
      <section className="relative px-4 md:px-8 py-20 md:py-32">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Cloud className="w-16 h-16 text-purple-400 animate-pulse" />
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Urban Climate
            </h1>
          </div>
          <p className="text-xl md:text-3xl text-slate-300 mb-4 font-semibold">
            Real-time Weather Intelligence for India
          </p>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-8">
            Access comprehensive weather data, AI-powered insights, and historical trends
            from multiple trusted sources. Premium multi-source data collection for 8 major cities,
            with real-time weather available for all Indian cities and towns.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={onRegisterClick}
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300 flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onLoginClick}
              className="px-8 py-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700 hover:border-purple-500 text-slate-100 rounded-xl font-semibold transition-all duration-300"
            >
              Sign In
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Free Forever</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Real-time Updates</span>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="px-4 md:px-8 py-16 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
              Why Urban Climate?
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              The most comprehensive weather intelligence platform for India, combining data from 8+ trusted sources
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Premium Cities */}
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-8">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-100 mb-3">
                8 Premium Cities
              </h3>
              <p className="text-slate-400 mb-4">
                Multi-source data aggregation for Mumbai, Delhi, Bangalore, Hyderabad, Kolkata, Chennai, Pune, and Ahmedabad
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  8+ data sources (IMD, Open-Meteo, Weather Union, etc.)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  Historical records & trends
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  AI-powered insights
                </li>
              </ul>
            </div>

            {/* All Cities */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-100 mb-3">
                All Indian Cities & Towns
              </h3>
              <p className="text-slate-400 mb-4">
                Real-time weather data available for every location across India
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                  Search any city or town
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                  Click anywhere on the map
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                  Current conditions & forecasts
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 md:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-slate-400">
              Everything you need for comprehensive weather intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                Multi-Source Data
              </h3>
              <p className="text-slate-400 text-sm">
                Aggregated data from 8+ sources including IMD, Open-Meteo, Weather Union, and local weather stations for maximum accuracy
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                AI-Powered Insights
              </h3>
              <p className="text-slate-400 text-sm">
                Get intelligent weather analysis and predictions powered by Google Gemini AI with contextual recommendations
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-amber-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                Historical Trends
              </h3>
              <p className="text-slate-400 text-sm">
                Access historical weather patterns, compare with typical conditions, and view long-term climate trends
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-green-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                Interactive Map
              </h3>
              <p className="text-slate-400 text-sm">
                Click anywhere on India to get instant weather data. Visual markers show temperature and air quality at a glance
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-pink-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                Real-time Updates
              </h3>
              <p className="text-slate-400 text-sm">
                Data refreshed every 30 minutes from all sources. Get the latest weather conditions and air quality readings
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                Weather Alerts
              </h3>
              <p className="text-slate-400 text-sm">
                Receive alerts for extreme temperatures, poor air quality, and severe weather conditions in your saved cities
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 md:px-8 py-16 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-slate-800/20 backdrop-blur-xl border border-slate-700/30 rounded-2xl p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-purple-400 mb-2">8+</div>
                <div className="text-sm text-slate-400">Data Sources</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-400 mb-2">8</div>
                <div className="text-sm text-slate-400">Premium Cities</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-amber-400 mb-2">24/7</div>
                <div className="text-sm text-slate-400">Real-time Updates</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-400 mb-2">∞</div>
                <div className="text-sm text-slate-400">All Indian Cities</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 md:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-100 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-slate-400 mb-8">
            Join thousands of users accessing real-time weather intelligence across India
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onRegisterClick}
              className="group px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-lg rounded-xl font-semibold shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Create Free Account
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 md:px-8 py-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center text-slate-500 text-sm">
          <p>© 2024 Urban Climate. Powered by multiple weather data sources.</p>
          <p className="mt-2">Premium data collection for 8 major cities • Real-time weather for all Indian locations</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
