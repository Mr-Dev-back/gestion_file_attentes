import { ArrowLeft, CheckCircle2, Printer, Save, Truck, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../molecules/ui/card';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import { Badge } from '../atoms/ui/badge';
import { printTicket } from '../../utils/printTicket';
import { api } from '../../services/api';
import type { Ticket } from '../../types/ticket';
import type { Category } from '../../hooks/useCategories';

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
}

export function EntryFormView({
    formData, setFormData,
    customerName, setCustomerName,
    salesPerson, setSalesPerson,
    successTicket, isLoading, isValidatingOrder,
    availableCategories, isLoadingCats,
    onReset, onValidateOrder, onSubmit, onGoHome
}: EntryFormViewProps) {

    const handlePrint = async (ticket: Ticket) => {
        try {
            await api.post(`/tickets/${ticket.ticketId}/log-print`);
            printTicket(ticket);
        } catch (error) {
            console.error('Failed to log print:', error);
            printTicket(ticket);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={onGoHome} className="rounded-full hover:bg-surface/80">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                    </Button>
                    <h2 className="text-3xl font-black tracking-tight text-text-main">Enregistrement Camion</h2>
                </div>
            </div>

            <div className="relative group">
                <Card className="relative border-white/50 bg-white/60 backdrop-blur-xl shadow-2xl rounded-[1.8rem] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-50"></div>
                    <CardHeader className="bg-surface/30 border-b border-border/40 pb-6 pt-8">
                        <CardTitle className="text-xl font-bold flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-inner">
                                <Truck className="h-6 w-6" />
                            </div>
                            Informations du Transport
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 p-8">
                        {successTicket ? (
                            <div className="text-center py-12 space-y-6 animate-scale-in">
                                <div className="inline-block p-6 rounded-full bg-success/10 mb-4 animate-bounce-message">
                                    <CheckCircle2 className="h-20 w-20 text-success" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-text-main mb-2">Ticket Généré !</h3>
                                    <p className="text-xl text-text-muted font-mono tracking-wider">{successTicket.ticketNumber}</p>
                                </div>
                                <div className="flex gap-4 justify-center pt-6">
                                    <Button onClick={() => handlePrint(successTicket)} variant="outline" size="lg" className="rounded-full shadow-sm hover:shadow-md transition-all">
                                        <Printer className="mr-2 h-5 w-5" />Imprimer le Ticket
                                    </Button>
                                    <Button onClick={onReset} size="lg" className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                                        Nouveau Camion
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={onSubmit} className="space-y-8">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-3 group/input">
                                        <label className="text-sm font-bold text-text-main uppercase tracking-wider ml-1">Immatriculation *</label>
                                        <div className="relative transform transition-all duration-300 focus-within:scale-[1.02]">
                                            <Input
                                                placeholder="AA-123-BB"
                                                value={formData.licensePlate}
                                                onChange={e => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                                                required
                                                className="h-12 bg-white/70 border-border/50 focus:border-primary/50 focus:ring-primary/20 text-lg font-mono font-bold tracking-wider rounded-xl shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3 group/input">
                                        <label className="text-sm font-bold text-text-main uppercase tracking-wider ml-1">Chauffeur *</label>
                                        <div className="relative transform transition-all duration-300 focus-within:scale-[1.02]">
                                            <Input
                                                placeholder="Nom complet"
                                                value={formData.driverName}
                                                onChange={e => setFormData({ ...formData, driverName: e.target.value })}
                                                required
                                                className="h-12 bg-white/70 border-border/50 focus:border-primary/50 focus:ring-primary/20 text-lg rounded-xl shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3 group/input">
                                        <label className="text-sm font-bold text-text-main uppercase tracking-wider ml-1">Téléphone Chauffeur</label>
                                        <div className="relative transform transition-all duration-300 focus-within:scale-[1.02]">
                                            <Input
                                                placeholder="0102030405"
                                                value={formData.driverPhone}
                                                onChange={e => setFormData({ ...formData, driverPhone: e.target.value })}
                                                className="h-12 bg-white/70 border-border/50 focus:border-primary/50 focus:ring-primary/20 text-lg rounded-xl shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3 group/input">
                                        <label className="text-sm font-bold text-text-main uppercase tracking-wider ml-1">Bon de Commande</label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Rechercher SAP/SAGE..."
                                                value={formData.orderNumber}
                                                onChange={e => setFormData({ ...formData, orderNumber: e.target.value })}
                                                className="h-12 bg-white/70 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl shadow-sm flex-1"
                                            />
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={onValidateOrder}
                                                disabled={isValidatingOrder || !formData.orderNumber}
                                                className="h-12 px-4 rounded-xl shadow-sm hover:shadow-md transition-all"
                                            >
                                                <span className="inline-flex items-center">
                                                    {isValidatingOrder ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                                                </span>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-3 group/input">
                                        <label className="text-sm font-bold text-text-main uppercase tracking-wider ml-1">Client / Société</label>
                                        <Input
                                            placeholder="Client identifié"
                                            value={customerName}
                                            onChange={e => setCustomerName(e.target.value)}
                                            readOnly={!!formData.orderNumber}
                                            className={`h-12 border-border/50 rounded-xl shadow-sm ${formData.orderNumber ? 'bg-primary/5 font-bold text-primary border-primary/20' : 'bg-white/70'}`}
                                        />
                                    </div>
                                    <div className="space-y-3 group/input col-span-full">
                                        <label className="text-sm font-bold text-text-main uppercase tracking-wider ml-1">Commercial / Vendeur</label>
                                        <Input
                                            placeholder="Commercial identifié"
                                            value={salesPerson}
                                            onChange={e => setSalesPerson(e.target.value)}
                                            readOnly={!!formData.orderNumber}
                                            className={`h-12 border-border/50 rounded-xl shadow-sm ${formData.orderNumber && salesPerson ? 'bg-primary/5 font-bold text-primary border-primary/20' : 'bg-white/70'}`}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-text-main uppercase tracking-wider ml-1">
                                        Type d'opération *
                                        {formData.orderNumber && <span className="text-xs font-normal text-text-muted ml-2">(Auto-sélectionné depuis la commande)</span>}
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        {isLoadingCats ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : (
                                            availableCategories.map((cat) => {
                                                const isSelected = formData.categoryId === cat.categoryId;
                                                return (
                                                    <Badge
                                                        key={cat.categoryId}
                                                        variant={isSelected ? "default" : "outline"}
                                                        className={`py-2.5 px-5 text-sm rounded-xl cursor-pointer transition-all duration-200 ${isSelected
                                                            ? "bg-primary border-primary text-white shadow-md scale-105"
                                                            : "bg-white/50 hover:bg-white hover:border-primary/50 text-text-muted hover:text-primary"
                                                            }`}
                                                        onClick={() => {
                                                            setFormData({
                                                                ...formData,
                                                                categoryId: isSelected ? '' : cat.categoryId
                                                            });
                                                        }}
                                                    >
                                                        <span className="inline-flex items-center">
                                                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 mr-2" />}
                                                            <span>{cat.name}</span>
                                                        </span>
                                                    </Badge>
                                                );
                                            })
                                        )}
                                    </div>
                                    {!formData.categoryId && !isLoadingCats && (
                                        <p className="text-[11px] text-red-500 font-medium ml-1 animate-pulse">
                                            * Veuillez sélectionner une catégorie
                                        </p>
                                    )}
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.01] transition-all duration-300"
                                        disabled={isLoading}
                                    >
                                        <span className="inline-flex items-center">
                                            {isLoading ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <Save className="mr-3 h-6 w-6" />}
                                            <span>Enregistrer le Camion</span>
                                        </span>
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
