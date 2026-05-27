import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { TyreIcon, BatteryIcon, FuelIcon, PumpIcon, WrenchIcon } from "@/components/icons/ServiceIcons";
import {
  ArrowRight, Shield, MapPin, CheckCircle2, Zap, Phone,
  AlertTriangle, Heart, BadgeCheck, Timer, Wallet, Quote, MessageCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useEffect } from "react";
import { exportAIPromptPDF } from "@/utils/exportAIPromptPDF";
import {
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  openSupportWhatsApp,
} from "@/lib/contact";

const painPoints = [
  "Stranded on a dark road at night?",
  "Flat tyre with no spare or tools?",
  "Dead battery and nobody to call?",
  "Ran out of fuel kilometres from a station?",
];

const solutions = [
  { icon: Timer, title: "Fast Local Response", description: "We're launching first in Centurion with responders ready to come to you, day or night.", highlight: "Centurion" },
  { icon: BadgeCheck, title: "Verified Responders", description: "Every responder is vetted before they're dispatched to a customer.", highlight: "Vetted" },
  { icon: MapPin, title: "WhatsApp First", description: "No app to download. Send one WhatsApp and we take it from there.", highlight: "Easy" },
  { icon: Wallet, title: "Pay Only When You Need Help", description: "No membership, no monthly fees. Transparent pricing on every call-out.", highlight: "No Fees" },
];

const services = [
  { icon: TyreIcon, name: "Tyre Change", description: "Flat or punctured tyre? We'll swap it with your spare.", popular: true },
  { icon: BatteryIcon, name: "Jump Start", description: "Dead battery? We'll get you running again.", popular: true },
  { icon: FuelIcon, name: "Fuel Delivery", description: "Ran out of fuel? We'll bring petrol or diesel to you.", popular: false },
  { icon: PumpIcon, name: "Tyre Inflate", description: "Low tyre pressure? We'll pump it up.", popular: false },
  { icon: WrenchIcon, name: "Minor Repairs", description: "Small roadside fixes to get you moving.", popular: false },
];

const testimonials = [
  { name: "Sarah M.", location: "Centurion", rating: 5, text: "Flat tyre at night near the N1. The responder was friendly and quick.", avatar: "SM" },
  { name: "David K.", location: "Centurion", rating: 5, text: "Battery died in a mall parking lot. WhatsApp'd them and was sorted in no time.", avatar: "DK" },
  { name: "Thandi N.", location: "Centurion", rating: 5, text: "As a woman travelling alone, knowing help was on the way made me feel safe.", avatar: "TN" },
];

const trustPoints = [
  { value: "Centurion", label: "Starting Here", icon: MapPin },
  { value: "South Africa", label: "Built For", icon: BadgeCheck },
  { value: "Verified", label: "Vetted Responders", icon: Shield },
  { value: "No Fees", label: "No Membership", icon: Wallet },
];

const howItWorks = [
  { step: "1", title: "Send a WhatsApp", description: "Tap the button, send us a WhatsApp, tell us what's wrong and where you are." },
  { step: "2", title: "We Dispatch", description: "We match you with the nearest verified responder in your area." },
  { step: "3", title: "Help Arrives", description: "Your responder confirms ETA and gets you moving again." },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const handleWhatsApp = () => openSupportWhatsApp();

export const LandingPage = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('export') === 'ai-prompt') {
      exportAIPromptPDF();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container py-1 md:py-2 flex-row flex items-center justify-between">
          <Logo size="2xl" />
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" onClick={(e) => { e.preventDefault(); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer">Services</a>
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer">How It Works</a>
            <a href="#testimonials" onClick={(e) => { e.preventDefault(); document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer">Reviews</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="font-medium" onClick={() => navigate("/auth")}>Log in</Button>
            <Button variant="amber" size="sm" className="hidden sm:flex font-medium" onClick={() => navigate("/driver/signup")}>Become a Driver</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden bg-primary">
        <motion.div style={{ opacity: heroOpacity, scale: heroScale }}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl opacity-40" />

          <div className="container relative py-16 md:py-24 lg:py-32 text-sm">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 border border-white/15">
                <MapPin className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-white">Now launching in Centurion</span>
              </div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-7xl md:text-4xl">
                Stuck on the road?<br /><span className="text-accent">We'll be there, now-now.</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="mx-auto mb-8 max-w-2xl text-lg text-white/80 md:text-xl">
                Flat tyre, dead battery, empty tank or locked out? Send us one WhatsApp and a verified responder is on the way. We're launching first in Centurion as we test the market, with plans to expand across South Africa. No membership. No app needed. Pay only when you need help.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="https://wa.me/27613278392?text=Hi%20Now-Now%20Assist%2C%20I%20need%20roadside%20help.%20My%20location%20is:"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-accent px-8 md:px-12 py-4 text-base font-semibold text-primary-foreground shadow-accent animate-pulse-amber w-full sm:w-auto"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />Get Help on WhatsApp
                </a>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-primary-foreground">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-accent" /><span className="font-medium text-white">No membership</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-accent" /><span className="font-medium text-white">Verified responders</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-accent" /><span className="font-medium text-white">Pay only when you need help</span></div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-primary/10 bg-primary py-8 md:py-12">
        <div className="container">
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            {trustPoints.map((stat) => (
              <motion.div key={stat.label} variants={item} className="text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-2xl font-extrabold text-white md:text-3xl">{stat.value}</p>
                <p className="text-sm text-white/70">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-1.5">
              <AlertTriangle className="h-4 w-4 text-orange-500" /><span className="text-sm font-medium text-orange-500">Sound familiar?</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
              Roadside emergencies are stressful.<br /><span className="text-muted-foreground">We make them easy.</span>
            </h2>
          </motion.div>

          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="mx-auto max-w-3xl space-y-4">
            {painPoints.map((point, index) => (
              <motion.div key={index} variants={item} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 md:p-6 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                </div>
                <p className="text-lg font-medium text-foreground md:text-xl">{point}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-6 py-3">
              <Heart className="h-5 w-5 text-orange-500" /><span className="text-lg font-semibold text-orange-500">Now-Now Assist has your back.</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solutions */}
      <section className="bg-secondary py-16 md:py-24">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-secondary-foreground md:text-4xl">Built for South African drivers, launching first in Centurion</h2>
            <p className="mx-auto max-w-2xl md:text-lg text-primary-foreground">A simple, local roadside service. WhatsApp us, we respond. No memberships, no admin.</p>
          </motion.div>

          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid gap-6 md:grid-cols-2">
            {solutions.map((solution) => (
              <motion.div key={solution.title} variants={item}>
                <div className="h-full overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8 transition-all hover:shadow-lg group">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 transition-colors group-hover:bg-orange-500/15">
                      <solution.icon className="h-7 w-7 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="text-xl font-bold text-foreground">{solution.title}</h3>
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">{solution.highlight}</span>
                      </div>
                      <p className="text-muted-foreground">{solution.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16 md:py-24 bg-background">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Services we offer</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">From flat tyres to empty tanks, we've got every roadside emergency covered.</p>
          </motion.div>

          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {services.map((service) => (
              <motion.div key={service.name} variants={item}>
                <div
                  className="h-full relative cursor-pointer rounded-2xl border border-orange-500 ring-2 ring-orange-500 bg-orange-500/5 transition-all hover:scale-105"
                  onClick={handleWhatsApp}
                >
                  {service.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">Popular</span>
                    </div>
                  )}
                  <div className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
                      <service.icon className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-foreground">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-secondary py-16 md:py-24">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-secondary-foreground md:text-4xl">Help in 3 simple steps</h2>
            <p className="mx-auto max-w-2xl text-secondary-foreground/80 md:text-lg">Getting roadside help has never been easier.</p>
          </motion.div>

          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="mx-auto max-w-4xl">
            <div className="relative">
              <div className="absolute left-8 top-8 hidden h-[calc(100%-4rem)] w-0.5 bg-border md:left-1/2 md:-translate-x-1/2 lg:block" />
              <div className="space-y-8">
                {howItWorks.map((step) => (
                  <motion.div key={step.step} variants={item} className="relative flex items-start gap-6 md:gap-8">
                    <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-lg">{step.step}</div>
                    <div className="flex-1 rounded-2xl border border-border bg-card p-6 shadow-sm">
                      <h3 className="mb-2 text-xl font-bold text-foreground">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 md:py-24 bg-background">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Real stories from real drivers</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">From our early Centurion community.</p>
          </motion.div>

          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <motion.div key={testimonial.name} variants={item}>
                <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <Quote className="mb-3 h-8 w-8 text-primary/20" />
                  <p className="mb-6 text-foreground">{testimonial.text}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{testimonial.avatar}</div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Driver CTA */}
      <section className="bg-primary py-16 md:py-24">
        <div className="container">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <div className="rounded-3xl border-2 border-white/10 bg-white/5 overflow-hidden p-8 md:p-12">
              <div className="grid gap-8 md:grid-cols-2 md:items-center">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5">
                    <Wallet className="h-4 w-4 text-accent-foreground" /><span className="text-sm font-medium text-accent-foreground">Earn Extra Income</span>
                  </div>
                  <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Have a vehicle &amp; want to earn?</h2>
                  <p className="mb-6 text-white/80 md:text-lg">
                    Join our growing Centurion responder network. Flexible hours, weekly payouts, and the satisfaction of helping local drivers in need.
                  </p>
                  <ul className="mb-6 space-y-2">
                    {["Set your own schedule", "Weekly payouts", "Free onboarding & training", "Dedicated support team"].map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2 text-white"><CheckCircle2 className="h-5 w-5 text-accent" />{benefit}</li>
                    ))}
                  </ul>
                  <Button variant="amber" size="lg" onClick={() => navigate("/driver/signup")}>Apply to Drive<ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
                <div className="relative hidden md:block">
                  <div className="aspect-square rounded-3xl bg-gradient-to-br from-white/10 to-white/5 p-8">
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <div className="mb-4 text-6xl font-extrabold text-accent">Centurion</div>
                      <p className="text-lg font-medium text-white">Now Onboarding</p>
                      <p className="text-sm text-white/70">Be one of our first verified responders</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <Card variant="dark" className="overflow-hidden">
              <CardContent className="relative p-8 md:p-16">
                <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent/10 blur-2xl" />
                <div className="relative mx-auto max-w-3xl text-center">
                  <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                    <Shield className="h-10 w-10 text-white" />
                  </motion.div>
                  <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">Ready for stress-free roadside help?</h2>
                  <p className="mb-8 text-lg text-white/70 md:text-xl">Send us a WhatsApp and we'll take it from there. No sign-up needed to get help.</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button variant="amber" size="xl" onClick={handleWhatsApp} className="w-full sm:w-auto px-12 shadow-accent">
                      <MessageCircle className="mr-2 h-5 w-5" />Get Help on WhatsApp
                    </Button>
                    <Button variant="light" size="lg" onClick={() => window.location.href = `tel:${SUPPORT_PHONE_TEL}`} className="w-full sm:w-auto !text-white !bg-white/20 !border-white/30 hover:!bg-white/30">
                      <Phone className="mr-2 h-4 w-4" />Call/WhatsApp: {SUPPORT_PHONE_DISPLAY}
                    </Button>
                  </div>
                  <p className="mt-6 text-sm text-white/50">🔒 Your data is encrypted and safe.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-primary py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <Logo size="md" className="mb-4" />
              <p className="mb-4 max-w-sm text-white/80">Centurion's WhatsApp-first roadside assistance. Help when you need it, where you need it.</p>
              <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-accent" /><span className="text-sm text-white/80">Verified &amp; Trusted</span></div>
              <p className="mt-4 text-sm text-white/80">Call/WhatsApp: <a href={`tel:${SUPPORT_PHONE_TEL}`} className="font-medium text-white hover:underline">{SUPPORT_PHONE_DISPLAY}</a></p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">Quick Links</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><button onClick={handleWhatsApp} className="hover:text-white transition-colors">Get Help</button></li>
                <li><button onClick={() => navigate("/driver/signup")} className="hover:text-white transition-colors">Become a Responder</button></li>
                <li><button onClick={() => navigate("/about")} className="hover:text-white transition-colors">About Us</button></li>
                <li><button onClick={() => navigate("/contact")} className="hover:text-white transition-colors">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">Legal</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><button onClick={() => navigate("/privacy-policy")} className="hover:text-white transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => navigate("/terms")} className="hover:text-white transition-colors">Terms of Service</button></li>
                <li><button onClick={() => navigate("/cookie-policy")} className="hover:text-white transition-colors">Cookie Policy</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/15 pt-8 md:flex-row">
            <p className="text-sm text-white/70">© 2026 Now-Now Assist. All rights reserved.</p>
            <div className="flex items-center gap-4"><span className="text-sm text-white/70">🇿🇦 Made in South Africa</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
