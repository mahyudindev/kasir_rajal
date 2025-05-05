import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="flex min-h-screen">
            <Head title="Login" />
            
            {/* Left side with background image and logo */}
            <div className="relative hidden w-1/2 bg-gray-900 lg:block">
                <div 
                    className="absolute inset-0 bg-cover bg-center" 
                    style={{ backgroundImage: 'url(/images/bg-hero.jpeg)' }}
                >
                    <div className="absolute inset-0 bg-black/40"></div> {/* Overlay for better text visibility */}
                </div>
                <div className="relative z-10 flex h-full flex-col items-center justify-center text-white p-12">
                    <img src="/images/logo.png" alt="Logo Puskesmas" className="w-48 mb-8" />
                    <h1 className="text-4xl font-bold mb-2 text-center">PUSKESMAS BOJONEGARA</h1>
                </div>
            </div>
            
            {/* Right side with login form */}
            <div className="flex w-full items-center justify-center lg:w-1/2 bg-gray-50">
                <div className="w-full max-w-md p-8">
                    <div className="text-center mb-10">
                        {/* For mobile, show logo */}
                        <div className="lg:hidden mb-6">
                            <img src="/images/logo.png" alt="Logo Puskesmas" className="w-32 mx-auto" />
                            <h1 className="text-2xl font-bold mt-4">PUSKESMAS BOJONEGARA</h1>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">SISTEM E-REGISTER RAJAL</h2>
                    </div>
                    
                    <form onSubmit={submit}>
                        <div className="space-y-6">
                            <div>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    autoFocus
                                    className="bg-gray-200 border-0 rounded-full py-6 px-6 w-full"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="Email"
                                />
                                <InputError message={errors.email} />
                            </div>
                            
                            <div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    className="bg-gray-200 border-0 rounded-full py-6 px-6 w-full"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>
                            
                            <Button 
                                type="submit" 
                                className="w-full bg-black text-white hover:bg-gray-800 rounded-full py-6 text-lg font-semibold"
                                disabled={processing}
                            >
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                                Login
                            </Button>
                        </div>
                    </form>
                    
                    {status && <div className="mt-4 text-center text-sm font-medium text-green-600">{status}</div>}
                </div>
            </div>
        </div>
    );
}
