"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus } from "lucide-react";

export default function OrgSetupClient() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Dialog states
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);

  // Form states
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptParent, setNewDeptParent] = useState("none");
  const [newDeptHead, setNewDeptHead] = useState("none");
  
  const [newCatName, setNewCatName] = useState("");
  const [customFields, setCustomFields] = useState<{name: string}[]>([]);

  const fetchDepartments = async () => {
    const res = await fetch("/api/departments");
    if (res.ok) setDepartments(await res.json());
  };

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    if (res.ok) setCategories(await res.json());
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
  };

  useEffect(() => {
    fetchDepartments();
    fetchCategories();
    fetchUsers();
  }, []);

  const handleCreateDepartment = async () => {
    if (!newDeptName) return;
    await fetch("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newDeptName,
        parentDepartmentId: newDeptParent === "none" ? null : newDeptParent,
        headUserId: newDeptHead === "none" ? null : newDeptHead,
      }),
    });
    setDeptDialogOpen(false);
    fetchDepartments();
  };

  const handleCreateCategory = async () => {
    if (!newCatName) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCatName,
        customFieldsJson: customFields.length > 0 ? customFields : null,
      }),
    });
    setCatDialogOpen(false);
    fetchCategories();
  };

  const handlePromoteUser = async (userId: string, newRole: string) => {
    await fetch(`/api/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    fetchUsers();
  };

  const handleToggleDeptStatus = async (deptId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await fetch(`/api/departments/${deptId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchDepartments();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold tracking-tight">Organization Setup</h1>
      </div>

      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="employees">Employee Directory</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium">Departments</h2>
            <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> New Department</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Department</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="e.g. Engineering" />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent Department (Optional)</Label>
                    <Select value={newDeptParent} onValueChange={setNewDeptParent}>
                      <SelectTrigger><SelectValue placeholder="Select parent" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department Head (Optional)</Label>
                    <Select value={newDeptHead} onValueChange={setNewDeptHead}>
                      <SelectTrigger><SelectValue placeholder="Select head" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateDepartment} className="w-full">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Head</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>{dept.parentDepartment?.name || "-"}</TableCell>
                  <TableCell>{dept.head?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={dept.status === "ACTIVE" ? "default" : "secondary"}>
                      {dept.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleToggleDeptStatus(dept.id, dept.status)}>
                      {dept.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {departments.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No departments found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="categories" className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium">Asset Categories</h2>
            <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> New Category</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Category Name</Label>
                    <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g. Electronics" />
                  </div>
                  <div className="space-y-2">
                    <Label>Custom Fields</Label>
                    {customFields.map((field, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <Input 
                          value={field.name} 
                          onChange={(e) => {
                            const newFields = [...customFields];
                            newFields[idx].name = e.target.value;
                            setCustomFields(newFields);
                          }} 
                          placeholder="Field Name (e.g. Warranty Period)" 
                        />
                        <Button variant="outline" onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}>Remove</Button>
                      </div>
                    ))}
                    <Button variant="secondary" size="sm" onClick={() => setCustomFields([...customFields, { name: "" }])}>
                      + Add Custom Field
                    </Button>
                  </div>
                  <Button onClick={handleCreateCategory} className="w-full">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead>Custom Fields</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>
                    {(() => {
                      if (!cat.customFieldsJson) return "-";
                      if (Array.isArray(cat.customFieldsJson)) {
                        return cat.customFieldsJson.map((f: any) => f.name || f).join(", ");
                      }
                      if (typeof cat.customFieldsJson === "object") {
                        return Object.keys(cat.customFieldsJson).join(", ");
                      }
                      return "-";
                    })()}
                  </TableCell>
                </TableRow>
              ))}
              {categories.length === 0 && (
                <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-6">No categories found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="employees" className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-medium mb-6">Employee Directory</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.department?.name || "-"}</TableCell>
                  <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>{user.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePromoteUser(user.id, "DEPT_HEAD")}>
                          Make Dept Head
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePromoteUser(user.id, "ASSET_MANAGER")}>
                          Make Asset Manager
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePromoteUser(user.id, "EMPLOYEE")}>
                          Make Employee
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
