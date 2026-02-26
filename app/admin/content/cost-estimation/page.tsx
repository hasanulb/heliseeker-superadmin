"use client";

import React, { useEffect, useTransition, useState } from "react";

import { CostEstimationType } from "./types";
import { DropdownComponent, ManualRowComponent, ModalComponent, TableComponent } from "./_components";
import { CostEstimationService } from "@/services/api/cost-estimation.service";
import { makeApiCall } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ContentLoading } from "@/components/common";

const service = new CostEstimationService();

export default function CostEstimationAdminPage() {
    const [combos, setCombos] = useState<CostEstimationType[]>([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const [loading, startTransition] = useTransition()
    const { toast } = useToast()

    // Modal state for batch adding combos
    const [showModal, setShowModal] = useState(false);
    const [pendingCombos, setPendingCombos] = useState<Omit<CostEstimationType, 'cost_estimation_id' | 'created_at'>[]>([]);
    const [modalTitle, setModalTitle] = useState("");

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
                }, afterFinally: () => {
                    setIsInitialLoad(false)
                }
            })
        })
    }

    useEffect(() => {
        fetchCombos();
    }, []);

    const handleModalCancel = () => {
        setShowModal(false);
        setPendingCombos([]);
        setModalTitle("");
    };

    if (loading) return <ContentLoading />;
    if (isInitialLoad) return <ContentLoading />;

    return (
        <div style={{ padding: 24 }}>
            <div className="flex flex-col w-full items-start mb-4">
                <h1 className="text-2xl font-semibold text-foreground">Cost Estimation Management</h1>
                <p className="text-sm md:text-base text-muted-foreground">Create, edit, and manage your cost estimations</p>
            </div>

            {/* Show manual entry form if no combos exist or user wants to add manually */}
            <ManualRowComponent
                combos={combos}
                fetchCombos={fetchCombos} />

            {/* Dropdown Management - Only show if we have combos */}
            <DropdownComponent
                setPendingCombos={setPendingCombos}
                setShowModal={setShowModal}
                setModalTitle={setModalTitle} />

            {/* Modal for setting prices on new combinations */}
            <ModalComponent
                showModal={showModal}
                modalTitle={modalTitle}
                setShowModal={setShowModal}
                setModalTitle={setModalTitle}
                pendingCombos={pendingCombos}
                setPendingCombos={setPendingCombos}
                handleModalCancel={handleModalCancel}
                fetchCombos={fetchCombos} />

            {/* All combinations table */}
            <TableComponent />
        </div>
    );
}