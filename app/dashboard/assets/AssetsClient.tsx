"use client";

import { useState, useEffect, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Filter } from "lucide-react";

const getStatusColor = (status: string) => {
  switch (status) {
    case "AVAILABLE": return "default";
    case "ALLOCATED": return "secondary";
    case "UNDER_MAINTENANCE": return "destructive";
    default: return "outline";
  }
};

export default function AssetsClient({ role }: { role: string }) {
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");

  // Registration Dialog
  const [regOpen, setRegOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: "", categoryId: "", serialNumber: "", acquisitionDate: "",
    acquisitionCost: "", condition: "GOOD", location: "", departmentId: "",
    isBookable: false, photoUrl: "", documentUrls: [] as string[]
  });

  // Details Sheet
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [assetDetails, setAssetDetails] = useState<any>(null);

  const fetchAssets = async () => {
    const res = await fetch("/api/assets");
    if (res.ok) setAssets(await res.json());
    setLoading(false);
  };

  const fetchCategoriesAndDepts = async () => {
    const [catRes, deptRes] = await Promise.all([
      fetch("/api/categories"), fetch("/api/departments")
    ]);
    if (catRes.ok) setCategories(await catRes.json());
    if (deptRes.ok) setDepartments(await deptRes.json());
  };

  useEffect(() => {
    fetchAssets();
    fetchCategoriesAndDepts();
  }, []);

  const handleRegisterAsset = async () => {
    await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newAsset,
        departmentId: newAsset.departmentId || null,
        serialNumber: newAsset.serialNumber || null,
      })
    });
    setRegOpen(false);
    fetchAssets();
  };

  const handleRowClick = async (id: string) => {
    setSelectedAssetId(id);
    const res = await fetch(`/api/assets/${id}`);
    if (res.ok) setAssetDetails(await res.json());
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchSearch = search ? 
        asset.name.toLowerCase().includes(search.toLowerCase()) || 
        asset.assetTag.toLowerCase().includes(search.toLowerCase()) ||
        (asset.serialNumber || "").toLowerCase().includes(search.toLowerCase()) ||
        (asset.qrCode || "").toLowerCase().includes(search.toLowerCase())
        : true;
      const matchCat = filterCategory === "all" || asset.categoryId === filterCategory;
      const matchStatus = filterStatus === "all" || asset.status === filterStatus;
      const matchDept = filterDepartment === "all" || asset.departmentId === filterDepartment;
      return matchSearch && matchCat && matchStatus && matchDept;
    });
  }, [assets, search, filterCategory, filterStatus, filterDepartment]);

  const canRegister = role === "ADMIN" || role === "ASSET_MANAGER";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold tracking-tight">Asset Directory</h1>
        {canRegister && (
          <Dialog open={regOpen} onOpenChange={setRegOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Register Asset</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Register New Asset</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Asset Name *</Label>
                  <Input value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={newAsset.categoryId} onValueChange={v => setNewAsset({...newAsset, categoryId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category">
                        {categories.find(c => c.id === newAsset.categoryId)?.name || "Select Category"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Serial Number</Label>
                  <Input value={newAsset.serialNumber} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select value={newAsset.condition} onValueChange={v => setNewAsset({...newAsset, condition: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Condition">
                        {newAsset.condition === "GOOD" ? "Good" :
                         newAsset.condition === "FAIR" ? "Fair" :
                         newAsset.condition === "POOR" ? "Poor" :
                         newAsset.condition === "DAMAGED" ? "Damaged" : "Condition"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GOOD">Good</SelectItem>
                      <SelectItem value="FAIR">Fair</SelectItem>
                      <SelectItem value="POOR">Poor</SelectItem>
                      <SelectItem value="DAMAGED">Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Acquisition Date</Label>
                  <Input type="date" value={newAsset.acquisitionDate} onChange={e => setNewAsset({...newAsset, acquisitionDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Cost</Label>
                  <Input type="number" value={newAsset.acquisitionCost} onChange={e => setNewAsset({...newAsset, acquisitionCost: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={newAsset.departmentId} onValueChange={v => setNewAsset({...newAsset, departmentId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign to Dept">
                        {newAsset.departmentId === "none" ? "None" : 
                         departments.find(d => d.id === newAsset.departmentId)?.name || "Assign to Dept"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={newAsset.location} onChange={e => setNewAsset({...newAsset, location: e.target.value})} />
                </div>
                <div className="col-span-2 flex items-center space-x-2 pt-2">
                  <Checkbox id="bookable" checked={newAsset.isBookable} onCheckedChange={(c: boolean) => setNewAsset({...newAsset, isBookable: c})} />
                  <Label htmlFor="bookable">Is Bookable (Available for reservation)</Label>
                </div>
                <Button className="col-span-2 mt-4" onClick={handleRegisterAsset} disabled={!newAsset.name || !newAsset.categoryId}>
                  Save Asset
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tag, SN, name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category">
              {filterCategory === "all" ? "All Categories" : 
               categories.find(c => c.id === filterCategory)?.name || "Category"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Department">
              {filterDepartment === "all" ? "All Departments" : 
               departments.find(d => d.id === filterDepartment)?.name || "Department"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status">
              {filterStatus === "all" ? "All Status" :
               filterStatus === "AVAILABLE" ? "Available" :
               filterStatus === "ALLOCATED" ? "Allocated" :
               filterStatus === "UNDER_MAINTENANCE" ? "Maintenance" :
               filterStatus === "RETIRED" ? "Retired" : "Status"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="ALLOCATED">Allocated</SelectItem>
            <SelectItem value="UNDER_MAINTENANCE">Maintenance</SelectItem>
            <SelectItem value="RETIRED">Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset Tag</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssets.map(asset => (
              <TableRow key={asset.id} className="cursor-pointer hover:bg-slate-50" onClick={() => handleRowClick(asset.id)}>
                <TableCell className="font-semibold text-primary">{asset.assetTag}</TableCell>
                <TableCell>{asset.name}</TableCell>
                <TableCell>{asset.category?.name}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(asset.status) as any}>{asset.status}</Badge>
                </TableCell>
                <TableCell>{asset.department?.name || "-"}</TableCell>
                <TableCell>{asset.location || "-"}</TableCell>
              </TableRow>
            ))}
            {filteredAssets.length === 0 && !loading && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No assets match your filters.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedAssetId} onOpenChange={(open) => { if(!open) { setSelectedAssetId(null); setAssetDetails(null); }}}>
        <SheetContent className="w-[90vw] sm:w-[600px] sm:max-w-none overflow-y-auto !m-0 p-6 sm:p-8">
          {assetDetails ? (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl">{assetDetails.name}</SheetTitle>
                <Badge variant={getStatusColor(assetDetails.status) as any} className="w-fit">{assetDetails.status}</Badge>
              </SheetHeader>
              <Tabs defaultValue="overview">
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="allocations">Allocation History</TabsTrigger>
                  <TabsTrigger value="maintenance">Maintenance History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div><p className="text-muted-foreground">Asset Tag</p><p className="font-medium">{assetDetails.assetTag}</p></div>
                    <div><p className="text-muted-foreground">Category</p><p className="font-medium">{assetDetails.category?.name}</p></div>
                    <div><p className="text-muted-foreground">Serial Number</p><p className="font-medium">{assetDetails.serialNumber || "-"}</p></div>
                    <div><p className="text-muted-foreground">Condition</p><p className="font-medium">{assetDetails.condition}</p></div>
                    <div><p className="text-muted-foreground">Acquisition Date</p><p className="font-medium">{assetDetails.acquisitionDate ? new Date(assetDetails.acquisitionDate).toLocaleDateString() : "-"}</p></div>
                    <div><p className="text-muted-foreground">Department</p><p className="font-medium">{assetDetails.department?.name || "-"}</p></div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">QR Code</p>
                    <div className="bg-white p-4 inline-block border rounded-lg">
                      <QRCodeSVG value={assetDetails.qrCode || assetDetails.assetTag} size={120} />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="allocations">
                  {assetDetails.allocations?.length > 0 ? (
                    <div className="space-y-4">
                      {assetDetails.allocations.map((alloc: any) => (
                        <div key={alloc.id} className="p-4 border rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-medium">{alloc.user?.name}</p>
                            <p className="text-xs text-muted-foreground">From: {new Date(alloc.allocatedAt).toLocaleDateString()}</p>
                          </div>
                          <Badge variant={alloc.status === "ACTIVE" ? "default" : "outline"}>{alloc.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground text-center py-8">No allocation history.</p>}
                </TabsContent>
                
                <TabsContent value="maintenance">
                  {assetDetails.maintenanceRequests?.length > 0 ? (
                    <div className="space-y-4">
                      {assetDetails.maintenanceRequests.map((req: any) => (
                        <div key={req.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <p className="font-medium">{req.issueDescription}</p>
                            <Badge variant="secondary">{req.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Reported by: {req.raisedBy?.name} on {new Date(req.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground text-center py-8">No maintenance history.</p>}
                </TabsContent>
              </Tabs>
            </>
          ) : <p className="text-center py-12">Loading details...</p>}
        </SheetContent>
      </Sheet>
    </div>
  );
}
