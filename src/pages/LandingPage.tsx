import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { TyreIcon, BatteryIcon, FuelIcon, PumpIcon, WrenchIcon, CarIcon } from "@/components/icons/ServiceIcons";
import { ArrowRight, Shield, Clock, Star, MapPin, CheckCircle2, Zap, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: Clock,
    title: "15-Min Response",
    description: "Fast arrival guaranteed",
  },
  {
    icon: Shield,
    title: "Verified Responders",
    description: "Background-checked pros",
  },
  {
    icon: Star,
    title: "4.9★ Rated",
    description: "Top-quality service",
  },
  {
    icon: MapPin,
    title: "Live Tracking",
    description: "Know exactly when help arrives",
  },
];

const services = [
  { icon: TyreIcon, name: "Tyre Change", price: "From R350" },
  { icon: BatteryIcon, name: "Jump Start", price: "From R250" },
  { icon: FuelIcon, name: "Fuel Delivery", price: "From R180" },
  { icon: PumpIcon, name: "Tyre Inflate", price: "From R150" },
  { icon: WrenchIcon, name: "Other Help", price: "From R200" },
];

const stats = [
  { value: "50K+", label: "Customers Helped" },
  { value: "500+", label: "Active Responders" },
  { value: "15min", label: "Avg Response Time" },
  { value: "4.9★", label: "Customer Rating" },
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-4">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/driver")}>
              Drive with us
            </Button>
            <Button variant="amber" onClick={() => navigate("/customer")}>
              Get Help Now
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
            >
              <Zap className="h-4 w-4" />
              Roadside help in minutes, not hours
            </motion.div>

            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Stranded?{" "}
              <span className="text-gradient-amber">We're on our way.</span>
            </h1>

            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Get instant roadside assistance from verified responders. Tyre changes, 
              jump-starts, fuel delivery — help is just a tap away.
            </p>

            <Button
              variant="amber"
              size="xl"
              onClick={() => navigate("/customer")}
              className="w-full px-12 py-6 text-lg sm:w-auto"
            >
              Request Help Now
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>

            <p className="mt-4 text-sm text-muted-foreground">
              Want to earn as a responder?{" "}
              <button
                onClick={() => navigate("/driver")}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Join our team
              </button>
            </p>
          </motion.div>
        </div>

        {/* Floating Icons */}
        <motion.div
          className="absolute -right-10 top-20 hidden lg:block"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 shadow-lg">
            <TyreIcon className="h-10 w-10 text-primary" />
          </div>
        </motion.div>

        <motion.div
          className="absolute -left-5 bottom-20 hidden lg:block"
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 shadow-lg">
            <BatteryIcon className="h-8 w-8 text-success" />
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/50 py-12">
        <div className="container">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-8 md:grid-cols-4"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={item} className="text-center">
                <p className="text-3xl font-extrabold text-primary md:text-4xl">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Why choose Now-Now Assist?
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              We've reimagined roadside assistance for the modern driver. Fast, reliable, and always there when you need it.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={item}>
                <Card variant="interactive" className="h-full">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-muted/30 py-16 md:py-24">
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
            <p className="mx-auto max-w-2xl text-muted-foreground">
              From flat tyres to empty tanks, we've got you covered with our full range of roadside services.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
          >
            {services.map((service) => (
              <motion.div key={service.name} variants={item}>
                <Card variant="default" className="text-center">
                  <CardContent className="p-6">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <service.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="mb-1 font-semibold text-foreground">{service.name}</h3>
                    <p className="text-sm font-medium text-primary">{service.price}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Card variant="dark" className="overflow-hidden">
              <CardContent className="relative p-8 md:p-12">
                <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
                
                <div className="relative mx-auto max-w-2xl text-center">
                  <h2 className="mb-4 text-3xl font-bold text-brand-white md:text-4xl">
                    Ready to experience stress-free roadside help?
                  </h2>
                  <p className="mb-8 text-brand-white/70">
                    Join thousands of drivers who trust Now-Now Assist for fast, reliable roadside assistance.
                  </p>
                  <Button
                    variant="amber"
                    size="xl"
                    onClick={() => navigate("/customer")}
                    className="px-12"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  
                  <p className="mt-4 text-sm text-brand-white/60">
                    Interested in becoming a responder?{" "}
                    <button
                      onClick={() => navigate("/driver")}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Learn more
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              © 2025 Now-Now Assist. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">Privacy</Button>
              <Button variant="ghost" size="sm">Terms</Button>
              <Button variant="ghost" size="sm">Support</Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
