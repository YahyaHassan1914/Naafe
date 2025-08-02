import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleProviderAction = () => {
    if (!user) {
      navigate('/register');
    } else {
      window.dispatchEvent(new CustomEvent('openUpgradeModal'));
    }
  };

  const handleSeekerAction = () => {
    if (!user) {
      navigate('/register');
    } else {
      navigate('/request-service');
    }
  };

  return (
    <section className="relative text-white text-center py-12 md:py-20 px-4 font-arabic overflow-hidden">
      {/* Optimized background with better gradients */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `
            linear-gradient(135deg, 
              rgba(0,128,128,0.4) 0%, 
              rgba(0,64,64,0.8) 50%,
              rgba(0,40,40,0.95) 100%
            ), 
            url('/images/hero-section.png')
          `,
          transform: 'scale(1.05)',
          willChange: 'transform'
        }}
        aria-hidden="true"
      />
      
      {/* Mobile performance overlay */}
      <div 
        className="absolute inset-0 md:hidden bg-gradient-to-b from-black/10 to-black/30" 
        aria-hidden="true"
      />
      
      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Brand with improved typography */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black leading-none tracking-tight text-orange-300 drop-shadow-2xl animate-fade-in">
            نافع
          </h1>
        </div>

        {/* Enhanced value proposition */}
        <div className="mb-10">
          <h2 className="text-xl sm:text-3xl md:text-5xl font-bold leading-tight mb-6 text-white drop-shadow-xl animate-fade-in-delay">
            منصة الخدمات الأسرع والأكثر أماناً في مصر
          </h2>
        </div>

        {/* Refined description */}
        <div className="mb-12">
          <p className="text-base sm:text-lg md:text-xl text-gray-100 max-w-4xl mx-auto leading-relaxed drop-shadow-lg animate-fade-in-slow">
            نافع بتساعدك تلاقي محترفين بطريقة سريعة وموثوقة. متشيلش هم مشاكل الخدمات، ولو انت محترف متخافش من ضياع تعبك! 
            <span className="text-orange-200 font-semibold"> نافع بتضمن للجميع تجربة سلسة ومميزة!</span>
          </p>
        </div>
        
        {/* Improved CTA cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto animate-fade-in-cards">
          {/* Service Seeker Card */}
          <div className="group relative overflow-hidden bg-white/5 backdrop-blur-md rounded-3xl p-10 border border-white/10 hover:border-white/20 transition-all duration-500 hover:bg-white/10 hover:-translate-y-2 hover:shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-white/20 to-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <Search className="w-8 h-8 text-white drop-shadow" />
              </div>
              
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                بتدور على محترف؟
              </h3>
              <p className="text-gray-200/90 mb-8 text-sm md:text-base leading-relaxed px-2">
                انشر طلبك دلوقتي وهنساعدك تلاقي محترفين موثوقين في دقايق
              </p>
              
              <button
                className="w-full bg-white text-teal-800 rounded-2xl py-4 px-8 font-bold text-base md:text-lg shadow-xl hover:shadow-2xl hover:bg-gray-50 active:scale-[0.98] transition-all duration-300"
                onClick={handleSeekerAction}
                aria-label="انشر طلبك في ثواني"
              >
                انشر طلبك في ثواني
              </button>
            </div>
          </div>
          
          {/* Provider Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500/15 to-red-600/15 backdrop-blur-md rounded-3xl p-10 border border-orange-400/20 hover:border-orange-400/40 transition-all duration-500 hover:from-orange-500/25 hover:to-red-600/25 hover:-translate-y-2 hover:shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400/30 to-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <UserPlus className="w-8 h-8 text-white drop-shadow" />
              </div>
              
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                عايز تكسب من مهاراتك؟
              </h3>
              <p className="text-gray-200/90 mb-8 text-sm md:text-base leading-relaxed px-2">
                انضم لينا كمحترف وابدأ تجربة آمنة ومضمونة من غير ضياع حقوقك
              </p>
              
              <button
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl py-4 px-8 font-bold text-base md:text-lg shadow-xl hover:shadow-2xl hover:from-orange-600 hover:to-red-700 active:scale-[0.98] transition-all duration-300"
                onClick={handleProviderAction}
                aria-label="انضم لينا كمحترف"
              >
                انضم لينا كمحترف
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Optimized animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in { 
          animation: fade-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s both; 
        }
        .animate-fade-in-delay { 
          animation: fade-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.5s both; 
        }
        .animate-fade-in-slow { 
          animation: fade-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.8s both; 
        }
        .animate-fade-in-cards { 
          animation: fade-in 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 1.1s both; 
        }
      `}</style>
    </section>
  );
};

export default Hero;