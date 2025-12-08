import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Utensils } from 'lucide-react';

interface TreatModalProps {
  isEnabled: boolean;
}

const TreatModal: React.FC<TreatModalProps> = ({ isEnabled }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isEnabled) {
      // If enabled and currently hidden, start timer to show it
      if (!isVisible) {
        timer = setTimeout(() => {
          setIsVisible(true);
        }, 5000); // Appear every 5 seconds after closing
      }
    } else {
      setIsVisible(false);
    }

    return () => clearTimeout(timer);
  }, [isEnabled, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    // The useEffect will trigger again because isVisible changed to false,
    // restarting the 5s timer.
  };

  return (
    <AnimatePresence>
      {isVisible && isEnabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm w-full relative border border-gray-100"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-black transition-colors backdrop-blur-md shadow-sm"
            >
              <X size={18} />
            </button>

            {/* Image Section */}
            <div className="relative h-64 w-full bg-gray-100">
              <img
                src="https://i.ibb.co/fGSfy2RF/Kacchi-Biryani-Mutton-large.webp"
                alt="Treat"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-6 text-white">
                <div className="flex items-center gap-2 mb-1">
                    <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                        Pending
                    </span>
                </div>
                <h3 className="text-xl font-bold">Kacchi Biryani</h3>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Treat Pending!</h2>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Need treat ASAP! Don't keep the hunger waiting.
              </p>
              
              <button 
                onClick={handleClose}
                className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200/50"
              >
                Okay, I'll Treat You!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TreatModal;