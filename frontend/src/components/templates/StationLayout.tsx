import type { ReactNode } from 'react';

interface StationLayoutProps {
    title: string;
    icon?: ReactNode;
    leftPanel: ReactNode;
    rightPanel: ReactNode;
}

export function StationLayout({ title, icon, leftPanel, rightPanel }: StationLayoutProps) {
    return (
        <div className="flex h-full bg-gray-50 overflow-hidden">
            {/* LEFT PANEL: LIST */}
            <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        {icon}
                        {title}
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {leftPanel}
                </div>
            </div>

            {/* RIGHT PANEL: CONTENT */}
            <div className="flex-1 flex flex-col bg-white">
                {rightPanel}
            </div>
        </div>
    );
}
