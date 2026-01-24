import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNav } from "@/components/shared/BottomNav";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TrendingUp, Calendar, DollarSign, Clock, ChevronRight, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";

const mockEarnings = {
  today: "R1,250",
  thisWeek: "R8,450",
  pending: "R2,100",
  completedJobs: 12,
};

const mockTransactions = [
  { id: 1, type: "earning", description: "Tyre Change - John M.", amount: "+R280", time: "2 hours ago" },
  { id: 2, type: "earning", description: "Jump Start - Sarah L.", amount: "+R200", time: "4 hours ago" },
  { id: 3, type: "payout", description: "Weekly Payout", amount: "-R6,350", time: "Yesterday" },
  { id: 4, type: "earning", description: "Fuel Delivery - Mike R.", amount: "+R144", time: "Yesterday" },
];

export const DriverEarnings = () => {
  return (
    <div className="min-h-screen bg-background pb-24 dark">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="container py-4">
          <h1 className="text-xl font-bold text-foreground">Earnings</h1>
          <p className="text-sm text-muted-foreground">Track your income</p>
        </div>
      </header>

      <div className="container py-4 space-y-4">
        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card variant="amber" className="cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
                <span className="text-sm text-primary-foreground/80">Today</span>
              </div>
              <p className="text-2xl font-bold text-primary-foreground">{mockEarnings.today}</p>
            </CardContent>
          </Card>

          <Card variant="default" className="cursor-pointer transition-all hover:border-primary/50 active:scale-[0.98]">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">This Week</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{mockEarnings.thisWeek}</p>
            </CardContent>
          </Card>

          <Card variant="success" className="cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Pending</span>
              </div>
              <p className="text-2xl font-bold">{mockEarnings.pending}</p>
            </CardContent>
          </Card>

          <Card variant="default" className="cursor-pointer transition-all hover:border-primary/50 active:scale-[0.98]">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Jobs</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{mockEarnings.completedJobs}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3"
        >
          <Button variant="amber" className="flex-1">
            Request Payout
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card variant="default">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
              <Button variant="link" size="sm" className="text-primary">
                View All
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-3 transition-all hover:border-primary/50 hover:bg-muted/50 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        transaction.type === "earning"
                          ? "bg-success/10"
                          : "bg-primary/10"
                      }`}
                    >
                      {transaction.type === "earning" ? (
                        <ArrowUpRight className="h-5 w-5 text-success" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{transaction.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold ${
                        transaction.type === "earning" ? "text-success" : "text-foreground"
                      }`}
                    >
                      {transaction.amount}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payout Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="interactive" className="cursor-pointer transition-all hover:border-primary/50 active:scale-[0.99]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Next Payout</p>
                  <p className="text-sm text-muted-foreground">Friday, Dec 15</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{mockEarnings.pending}</p>
                    <StatusBadge variant="pending">Processing</StatusBadge>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <BottomNav type="driver" />
    </div>
  );
};

export default DriverEarnings;
