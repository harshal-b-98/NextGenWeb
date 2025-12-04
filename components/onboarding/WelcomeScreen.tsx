/**
 * Welcome Screen for First-Time Users
 *
 * Clear, friendly introduction explaining what NextGenWeb does
 * and guiding users to create their first website.
 *
 * Epic: NextGenWeb Complete Product Reimplementation
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, MessageSquare, Wand2, Rocket, ArrowRight, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function WelcomeScreen() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(!!data.user);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleCreateWebsite = () => {
    if (isAuthenticated) {
      router.push('/create?step=setup');
    } else {
      router.push('/signin');
    }
  };
  const steps = [
    {
      number: 1,
      icon: Upload,
      title: 'Upload Your Documents',
      description: 'Drop in your business docs, brochures, or content',
      color: 'from-blue-500 to-blue-600',
    },
    {
      number: 2,
      icon: MessageSquare,
      title: 'Chat with AI',
      description: 'Answer a few questions about your vision',
      color: 'from-purple-500 to-purple-600',
    },
    {
      number: 3,
      icon: Wand2,
      title: 'Watch it Generate',
      description: 'See your website come to life in real-time',
      color: 'from-pink-500 to-pink-600',
    },
    {
      number: 4,
      icon: Rocket,
      title: 'Refine & Publish',
      description: 'Polish with AI feedback and go live instantly',
      color: 'from-green-500 to-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full"
      >
        {/* Main Heading */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-lg"
          >
            <Wand2 className="h-10 w-10 text-white" />
          </motion.div>

          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to NextGenWeb! 👋
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your business documents into intelligent, adaptive websites
            that understand your content and engage your visitors.
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold shadow-md`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {step.number}. {step.title}
                  </h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center space-y-4"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-10 py-6 shadow-lg hover:shadow-xl transition-all"
            onClick={handleCreateWebsite}
            disabled={isCheckingAuth}
          >
            <Rocket className="mr-2 h-6 w-6" />
            {isCheckingAuth ? 'Loading...' : 'Create Your First Website'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <button className="hover:text-gray-700 transition-colors flex items-center gap-1">
              <PlayCircle className="h-4 w-4" />
              Watch Demo
            </button>
            <span>·</span>
            <button className="hover:text-gray-700 transition-colors">
              Learn More
            </button>
          </div>
        </motion.div>

        {/* Value Props */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-12 grid grid-cols-3 gap-6 text-center"
        >
          <div>
            <p className="text-3xl font-bold text-blue-600 mb-1">15 min</p>
            <p className="text-sm text-gray-600">From upload to live site</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-purple-600 mb-1">AI-Powered</p>
            <p className="text-sm text-gray-600">Intelligent content extraction</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-pink-600 mb-1">Adaptive</p>
            <p className="text-sm text-gray-600">Changes for each visitor</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
