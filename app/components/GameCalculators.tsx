'use client'

import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FaPaw, FaGamepad, FaHorseHead, FaBuilding, FaBoxOpen } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { motion, useAnimationControls } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface Calculator {
  title: string;
  description: string;
  icon: IconType;
  active: boolean;
  route: string;
}

const calculators: Calculator[] = [
  {
    title: 'Pet Growth Event',
    description: 'Calculate egg openings',
    icon: FaPaw,
    active: true,
    route: '/pet-growth-event',
  },
  {
    title: 'Chest Growth Event',
    description: 'Coming soon',
    icon: FaBoxOpen,
    active: false,
    route: '#',
  },
  {
    title: 'Build Growth Event',
    description: 'Coming soon',
    icon: FaBuilding,
    active: false,
    route: '#',
  },
  {
    title: 'Mount Growth Event',
    description: 'Coming soon',
    icon: FaHorseHead,
    active: false,
    route: '#',
  },
];

// Custom hook to track if the card animations are complete
const useCardsAnimationComplete = (numCards: number) => {
  const [animationsComplete, setAnimationsComplete] = useState(0);

  const cardAnimationComplete = () => {
    setAnimationsComplete((prev) => prev + 1);
  };

  const allAnimationsComplete = animationsComplete === numCards;

  return { allAnimationsComplete, cardAnimationComplete };
};

const GameCalculators = () => {
  const router = useRouter();
  const footerControls = useAnimationControls(); // Controls for the footer
  const { ref: footerRef, inView: footerInView } = useInView(); // useInView for the footer

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.4,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }, // Add a duration for onAnimationComplete to work
  };

  const footerVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };
  const { allAnimationsComplete, cardAnimationComplete } = useCardsAnimationComplete(calculators.length);

  useEffect(() => {
    // Only start the footer animation if:
    // 1. The footer is in view.
    // 2. All card animations are complete.
    if (footerInView && allAnimationsComplete) {
      footerControls.start("show");
    }
  }, [footerInView, allAnimationsComplete, footerControls]);

  return (
    <div className="bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <CardHeader className="flex flex-col sm:flex-row items-center justify-center bg-blue-600 text-white rounded-t-xl py-4 text-center">
          <FaGamepad className='h-10 w-10 sm:mr-4 mb-2 sm:mb-0' />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold whitespace-nowrap">Capybara Go Event Calculators</h1>
        </CardHeader>

        {/* Calculator Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {calculators.map((calc) => (
            <motion.div
              key={calc.title}
              variants={cardVariants}
              onAnimationComplete={cardAnimationComplete} // Call the function when a card animation completes
            >
              <Card className="shadow-md">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <calc.icon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl text-slate-800">{calc.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm mb-4">{calc.description}</p>
                  <Button
                    className="w-full text-sm"
                    variant={calc.active ? "default" : "secondary"}
                    disabled={!calc.active}
                    onClick={() => calc.active && router.push(calc.route)}
                    aria-label={calc.active ? `Open ${calc.title} calculator` : `${calc.title} - Coming Soon`}
                  >
                    {calc.active ? 'Open Calculator' : 'Coming Soon'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
      {/* Creator Banner - Rounded Corners */}
      <motion.footer
        ref={footerRef} // Attach the ref for useInView
        className="mt-8 w-full max-w-4xl bg-blue-600 text-white py-2 text-center text-sm rounded-b-xl"
        variants={footerVariants}
        initial="hidden"
        animate={footerControls} // Use animation controls
      >
        <p>Any advice or suggestion? Find me on Discord: modifiedwheel</p>
      </motion.footer>
    </div>
  );
};

export default GameCalculators;