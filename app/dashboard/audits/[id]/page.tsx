"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AuditDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Finding state
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [findingResult, setFindingResult] = useState<"VERIFIED" | "MISSING" | "DAMAGED" | null>(null);
  const [findingNotes, setFindingNotes] = useState("");
  const [isFindingDialogOpen, setIsFindingDialogOpen] = useState(false);
  const [submittingFinding, setSubmittingFinding] = useState(false);

  // Close cycle state
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [autoRaiseMaintenance, setAutoRaiseMaintenance] = useState(false);
  const [forceClose, setForceClose] = useState(false); // override for closing when pending > 0
  const [closingCycle, setClosingCycle] = useState(false);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [auditRes, meRes] = await Promise.all([
        fetch(`/api/audits/${params.id}`),
        fetch("/api/me"),
      ]);
      
      if (meRes.ok) setCurrentUser(await meRes.json());
      if (auditRes.ok) setData(await auditRes.json());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleActionClick = (asset: any, result: "VERIFIED" | "MISSING" | "DAMAGED") => {
    setSelectedAsset(asset);
    setFindingResult(result);
    setFindingNotes("");
    if (result === "VERIFIED") {
      // For verified, we can submit immediately to save time, or show dialog. Let's just submit immediately if no notes needed.
      submitFinding(asset.id, result, "");
    } else {
      setIsFindingDialogOpen(true);
    }
  };

  const submitFinding = async (assetId: string, result: string, notes: string) => {
    setSubmittingFinding(true);
    try {
      const res = await fetch(`/api/audits/${params.id}/findings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId, result, notes }),
      });
      if (res.ok) {
        setIsFindingDialogOpen(false);
        fetchData(); // refresh data
      } else {
        const error = await res.json();
        alert(error.error || "Failed to record finding");
      }
    } catch (err) {
      console.error(err);
      alert("Error recording finding");
    }
    setSubmittingFinding(false);
  };

  const handleCloseCycle = async () => {
    setClosingCycle(true);
    try {
      const res = await fetch(`/api/audits/${params.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoRaiseMaintenance }),
      });
      if (res.ok) {
        setIsCloseDialogOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to close audit cycle");
      }
    } catch (err) {
      console.error(err);
      alert("Error closing audit cycle");
    }
    setClosingCycle(false);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!data || data.error) {
    return <div className="p-8 text-red-500">{data?.error || "Failed to load"}</div>;
  }

  const { auditCycle, pendingAssets } = data;
  const discrepancies = auditCycle.findings.filter((f: any) => f.result === "MISSING" || f.result === "DAMAGED");
  const verifiedCount = auditCycle.findings.filter((f: any) => f.result === "VERIFIED").length;

  const isManager = currentUser && ["ADMIN", "ASSET_MANAGER"].includes(currentUser.role);
  const isAssigned = auditCycle.assignments.some((a: any) => a.auditorId === currentUser?.id);
  const canRecord = auditCycle.status === "OPEN" && (isManager || isAssigned);
  const canClose = auditCycle.status === "OPEN" && isManager;
  const hasPending = pendingAssets.length > 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-4">
        <Link href="/dashboard/audits" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">{auditCycle.name}</h1>
        <Badge variant="outline" className={auditCycle.status === "OPEN" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200"}>
          {auditCycle.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Pending Assets */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <h2 className="text-lg font-medium">Pending Assets ({pendingAssets.length})</h2>
              <p className="text-sm text-gray-500">Assets in scope that haven't been audited yet.</p>
            </div>
            {canClose && (
              <Button 
                onClick={() => setIsCloseDialogOpen(true)}
                className="bg-gray-800 hover:bg-gray-900 text-white"
              >
                Close Audit Cycle
              </Button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      All assets in scope have been audited!
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingAssets.map((asset: any) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell>{asset.category?.name}</TableCell>
                      <TableCell>{asset.assetTag}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          disabled={!canRecord || submittingFinding}
                          onClick={() => handleActionClick(asset, "VERIFIED")}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Verified
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          disabled={!canRecord || submittingFinding}
                          onClick={() => handleActionClick(asset, "MISSING")}
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Missing
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          disabled={!canRecord || submittingFinding}
                          onClick={() => handleActionClick(asset, "DAMAGED")}
                        >
                          <AlertTriangle className="w-4 h-4 mr-1" /> Damaged
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Right Column: Discrepancies & Stats */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Audit Progress</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total in Scope:</span>
                <span className="font-semibold">{data.inScopeAssets.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending:</span>
                <span className="font-semibold">{pendingAssets.length}</span>
              </div>
              <div className="flex justify-between items-center text-green-600">
                <span>Verified:</span>
                <span className="font-semibold">{verifiedCount}</span>
              </div>
              <div className="flex justify-between items-center text-red-600">
                <span>Discrepancies:</span>
                <span className="font-semibold">{discrepancies.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[500px]">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium text-red-600 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Discrepancies
              </h2>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {discrepancies.length === 0 ? (
                <p className="text-gray-500 text-sm text-center mt-10">No discrepancies found yet.</p>
              ) : (
                discrepancies.map((f: any) => (
                  <div key={f.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">{f.asset?.name}</span>
                      <Badge variant="outline" className={f.result === "MISSING" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>
                        {f.result}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">Tag: {f.asset?.assetTag}</div>
                    {f.notes && <div className="text-sm bg-white p-2 rounded border">{f.notes}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Record Finding Dialog */}
      <Dialog open={isFindingDialogOpen} onOpenChange={setIsFindingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record {findingResult === "MISSING" ? "Missing" : "Damaged"} Asset</DialogTitle>
            <DialogDescription>
              Provide notes for the {findingResult?.toLowerCase()} asset: <strong>{selectedAsset?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 space-y-2">
            <label className="text-sm font-medium">Notes / Details</label>
            <Textarea 
              rows={4}
              placeholder="E.g., Screen is cracked, or Not found at designated desk..."
              value={findingNotes}
              onChange={(e) => setFindingNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFindingDialogOpen(false)}>Cancel</Button>
            <Button 
              className={findingResult === "MISSING" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-orange-600 hover:bg-orange-700 text-white"}
              onClick={() => submitFinding(selectedAsset.id, findingResult!, findingNotes)}
              disabled={submittingFinding}
            >
              {submittingFinding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record Finding"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Cycle Dialog */}
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Audit Cycle</DialogTitle>
          </DialogHeader>
          <div className="my-4 space-y-4">
            {hasPending && !forceClose ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm mb-3">
                  <strong>Warning:</strong> There are still {pendingAssets.length} pending assets.
                  You should generally audit all in-scope assets before closing.
                </p>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="forceClose" 
                    checked={forceClose}
                    onCheckedChange={(c) => setForceClose(c as boolean)}
                  />
                  <label htmlFor="forceClose" className="text-sm font-medium text-red-900 cursor-pointer">
                    I understand, close anyway
                  </label>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border rounded-lg text-sm text-gray-700">
                Closing this audit cycle will lock it from further findings.
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>MISSING</strong> assets will be marked as LOST.</li>
                  <li><strong>DAMAGED</strong> assets will have their condition updated.</li>
                </ul>
              </div>
            )}

            <div className="flex items-center space-x-2 border p-3 rounded-lg">
              <Checkbox 
                id="autoRaise" 
                checked={autoRaiseMaintenance}
                onCheckedChange={(c) => setAutoRaiseMaintenance(c as boolean)}
              />
              <label htmlFor="autoRaise" className="text-sm font-medium cursor-pointer">
                Auto-raise Maintenance Requests for DAMAGED assets
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-gray-800 hover:bg-gray-900 text-white"
              onClick={handleCloseCycle}
              disabled={closingCycle || (hasPending && !forceClose)}
            >
              {closingCycle ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Close Cycle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
