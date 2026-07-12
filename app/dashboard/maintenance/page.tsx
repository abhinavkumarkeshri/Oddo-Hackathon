"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Circle, Clock, Loader2, Wrench } from "lucide-react";

export default function MaintenancePage() {
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isRaiseOpen, setIsRaiseOpen] = useState(false);
  const [formData, setFormData] = useState({ assetId: "", issueDescription: "", priority: "MEDIUM", photoUrl: "" });
  const [error, setError] = useState<string | null>(null);

  const [technicianName, setTechnicianName] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, assetsRes, meRes] = await Promise.all([
        fetch("/api/maintenance"),
        fetch("/api/assets"),
        fetch("/api/me"),
      ]);
      
      if (meRes.ok) setCurrentUser(await meRes.json());
      
      const reqData = await reqRes.json();
      const assetsData = await assetsRes.json();
      
      setRequests(reqData);
      setAssets(assetsData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleRaise = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }
      setIsRaiseOpen(false);
      setFormData({ assetId: "", issueDescription: "", priority: "MEDIUM", photoUrl: "" });
      fetchData();
    } catch (err) {
      setError("An error occurred");
    }
  };

  const handleAction = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/maintenance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, technicianName: action === "ASSIGN" ? technicianName : undefined }),
      });
      if (res.ok) {
        if (action === "ASSIGN") setTechnicianName("");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Action failed");
      }
    } catch (err) {
      alert("Error processing action");
    }
  };

  const isAssetManager = currentUser && ["ADMIN", "ASSET_MANAGER"].includes(currentUser.role);

  const renderStepper = (status: string) => {
    const steps = [
      { id: "PENDING", label: "Pending" },
      { id: "APPROVED", label: "Approved" },
      { id: "TECH_ASSIGNED", label: "Assigned" },
      { id: "IN_PROGRESS", label: "In Progress" },
      { id: "RESOLVED", label: "Resolved" }
    ];

    if (status === "REJECTED") {
      return (
        <div className="flex items-center space-x-2 text-red-600">
           <CheckCircle2 className="w-5 h-5" />
           <span className="text-sm font-medium">Rejected</span>
        </div>
      )
    }

    const currentIndex = steps.findIndex(s => s.id === status);

    return (
      <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto py-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : isCurrent ? (
                  <Circle className="w-6 h-6 text-blue-600 fill-blue-600" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-300" />
                )}
                <span className="text-xs mt-1 text-gray-600">{step.label}</span>
              </div>
              {!isLast && (
                <div className={`w-8 sm:w-12 h-1 mx-2 rounded ${index < currentIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "border-red-600";
      case "HIGH": return "border-red-500";
      case "MEDIUM": return "border-amber-500";
      case "LOW": return "border-gray-400";
      default: return "border-gray-200";
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Maintenance</h1>
        <Dialog open={isRaiseOpen} onOpenChange={setIsRaiseOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Raise Request</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle>Raise Maintenance Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRaise} className="space-y-4 mt-4">
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
                <Label>Issue Description</Label>
                <Textarea 
                  value={formData.issueDescription}
                  onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Photo URL (Optional)</Label>
                <Input 
                  type="url"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                Submit Request
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : requests.length === 0 ? (
          <div className="text-center p-8 text-gray-500">No maintenance requests found.</div>
        ) : (
          requests.map((req: any) => (
            <div key={req.id} className={`bg-white rounded-xl border-l-4 border-y border-r border-gray-200 shadow-sm p-5 ${getPriorityColor(req.priority)}`}>
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                     <h3 className="text-lg font-semibold text-gray-900">{req.asset.name} ({req.asset.assetTag})</h3>
                     <span className="text-xs text-gray-500 flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-600">{req.issueDescription}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Priority: <strong className="text-gray-700">{req.priority}</strong></span>
                    <span>Requested by: <strong className="text-gray-700">{req.raisedBy.name}</strong></span>
                    {req.technicianName && <span>Technician: <strong className="text-gray-700">{req.technicianName}</strong></span>}
                  </div>
                </div>

                <div className="md:w-1/3 flex flex-col items-end space-y-4">
                  {renderStepper(req.status)}

                  {isAssetManager && (
                    <div className="flex items-center space-x-2 mt-4">
                      {req.status === "PENDING" && (
                        <>
                           <Button variant="outline" size="sm" className="text-green-600 hover:bg-green-50" onClick={() => handleAction(req.id, "APPROVE")}>Approve</Button>
                           <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleAction(req.id, "REJECT")}>Reject</Button>
                        </>
                      )}
                      {req.status === "APPROVED" && (
                        <div className="flex items-center space-x-2">
                           <Input placeholder="Technician Name" className="w-36 h-8" value={technicianName} onChange={e => setTechnicianName(e.target.value)} />
                           <Button variant="outline" size="sm" onClick={() => handleAction(req.id, "ASSIGN")} disabled={!technicianName}>Assign</Button>
                        </div>
                      )}
                      {req.status === "TECH_ASSIGNED" && (
                        <Button variant="outline" size="sm" className="text-blue-600 hover:bg-blue-50" onClick={() => handleAction(req.id, "START")}>Start Work</Button>
                      )}
                      {req.status === "IN_PROGRESS" && (
                        <Button variant="outline" size="sm" className="text-green-600 hover:bg-green-50" onClick={() => handleAction(req.id, "RESOLVE")}>Resolve</Button>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
