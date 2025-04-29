import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, Plus, Trash2, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

interface Layanan {
    id_layanan: number;
    nama_layanan: string;
    trf_kunjungan: number;
    layanan_dokter: number;
    layanan_tindakan: number;
    total_harga: number;
}

interface LayananIndexProps {
    layanan: Layanan[];
}

export default function LayananIndex({ layanan }: LayananIndexProps) {
    const [layananToDelete, setLayananToDelete] = useState<Layanan | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLayanan = useMemo(() => {
        return layanan.filter((item) => {
            return (
                item.nama_layanan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id_layanan.toString().includes(searchTerm)
            );
        });
    }, [layanan, searchTerm]);

    const handleDelete = () => {
        if (layananToDelete) {
            const toastLoading = toast.loading('Menghapus layanan...');
            
            router.delete(route('layanan.destroy', layananToDelete.id_layanan), {
                onSuccess: () => {
                    toast.dismiss(toastLoading);
                    toast.success('Layanan berhasil dihapus');
                    setIsDeleteDialogOpen(false);
                    
                    setTimeout(() => {
                        router.visit(route('layanan.index'), { 
                            preserveScroll: true,
                            only: ['layanan']
                        });
                    }, 1000);
                },
                onError: (errors) => {
                    toast.dismiss(toastLoading);
                    
                    if (errors.message) {
                        toast.error(errors.message);
                    } else {
                        toast.error('Gagal menghapus layanan');
                    }
                }
            });
        }
    };
    
    const confirmDelete = (item: Layanan) => {
        setLayananToDelete(item);
        setIsDeleteDialogOpen(true);
    };
    
    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Data Layanan', href: route('layanan.index') },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Layanan" />
            
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="text-center mb-2">
                    <h1 className="text-2xl font-bold tracking-tight">Data Layanan</h1>
                </div>

                <Card className="shadow-sm rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                        <div className="flex items-center space-x-2 w-full max-w-sm">
                            <div className="relative w-full">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    type="text" 
                                    placeholder="Cari ID atau nama layanan..." 
                                    className="h-9 pl-8" 
                                    value={searchTerm}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button asChild size="sm" className="h-9 gap-1 bg-primary/90 hover:bg-primary shadow-sm">
                            <Link href={route('layanan.create')}>
                                <Plus className="h-4 w-4" /> Tambah Layanan
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 pb-4">
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-medium">No</TableHead>
                                    <TableHead className="font-medium">Nama Layanan</TableHead>
                                    <TableHead className="font-medium">Tarif Kunjungan</TableHead>
                                    <TableHead className="font-medium">Layanan Dokter</TableHead>
                                    <TableHead className="font-medium">Layanan Tindakan</TableHead>
                                    <TableHead className="font-medium">Total Harga</TableHead>
                                    <TableHead className="text-right font-medium">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLayanan.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center">
                                            Tidak ada data layanan
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLayanan.map((item, index) => (
                                        <TableRow key={item.id_layanan}>
                                            <TableCell>{item.id_layanan}</TableCell>
                                            <TableCell className="font-medium">{item.nama_layanan}</TableCell>
                                            <TableCell className="text-sm">{formatRupiah(item.trf_kunjungan)}</TableCell>
                                            <TableCell className="text-sm">{formatRupiah(item.layanan_dokter)}</TableCell>
                                            <TableCell className="text-sm">{formatRupiah(item.layanan_tindakan)}</TableCell>
                                            <TableCell className="text-sm font-semibold">{formatRupiah(item.total_harga)}</TableCell>
                                            <TableCell className="text-right whitespace-nowrap">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" asChild className="h-8">
                                                        <Link href={route('layanan.edit', item.id_layanan)}>
                                                            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                                                        </Link>
                                                    </Button>
                                                    <Button variant="destructive" size="sm" className="h-8" onClick={() => confirmDelete(item)}>
                                                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Hapus
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            
            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus Layanan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus layanan <strong>{layananToDelete?.nama_layanan}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
