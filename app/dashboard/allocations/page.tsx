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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [formData, setFormData] = useState({ assetId: "", userId: "", expectedReturnDate: "" });
  const [error, setError] = useState<string | null>(null);
  
  const [activeTransferRequest, setActiveTransferRequest] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allocRes, assetsRes, usersRes, meRes, transfersRes] = await Promise.all([
        fetch("/api/allocations"),
        fetch("/api/assets"),
        fetch("/api/users"),
        fetch("/api/me"),
        fetch("/api/transfers"),
      ]);
      
      if (meRes.ok) {
         setCurrentUser(await meRes.json());
      }
      
      const [allocData, assetsData, usersData, transfersData] = await Promise.all([
        allocRes.json(),
        assetsRes.json(),
        usersRes.json(),
        transfersRes.json(),
      ]);
      setAllocations(allocData);
      setAssets(assetsData.filter((a: any) => a.status === "AVAILABLE"));
      setUsers(usersData);
      setTransfers(transfersData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "CONFLICT_ACTIVE_ALLOCATION") {
           setActiveTransferRequest({ assetId: formData.assetId, error: data.error });
        } else {
           setError(data.error);
        }
        return;
      }
      setIsAllocateOpen(false);
      setFormData({ assetId: "", userId: "", expectedReturnDate: "" });
      fetchData();
    } catch (err) {
      setError("An error occurred");
    }
  };

  const handleRequestTransfer = async () => {
    try {
      const res = await fetch("/api/allocations/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: activeTransferRequest.assetId }),
      });
      if (res.ok) {
        alert("Transfer requested successfully");
        setActiveTransferRequest(null);
        setIsAllocateOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to request transfer");
    }
  };

  const handleProcessTransfer = async (id: string, action: "APPROVE" | "REJECT") => {
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this transfer?`)) return;
    try {
      const res = await fetch(`/api/allocations/transfer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferRequestId: id, action }),
      });
      if (res.ok) {
        fetchData();
      } else {
         const data = await res.json();
         alert(data.error || `Failed to ${action.toLowerCase()} transfer`);
      }
    } catch (err) {
      alert("Error processing transfer");
    }
  };

  const handleReturn = async (id: string) => {
    const notes = prompt("Enter check-in condition notes (optional):");
    try {
      const res = await fetch(`/api/allocations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditionCheckInNotes: notes }),
      });
      if (res.ok) {
        fetchData();
      } else {
         alert("Failed to return asset");
      }
    } catch (err) {
      alert("Error returning asset");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "RETURNED": return "bg-gray-100 text-gray-800";
      case "OVERDUE": return "bg-red-100 text-red-800";
      case "REQUESTED": return "bg-amber-100 text-amber-800";
      case "APPROVED": return "bg-green-100 text-green-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const overdueAllocations = allocations.filter((a: any) => {
    if (a.status === "ACTIVE" && a.expectedReturnDate) {
      return new Date(a.expectedReturnDate) < new Date();
    }
    return false;
  });

  const canApproveTransfer = (transfer: any) => {
    if (!currentUser) return false;
    if (["ADMIN", "ASSET_MANAGER"].includes(currentUser.role)) return true;
    if (currentUser.role === "DEPT_HEAD" && currentUser.departmentId === transfer.fromUser.departmentId) return true;
    return false;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Allocations & Transfers</h1>
        <Dialog open={isAllocateOpen} onOpenChange={setIsAllocateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Allocate Asset</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle>Allocate Asset</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAllocate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Asset</Label>
                <Select onValueChange={(val) => setFormData({ ...formData, assetId: val })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((asset: any) => (
                      <SelectItem key={asset.id} value={asset.id}>{asset.name} ({asset.assetTag})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>User</Label>
                <Select onValueChange={(val) => setFormData({ ...formData, userId: val })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Return Date (Optional)</Label>
                <Input 
                  type="date" 
                  value={formData.expectedReturnDate}
                  onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {activeTransferRequest && (
                 <div className="bg-amber-50 p-3 rounded-md flex flex-col space-y-2">
                   <p className="text-sm text-amber-800">{activeTransferRequest.error}</p>
                   <Button type="button" variant="outline" size="sm" onClick={handleRequestTransfer}>
                     Request Transfer
                   </Button>
                 </div>
              )}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                Allocate
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {overdueAllocations.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>You have {overdueAllocations.length} overdue allocation(s). Please review them.</span>
        </div>
      )}

      <Tabs defaultValue="allocations" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="allocations">Active Allocations</TabsTrigger>
          <TabsTrigger value="transfers">Transfer Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="allocations">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>Asset</TableHead>
                  <TableHead>Allocated To</TableHead>
                  <TableHead>Allocated At</TableHead>
                  <TableHead>Expected Return</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-4">Loading...</TableCell></TableRow>
                ) : allocations.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-4">No allocations found</TableCell></TableRow>
                ) : (
                  allocations.map((alloc: any) => {
                    const isOverdue = alloc.status === "ACTIVE" && alloc.expectedReturnDate && new Date(alloc.expectedReturnDate) < new Date();
                    const displayStatus = isOverdue ? "OVERDUE" : alloc.status;
                    
                    return (
                      <TableRow key={alloc.id}>
                        <TableCell className="font-medium">{alloc.asset.name} ({alloc.asset.assetTag})</TableCell>
                        <TableCell>{alloc.user.name}</TableCell>
                        <TableCell>{new Date(alloc.allocatedAt).toLocaleDateString()}</TableCell>
                        <TableCell>{alloc.expectedReturnDate ? new Date(alloc.expectedReturnDate).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(displayStatus)} variant="secondary">
                            {displayStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {alloc.status === "ACTIVE" && (
                            <Button variant="outline" size="sm" onClick={() => handleReturn(alloc.id)}>
                              Return
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="transfers">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>Asset</TableHead>
                  <TableHead>From User</TableHead>
                  <TableHead>To User</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-4">Loading...</TableCell></TableRow>
                ) : transfers.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-4">No transfer requests found</TableCell></TableRow>
                ) : (
                  transfers.map((transfer: any) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">{transfer.asset.name} ({transfer.asset.assetTag})</TableCell>
                      <TableCell>{transfer.fromUser.name}</TableCell>
                      <TableCell>{transfer.toUser.name}</TableCell>
                      <TableCell>{new Date(transfer.requestedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transfer.status)} variant="secondary">
                          {transfer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {transfer.status === "REQUESTED" && canApproveTransfer(transfer) && (
                          <>
                            <Button variant="outline" size="sm" className="text-green-600 hover:bg-green-50" onClick={() => handleProcessTransfer(transfer.id, "APPROVE")}>
                              Approve
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleProcessTransfer(transfer.id, "REJECT")}>
                              Reject
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

