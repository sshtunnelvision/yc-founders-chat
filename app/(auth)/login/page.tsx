"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { SocialLoginButtons } from "@/components/social-login-buttons";

// Import ReactConfetti dynamically to avoid SSR issues
const ReactConfetti = dynamic(() => import("react-confetti"), {
  ssr: false,
});

export default function Page() {
  const [showConfetti, setShowConfetti] = useState(true);
  const [showMessage, setShowMessage] = useState(true);
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    // Set window size
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Hide confetti after 5 seconds
    const confettiTimer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    // Hide message after 4 seconds
    const messageTimer = setTimeout(() => {
      setShowMessage(false);
    }, 4000);

    return () => {
      clearTimeout(confettiTimer);
      clearTimeout(messageTimer);
    };
  }, []);

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center">
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h1 className="text-2xl font-light">YC Founder&apos;s Chat</h1>
          <p className="text-sm text-muted-foreground">
            Explore and learn about Y Combinator founders and their companies
            through an intelligent chat interface. Our database contains 7,374
            YC funded founders with enriched LinkedIn data including education,
            skills, and work experience.
          </p>
        </div>
        <div className="flex flex-col gap-4 px-4 sm:px-16">
          <SocialLoginButtons />
          <AnimatePresence>
            {showMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg text-center mt-4"
              >
                <p className="text-lg font-medium">
                  Happy 20 Year Anniversary YC! 🎉
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
