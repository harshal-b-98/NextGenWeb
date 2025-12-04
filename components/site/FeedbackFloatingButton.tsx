'use client';

/**
 * Floating Feedback Button for Public Sites
 * Phase 7: Knowledge-Grounded Website Generation
 *
 * Allows visitors and admins to submit feedback directly on the public site.
 * Feedback is stored and can be used to improve the website content.
 */

import { useState, useCallback } from 'react';
import { MessageSquare, X, Send, Star, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';

interface FeedbackFloatingButtonProps {
  websiteId: string;
  workspaceId: string;
  pagePath?: string;
}

type FeedbackType = 'general' | 'content' | 'design' | 'bug';
type Rating = 1 | 2 | 3 | 4 | 5;

interface FeedbackData {
  type: FeedbackType;
  rating?: Rating;
  sentiment?: 'positive' | 'negative' | 'neutral';
  message: string;
  pagePath: string;
  sectionId?: string;
}

export function FeedbackFloatingButton({
  websiteId,
  workspaceId,
  pagePath = '/',
}: FeedbackFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [rating, setRating] = useState<Rating | undefined>(undefined);
  const [sentiment, setSentiment] = useState<'positive' | 'negative' | 'neutral' | undefined>(undefined);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setFeedbackType('general');
    setRating(undefined);
    setSentiment(undefined);
    setMessage('');
    setError(null);
    setIsSubmitted(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Reset form after animation
    setTimeout(resetForm, 300);
  }, [resetForm]);

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Please enter your feedback');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const feedbackData: FeedbackData = {
      type: feedbackType,
      rating,
      sentiment,
      message: message.trim(),
      pagePath,
    };

    try {
      const response = await fetch(`/api/sites/${websiteId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...feedbackData,
          workspaceId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setIsSubmitted(true);

      // Auto-close after showing success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedbackTypes: { value: FeedbackType; label: string }[] = [
    { value: 'general', label: 'General' },
    { value: 'content', label: 'Content' },
    { value: 'design', label: 'Design' },
    { value: 'bug', label: 'Bug Report' },
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
        aria-label="Give Feedback"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {/* Feedback Panel */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-96 bg-white rounded-xl shadow-2xl transition-all duration-300 overflow-hidden ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <span className="font-medium">Share Your Feedback</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-blue-500 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isSubmitted ? (
            // Success State
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ThumbsUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Thank You!
              </h3>
              <p className="text-gray-600">
                Your feedback has been submitted successfully.
              </p>
            </div>
          ) : (
            // Form
            <div className="space-y-4">
              {/* Feedback Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback Type
                </label>
                <div className="flex gap-2 flex-wrap">
                  {feedbackTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFeedbackType(type.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        feedbackType === type.value
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                          : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Sentiment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How do you feel about this page?
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSentiment(sentiment === 'positive' ? undefined : 'positive')}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                      sentiment === 'positive'
                        ? 'bg-green-100 text-green-700 border-2 border-green-500'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    <ThumbsUp className="h-5 w-5" />
                    <span className="text-sm font-medium">Good</span>
                  </button>
                  <button
                    onClick={() => setSentiment(sentiment === 'neutral' ? undefined : 'neutral')}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                      sentiment === 'neutral'
                        ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-lg">😐</span>
                    <span className="text-sm font-medium">Okay</span>
                  </button>
                  <button
                    onClick={() => setSentiment(sentiment === 'negative' ? undefined : 'negative')}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                      sentiment === 'negative'
                        ? 'bg-red-100 text-red-700 border-2 border-red-500'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    <ThumbsDown className="h-5 w-5" />
                    <span className="text-sm font-medium">Poor</span>
                  </button>
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate your experience (optional)
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(rating === star ? undefined : (star as Rating))}
                      className="p-1 transition-colors"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          rating && star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Feedback
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you think... What's working? What could be better?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !message.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={handleClose}
        />
      )}
    </>
  );
}
