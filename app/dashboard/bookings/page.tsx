"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [assets, setAssets] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [formData, setFormData] = useState({ assetId: "", startTime: "", endTime: "", onBehalfOfDept: false });
  const [error, setError] = useState(null);

  const [rescheduleData, setRescheduleData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, assetsRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/assets"), // assuming this returns assets
      ]);
      const [bookingsData, assetsData] = await Promise.all([
        bookingsRes.json(),
        assetsRes.json(),
      ]);
      setBookings(bookingsData);
      setAssets(assetsData.filter(a => a.isBookable)); // Only bookable assets
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setIsBookOpen(false);
      setFormData({ assetId: "", startTime: "", endTime: "", onBehalfOfDept: false });
      fetchData();
    } catch (err) {
      setError("An error occurred");
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL" }),
      });
      if (res.ok) {
        fetchData();
      } else {
         alert("Failed to cancel booking");
      }
    } catch (err) {
      alert("Error cancelling booking");
    }
  };

  const handleReschedule = async (e) => {
     e.preventDefault();
     setError(null);
     try {
       const res = await fetch(`/api/bookings/${rescheduleData.id}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ 
            action: "RESCHEDULE", 
            startTime: rescheduleData.startTime, 
            endTime: rescheduleData.endTime 
         }),
       });
       const data = await res.json();
       if (!res.ok) {
         setError(data.error);
         return;
       }
       setRescheduleData(null);
       fetchData();
     } catch (err) {
       setError("Error rescheduling");
     }
  };

  const handleCheckReminders = async () => {
    try {
      const res = await fetch("/api/bookings/reminders", { method: "POST" });
      const data = await res.json();
      alert(data.message);
    } catch (err) {
      alert("Failed to check reminders");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "UPCOMING": return "bg-amber-100 text-amber-800";
      case "ONGOING": return "bg-blue-100 text-blue-800";
      case "COMPLETED": return "bg-green-100 text-green-800";
      case "CANCELLED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleCheckReminders}>
            Check Reminders
          </Button>
          <Dialog open={isBookOpen} onOpenChange={setIsBookOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Book Asset</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white">
              <DialogHeader>
                <DialogTitle>Book Asset</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleBook} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Asset</Label>
                  <Select onValueChange={(val) => setFormData({ ...formData, assetId: val })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a bookable asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map(asset => (
                        <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input 
                    type="datetime-local" 
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input 
                    type="datetime-local" 
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="onBehalf" 
                    checked={formData.onBehalfOfDept}
                    onCheckedChange={(c) => setFormData({ ...formData, onBehalfOfDept: c === true })}
                  />
                  <label htmlFor="onBehalf" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Book on behalf of department (Dept Head only)
                  </label>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                  Confirm Booking
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={!!rescheduleData} onOpenChange={(open) => !open && setRescheduleData(null)}>
        <DialogContent className="sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle>Reschedule Booking</DialogTitle>
            </DialogHeader>
            {rescheduleData && (
              <form onSubmit={handleReschedule} className="space-y-4 mt-4">
                 <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input 
                    type="datetime-local" 
                    value={rescheduleData.startTime}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input 
                    type="datetime-local" 
                    value={rescheduleData.endTime}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, endTime: e.target.value })}
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Reschedule
                </Button>
              </form>
            )}
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead>Asset</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-4">Loading...</TableCell></TableRow>
            ) : bookings.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-4">No bookings found</TableCell></TableRow>
            ) : (
              bookings.map((booking) => {
                return (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.asset.name}</TableCell>
                    <TableCell>{booking.requestedBy.name}</TableCell>
                    <TableCell>{new Date(booking.startTime).toLocaleString()}</TableCell>
                    <TableCell>{new Date(booking.endTime).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.status)} variant="secondary">
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {(booking.status === "UPCOMING" || booking.status === "ONGOING") && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setRescheduleData({
                                id: booking.id, 
                                startTime: new Date(booking.startTime).toISOString().slice(0, 16), 
                                endTime: new Date(booking.endTime).toISOString().slice(0, 16)
                            })}
                          >
                            Reschedule
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleCancel(booking.id)}>
                            Cancel
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
