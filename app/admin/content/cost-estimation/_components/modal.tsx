import { useState, useTransition } from "react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CostEstimationService } from "@/services/api";
import { makeApiCall } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";


export const ModalComponent = ({ fetchCombos, showModal, modalTitle, setShowModal, setModalTitle, pendingCombos, setPendingCombos, handleModalCancel }: { fetchCombos: () => void, showModal: boolean, modalTitle: string, setShowModal: (show: boolean) => void, setModalTitle: (title: string) => void, pendingCombos: any[], setPendingCombos: (combos: any[]) => void, handleModalCancel: () => void }) => {
    const [loading, startTransition] = useTransition()
    const { toast } = useToast()
    const [localError, setLocalError] = useState<string>("");
    const service = new CostEstimationService();

    const validate = () => {
        for (const combo of pendingCombos) {
            if (!combo.price_per_sqft || isNaN(Number(combo.price_per_sqft)) || Number(combo.price_per_sqft) <= 0) {
                setLocalError("All prices must be positive numbers");
                return false;
            }
            if (!combo.furniture_included_price_per_sqft || isNaN(Number(combo.furniture_included_price_per_sqft)) || Number(combo.furniture_included_price_per_sqft) <= 0) {
                setLocalError("All furniture included prices must be positive numbers");
                return false;
            }
        }
        setLocalError("");
        return true;
    };

    const handleSave = () => {
        if (!validate()) return;
        handleModalSave();
    };

    // Modal handlers
    const handleModalPriceChange = (idx: number, value: string) => {
        const updated = pendingCombos.map((c, i) => i === idx ? { ...c, price_per_sqft: value } : c);
        setPendingCombos(updated);
    };
    const handleModalFurnitureIncludedPriceChange = (idx: number, value: string) => {
        const updated = pendingCombos.map((c, i) => i === idx ? { ...c, furniture_included_price_per_sqft: value } : c);
        setPendingCombos(updated);
    };

    const handleModalSave = async () => {
        startTransition(async () => {
            await makeApiCall(() => {
                for (const combo of pendingCombos) {
                    service.createCostEstimation(combo);
                }
            }, {
                afterSuccess: (data: any) => {
                    setShowModal(false);
                    setPendingCombos([]);
                    setModalTitle("");
                    fetchCombos();
                }, afterError: (err: any) => {
                    toast({ title: "Error", description: err.message || "Error fetching combos", variant: "destructive" })
                }
            })
        })
    };

    return (
        <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className="max-w-2xl p-0">
                <Card className="w-full">
                    <CardHeader>
                        <h3 className="text-lg font-semibold">{modalTitle}</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-[400px] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Project Type</TableHead>
                                        <TableHead>Style Preference</TableHead>
                                        <TableHead>Specification</TableHead>
                                        <TableHead>Price per Sqft</TableHead>
                                        <TableHead>Furniture Included Price per Sqft</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingCombos.map((combo, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{combo.project_type}</TableCell>
                                            <TableCell>{combo.style_preference}</TableCell>
                                            <TableCell>{combo.project_specification}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={combo.price_per_sqft}
                                                    onChange={e => handleModalPriceChange(idx, e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={combo.furniture_included_price_per_sqft}
                                                    onChange={e => handleModalFurnitureIncludedPriceChange(idx, e.target.value)}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {localError && <div className="text-red-500 mt-2">{localError}</div>}

                        <div className="flex justify-end gap-3 mt-4">
                            <Button variant="secondary" onClick={handleModalCancel}>Cancel</Button>
                            <Button
                                onClick={handleSave}
                                disabled={pendingCombos.some(c =>
                                    !c.price_per_sqft || isNaN(Number(c.price_per_sqft)) || Number(c.price_per_sqft) <= 0 ||
                                    !c.furniture_included_price_per_sqft || isNaN(Number(c.furniture_included_price_per_sqft)) || Number(c.furniture_included_price_per_sqft) <= 0
                                )}
                            >
                                Save All
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    );
};