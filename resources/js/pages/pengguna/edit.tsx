import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    FormField, 
    FormItem, 
    FormLabel, 
    FormControl, 
    FormMessage, 
    Form 
} from '../../components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm as useReactHookForm, ControllerRenderProps, FieldValues } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

type UserData = {
    id_user: number;
    email: string;
    role: 'kasir' | 'bendahara';
    nama: string;
    jenis_kelamin: 'L' | 'P';
    alamat: string;
    nomor_telpon: string;
};

interface EditUserProps {
    user: UserData;
}

const formSchema = z.object({
    email: z.string().email({ message: 'Email tidak valid' }),
    password: z.string().min(8, { message: 'Password minimal 8 karakter' }).optional().or(z.literal('')),
    role: z.enum(['kasir', 'bendahara']),
    nama: z.string().min(1, { message: 'Nama tidak boleh kosong' }).max(50, { message: 'Nama maksimal 50 karakter' }),
    jenis_kelamin: z.enum(['L', 'P']),
    alamat: z.string().min(1, { message: 'Alamat tidak boleh kosong' }).max(50, { message: 'Alamat maksimal 50 karakter' }),
    nomor_telpon: z.string().min(1, { message: 'Nomor telepon tidak boleh kosong' }).max(13, { message: 'Nomor telepon maksimal 13 karakter' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditUser({ user }: EditUserProps) {
    const [showPassword, setShowPassword] = useState(false);
    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Pengguna', href: route('pengguna.index') },
        { title: 'Edit Pengguna', href: route('pengguna.edit', user.id_user) },
    ];

    const form = useReactHookForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: user.email,
            password: '',
            role: user.role,
            nama: user.nama,
            jenis_kelamin: user.jenis_kelamin,
            alamat: user.alamat,
            nomor_telpon: user.nomor_telpon,
        },
    });

    const { processing, errors, setData, put } = useForm({
        email: user.email,
        password: '',
        role: user.role,
        nama: user.nama,
        jenis_kelamin: user.jenis_kelamin,
        alamat: user.alamat,
        nomor_telpon: user.nomor_telpon,
    });

    const onSubmit = (values: FormValues) => {
        console.log('Submitting form with values:', values);
        console.log('User ID:', user.id_user);
        
        const loadingToast = toast.loading('Menyimpan perubahan...');
        
        router.put(route('pengguna.update', user.id_user), {
            email: values.email,
            password: values.password || '',
            role: values.role,
            nama: values.nama,
            jenis_kelamin: values.jenis_kelamin,
            alamat: values.alamat,
            nomor_telpon: values.nomor_telpon
        }, {
            onSuccess: () => {
                toast.dismiss(loadingToast);
                
                toast.success('Pengguna berhasil diperbarui');
                
                setTimeout(() => {
                    router.visit(route('pengguna.index'), { preserveScroll: true });
                }, 1000);
            },
            onError: (errors) => {
                toast.dismiss(loadingToast);
                
                console.error('Error updating user:', errors);
                
                Object.entries(errors).forEach(([key, value]) => {
                    const errorMessage = value as string;
                    form.setError(key as keyof FormValues, { message: errorMessage });
                    toast.error(errorMessage);
                });
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Pengguna" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="text-center mb-2">
                    <h1 className="text-2xl font-bold tracking-tight">Edit Pengguna</h1>
                </div>

                <Card className="shadow-sm rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                        <div>
                            <CardTitle>Form Edit Pengguna</CardTitle>
                            <CardDescription>
                                Update informasi pengguna {user.nama}
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild className="h-9">
                            <a href={route('pengguna.index')}>
                                <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
                            </a>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Email" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password (Kosongkan jika tidak diubah)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input 
                                                            type={showPassword ? "text" : "password"} 
                                                            placeholder="Password baru" 
                                                            {...field} 
                                                            className="pr-10" 
                                                        />
                                                        <button 
                                                            type="button"
                                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                        >
                                                            {showPassword ? (
                                                                <EyeOff className="h-5 w-5" aria-hidden="true" />
                                                            ) : (
                                                                <Eye className="h-5 w-5" aria-hidden="true" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Role</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih role" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="kasir">Kasir</SelectItem>
                                                    <SelectItem value="bendahara">Bendahara</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="nama"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nama</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nama lengkap" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="jenis_kelamin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Jenis Kelamin</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih jenis kelamin" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="L">Laki-laki</SelectItem>
                                                    <SelectItem value="P">Perempuan</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="alamat"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Alamat</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Alamat lengkap" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="nomor_telpon"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nomor Telepon</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nomor telepon" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <CardFooter className="p-0 pt-4 flex justify-end gap-3">
                                    <Button variant="outline" asChild className="h-9">
                                        <a href={route('pengguna.index')}>Batal</a>
                                    </Button>
                                    <Button type="submit" disabled={processing} className="h-9 bg-primary/90 hover:bg-primary shadow-sm">
                                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
