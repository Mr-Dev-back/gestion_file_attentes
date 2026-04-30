import { useState } from 'react';
import { useEntryForm } from '../hooks/useEntryForm';
import { EntryHeader } from '../components/entry/EntryHeader';
import { EntryHomeView } from '../components/entry/EntryHomeView';
import { EntryFormView } from '../components/entry/EntryFormView';

export default function Entry() {
    const [viewMode, setViewMode] = useState<'HOME' | 'ENTRY'>('HOME');
    
    const entryFormState = useEntryForm();

    if (viewMode === 'HOME') {
        return (
            <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow" style={{ animationDelay: '1s' }} />

                <EntryHeader viewMode={viewMode} onGoHome={() => setViewMode('HOME')} />
                
                <EntryHomeView 
                    queuedTrucks={entryFormState.tickets.filter(t => t.status === 'EN_ATTENTE')} 
                    onStartEntry={() => setViewMode('ENTRY')} 
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden pb-10">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow" style={{ animationDelay: '1s' }} />

            <EntryHeader viewMode={viewMode} onGoHome={() => setViewMode('HOME')} />
            
            <EntryFormView 
                {...entryFormState}
                onReset={entryFormState.handleReset}
                onValidateOrder={entryFormState.handleValidateOrder}
                onSubmit={entryFormState.handleSubmit}
                onGoHome={() => setViewMode('HOME')}
            />
        </div>
    );
}
