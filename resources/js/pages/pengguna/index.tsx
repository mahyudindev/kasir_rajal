import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '../../components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type User = {
    id_user: number;
    email: string;
    role: 'kasir' | 'bendahara';
    nama: string;
    jenis_kelamin: 'L' | 'P';
    alamat: string;
    nomor_telpon: string;
};

interface PenggunaIndexProps {
    users: User[];
}

export default function PenggunaIndex({ users }: PenggunaIndexProps) {
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    
    const handleDelete = () => {
        if (userToDelete) {
            const toastLoading = toast.loading('Menghapus pengguna...');
            
            router.delete(route('pengguna.destroy', userToDelete.id_user), {
                onSuccess: () => {
                    toast.dismiss(toastLoading);
                    toast.success('Pengguna berhasil dihapus');
                    setIsDeleteDialogOpen(false);
                    
                    setTimeout(() => {
                        router.visit(route('pengguna.index'), { 
                            preserveScroll: true,
                            only: ['users']
                        });
                    }, 1000);
                },
                onError: (errors) => {
                    toast.dismiss(toastLoading);
                    
                    if (errors.message) {
                        toast.error(errors.message);
                    } else {
                        toast.error('Gagal menghapus pengguna');
                    }
                }
            });
        }
    };

    const confirmDelete = (user: User) => {
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Pengguna', href: route('pengguna.index') },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Pengguna" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="text-center mb-2">
                    <h1 className="text-2xl font-bold tracking-tight">Manajemen Pengguna</h1>
                </div>

                <Card className="shadow-sm rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                        <div>
                            <CardTitle>Daftar Pengguna</CardTitle>
                            
                        </div>
                        <Button asChild size="sm" className="h-9 gap-1 bg-primary/90 hover:bg-primary shadow-sm">
                            <Link href={route('pengguna.create')}>
                                <Plus className="h-4 w-4" /> Tambah Pengguna
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 pb-4">
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-medium">Nama</TableHead>
                                    <TableHead className="font-medium">Email</TableHead>
                                    <TableHead className="font-medium">Role</TableHead>
                                    <TableHead className="font-medium">Jenis Kelamin</TableHead>
                                    <TableHead className="font-medium">Alamat</TableHead>
                                    <TableHead className="font-medium">Nomor Telepon</TableHead>
                                    <TableHead className="text-center font-medium w-[180px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center">
                                            Tidak ada data pengguna
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id_user}>
                                            <TableCell className="font-medium">{user.nama}</TableCell>
                                            <TableCell className="text-sm">{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'kasir' ? 'default' : 'secondary'} className="px-2 py-1">
                                                    {user.role === 'kasir' ? 'Kasir' : 'Bendahara'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">{user.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</TableCell>
                                            <TableCell className="text-sm truncate max-w-[120px]">{user.alamat}</TableCell>
                                            <TableCell className="text-sm">{user.nomor_telpon}</TableCell>
                                            <TableCell className="text-right whitespace-nowrap">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" asChild className="h-8">
                                                        <Link href={route('pengguna.edit', user.id_user)}>
                                                            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                                                        </Link>
                                                    </Button>
                                                    <Button variant="destructive" size="sm" className="h-8" onClick={() => confirmDelete(user)}>
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
                        <DialogTitle>Konfirmasi Hapus Pengguna</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus pengguna <strong>{userToDelete?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
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
