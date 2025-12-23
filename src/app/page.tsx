"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  PieChart,
  Target,
  Zap,
  BarChart3,
  Calendar,
  Wallet,
  ArrowRight,
  Clock,
  Filter,
} from "lucide-react";

export default function Home() {
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
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6" variant="secondary">
              Budget Analytics
            </Badge>
            <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Supercharge your{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                financial insights
              </span>
            </h1>
            <p className="mb-8 text-xl text-muted-foreground md:text-2xl">
              From first transaction to financial goals, understand exactly how
              your spending drives your financial future with powerful budget
              analytics.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="w-full sm:w-auto">
                Start for free
                <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Analytics Section */}
      <section className="border-b bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Success at a glance
              </h2>
              <p className="text-lg text-muted-foreground">
                With our powerful real-time analytics, you can focus on what
                truly matters for your financial health.
              </p>
            </div>

            {/* Metrics Cards */}
            <div className="mb-12 grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardDescription>Total Expenses</CardDescription>
                  <CardTitle className="text-3xl font-bold">$9,084</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="size-4 text-green-500" />
                    <span>12% decrease from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardDescription>Budget Categories</CardDescription>
                  <CardTitle className="text-3xl font-bold">24</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <PieChart className="size-4 text-blue-500" />
                    <span>8 categories over budget</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardDescription>Savings Rate</CardDescription>
                  <CardTitle className="text-3xl font-bold">32%</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="size-4 text-purple-500" />
                    <span>5% above target</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dashboard Preview */}
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Budget Overview</CardTitle>
                    <CardDescription>
                      Real-time spending across all categories
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Live</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Category Breakdown */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[
                      {
                        name: "Food & Dining",
                        amount: "$1,240",
                        percentage: 45,
                        color: "bg-blue-500",
                      },
                      {
                        name: "Transportation",
                        amount: "$890",
                        percentage: 32,
                        color: "bg-green-500",
                      },
                      {
                        name: "Shopping",
                        amount: "$650",
                        percentage: 28,
                        color: "bg-purple-500",
                      },
                      {
                        name: "Bills & Utilities",
                        amount: "$420",
                        percentage: 15,
                        color: "bg-orange-500",
                      },
                      {
                        name: "Entertainment",
                        amount: "$380",
                        percentage: 18,
                        color: "bg-pink-500",
                      },
                      {
                        name: "Healthcare",
                        amount: "$290",
                        percentage: 12,
                        color: "bg-red-500",
                      },
                    ].map((category) => (
                      <div key={category.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{category.name}</span>
                          <span className="text-muted-foreground">
                            {category.amount}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full ${category.color} transition-all`}
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Everything you need to master your budget
              </h2>
              <p className="text-lg text-muted-foreground">
                Powerful features designed to give you complete control over
                your finances
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                    <BarChart3 className="size-6 text-primary" />
                  </div>
                  <CardTitle>Real-time Tracking</CardTitle>
                  <CardDescription>
                    Monitor your spending as it happens with instant updates
                    across all your devices.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="size-6 text-primary" />
                  </div>
                  <CardTitle>Budget Cycles</CardTitle>
                  <CardDescription>
                    Set up custom budget periods that match your pay schedule
                    and financial goals.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                    <PieChart className="size-6 text-primary" />
                  </div>
                  <CardTitle>Category Insights</CardTitle>
                  <CardDescription>
                    Deep dive into spending patterns with detailed breakdowns by
                    category and time period.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                    <Target className="size-6 text-primary" />
                  </div>
                  <CardTitle>Goal Tracking</CardTitle>
                  <CardDescription>
                    Set and track financial goals with visual progress
                    indicators and milestone celebrations.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                    <Filter className="size-6 text-primary" />
                  </div>
                  <CardTitle>Advanced Filters</CardTitle>
                  <CardDescription>
                    Filter transactions by date, category, amount, and more to
                    find exactly what you&apos;re looking for.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="size-6 text-primary" />
                  </div>
                  <CardTitle>Smart Alerts</CardTitle>
                  <CardDescription>
                    Get notified when you&apos;re approaching budget limits or
                    when unusual spending patterns are detected.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Transaction Stream Section */}
      <section className="border-y bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                See it as it happens
              </h2>
              <p className="text-lg text-muted-foreground">
                Gain deeper insights with fine-grained, transaction-level data.
                Understand every expense in real-time.
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                      Live feed of your spending activity
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    <Clock className="mr-2 size-3" />
                    Real-time
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      category: "Food & Dining",
                      merchant: "Coffee Shop",
                      amount: "$12.50",
                      time: "2:32 AM",
                    },
                    {
                      category: "Transportation",
                      merchant: "Uber",
                      amount: "$24.00",
                      time: "2:28 AM",
                    },
                    {
                      category: "Shopping",
                      merchant: "Amazon",
                      amount: "$49.99",
                      time: "2:25 AM",
                    },
                    {
                      category: "Bills & Utilities",
                      merchant: "Electric Company",
                      amount: "$89.50",
                      time: "2:21 AM",
                    },
                    {
                      category: "Entertainment",
                      merchant: "Netflix",
                      amount: "$15.99",
                      time: "2:17 AM",
                    },
                  ].map((transaction, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                          <Wallet className="size-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {transaction.merchant}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.category}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {transaction.amount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6 text-3xl font-bold md:text-4xl">
              Supercharge your financial insights
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Start tracking your expenses and budgets in seconds and see
              exactly how your spending drives your financial future.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="w-full sm:w-auto">
                Start for free
                <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Get a demo
              </Button>
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
