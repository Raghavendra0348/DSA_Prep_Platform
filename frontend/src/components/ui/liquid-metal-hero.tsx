"use client";

import { LiquidMetal, liquidMetalPresets } from '@paper-design/shaders-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { motion, useReducedMotion } from 'framer-motion';

interface LiquidMetalHeroProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  onPrimaryCtaClick?: () => void;
  onSecondaryCtaClick?: () => void;
  features?: string[];
  visualOnly?: boolean;
}

export default function LiquidMetalHero({
  badge,
  title,
  subtitle,
  primaryCtaLabel,
  secondaryCtaLabel,
  onPrimaryCtaClick,
  onSecondaryCtaClick,
  features = [],
  visualOnly = false,
}: LiquidMetalHeroProps) {
  const reducedMotion = useReducedMotion();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 30 },
    visible: {
      opacity: 1,
      y: 0
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: reducedMotion ? 1 : 0.9 },
    visible: {
      opacity: 1,
      scale: 1
    }
  };

  if (visualOnly) {
    return (
      <div className="liquid-metal-hero liquid-metal-visual" aria-hidden="true">
        <LiquidMetal
          {...liquidMetalPresets[2].params}
          speed={reducedMotion ? 0 : 0.35}
          maxPixelCount={1200000}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
      </div>
    );
  }

  return (
    <section className="liquid-metal-hero relative flex items-center justify-center overflow-hidden">
      <LiquidMetal
        {...liquidMetalPresets[2].params}
        speed={reducedMotion ? 0 : 0.35}
        maxPixelCount={1200000}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />

      <div className="liquid-metal-shade" aria-hidden="true" />
      <div className="relative mx-auto px-6 lg:px-8 max-w-7xl">
        <motion.div
          className="text-center space-y-8"
          variants={containerVariants}
          initial={reducedMotion ? false : "hidden"}
          animate="visible"
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {badge && (
            <motion.div
              className="flex justify-center"
              variants={itemVariants}
            >
              <Badge
                variant="secondary"
                className="bg-foreground/10 text-foreground border-foreground/20 hover:bg-foreground/20 transition-colors duration-300 backdrop-blur-sm"
              >
                {badge}
              </Badge>
            </motion.div>
          )}

          <motion.div
            className="space-y-6"
            variants={itemVariants}
          >
            <motion.h1
              role="heading"
              aria-level={1}
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground leading-tight tracking-tight"
              variants={itemVariants}
            >
              {title}
            </motion.h1>

            <motion.p
              className="max-w-3xl mx-auto text-xl sm:text-2xl text-foreground/90 leading-relaxed"
              variants={itemVariants}
            >
              {subtitle}
            </motion.p>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={buttonVariants}
          >
            <motion.div
              whileHover={reducedMotion ? undefined : { scale: 1.05 }}
              whileTap={reducedMotion ? undefined : { scale: 0.95 }}
            >
              <Button
                onClick={onPrimaryCtaClick}
                size="lg"
                className="bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 shadow-2xl text-lg px-8 py-6 font-semibold"
              >
                {primaryCtaLabel}
              </Button>
            </motion.div>

            {secondaryCtaLabel && onSecondaryCtaClick && (
              <motion.div
                whileHover={reducedMotion ? undefined : { scale: 1.05 }}
                whileTap={reducedMotion ? undefined : { scale: 0.95 }}
              >
                <Button
                  onClick={onSecondaryCtaClick}
                  variant="outline"
                  size="lg"
                  className="border-foreground/30 text-foreground hover:bg-foreground/10 hover:border-foreground/50 transition-all duration-300 backdrop-blur-sm text-lg px-8 py-6 font-semibold"
                >
                  {secondaryCtaLabel}
                </Button>
              </motion.div>
            )}
          </motion.div>

          {features.length > 0 && (
            <motion.div
              className="pt-12"
              variants={itemVariants}
            >
              <motion.div
                whileHover={reducedMotion ? undefined : { y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-foreground/10 border-foreground/20 backdrop-blur-md shadow-2xl">
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {features.map((feature, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center justify-center text-center"
                          initial={reducedMotion ? false : { opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.6,
                            delay: 0.8 + (index * 0.1)
                          }}
                        >
                          <p className="text-foreground/90 font-medium text-lg">
                            {feature}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
