import { JSX } from "react"

export const LabelAndValueComponent = ({ label, value, noSpan }: { label: string, value: string | JSX.Element | undefined | null | number, noSpan?: boolean }) => {
    return (
        <div>
            <span className="text-sm font-semibold text-primary">{label}:</span>
            {value ?
                (noSpan ?
                    <div className="text-sm border rounded p-4 mt-2 text-purple-one overflow-hidden">{value}</div>
                    : <span className="text-sm font-medium text-purple-one">{" " + value}</span>)
                : <span className="text-gray-400">{" "}N/A</span>}
        </div>
    )
}