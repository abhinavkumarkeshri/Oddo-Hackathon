"use client";

import { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const downloadCSV = (filename: string, rows: object[]) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]).join(",");
    const csvData = rows.map(row => Object.values(row).map(val => `"${val}"`).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `${filename}.csv`);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!data) return <div className="p-8 text-center">Failed to load data</div>;

  const { assetUtilization, maintenanceFrequency, agingAssets, departmentAllocation, bookingHeatmap } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Asset Utilization */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Asset Utilization (Last 90 Days)</CardTitle>
            <Button variant="outline" size="sm" onClick={() => downloadCSV('asset_utilization', assetUtilization)}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assetUtilization} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="assetTag" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip />
                  <Bar dataKey="days" fill="#2563EB" radius={[4, 4, 0, 0]} name="Allocated Days" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 2. Maintenance Frequency */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Maintenance by Category (Last 90 Days)</CardTitle>
            <Button variant="outline" size="sm" onClick={() => downloadCSV('maintenance_frequency', maintenanceFrequency)}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintenanceFrequency} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="category" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Requests" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 3. Assets Due for Maintenance / Retirement */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Assets Needing Attention (Poor Condition / &gt;5 Years Old)</CardTitle>
            <Button variant="outline" size="sm" onClick={() => downloadCSV('aging_assets', agingAssets)}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0">
                  <TableRow>
                    <TableHead>Asset Tag</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Acquisition Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agingAssets.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center">No assets found</TableCell></TableRow>
                  ) : (
                    agingAssets.map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.assetTag}</TableCell>
                        <TableCell>{a.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={["POOR", "DAMAGED"].includes(a.condition) ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-100"}>
                            {a.condition}
                          </Badge>
                        </TableCell>
                        <TableCell>{a.acquisitionDate ? new Date(a.acquisitionDate).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{a.status}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 4. Department Allocation Summary */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Department Allocation Summary</CardTitle>
            <Button variant="outline" size="sm" onClick={() => downloadCSV('department_allocation', departmentAllocation)}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0">
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Currently Allocated Assets</TableHead>
                    <TableHead>Total Acquisition Value ($)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentAllocation.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center">No data found</TableCell></TableRow>
                  ) : (
                    departmentAllocation.map((d: any) => (
                      <TableRow key={d.departmentName}>
                        <TableCell className="font-medium">{d.departmentName}</TableCell>
                        <TableCell>{d.allocatedCount}</TableCell>
                        <TableCell>${d.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 5. Booking Heatmap */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Resource Booking Heatmap (Last 30 Days)</CardTitle>
            <Button variant="outline" size="sm" onClick={() => downloadCSV('booking_heatmap', bookingHeatmap)}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto pb-4">
              <div className="min-w-[800px]">
                <div className="flex mb-1">
                  <div className="w-12"></div> {/* empty corner */}
                  {Array.from({length: 24}).map((_, h) => (
                    <div key={h} className="flex-1 text-center text-[10px] text-gray-500">{h}:00</div>
                  ))}
                </div>
                {bookingHeatmap.map((row: any) => (
                  <div key={row.day} className="flex items-center mb-1">
                    <div className="w-12 text-xs font-medium text-gray-600">{row.day}</div>
                    {Array.from({length: 24}).map((_, h) => {
                      const count = row[`${h}:00`];
                      let bgClass = "bg-gray-50 border border-gray-100";
                      if (count > 0) bgClass = "bg-blue-200 border border-blue-300";
                      if (count > 3) bgClass = "bg-blue-400 border border-blue-500 text-white";
                      if (count > 8) bgClass = "bg-blue-600 border border-blue-700 text-white";
                      
                      return (
                        <div 
                          key={h} 
                          className={`flex-1 h-8 mx-0.5 rounded-sm flex items-center justify-center text-[10px] ${bgClass}`}
                          title={`${row.day} ${h}:00 - ${count} bookings`}
                        >
                          {count > 0 ? count : ""}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div className="flex items-center justify-end space-x-2 mt-4 text-xs text-gray-500">
                  <span>Less</span>
                  <div className="w-4 h-4 rounded-sm bg-gray-50 border"></div>
                  <div className="w-4 h-4 rounded-sm bg-blue-200 border border-blue-300"></div>
                  <div className="w-4 h-4 rounded-sm bg-blue-400 border border-blue-500"></div>
                  <div className="w-4 h-4 rounded-sm bg-blue-600 border border-blue-700"></div>
                  <span>More</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
