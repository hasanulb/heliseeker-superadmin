"use client"

import { useEffect, useState, useTransition } from "react";

import { CostEstimationType } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CostEstimationService } from "@/services/api";
import { makeApiCall } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ContentLoading, ContentNotFound } from "@/components/common";

const service = new CostEstimationService();

export const DropdownComponent = ({ setPendingCombos, setShowModal, setModalTitle }: { setPendingCombos: (combos: Omit<CostEstimationType, 'cost_estimation_id' | 'created_at'>[]) => void, setShowModal: (show: boolean) => void, setModalTitle: (title: string) => void }) => {
    const { toast } = useToast()
    const [edit, setEdit] = useState<{ type: 'projectType' | 'stylePreference' | 'specification' | null, oldValue: string, newValue: string }>({ type: null, oldValue: "", newValue: "" });
    const [dropdownError, setDropdownError] = useState<{ type: 'projectType' | 'stylePreference' | 'specification' | null, message: string }>({ type: null, message: "" });
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const [loading, startTransition] = useTransition()
    const [combos, setCombos] = useState<CostEstimationType[]>([]);

    // Derived dropdowns from combos
    const projectTypes = Array.from(new Set(combos.map(c => c.project_type)));
    const stylePreferences = Array.from(new Set(combos.map(c => c.style_preference)));
    const specifications = Array.from(new Set(combos.map(c => c.project_specification)));

    // Edit dropdown value (projectType, stylePreference, specification)
    async function handleEditDropdownValue(type: 'projectType' | 'stylePreference' | 'specification', oldValue: string, newValue: string) {
        startTransition(async () => {
            await makeApiCall(() => service.updateDropdownValue(type, oldValue, newValue), {
                afterSuccess: () => {
                    toast({ title: "Updated", description: "Dropdown value updated", variant: "success" })
                    fetchCombos()
                }, afterError: (err: any) => {
                    toast({ title: "Error", description: err.message || "Error updating dropdown value", variant: "destructive" })
                }, afterFinally: () => {
                    cancelEdit()
                }
            })
        })
    }

    // Fetch combos from backend
    async function fetchCombos() {
        startTransition(async () => {
            await makeApiCall(() => service.getCostEstimations({ page: 1, pageSize: 100 }), {
                afterSuccess: (data: any) => {
                    setCombos(data.data || [])
                    setIsInitialLoad(false)
                }, afterError: (err: any) => {
                    toast({ title: "Error", description: err.message || "Error fetching combos", variant: "destructive" })
                    setIsInitialLoad(false)
                }
            })
        })
    }

    useEffect(() => {
        fetchCombos();
    }, []);

    // Generate new combos for modal when adding a new dropdown value
    function getNewCombos(type: 'projectType' | 'stylePreference' | 'specification', newValue: string) {
        let newCombos: Omit<CostEstimationType, 'cost_estimation_id' | 'created_at'>[] = [];

        if (type === 'projectType') {
            newCombos = stylePreferences.flatMap(sp =>
                specifications.map(spec => ({
                    project_type: newValue,
                    style_preference: sp,
                    project_specification: spec,
                    price_per_sqft: "",
                    furniture_included_price_per_sqft: ""
                }))
            );
        } else if (type === 'stylePreference') {
            newCombos = projectTypes.flatMap(pt =>
                specifications.map(spec => ({
                    project_type: pt,
                    style_preference: newValue,
                    project_specification: spec,
                    price_per_sqft: "",
                    furniture_included_price_per_sqft: ""
                }))
            );
        } else if (type === 'specification') {
            newCombos = projectTypes.flatMap(pt =>
                stylePreferences.map(sp => ({
                    project_type: pt,
                    style_preference: sp,
                    project_specification: newValue,
                    price_per_sqft: "",
                    furniture_included_price_per_sqft: ""
                }))
            );
        }

        // Only return combos that don't already exist
        return newCombos.filter(combo =>
            !combos.some(c =>
                c.project_type === combo.project_type &&
                c.style_preference === combo.style_preference &&
                c.project_specification === combo.project_specification
            )
        );
    }

    // Handle adding new dropdown values
    const handleAddDropdownValue = (type: 'projectType' | 'stylePreference' | 'specification', newValue: string) => {
        if (!newValue.trim()) {
            setDropdownError({ type, message: "Value is required" });
            return;
        }

        const existingValues = type === 'projectType' ? projectTypes :
            type === 'stylePreference' ? stylePreferences : specifications;

        if (existingValues.includes(newValue.trim())) {
            setDropdownError({ type, message: `${newValue} already exists` });
            return;
        }

        const newCombos = getNewCombos(type, newValue.trim());

        if (newCombos.length > 0) {
            setPendingCombos(newCombos);
            setModalTitle(`Set prices for new combinations with '${newValue.trim()}'`);
            setShowModal(true);
        } else {
            // This shouldn't happen if we have existing combos, but just in case
            setDropdownError({ type, message: "No new combinations would be created" });
        }
    };

    // Check if we can delete a dropdown value (must have at least one combo remaining)
    const canDeleteDropdownValue = (type: 'projectType' | 'stylePreference' | 'specification', value: string) => {
        const otherValues = type === 'projectType' ? projectTypes.filter(pt => pt !== value) :
            type === 'stylePreference' ? stylePreferences.filter(sp => sp !== value) :
                specifications.filter(spec => spec !== value);
        return otherValues.length > 0;
    };

    const handleDeleteDropdownValue = async (type: 'projectType' | 'stylePreference' | 'specification', value: string) => {
        if (!canDeleteDropdownValue(type, value)) {
            setDropdownError({ type, message: `Cannot delete the last ${type.replace(/([A-Z])/g, ' $1').toLowerCase()}` });
            return;
        }

        const combosToDelete = combos.filter(combo => {
            if (type === 'projectType') return combo.project_type === value;
            if (type === 'stylePreference') return combo.style_preference === value;
            if (type === 'specification') return combo.project_specification === value;
            return false;
        });

        startTransition(async () => {
            try {
                for (const combo of combosToDelete) {
                    await service.deleteCostEstimation(combo.cost_estimation_id);
                }
                await fetchCombos();
                toast({ title: "Deleted", description: "Combinations deleted", variant: "success" })
            } catch (err: any) {
                toast({ title: "Error", description: err.message || "Error deleting combinations", variant: "destructive" })
            }
        });
    };

    const startEdit = (type: 'projectType' | 'stylePreference' | 'specification', value: string) => {
        setEdit({ type, oldValue: value, newValue: value });
        setDropdownError({ type: null, message: "" });
    };
    const cancelEdit = () => {
        setEdit({ type: null, oldValue: "", newValue: "" });
        setDropdownError({ type: null, message: "" });
    };
    const saveEdit = () => {
        if (!edit.newValue.trim()) {
            setDropdownError({ type: edit.type, message: "Value is required" });
            return;
        }
        // Check for duplicates
        let exists = false;
        if (edit.type === 'projectType') exists = projectTypes.includes(edit.newValue.trim());
        if (edit.type === 'stylePreference') exists = stylePreferences.includes(edit.newValue.trim());
        if (edit.type === 'specification') exists = specifications.includes(edit.newValue.trim());
        if (exists && edit.oldValue !== edit.newValue.trim()) {
            setDropdownError({ type: edit.type, message: "Duplicate value" });
            return;
        }
        handleEditDropdownValue(edit.type!, edit.oldValue, edit.newValue.trim());
        cancelEdit();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dropdown Value Management</CardTitle>
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
                                <TableHead>Project Types</TableHead>
                                <TableHead>Style Preferences</TableHead>
                                <TableHead>Specifications</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                {/* Project Types Column */}
                                <TableCell className="align-top">
                                    <ul className="pl-5 m-0">
                                        {projectTypes.map((type) => (
                                            <li key={type} className="mb-1 flex gap-2 justify-between items-center">
                                                {edit.type === 'projectType' && edit.oldValue === type ? (
                                                    <>
                                                        <Input
                                                            value={edit.newValue}
                                                            onChange={e => setEdit({ ...edit, newValue: e.target.value })}
                                                            className="w-32"
                                                        />
                                                        <Button size="sm" onClick={saveEdit}>Save</Button>
                                                        <Button size="sm" variant="secondary" onClick={cancelEdit}>Cancel</Button>
                                                        {dropdownError.type === 'projectType' && dropdownError.message && <span className="text-xs text-red-500 ml-2">{dropdownError.message}</span>}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>{type}</span>
                                                        <div className="flex gap-1">
                                                            <Button size="sm" variant="outline" onClick={() => startEdit('projectType', type)} disabled={!!edit.type}>Edit</Button>
                                                            {canDeleteDropdownValue('projectType', type) && (
                                                                <Button size="sm" variant="destructive" onClick={() => handleDeleteDropdownValue('projectType', type)}>
                                                                    Delete
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="flex flex-col gap-2 mt-6">
                                        <div className="flex gap-2">
                                            <Input
                                                type="text"
                                                placeholder="New project type"
                                                id="newProjectType"
                                                className="flex-1"
                                            />
                                            <Button
                                                onClick={() => {
                                                    const input = document.getElementById('newProjectType') as HTMLInputElement;
                                                    handleAddDropdownValue('projectType', input.value);
                                                    input.value = '';
                                                }}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                        {dropdownError.type === 'projectType' && dropdownError.message && <span className="text-xs text-red-500 ml-2">{dropdownError.message}</span>}
                                    </div>
                                </TableCell>
                                {/* Style Preferences Column */}
                                <TableCell className="align-top">
                                    <ul className="pl-5 m-0">
                                        {stylePreferences.map((style) => (
                                            <li key={style} className="mb-1 flex gap-1 justify-between items-center">
                                                {edit.type === 'stylePreference' && edit.oldValue === style ? (
                                                    <>
                                                        <Input
                                                            value={edit.newValue}
                                                            onChange={e => setEdit({ ...edit, newValue: e.target.value })}
                                                            className="w-32"
                                                        />
                                                        <Button size="sm" onClick={saveEdit}>Save</Button>
                                                        <Button size="sm" variant="secondary" onClick={cancelEdit}>Cancel</Button>
                                                        {dropdownError.type === 'stylePreference' && dropdownError.message && <span className="text-xs text-red-500 ml-2">{dropdownError.message}</span>}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>{style}</span>
                                                        <div className="flex gap-1">
                                                            <Button size="sm" variant="outline" onClick={() => startEdit('stylePreference', style)} disabled={!!edit.type}>Edit</Button>
                                                            {canDeleteDropdownValue('stylePreference', style) && (
                                                                <Button size="sm" variant="destructive" onClick={() => handleDeleteDropdownValue('stylePreference', style)}>
                                                                    Delete
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="flex flex-col gap-2 mt-6">
                                        <div className="flex gap-2">
                                            <Input
                                                type="text"
                                                placeholder="New style preference"
                                                id="newStylePreference"
                                                className="flex-1"
                                            />
                                            <Button
                                                onClick={() => {
                                                    const input = document.getElementById('newStylePreference') as HTMLInputElement;
                                                    handleAddDropdownValue('stylePreference', input.value);
                                                    input.value = '';
                                                }}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                        {dropdownError.type === 'stylePreference' && dropdownError.message && <span className="text-xs text-red-500 ml-2">{dropdownError.message}</span>}
                                    </div>
                                </TableCell>
                                {/* Specifications Column */}
                                <TableCell className="align-top">
                                    <ul className="pl-5 m-0">
                                        {specifications.map((spec) => (
                                            <li key={spec} className="mb-1 flex gap-2 justify-between items-center">
                                                {edit.type === 'specification' && edit.oldValue === spec ? (
                                                    <>
                                                        <Input
                                                            value={edit.newValue}
                                                            onChange={e => setEdit({ ...edit, newValue: e.target.value })}
                                                            className="w-32"
                                                        />
                                                        <Button size="sm" onClick={saveEdit}>Save</Button>
                                                        <Button size="sm" variant="secondary" onClick={cancelEdit}>Cancel</Button>
                                                        {dropdownError.type === 'specification' && dropdownError.message && <span className="text-xs text-red-500 ml-2">{dropdownError.message}</span>}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>{spec}</span>
                                                        <div className="flex gap-1">
                                                            <Button size="sm" variant="outline" onClick={() => startEdit('specification', spec)} disabled={!!edit.type}>Edit</Button>
                                                            {canDeleteDropdownValue('specification', spec) && (
                                                                <Button size="sm" variant="destructive" onClick={() => handleDeleteDropdownValue('specification', spec)}>
                                                                    Delete
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="flex flex-col gap-2 mt-6">
                                        <div className="flex gap-2">
                                            <Input
                                                type="text"
                                                placeholder="New specification"
                                                id="newSpecification"
                                                className="flex-1"
                                            />
                                            <Button
                                                onClick={() => {
                                                    const input = document.getElementById('newSpecification') as HTMLInputElement;
                                                    handleAddDropdownValue('specification', input.value);
                                                    input.value = '';
                                                }}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                        {dropdownError.type === 'specification' && dropdownError.message && <span className="text-xs text-red-500 ml-2">{dropdownError.message}</span>}
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
};
