import { ReactNode } from "react";
import { AddTranslationsButton, BackButton } from "@/components/custom-ui";
import { LocaleEnum } from "@/lib/types";

interface ContentCreateEditLayoutProps {
    title: string;
    children: ReactNode;
    activeLocales?: LocaleEnum[];
    handleAddLocale?: (locale: LocaleEnum) => void;
    onBack?: () => void;
}

export const ContentCreateEditLayout = ({ title, children, activeLocales, handleAddLocale, onBack }: ContentCreateEditLayoutProps) => {
    return (
        <div className="max-w-xl lg:max-w-3xl xl:max-w-5xl mx-auto py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-2 md:gap-0">
                <h1 className="text-2xl font-bold">{title}</h1>
                <div className="flex w-full md:w-fit justify-between items-center gap-2">
                    {activeLocales && handleAddLocale &&
                        <AddTranslationsButton
                            activeLocales={activeLocales}
                            onAddLocale={handleAddLocale}
                        />
                    }
                    <BackButton onClick={onBack} />
                </div>
            </div>
            {/* Content */}
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
};
