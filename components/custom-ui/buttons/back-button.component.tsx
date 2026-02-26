"use client"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

import { MouseEventHandler } from "react";

export const BackButton = ({ onClick }: { onClick?: MouseEventHandler<HTMLButtonElement> }) => {
    const router = useRouter();
    return (
        <Button
            type="button"
            variant="outline"
            onClick={onClick ? onClick : () => router.back()}
        >
            Back
        </Button>
    );
}