/**
 * Celebration Animation
 *
 * Confetti and success animations for major milestones:
 * - Production branch creation
 * - Website finalization
 * - Domain connection
 *
 * Epic #146: Interactive Website Feedback & Refinement System
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Sparkles, Check } from 'lucide-react';

interface CelebrationAnimationProps {
  show: boolean;
  onComplete?: () => void;
  title?: string;
  message?: string;
  duration?: number; // milliseconds
}

export function CelebrationAnimation({
  show,
  onComplete,
  title = 'Success!',
  message = 'Your changes have been applied',
  duration = 3000,
}: CelebrationAnimationProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti particles
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100, // 0-100%
        delay: Math.random() * 0.5, // 0-500ms delay
      }));
      setConfetti(particles);

      // Auto-complete after duration
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm"
        >
          {/* Confetti */}
          {confetti.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ y: -20, x: `${particle.x}vw`, opacity: 1 }}
              animate={{
                y: '100vh',
                rotate: Math.random() * 720 - 360,
                opacity: 0,
              }}
              transition={{
                duration: 2 + Math.random(),
                delay: particle.delay,
                ease: 'easeIn',
              }}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][
                  Math.floor(Math.random() * 5)
                ],
              }}
            />
          ))}

          {/* Success Card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center"
          >
            {/* Animated Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mb-6"
            >
              <Rocket className="w-10 h-10 text-white" />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-gray-900 mb-3"
            >
              {title}
            </motion.h2>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-6"
            >
              {message}
            </motion.p>

            {/* Success Checkmarks */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              {[
                'Production branch created',
                'Website is ready to deploy',
                'Draft continues to be editable',
              ].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center justify-center gap-2 text-sm text-gray-700"
                >
                  <Check className="w-4 h-4 text-green-600" />
                  {item}
                </motion.div>
              ))}
            </motion.div>

            {/* Sparkle Effect */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute top-4 right-4 text-yellow-400"
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, -180, -360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
              className="absolute bottom-4 left-4 text-yellow-400"
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Simple confetti burst effect
 * Can be used standalone or with CelebrationAnimation
 */
export function ConfettiBurst({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 30, // Center spread
        y: 50,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => setParticles([]), 2000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[99]">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: `${particle.x}vw`,
            y: `${particle.y}vh`,
            scale: 1,
            opacity: 1,
          }}
          animate={{
            x: `${particle.x + (Math.random() - 0.5) * 50}vw`,
            y: '100vh',
            scale: 0,
            opacity: 0,
            rotate: Math.random() * 720,
          }}
          transition={{
            duration: 1.5 + Math.random(),
            ease: 'easeIn',
          }}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][
              Math.floor(Math.random() * 5)
            ],
          }}
        />
      ))}
    </div>
  );
}
