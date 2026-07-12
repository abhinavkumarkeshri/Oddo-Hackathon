"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";

export default function AuditsPage() {
  const [audits, setAudits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    scopeType: "department", // 'department' or 'location'
    scopeDepartmentId: "",
    scopeLocation: "",
    startDate: "",
    endDate: "",
    auditorIds: [] as string[]
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [auditsRes, deptsRes, usersRes, meRes] = await Promise.all([
        fetch("/api/audits"),
        fetch("/api/departments"),
        fetch("/api/users"),
        fetch("/api/me"),
      ]);
      
      if (meRes.ok) setCurrentUser(await meRes.json());
      setAudits(await auditsRes.json());
      setDepartments(await deptsRes.json());
      setUsers(await usersRes.json());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        auditorIds: formData.auditorIds,
        scopeDepartmentId: formData.scopeType === "department" ? formData.scopeDepartmentId : undefined,
        scopeLocation: formData.scopeType === "location" ? formData.scopeLocation : undefined,
      };

      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }

      setIsCreateOpen(false);
      setFormData({ name: "", scopeType: "department", scopeDepartmentId: "", scopeLocation: "", startDate: "", endDate: "", auditorIds: [] });
      fetchData();
    } catch (err) {
      setError("An error occurred");
    }
  };

  const isManager = currentUser && ["ADMIN", "ASSET_MANAGER"].includes(currentUser.role);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Audit Cycles</h1>
        
        {isManager && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Create Audit Cycle</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white">
              <DialogHeader>
                <DialogTitle>New Audit Cycle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Audit Name</Label>
                  <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Q3 IT Assets Audit" />
                </div>
                
                <div className="space-y-2">
                  <Label>Scope Type</Label>
                  <Select value={formData.scopeType} onValueChange={(v: string | null) => setFormData({...formData, scopeType: v || "department", scopeDepartmentId: "", scopeLocation: ""})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="department">By Department</SelectItem>
                      <SelectItem value="location">By Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.scopeType === "department" ? (
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select onValueChange={(v: string | null) => setFormData({...formData, scopeDepartmentId: v || ""})} required>
                      <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input required value={formData.scopeLocation} onChange={(e) => setFormData({...formData, scopeLocation: e.target.value})} placeholder="e.g. Server Room A" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" required value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" required value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded">
                  <Label className="mb-2 block">Assign Auditors</Label>
                  {users.map((u: any) => (
                    <div key={u.id} className="flex items-center space-x-2 mb-2">
                      <Checkbox 
                        id={`auditor-${u.id}`} 
                        checked={formData.auditorIds.includes(u.id)}
                        onCheckedChange={(checked) => {
                          if (checked) setFormData({...formData, auditorIds: [...formData.auditorIds, u.id]});
                          else setFormData({...formData, auditorIds: formData.auditorIds.filter(id => id !== u.id)});
                        }}
                      />
                      <label htmlFor={`auditor-${u.id}`} className="text-sm cursor-pointer">{u.name} ({u.email})</label>
                    </div>
                  ))}
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                  Create
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : audits.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-500">
          No audit cycles found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Audit Name</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Auditors</TableHead>
                <TableHead>Findings</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.map((audit: any) => (
                <TableRow key={audit.id}>
                  <TableCell className="font-medium">{audit.name}</TableCell>
                  <TableCell>{audit.scopeDepartment?.name || audit.scopeLocation}</TableCell>
                  <TableCell>{new Date(audit.startDate).toLocaleDateString()} - {new Date(audit.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={audit.status === "OPEN" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200"}>
                      {audit.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{audit._count.assignments}</TableCell>
                  <TableCell>{audit._count.findings}</TableCell>
                  <TableCell>
                    <Link href={`/dashboard/audits/${audit.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
