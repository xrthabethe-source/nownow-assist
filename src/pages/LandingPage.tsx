import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { TyreIcon, BatteryIcon, FuelIcon, PumpIcon, WrenchIcon } from "@/components/icons/ServiceIcons";
import { 
  ArrowRight, 
  Shield, 
  Clock, 
  Star, 
  MapPin, 
  CheckCircle2, 
  Zap, 
  Users, 
  Phone,
  AlertTriangle,
  Heart,
  BadgeCheck,
  Timer,
  Wallet,
  Quote,
  ChevronRight,
  Play
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

const painPoints = [
  "Stranded on a dark highway at midnight?",
  "Flat tyre with no spare or tools?",
  "Dead battery in an unsafe area?",
  "Ran out of fuel kilometers from a station?",
];

const solutions = [
  {
    icon: Timer,
    title: "15-Minute Response",
    description: "Our network of 500+ responders ensures help is always nearby. No more waiting hours.",
    highlight: "Guaranteed",
  },
  {
    icon: BadgeCheck,
    title: "Verified Professionals",
    description: "Every responder is background-checked, trained, and rated by real customers.",
    highlight: "100% Vetted",
  },
  {
    icon: MapPin,
    title: "Real-Time Tracking",
    description: "Watch your responder approach in real-time. Know exactly when help arrives.",
    highlight: "Live GPS",
  },
  {
    icon: Wallet,
    title: "Transparent Pricing",
    description: "See the price before you book. No hidden fees, no surprises. Pay only for what you need.",
    highlight: "No Surprises",
  },
];

const services = [
  { 
    icon: TyreIcon, 
    name: "Tyre Change", 
    description: "Flat or punctured tyre? We'll swap it with your spare in minutes.",
    popular: true,
  },
  { 
    icon: BatteryIcon, 
    name: "Jump Start", 
    description: "Dead battery? We'll get you running again, fast.",
    popular: true,
  },
  { 
    icon: FuelIcon, 
    name: "Fuel Delivery", 
    description: "Ran out of fuel? We'll bring petrol or diesel to you.",
    popular: false,
  },
  { 
    icon: PumpIcon, 
    name: "Tyre Inflate", 
    description: "Low tyre pressure? We'll pump it up to the perfect PSI.",
    popular: false,
  },
  { 
    icon: WrenchIcon, 
    name: "Minor Repairs", 
    description: "Small fixes that get you back on the road.",
    popular: false,
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    location: "Johannesburg",
    rating: 5,
    text: "Flat tyre at 11pm on the N1. Help arrived in 12 minutes. Absolute lifesaver!",
    avatar: "SM",
  },
  {
    name: "David K.",
    location: "Cape Town",
    rating: 5,
    text: "Battery died in a mall parking lot. Within 15 mins, I was on my way. Incredible service.",
    avatar: "DK",
  },
  {
    name: "Thandi N.",
    location: "Durban",
    rating: 5,
    text: "As a woman traveling alone, the live tracking feature made me feel so safe. Highly recommend!",
    avatar: "TN",
  },
];

const stats = [
  { value: "50,000+", label: "Drivers Helped", icon: Users },
  { value: "12 min", label: "Avg. Response", icon: Timer },
  { value: "4.9★", label: "Customer Rating", icon: Star },
  { value: "500+", label: "Active Responders", icon: BadgeCheck },
];

const howItWorks = [
  {
    step: "1",
    title: "Request Help",
    description: "Open the app, select your service, and share your location. Takes 30 seconds.",
  },
  {
    step: "2",
    title: "Get Matched",
    description: "We instantly connect you with the nearest available verified responder.",
  },
  {
    step: "3",
    title: "Track & Relax",
    description: "Watch your responder approach in real-time. They'll handle everything.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const LandingPage = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Sticky Header - Deep Trust Blue */}
      <header className="sticky top-0 z-50 bg-primary/95 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-16 md:h-[72px]">
          <Logo size="lg" />
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" onClick={(e) => { e.preventDefault(); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-medium text-white/70 hover:text-white transition-colors cursor-pointer">Services</a>
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-medium text-white/70 hover:text-white transition-colors cursor-pointer">How It Works</a>
            <a href="#testimonials" onClick={(e) => { e.preventDefault(); document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-medium text-white/70 hover:text-white transition-colors cursor-pointer">Reviews</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="font-medium text-white" onClick={() => navigate("/auth")}>
              Log in
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex font-medium" onClick={() => navigate("/auth")}>
              Drive with us
            </Button>
            <Button variant="amber" size="sm" className="font-medium" onClick={() => navigate("/auth")}>
              Get help
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Deep Trust Blue Background */}
      <section ref={heroRef} className="relative overflow-hidden">
        <motion.div style={{ opacity: heroOpacity, scale: heroScale }}>
          {/* Background Effects - Subtle on dark */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl opacity-40" />
          
          <div className="container relative py-16 md:py-24 lg:py-32">
            <div className="mx-auto max-w-4xl text-center">

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
              >
                Stuck on the road?
                <br />
                <span className="text-accent">We'll be there, now-now.</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mx-auto mb-8 max-w-2xl text-lg text-white/70 md:text-xl"
              >
                From flat tyres to dead batteries – request roadside help the same way you request a ride. Our <strong className="text-white">500+ verified responders</strong> across South Africa will be there in minutes!
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Button
                  variant="amber"
                  size="xl"
                  onClick={() => navigate("/auth")}
                  className="w-full sm:w-auto px-8 md:px-12 shadow-amber animate-pulse-amber"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Sign Up for Free
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="w-full sm:w-auto"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Get Help Now
                </Button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/70"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>No signup fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Pay only when you use</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Cancel anytime</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Social Proof Stats - Orange Accent Panel */}
      <section className="border-y border-accent/30 bg-accent py-8 md:py-12">
        <div className="container">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={item} className="text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-2xl font-extrabold text-white md:text-3xl">{stat.value}</p>
                <p className="text-sm text-white/80">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-1.5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Sound familiar?</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
              Roadside emergencies are stressful.
              <br />
              <span className="text-muted-foreground">We make them easy.</span>
            </h2>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mx-auto max-w-3xl space-y-4"
          >
            {painPoints.map((point, index) => (
              <motion.div
                key={index}
                variants={item}
                className="flex items-center gap-4 rounded-2xl border border-green-700/30 bg-green-800 p-4 md:p-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <p className="text-lg font-medium text-white md:text-xl">{point}</p>
                <ChevronRight className="ml-auto h-5 w-5 text-white/60" />
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-6 py-3">
              <Heart className="h-5 w-5 text-success" />
              <span className="text-lg font-semibold text-success">Now-Now Assist has your back.</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solution Grid */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Why 50,000+ drivers trust us
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">
              We've reimagined roadside assistance for the modern world. Fast, transparent, and always reliable.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-2"
          >
            {solutions.map((solution) => (
              <motion.div key={solution.title} variants={item}>
                <div className="h-full overflow-hidden rounded-2xl border border-green-700/30 bg-green-800 p-6 md:p-8 transition-all hover:bg-green-700 group">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-600 transition-colors group-hover:bg-green-500">
                      <solution.icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">{solution.title}</h3>
                        <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs font-semibold text-white">
                          {solution.highlight}
                        </span>
                      </div>
                      <p className="text-white/80">{solution.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Services we offer
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">
              From flat tyres to empty tanks, we've got every roadside emergency covered.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          >
            {services.map((service) => (
              <motion.div key={service.name} variants={item}>
                <div 
                  className={`h-full relative cursor-pointer rounded-2xl border transition-all hover:scale-105 ${service.popular ? 'border-green-500 ring-2 ring-green-500 bg-green-700' : 'border-green-700/30 bg-green-800 hover:bg-green-700'}`}
                  onClick={() => navigate("/auth")}
                >
                  {service.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold text-white">
                        Popular
                      </span>
                    </div>
                  )}
                  <div className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600">
                      <service.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-white">{service.name}</h3>
                    <p className="text-sm text-white/70">{service.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-muted/30 py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Help in 3 simple steps
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">
              Getting roadside assistance has never been easier. Here's how it works:
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mx-auto max-w-4xl"
          >
            <div className="relative">
              {/* Connection Line */}
              <div className="absolute left-8 top-8 hidden h-[calc(100%-4rem)] w-0.5 bg-border md:left-1/2 md:-translate-x-1/2 lg:block" />
              
              <div className="space-y-8">
                {howItWorks.map((step, index) => (
                  <motion.div
                    key={step.step}
                    variants={item}
                    className="relative flex items-start gap-6 md:gap-8"
                  >
                    <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-lg">
                      {step.step}
                    </div>
                    <div className="flex-1 rounded-2xl border border-green-700/30 bg-green-800 p-6">
                      <h3 className="mb-2 text-xl font-bold text-white">{step.title}</h3>
                      <p className="text-white/80">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Real stories from real drivers
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">
              Join thousands of satisfied customers who've experienced our service.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-3"
          >
            {testimonials.map((testimonial) => (
              <motion.div key={testimonial.name} variants={item}>
                <div className="h-full rounded-2xl border border-green-700/30 bg-green-800 p-6">
                  <div className="mb-4 flex items-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-orange-400 text-orange-400" />
                    ))}
                  </div>
                  <Quote className="mb-3 h-8 w-8 text-white/30" />
                  <p className="mb-6 text-white">{testimonial.text}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 font-bold text-white">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{testimonial.name}</p>
                      <p className="text-sm text-white/70">{testimonial.location}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Driver CTA */}
      <section className="bg-green-800 py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="rounded-3xl border-2 border-green-600/30 bg-green-700 overflow-hidden p-8 md:p-12">
              <div className="grid gap-8 md:grid-cols-2 md:items-center">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-1.5">
                    <Wallet className="h-4 w-4 text-white" />
                    <span className="text-sm font-medium text-white">Earn Extra Income</span>
                  </div>
                  <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                    Have a vehicle & want to earn?
                  </h2>
                  <p className="mb-6 text-white/80 md:text-lg">
                    Join our network of 500+ responders. Flexible hours, competitive pay, and the satisfaction of helping drivers in need. 
                    Earn up to <strong className="text-orange-400">R8,000+/month</strong> part-time.
                  </p>
                  <ul className="mb-6 space-y-2">
                    {[
                      "Set your own schedule",
                      "Weekly payouts",
                      "Free training & certification",
                      "Dedicated support team",
                    ].map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2 text-white">
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <Button variant="amber" size="lg" onClick={() => navigate("/auth")}>
                    Apply to Drive
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="relative hidden md:block">
                  <div className="aspect-square rounded-3xl bg-gradient-to-br from-green-600/50 to-green-500/30 p-8">
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <div className="mb-4 text-6xl font-extrabold text-orange-400">R8K+</div>
                      <p className="text-lg font-medium text-white">Monthly Earnings</p>
                      <p className="text-sm text-white/70">For active part-time responders</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Card variant="dark" className="overflow-hidden">
              <CardContent className="relative p-8 md:p-16">
                {/* Background Effects */}
                <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-primary/20 blur-2xl" />
                
                <div className="relative mx-auto max-w-3xl text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20"
                  >
                    <Shield className="h-10 w-10 text-primary" />
                  </motion.div>
                  
                  <h2 className="mb-4 text-3xl font-bold text-brand-white md:text-4xl lg:text-5xl">
                    Ready for stress-free roadside help?
                  </h2>
                  <p className="mb-8 text-lg text-brand-white/70 md:text-xl">
                    Join 50,000+ drivers who trust Now-Now Assist. 
                    Sign up takes 30 seconds. No credit card required.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                      variant="amber"
                      size="xl"
                      onClick={() => navigate("/auth")}
                      className="w-full sm:w-auto px-12 shadow-amber"
                    >
                      <Zap className="mr-2 h-5 w-5" />
                      Get Started Free
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => window.location.href = 'tel:0800000000'}
                      className="w-full sm:w-auto border-brand-white/20 text-brand-white hover:bg-brand-white/10"
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Call Us: 0800 000 000
                    </Button>
                  </div>

                  <p className="mt-6 text-sm text-brand-white/50">
                    🔒 Protected by enterprise-grade security. Your data is encrypted and safe.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer - Green */}
      <footer className="border-t border-green-700/30 bg-green-800 py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <Logo size="md" className="mb-4" />
              <p className="mb-4 max-w-sm text-white/80">
                South Africa's fastest-growing roadside assistance platform. 
                Help when you need it, where you need it.
              </p>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-white" />
                <span className="text-sm text-white/80">Verified & Trusted</span>
              </div>
            </div>
            
            <div>
              <h4 className="mb-4 font-semibold text-white">Quick Links</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><button onClick={() => navigate("/auth")} className="hover:text-white transition-colors">Get Help</button></li>
                <li><button onClick={() => navigate("/auth")} className="hover:text-white transition-colors">Become a Responder</button></li>
                <li><button className="hover:text-white transition-colors">About Us</button></li>
                <li><button className="hover:text-white transition-colors">Contact</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-4 font-semibold text-white">Legal</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><button className="hover:text-white transition-colors">Privacy Policy</button></li>
                <li><button className="hover:text-white transition-colors">Terms of Service</button></li>
                <li><button className="hover:text-white transition-colors">Cookie Policy</button></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-8 md:flex-row">
            <p className="text-sm text-white/80">
              © 2025 Now-Now Assist. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/80">🇿🇦 Made in South Africa</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
