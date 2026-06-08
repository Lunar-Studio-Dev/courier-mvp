import Link from "next/link";
import {
  Package,
  MapPin,
  Truck,
  ArrowRight,
  Zap,
  Clock,
  Globe,
  Shield,
  CalendarCheck,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { TrackSection } from "./_components/track-section";

const services = [
  { icon: Zap, title: "Express", description: "Fast delivery for time-sensitive shipments across India." },
  { icon: Truck, title: "Standard", description: "Reliable and affordable shipping for everyday parcels." },
  { icon: Clock, title: "Same-Day", description: "Book before noon, delivered by evening within the city." },
  { icon: CalendarCheck, title: "Next-Day", description: "Guaranteed next business day delivery nationwide." },
  { icon: Globe, title: "Economy", description: "Cost-effective option for non-urgent bulk shipments." },
  { icon: Shield, title: "Priority", description: "Premium handling with priority loading and transit." },
];

const stats = [
  { value: "500+", label: "Cities Covered" },
  { value: "28", label: "States & UTs" },
  { value: "30+", label: "Years of Service" },
  { value: "1M+", label: "Deliveries Made" },
];

const steps = [
  { number: 1, icon: Package, title: "Book", description: "Create a shipment from any branch with instant pricing." },
  { number: 2, icon: Truck, title: "Ship", description: "We pick up and transport via Air, Rail, or Road." },
  { number: 3, icon: MapPin, title: "Deliver", description: "Track in real time until safe delivery to doorstep." },
];

export default function LandingPage() {
  return (
    <>
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          <div className="relative container mx-auto px-4 py-20 sm:py-28 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Reliable Courier Services
              <br />
              <span className="text-primary">Across India</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              30+ years of trusted logistics — Air, Rail & Road transport with
              real-time tracking and nationwide coverage.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#track">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Track a Shipment
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="border-t bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-10">Our Services</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div
                  key={service.title}
                  className="flex flex-col items-center text-center rounded-lg border bg-background p-6"
                >
                  <div className="mb-4 rounded-lg bg-primary/10 p-3">
                    <service.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{service.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 border-t">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>
            <div className="grid gap-8 sm:grid-cols-3 max-w-3xl mx-auto">
              {steps.map((step, i) => (
                <div key={step.number} className="relative flex flex-col items-center text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                    {step.number}
                  </div>
                  <step.icon className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-semibold text-lg">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                  {/* Connector line (desktop only) */}
                  {i < steps.length - 1 && (
                    <div className="hidden sm:block absolute top-6 left-[calc(50%+32px)] w-[calc(100%-64px)] border-t-2 border-dashed border-primary/30" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Coverage Stats */}
        <section className="border-t bg-primary py-16 text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl sm:text-4xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-sm opacity-80">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Track Your Shipment */}
        <section id="track" className="py-16 border-t">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-2">Track Your Shipment</h2>
            <p className="text-muted-foreground mb-8">
              Enter your tracking number to get real-time updates.
            </p>
            <TrackSection />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg">TPC India</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Trusted courier and cargo services across India since 1995.
                Air, Rail & Road transport with nationwide coverage.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/track" className="text-muted-foreground hover:text-foreground transition-colors">
                    Track Shipment
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    Admin Portal
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> +91 1800-XXX-XXXX
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> info@tpcindia.com
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Mumbai, Maharashtra, India
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} TPC India. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
