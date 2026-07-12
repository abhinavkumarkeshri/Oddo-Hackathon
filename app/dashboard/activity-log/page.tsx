"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [userFilter, setUserFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    fetch("/api/activity-log")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLogs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredLogs = logs.filter((log: any) => {
    const matchesUser = log.user?.name.toLowerCase().includes(userFilter.toLowerCase());
    const matchesAction = log.action.toLowerCase().includes(actionFilter.toLowerCase());
    return matchesUser && matchesAction;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Activity Log</h1>
      </div>

      <div className="flex space-x-4 mb-4">
        <Input 
          placeholder="Filter by user..." 
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="max-w-xs bg-white"
        />
        <Input 
          placeholder="Filter by action..." 
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="max-w-xs bg-white"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
               <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600"/></TableCell></TableRow>
            ) : filteredLogs.length === 0 ? (
               <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No activity logs found</TableCell></TableRow>
            ) : (
              filteredLogs.map((log: any) => (
                <React.Fragment key={log.id}>
                  <TableRow className="cursor-pointer" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                    <TableCell>
                      {expandedId === log.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-gray-600">{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{log.user?.name || "System"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{log.entityType} ({log.entityId.slice(0, 8)}...)</TableCell>
                  </TableRow>
                  {expandedId === log.id && (
                    <TableRow className="bg-gray-50/50">
                      <TableCell colSpan={5} className="p-4">
                        <div className="text-sm">
                          <strong>Details:</strong>
                          <pre className="mt-2 p-3 bg-gray-100 rounded border border-gray-200 text-xs overflow-x-auto">
                            {JSON.stringify(log.detailsJson, null, 2)}
                          </pre>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import React from 'react';
