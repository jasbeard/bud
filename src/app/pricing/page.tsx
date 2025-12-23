"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started with budget tracking",
      features: [
        "Up to 3 budget categories",
        "Basic expense tracking",
        "Monthly budget cycles",
        "Mobile app access",
        "Email support",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "$9",
      period: "per month",
      description: "For individuals who want advanced insights",
      features: [
        "Unlimited budget categories",
        "Advanced analytics & reports",
        "Custom budget cycles",
        "Goal tracking & milestones",
        "Smart alerts & notifications",
        "Data export (CSV, PDF)",
        "Priority support",
        "API access",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For teams and organizations",
      features: [
        "Everything in Pro",
        "Team collaboration",
        "Advanced permissions",
        "Custom integrations",
        "Dedicated account manager",
        "SLA guarantee",
        "Custom reporting",
        "On-premise deployment",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              Bud
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/pricing"
                className="text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
              >
                Pricing
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                Simple, transparent{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  pricing
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Choose the plan that&apos;s right for you. Start free and
                upgrade when you need more features.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col ${
                    plan.popular ? "border-primary shadow-lg md:scale-105" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-8">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {plan.description}
                    </CardDescription>
                    <div className="mt-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className="ml-2 text-muted-foreground">
                          /{plan.period}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="mt-0.5 size-5 shrink-0 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                      asChild
                    >
                      <Link href="/signup">
                        {plan.cta}
                        <ArrowRight className="ml-2 size-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* FAQ Section */}
            <div className="mt-24">
              <h2 className="mb-8 text-center text-3xl font-bold">
                Frequently asked questions
              </h2>
              <div className="mx-auto max-w-3xl space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Can I change plans later?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Yes, you can upgrade or downgrade your plan at any time.
                      Changes will be reflected in your next billing cycle.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      What payment methods do you accept?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      We accept all major credit cards, debit cards, and PayPal.
                      Enterprise customers can also pay via invoice.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Is there a free trial?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Yes! All Pro plans come with a 14-day free trial. No
                      credit card required to start.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Can I cancel anytime?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Absolutely. You can cancel your subscription at any time
                      with no penalties. Your data will remain accessible for 30
                      days after cancellation.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="text-sm text-muted-foreground">
                © 2025 Bud. All rights reserved.
              </div>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <Link
                  href="#"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  href="#"
                  className="hover:text-foreground transition-colors"
                >
                  Terms
                </Link>
                <Link
                  href="#"
                  className="hover:text-foreground transition-colors"
                >
                  Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
