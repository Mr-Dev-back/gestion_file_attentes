import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Printer, Save, Truck, Search, Loader2, User, Phone, Hash, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../molecules/ui/card';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import { printTicket } from '../../utils/printTicket';
import { api } from '../../services/api';
import type { Ticket } from '../../types/ticket';
import type { Category } from '../../hooks/useCategories';
import { cn } from '../../lib/utils';

interface EntryFormViewProps {
    formData: any;
    setFormData: (data: any) => void;
    customerName: string;
    setCustomerName: (name: string) => void;
    salesPerson: string;
    setSalesPerson: (name: string) => void;
    successTicket: Ticket | null;
    isLoading: boolean;
    isValidatingOrder: boolean;
    availableCategories: Category[];
    isLoadingCats: boolean;
    onReset: () => void;
    onValidateOrder: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onGoHome: () => void;
    hasPrinter?: boolean;
}

export function EntryFormView({
    formData, setFormData,
    customerName, setCustomerName,
    salesPerson, setSalesPerson,
    successTicket, isLoading, isValidatingOrder,
    availableCategories, isLoadingCats,
    onReset, onValidateOrder, onSubmit, onGoHome,
    hasPrinter = true
}: EntryFormViewProps) {
    const [countdown, setCountdown] = useState(10);

    // Auto-reset on success
    useEffect(() => {
        let timer: any;
        if (successTicket) {
            setCountdown(10);
            timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        onReset();
                        onGoHome();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            
            // Auto-print if enabled
            if (hasPrinter) {
                handlePrint(successTicket);
            }
        }
        return () => clearInterval(timer);
    }, [successTicket]);

    const handlePrint = async (ticket: Ticket) => {
        try {
            await api.post(`/tickets/${ticket.ticketId}/log-print`);
            printTicket(ticket);
        } catch (error) {
            console.error('Failed to log print:', error);
            printTicket(ticket);
        }
    };

    if (successTicket) {
        return (
            <div className="max-w-3xl mx-auto px-6 py-12 text-center animate-in zoom-in duration-500">
                <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] p-12 shadow-2xl border border-white">
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-success/10 mb-8">
                        <CheckCircle2 className="h-20 w-20 text-success animate-bounce-message" />
                    </div>
                    
                    <h2 className="text-5xl font-black text-text-main mb-4 tracking-tight">C'EST TOUT BON !</h2>
                    <p className="text-2xl text-text-muted mb-8">Votre ticket est enregistré sous le numéro :</p>
                    
                    <div className="bg-slate-100 rounded-2xl p-6 mb-10 inline-block border-2 border-dashed border-slate-300">
                        <span className="text-6xl font-black font-mono tracking-widest text-primary">{successTicket.ticketNumber}</span>
                    </div>

                    <div className="space-y-6">
                        <p className="text-xl font-bold text-primary animate-pulse">
                            {hasPrinter ? "Récupérez votre ticket imprimé ci-dessous." : "Veuillez noter ce numéro ou prendre une photo."}
                        </p>
                        
                        <div className="flex flex-col items-center gap-4 pt-4">
                            <Button 
                                onClick={() => handlePrint(successTicket)} 
                                variant="outline" 
                                size="lg" 
                                className="h-16 px-10 rounded-2xl text-xl font-bold border-2"
                            >
                                <Printer className="mr-3 h-6 w-6" /> Ré-imprimer
                            </Button>
                            
                            <p className="text-slate-400 text-sm font-medium pt-8">
                                Retour à l'accueil dans <span className="font-black text-primary">{countdown}s</span>...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in">
            <div className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Button 
                        variant="ghost" 
                        onClick={onGoHome} 
                        className="h-16 w-16 rounded-2xl bg-white/50 hover:bg-white shadow-sm border border-white"
                    >
                        <ArrowLeft className="h-8 w-8 text-primary" />
                    </Button>
                    <div>
                        <h2 className="text-4xl font-black tracking-tight text-text-main uppercase">Enregistrement</h2>
                        <p className="text-text-muted font-bold">Veuillez remplir les informations ci-dessous</p>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-8 pb-20">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Colonne de Saisie */}
                    <Card className="border-white/50 bg-white/70 backdrop-blur-xl shadow-xl rounded-[2rem] overflow-hidden">
                        <CardHeader className="pb-4 pt-8 px-8">
                            <CardTitle className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-3">
                                <User className="h-5 w-5" /> Identification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 p-8 pt-0">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                                    <Hash className="h-3.5 w-3.5" /> Immatriculation *
                                </label>
                                <Input
                                    placeholder="ex: AA-123-BB"
                                    value={formData.licensePlate}
                                    onChange={e => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                                    required
                                    className="h-16 bg-white border-2 border-slate-100 focus:border-primary text-3xl font-mono font-black tracking-widest rounded-2xl text-center"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                                    <User className="h-3.5 w-3.5" /> Nom du Chauffeur *
                                </label>
                                <Input
                                    placeholder="VOTRE NOM"
                                    value={formData.driverName}
                                    onChange={e => setFormData({ ...formData, driverName: e.target.value.toUpperCase() })}
                                    required
                                    className="h-16 bg-white border-2 border-slate-100 focus:border-primary text-xl font-bold rounded-2xl"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5" /> Téléphone
                                </label>
                                <Input
                                    type="tel"
                                    placeholder="01 02 03 04 05"
                                    value={formData.driverPhone}
                                    onChange={e => setFormData({ ...formData, driverPhone: e.target.value })}
                                    className="h-16 bg-white border-2 border-slate-100 focus:border-primary text-xl font-bold rounded-2xl"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Colonne Logistique */}
                    <Card className="border-white/50 bg-white/70 backdrop-blur-xl shadow-xl rounded-[2rem] overflow-hidden">
                        <CardHeader className="pb-4 pt-8 px-8">
                            <CardTitle className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-3">
                                <Building className="h-5 w-5" /> Commande & Client
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 p-8 pt-0">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-text-muted uppercase tracking-widest">Bon de Commande (SAP/SAGE)</label>
                                <div className="flex gap-3">
                                    <Input
                                        placeholder="N° DE COMMANDE"
                                        value={formData.orderNumber}
                                        onChange={e => setFormData({ ...formData, orderNumber: e.target.value })}
                                        className="h-16 bg-white border-2 border-slate-100 focus:border-primary text-xl font-mono font-bold rounded-2xl flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={onValidateOrder}
                                        disabled={isValidatingOrder || !formData.orderNumber}
                                        className="h-16 w-16 rounded-2xl shadow-md"
                                    >
                                        {isValidatingOrder ? <Loader2 className="h-6 w-6 animate-spin" /> : <Search className="h-6 w-6" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-text-muted uppercase tracking-widest">Client / Société</label>
                                <div className={cn(
                                    "h-16 flex items-center px-4 rounded-2xl border-2 font-bold text-lg transition-all",
                                    customerName ? "bg-primary/5 border-primary text-primary" : "bg-slate-50 border-slate-100 text-slate-400"
                                )}>
                                    {customerName || "AUCUN CLIENT IDENTIFIÉ"}
                                </div>
                            </div>

                            <div className="p-4 bg-info/10 rounded-2xl border border-info/20 text-info text-xs font-medium leading-relaxed">
                                Si vous n'avez pas de numéro de commande, remplissez uniquement vos informations personnelles et sélectionnez le type d'opération ci-dessous.
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Section Catégories - Grille de Cartes */}
                <div className="space-y-6">
                    <label className="text-lg font-black text-text-main uppercase tracking-tight ml-2">
                        QUE VENEZ-VOUS FAIRE ? <span className="text-primary">*</span>
                    </label>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {isLoadingCats ? (
                            Array(5).fill(0).map((_, i) => <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-[1.5rem]" />)
                        ) : (
                            availableCategories.map((cat) => {
                                const isSelected = formData.categoryId === cat.categoryId;
                                return (
                                    <div
                                        key={cat.categoryId}
                                        onClick={() => setFormData({ ...formData, categoryId: isSelected ? '' : cat.categoryId })}
                                        className={cn(
                                            "relative group cursor-pointer h-32 flex flex-col items-center justify-center p-4 rounded-[1.5rem] border-4 transition-all duration-300",
                                            isSelected 
                                                ? "bg-primary border-primary text-white shadow-xl scale-105" 
                                                : "bg-white border-slate-100 hover:border-primary/50 text-text-main hover:scale-102 shadow-sm"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center mb-2",
                                            isSelected ? "bg-white/20" : "bg-primary/5 text-primary"
                                        )}>
                                            <Truck className="h-5 w-5" />
                                        </div>
                                        <span className="text-sm font-black text-center uppercase leading-tight line-clamp-2">{cat.name}</span>
                                        
                                        {isSelected && (
                                            <div className="absolute top-2 right-2">
                                                <CheckCircle2 className="h-5 w-5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Bouton de Validation GÉANT */}
                <div className="pt-6">
                    <Button
                        type="submit"
                        disabled={isLoading || !formData.categoryId}
                        className={cn(
                            "w-full h-24 text-3xl font-black rounded-[2rem] shadow-2xl transition-all duration-300 uppercase tracking-widest",
                            formData.categoryId 
                                ? "bg-primary hover:bg-primary/90 text-white shadow-primary/30" 
                                : "bg-slate-300 text-slate-500 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="h-10 w-10 animate-spin" />
                        ) : (
                            <span className="flex items-center gap-4">
                                <Save className="h-10 w-10" />
                                VALIDER MON ENREGISTREMENT
                            </span>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

