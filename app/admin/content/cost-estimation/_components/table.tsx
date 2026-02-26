"use client"

import { useState, useEffect, useTransition } from "react";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CostEstimationType } from "../types";
import { CostEstimationService } from "@/services/api/cost-estimation.service";
import { makeApiCall } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentLoading, ContentNotFound } from "@/components/common";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 10

export const TableComponent = () => {
    const { toast } = useToast()
    const [editRowId, setEditRowId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>("");
    const [editField, setEditField] = useState<'price_per_sqft' | 'furniture_included_price_per_sqft' | null>(null);
    const [editFurnitureValue, setEditFurnitureValue] = useState<string>("");
    const [combos, setCombos] = useState<CostEstimationType[]>([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const [loading, startTransition] = useTransition()
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)

    // Fetch combos from backend
    const fetchCombos = () => {
        startTransition(async () => {
            await makeApiCall(() => new CostEstimationService().getCostEstimations({ page: 1, pageSize: 100 }),
                {
                    afterSuccess: (data: any) => {
                        setCombos(data.data || [])
                        setTotal(data.count || 0)
                        setIsInitialLoad(false)
                    }, afterError: (err: any) => {
                        toast({ title: "Error", description: err.message || "Error fetching blogs", variant: "destructive" })
                        setIsInitialLoad(false)
                    }
                })
        })
    }

    useEffect(() => {
        fetchCombos();
    }, []);

    const startEdit = (rowId: string, value: string, field: 'price_per_sqft' | 'furniture_included_price_per_sqft') => {
        setEditRowId(rowId);
        setEditField(field);
        if (field === 'price_per_sqft') {
            setEditValue(value);
            setEditFurnitureValue("");
        } else {
            setEditFurnitureValue(value);
            setEditValue("");
        }
    };

    const cancelEdit = () => {
        setEditRowId(null);
        setEditField(null);
        setEditValue("");
        setEditFurnitureValue("");
    };

    const saveEdit = async () => {
        if (!editRowId || !editField) return;
        let value = editField === 'price_per_sqft' ? editValue : editFurnitureValue;
        if (!/^(\d+\.?\d*)$/.test(value) || parseFloat(value) <= 0) {
            toast({ title: "Error", description: "Enter a valid positive number", variant: "destructive" });
            return;
        }
        try {
            await makeApiCall(() => new CostEstimationService().updateCostEstimation(editRowId, { [editField]: value }), {
                afterSuccess: () => {
                    toast({ title: "Success", description: `${editField === 'price_per_sqft' ? 'Price' : 'Furniture Price'} updated`, variant: "success" });
                    fetchCombos();
                    cancelEdit();
                }, afterError: (err: any) => {
                    toast({ title: "Error", description: err.message || `Failed to update ${editField === 'price_per_sqft' ? 'price' : 'furniture price'}`, variant: "destructive" });
                }
            })
        } catch (err: any) {
            toast({ title: "Error", description: err.message || `Failed to update ${editField === 'price_per_sqft' ? 'price' : 'furniture price'}`, variant: "destructive" });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>All Price Combinations ({combos.length})</CardTitle>
            </CardHeader>
            <CardContent>
                {loading || isInitialLoad ? (
                    <ContentLoading />
                ) : combos.length === 0 ? (
                    <ContentNotFound message="No Cost estimation rows found" />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Project Type</TableHead>
                                <TableHead>Style Preference</TableHead>
                                <TableHead>Specification</TableHead>
                                <TableHead>Price per Sqft</TableHead>
                                <TableHead>Furniture Included Price per Sqft</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {combos.map((combo) => (
                                <TableRow key={combo.cost_estimation_id}>
                                    <TableCell>{combo.project_type}</TableCell>
                                    <TableCell>{combo.style_preference}</TableCell>
                                    <TableCell>{combo.project_specification}</TableCell>
                                    <TableCell>
                                        {editRowId === combo.cost_estimation_id && editField === 'price_per_sqft' ? (
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                className="w-28"
                                            />
                                        ) : (
                                            <span>{combo.price_per_sqft}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editRowId === combo.cost_estimation_id && editField === 'furniture_included_price_per_sqft' ? (
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={editFurnitureValue}
                                                onChange={e => setEditFurnitureValue(e.target.value)}
                                                className="w-28"
                                            />
                                        ) : (
                                            <span>{combo.furniture_included_price_per_sqft}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editRowId === combo.cost_estimation_id ? (
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="default" onClick={saveEdit} disabled={!(editField === 'price_per_sqft' ? editValue : editFurnitureValue)}>Save</Button>
                                                <Button size="sm" variant="secondary" onClick={cancelEdit}>Cancel</Button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => startEdit(combo.cost_estimation_id, combo.price_per_sqft, 'price_per_sqft')} disabled={!!editRowId}>Edit Price</Button>
                                                <Button size="sm" variant="outline" onClick={() => startEdit(combo.cost_estimation_id, combo.furniture_included_price_per_sqft, 'furniture_included_price_per_sqft')} disabled={!!editRowId}>Edit Furniture Price</Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                    <span>Page {page} of {Math.ceil(total / PAGE_SIZE) || 1}</span>
                    <div className="space-x-2">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
                        <Button variant="outline" size="sm" disabled={page * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>Next</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};