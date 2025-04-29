import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm as useReactHookForm } from 'react-hook-form';
import { useState } from 'react';
import { toast } from 'sonner';

const formSchema = z.object({
    nama_layanan: z.string().min(1, { message: 'Nama layanan harus diisi' }).max(50, { message: 'Nama layanan maksimal 50 karakter' }),
    trf_kunjungan: z.string().min(1, { message: 'Tarif kunjungan harus diisi' }).refine(val => !isNaN(Number(val)), { message: 'Tarif kunjungan harus berupa angka' }),
    layanan_dokter: z.string().min(1, { message: 'Layanan dokter harus diisi' }).refine(val => !isNaN(Number(val)), { message: 'Layanan dokter harus berupa angka' }),
    layanan_tindakan: z.string().min(1, { message: 'Layanan tindakan harus diisi' }).refine(val => !isNaN(Number(val)), { message: 'Layanan tindakan harus berupa angka' }),
});

type FormValues = z.infer<typeof formSchema>;

type DefaultValues = {
    nama_layanan: string;
    trf_kunjungan: string;
    layanan_dokter: string;
    layanan_tindakan: string;
};

export default function LayananCreate() {
    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Data Layanan', href: route('layanan.index') },
        { title: 'Tambah Layanan', href: route('layanan.create') },
    ];

    const defaultValues: DefaultValues = {
        nama_layanan: '',
        trf_kunjungan: '',
        layanan_dokter: '',
        layanan_tindakan: '',
    };

    const form = useReactHookForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultValues as FormValues,
        mode: 'all',
    });

    const [submitting, setSubmitting] = useState(false);

    const onSubmit = (values: FormValues) => {
        if (submitting) return;
        
        setSubmitting(true);
        
        router.post(route('layanan.store'), {
            nama_layanan: values.nama_layanan,
            trf_kunjungan: values.trf_kunjungan,
            layanan_dokter: values.layanan_dokter,
            layanan_tindakan: values.layanan_tindakan,
        }, {
            onSuccess: () => {
                toast.success('Layanan berhasil ditambahkan');
                
                setTimeout(() => {
                    router.visit(route('layanan.index'), { preserveScroll: true });
                }, 1000);
            },
            onError: (errors: Record<string, string>) => {
                setSubmitting(false);
                
                Object.entries(errors).forEach(([key, value]) => {
                    let indonesianMessage = value;
                    
                    const fieldMap: Record<string, string> = {
                        'nama_layanan': 'Nama layanan',
                        'trf_kunjungan': 'Tarif kunjungan',
                        'layanan_dokter': 'Layanan dokter',
                        'layanan_tindakan': 'Layanan tindakan',
                    };
                    
                    if (value.includes('field is required')) {
                        indonesianMessage = `${fieldMap[key] || key} harus diisi`;
                    }
                    
                    form.setError(key as keyof FormValues, { message: indonesianMessage });
                });
                
                if (Object.keys(errors).length > 0) {
                    const firstKey = Object.keys(errors)[0];
                    const firstValue = errors[firstKey];
                    toast.error(firstValue);
                }
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
            <Head title="Tambah Layanan" />
            
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
                        <h1 className="text-2xl font-bold tracking-tight">Tambah Layanan Baru</h1>
                        <p className="text-muted-foreground">Tambahkan layanan baru dengan mengisi form berikut.</p>
                    </div>
                </div>

                <Card className="shadow-sm rounded-xl">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle>Detail Layanan</CardTitle>
                        <CardDescription>
                            Isikan informasi layanan yang akan ditambahkan
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
                                                        // Remove decimal places
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
                                                        // Remove decimal places
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
                                                        // Remove decimal places
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
                                        {submitting ? 'Menyimpan...' : 'Simpan Layanan'}
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
