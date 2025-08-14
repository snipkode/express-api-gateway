import React, { useState } from 'react';
import { Gauge } from 'lucide-react';

interface RateLimitFormProps {
  serviceId: string;
  currentLimit?: number;
  onSubmit: (limit: number) => Promise<void>;
  onCancel: () => void;
}

export function RateLimitForm({ serviceId, currentLimit = 1000, onSubmit, onCancel }: RateLimitFormProps) {
  const [rateLimit, setRateLimit] = useState(currentLimit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(rateLimit);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rate Limit (requests per minute)
        </label>
        <input
          type="number"
          value={rateLimit}
          onChange={(e) => setRateLimit(parseInt(e.target.value))}
          min="1"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Gauge className="w-4 h-4" />
          <span>{isSubmitting ? 'Updating...' : 'Update Limit'}</span>
        </button>
      </div>
    </form>
  );
}
