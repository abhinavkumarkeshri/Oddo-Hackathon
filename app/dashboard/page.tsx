"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, GitBranch, Wrench, CalendarCheck, ArrowRightLeft, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-sm text-gray-500">Here's a quick overview of your assets and activities.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-white shadow-sm border border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Assets Available</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{data?.assetsAvailable || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Assets Allocated</CardTitle>
            <GitBranch className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{data?.assetsAllocated || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Maintenance Today</CardTitle>
            <Wrench className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{data?.maintenanceToday || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Bookings</CardTitle>
            <CalendarCheck className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{data?.activeBookings || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Transfers</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{data?.pendingTransfers || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Upcoming Returns (7d)</CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{data?.upcomingReturns || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/dashboard/assets">
            <Button variant="outline" className="bg-white border-gray-200 shadow-sm rounded-md hover:bg-gray-50">
               Register Asset
            </Button>
          </Link>
          <Link href="/dashboard/bookings">
            <Button variant="outline" className="bg-white border-gray-200 shadow-sm rounded-md hover:bg-gray-50">
               Book Resource
            </Button>
          </Link>
          <Link href="/dashboard/maintenance">
            <Button variant="outline" className="bg-white border-gray-200 shadow-sm rounded-md hover:bg-gray-50">
               Raise Maintenance Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Overdue Returns section */}
      {data?.overdueReturnsList && data.overdueReturnsList.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-red-800 font-semibold mb-4">
            <AlertCircle className="h-5 w-5" />
            <span>Overdue Returns ({data.overdueReturnsList.length})</span>
          </div>
          <div className="space-y-3">
             {data.overdueReturnsList.map((alloc: any) => (
                <div key={alloc.id} className="bg-white border border-red-100 rounded p-3 flex justify-between items-center text-sm shadow-sm">
                   <div>
                     <span className="font-medium text-gray-900">{alloc.asset.name}</span> <span className="text-gray-500">({alloc.asset.assetTag})</span>
                   </div>
                   <div className="flex items-center space-x-4">
                     <span className="text-gray-600">User: {alloc.user.name}</span>
                     <span className="text-red-600 font-medium">Due: {new Date(alloc.expectedReturnDate).toLocaleDateString()}</span>
                   </div>
                </div>
             ))}
          </div>
        </div>
      )}

    </div>
  );
}
