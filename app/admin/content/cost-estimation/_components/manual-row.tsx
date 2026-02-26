'use client'
import { useState, useTransition } from "react";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CostEstimationType } from "../types";
import { CostEstimationService } from "@/services/api";
import { makeApiCall } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const service = new CostEstimationService();

export const ManualRowComponent = ({ combos, fetchCombos }: { combos: CostEstimationType[]; fetchCombos: () => void }) => {
    const [loading, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast()

    // Manual combo entry state (for first combo or individual additions)
    const [manualCombo, setManualCombo] = useState({
        project_type: "",
        style_preference: "",
        project_specification: "",
        price_per_sqft: "",
        furniture_included_price_per_sqft: ""
    });

    // Handle manual combo entry
    const handleManualComboChange = (field: keyof typeof manualCombo, value: string) => {
        setManualCombo(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveManualCombo = async () => {
        if (!manualCombo.project_type || !manualCombo.style_preference ||
            !manualCombo.project_specification || !manualCombo.price_per_sqft || !manualCombo.furniture_included_price_per_sqft) {
            setError("All fields are required");
            return;
        }
        if (isNaN(Number(manualCombo.price_per_sqft)) || Number(manualCombo.price_per_sqft) <= 0) {
            setError("Price per sqft must be a positive number");
            return;
        }
        if (isNaN(Number(manualCombo.furniture_included_price_per_sqft)) || Number(manualCombo.furniture_included_price_per_sqft) <= 0) {
            setError("Furniture included price per sqft must be a positive number");
            return;
        }

        // Check if combo already exists
        const exists = combos.some(c =>
            c.project_type === manualCombo.project_type &&
            c.style_preference === manualCombo.style_preference &&
            c.project_specification === manualCombo.project_specification
        );

        if (exists) {
            setError("This combination already exists");
            return;
        }

        startTransition(async () => {
            await makeApiCall(() => service.createCostEstimation(manualCombo), {
                afterSuccess: () => {
                    toast({ title: "Success", description: "Combo added successfully", variant: "success" })
                    fetchCombos()
                }, afterError: (err: any) => {
                    toast({ title: "Error", description: err.message || "Error adding combo", variant: "destructive" })
                }, afterFinally: () => {
                    setManualCombo({
                        project_type: "",
                        style_preference: "",
                        project_specification: "",
                        price_per_sqft: "",
                        furniture_included_price_per_sqft: ""
                    })
                }
            })
        })
    };

    const handleCancelManualEntry = () => {
        setManualCombo({
            project_type: "",
            style_preference: "",
            project_specification: "",
            price_per_sqft: "",
            furniture_included_price_per_sqft: ""
        });
        setError(null);
    };

    return (
        (combos.length === 0) && (
            <Card className="mb-6">
                <CardHeader>
                    <h3 className="text-lg font-semibold">{combos.length === 0 ? 'Add Your First Combination' : 'Add Manual Combination'}</h3>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <Input
                            type="text"
                            placeholder="Project Type"
                            value={manualCombo.project_type}
                            onChange={(e) => handleManualComboChange('project_type', e.target.value)}
                        />
                        <Input
                            type="text"
                            placeholder="Style Preference"
                            value={manualCombo.style_preference}
                            onChange={(e) => handleManualComboChange('style_preference', e.target.value)}
                        />
                        <Input
                            type="text"
                            placeholder="Specification"
                            value={manualCombo.project_specification}
                            onChange={(e) => handleManualComboChange('project_specification', e.target.value)}
                        />
                        <Input
                            type="number"
                            placeholder="Price per Sqft"
                            min="0"
                            step="0.01"
                            value={manualCombo.price_per_sqft}
                            onChange={(e) => handleManualComboChange('price_per_sqft', e.target.value)}
                        />
                        <Input
                            type="number"
                            placeholder="Furniture Included Price per Sqft"
                            min="0"
                            step="0.01"
                            value={manualCombo.furniture_included_price_per_sqft}
                            onChange={(e) => handleManualComboChange('furniture_included_price_per_sqft', e.target.value)}
                        />
                    </div>
                    {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
                    <div className="flex gap-2">
                        <Button onClick={handleSaveManualCombo}>Save</Button>
                        {combos.length > 0 && (
                            <Button variant="secondary" onClick={handleCancelManualEntry}>Cancel</Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    )
}