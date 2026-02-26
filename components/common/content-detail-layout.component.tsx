import { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/custom-ui";
import { ContentLoading, ContentNotFound } from "@/components/common";

interface ContentDetailLayoutProps {
    title: string;
    onEdit?: () => void;
    loading?: boolean;
    notFound?: boolean;
    notFoundMessage?: string;
    children: ReactNode;
}

export const ContentDetailLayout = ({ title, onEdit, loading, notFound, notFoundMessage, children }: ContentDetailLayoutProps) => {
    return (
        <div className="max-w-xl lg:max-w-3xl xl:max-w-5xl mx-auto py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">{title}</h1>
                <div className="flex items-center gap-2">
                    {/* Only show Edit if not loading and not notFound */}
                    {onEdit && !loading && !notFound && (
                        <Button type="button" variant="default" onClick={onEdit}>Edit</Button>
                    )}
                    <BackButton/>
                </div>
            </div>
            {/* Content */}
            <div className="space-y-4">
                {loading ? (
                    <ContentLoading />
                ) : notFound ? (
                    <ContentNotFound message={notFoundMessage || "Content not found."} />
                ) : (
                    children
                )}
            </div>
        </div>
    );
}
