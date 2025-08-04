import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Clock, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const BecomeAPro: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleProviderAction = () => {
    if (!user) {
      navigate('/register');
    } else if (user.roles?.includes('provider')) {
      // User is already a provider, navigate to dashboard
      navigate('/provider-dashboard');
    } else {
      // User is a seeker, navigate to application form
      navigate('/provider-application');
    }
  };

  const benefits = [
    {
      icon: TrendingUp,
      title: 'زيادة الدخل',
      description: 'احصل على عملاء جدد وزد دخلك الشهري'
    },
    {
      icon: Users,
      title: 'عملاء موثوقين',
      description: 'عملاء محليين يبحثون عن خدماتك'
    },
    {
      icon: Clock,
      title: 'مرونة في العمل',
      description: 'اختر أوقاتك وأماكن عملك'
    },
    {
      icon: Shield,
      title: 'حماية كاملة',
      description: 'تأمين على العمل وضمان الجودة'
    }
  ];

  return (
    <section className="bg-deep-teal text-white font-arabic text-text-primary" id="become-a-pro">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in">
            عايز تكسب من مهاراتك؟
          </h2>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto animate-fade-in-delayed">
            انضم إلى نافع للتواصل مع عملاء جدد في منطقتك وتنمية أعمالك.
          </p>
          <button
            onClick={handleProviderAction}
            className="btn btn-primary bg-bright-orange border-bright-orange hover:bg-bright-orange/90 hover:border-bright-orange/90 text-white text-lg font-bold h-14 px-8 mx-auto mb-8 transform hover:scale-105 active:scale-95 transition-all duration-300 animate-fade-in-delayed"
          >
            انضم لينا كمحترف
          </button>
        </div>

        {/* Platform Statistics with Counter Animation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {[
            { value: '5K+', label: 'محترف نشط' },
            { value: '50K+', label: 'خدمة مكتملة' },
            { value: '4.8', label: 'متوسط التقييم' },
            { value: '95%', label: 'رضا العملاء' }
          ].map((stat, index) => (
            <div 
              key={index}
              className="text-center bg-white/10 rounded-xl p-6 transform hover:scale-105 transition-all duration-300"
              style={{
                animationDelay: `${index * 200}ms`,
                animation: 'fade-in-up 0.6s ease-out backwards'
              }}
            >
              <div className="text-3xl md:text-4xl font-bold mb-2 animate-count">
                {stat.value}
              </div>
              <div className="text-white/80">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div 
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1"
                style={{
                  animationDelay: `${index * 200 + 400}ms`,
                  animation: 'fade-in-up 0.6s ease-out backwards'
                }}
              >
                <div className="flex items-center justify-center w-12 h-12 bg-bright-orange/20 rounded-full mb-4 mx-auto">
                  <Icon className="w-6 h-6 text-bright-orange" />
                </div>
                <h3 className="text-lg font-bold text-center mb-2">{benefit.title}</h3>
                <p className="text-white/70 text-center text-sm">{benefit.description}</p>
              </div>
            );
          })}
        </div>

        {/* Add animations */}
        <style>{`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fade-in-delayed {
            0% { opacity: 0; }
            50% { opacity: 0; }
            100% { opacity: 1; }
          }
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fade-in 1s ease-out;
          }
          .animate-fade-in-delayed {
            animation: fade-in-delayed 1.5s ease-out;
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out;
          }
          .animate-count {
            animation: count-up 2s ease-out;
          }
          @keyframes count-up {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </section>
  );
};

export default BecomeAPro; 