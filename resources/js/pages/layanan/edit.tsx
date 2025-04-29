import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    FormField, 
    FormItem, 
    FormLabel, 
    FormControl, 
    FormMessage,
    Form 
} from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm as useReactHookForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const formSchema = z.object({
    nama_layanan: z.string().min(1, { message: 'Nama layanan harus diisi' }).max(50, { message: 'Nama layanan maksimal 50 karakter' }),
    trf_kunjungan: z.string().min(1, { message: 'Tarif kunjungan harus diisi' }).refine(val => !isNaN(Number(val)), { message: 'Tarif kunjungan harus berupa angka' }),
    layanan_dokter: z.string().min(1, { message: 'Layanan dokter harus diisi' }).refine(val => !isNaN(Number(val)), { message: 'Layanan dokter harus berupa angka' }),
    layanan_tindakan: z.string().min(1, { message: 'Layanan tindakan harus diisi' }).refine(val => !isNaN(Number(val)), { message: 'Layanan tindakan harus berupa angka' }),
});


type FormValues = z.infer<typeof formSchema>;

interface Layanan {
    id_layanan: number;
    nama_layanan: string;
    trf_kunjungan: number;
    layanan_dokter: number;
    layanan_tindakan: number;
    total_harga: number;
}

interface LayananEditProps {
    layanan: Layanan;
}

export default function LayananEdit({ layanan }: LayananEditProps) {
    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Data Layanan', href: route('layanan.index') },
        { title: 'Edit Layanan', href: route('layanan.edit', layanan.id_layanan) },
    ];

    const form = useReactHookForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nama_layanan: '',
            trf_kunjungan: '',
            layanan_dokter: '',
            layanan_tindakan: '',
        },
        mode: 'all',
    });

    useEffect(() => {
        form.reset({
            nama_layanan: layanan.nama_layanan,
            trf_kunjungan: Math.floor(layanan.trf_kunjungan).toString(),
            layanan_dokter: Math.floor(layanan.layanan_dokter).toString(),
            layanan_tindakan: Math.floor(layanan.layanan_tindakan).toString(),
        });
    }, [layanan]);

    const [submitting, setSubmitting] = useState(false);

    const onSubmit = (values: FormValues) => {
        if (submitting) return;
        
        setSubmitting(true);
        
        const loadingToast = toast.loading('Menyimpan perubahan...');
        
        router.put(route('layanan.update', layanan.id_layanan), {
            nama_layanan: values.nama_layanan,
            trf_kunjungan: values.trf_kunjungan,
            layanan_dokter: values.layanan_dokter,
            layanan_tindakan: values.layanan_tindakan,
        }, {
            onSuccess: () => {
                toast.dismiss(loadingToast);
                
                toast.success('Layanan berhasil diperbarui');
                
                setTimeout(() => {
                    router.visit(route('layanan.index'), { preserveScroll: true });
                }, 1000);
            },
            onError: (errors) => {
                toast.dismiss(loadingToast);
                
                console.error('Error updating layanan:', errors);
                
                Object.entries(errors).forEach(([key, value]) => {
                    const errorMessage = value as string;
                    form.setError(key as keyof FormValues, { message: errorMessage });
                    toast.error(errorMessage);
                });
            }
        });
    };


    const calculateTotal = () => {
        const kunjungan = parseFloat(form.watch('trf_kunjungan') || '0');
        const dokter = parseFloat(form.watch('layanan_dokter') || '0');
        const tindakan = parseFloat(form.watch('layanan_tindakan') || '0');
        return (kunjungan + dokter + tindakan).toLocaleString('id-ID', { 
            style: 'currency', 
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Layanan" />
            
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.visit(route('layanan.index'))}
                        className="h-8 w-8"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Layanan</h1>
                        <p className="text-muted-foreground">Perbarui informasi layanan dengan mengisi form berikut.</p>
                    </div>
                </div>

                <Card className="shadow-sm rounded-xl">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle>Detail Layanan</CardTitle>
                        <CardDescription>
                            Perbarui informasi layanan <strong>{layanan.nama_layanan}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="nama_layanan"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nama Layanan</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="Masukkan nama layanan" 
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <FormField
                                    control={form.control}
                                    name="trf_kunjungan"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tarif Kunjungan</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    placeholder="Masukkan tarif kunjungan" 
                                                    step="1"
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value) || 0;
                                                        field.onChange(value.toString());
                                                    }}
                                                    value={field.value}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <FormField
                                    control={form.control}
                                    name="layanan_dokter"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Layanan Dokter</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    placeholder="Masukkan biaya layanan dokter" 
                                                    step="1"
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value) || 0;
                                                        field.onChange(value.toString());
                                                    }}
                                                    value={field.value}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <FormField
                                    control={form.control}
                                    name="layanan_tindakan"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Layanan Tindakan</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    placeholder="Masukkan biaya layanan tindakan" 
                                                    step="1"
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value) || 0;
                                                        field.onChange(value.toString());
                                                    }}
                                                    value={field.value}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <div className="pt-4 border-t mt-4">
                                    <div className="flex justify-between items-center">
                                        <Label className="font-semibold text-lg">Total Harga:</Label>
                                        <div className="text-xl font-bold text-primary">{calculateTotal()}</div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end space-x-2 pt-6 mt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.visit(route('layanan.index'))}
                                    >
                                        Batal
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={submitting}
                                        className="bg-primary/90 hover:bg-primary shadow-sm"
                                    >
                                        {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
