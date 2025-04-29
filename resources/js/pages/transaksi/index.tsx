import { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Search, Printer } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { debounce } from 'lodash';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Layanan {
    id_layanan: number;
    nama_layanan: string;
    total_harga: number;
}

interface Transaksi {
    id_transaksi: number;
    id_admin: number;
    nama_pasien: string;
    total_harga: number;
    total_bayar: number;
    created_at: string;
    transaksi_details?: {
        id_transaksi_detail: number;
        id_transaksi: number;
        id_layanan: number;
        layanan: Layanan;
    }[];
}

interface TransaksiIndexProps {
    transaksi: Transaksi[];
    layanan: Layanan[];
}

// Storage keys for localStorage
const STORAGE_KEYS = {
    NAMA_PASIEN: 'transaksi_nama_pasien',
    SELECTED_LAYANAN: 'transaksi_selected_layanan',
    TOTAL_BAYAR: 'transaksi_total_bayar'
};

export default function TransaksiIndex({ transaksi, layanan }: TransaksiIndexProps) {
    const [namaPasien, setNamaPasien] = useState('');
    const [searchLayanan, setSearchLayanan] = useState('');
    const [searchResults, setSearchResults] = useState<Layanan[]>([]);
    const [selectedLayanan, setSelectedLayanan] = useState<Layanan[]>([]);
    const [totalHarga, setTotalHarga] = useState(0);
    const [totalBayar, setTotalBayar] = useState('');
    const [kembalian, setKembalian] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    
    // Receipt modal state
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptData, setReceiptData] = useState<{
        id_transaksi?: number;
        nama_pasien: string;
        layanan: Layanan[];
        total_harga: number;
        total_bayar: number;
        kembalian: number;
        tanggal: string;
    }>({
        nama_pasien: '',
        layanan: [],
        total_harga: 0,
        total_bayar: 0,
        kembalian: 0,
        tanggal: new Date().toISOString()
    });
    const [isInitialized, setIsInitialized] = useState(false);

    // Load data from localStorage on component mount
    useEffect(() => {
        try {
            const storedNamaPasien = localStorage.getItem(STORAGE_KEYS.NAMA_PASIEN);
            const storedSelectedLayanan = localStorage.getItem(STORAGE_KEYS.SELECTED_LAYANAN);
            const storedTotalBayar = localStorage.getItem(STORAGE_KEYS.TOTAL_BAYAR);
            
            if (storedNamaPasien) {
                setNamaPasien(storedNamaPasien);
            }
            
            if (storedSelectedLayanan) {
                setSelectedLayanan(JSON.parse(storedSelectedLayanan));
            }
            
            if (storedTotalBayar) {
                setTotalBayar(storedTotalBayar);
            }
            
            setIsInitialized(true);
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
            setIsInitialized(true);
        }
    }, []);

    // Save data to localStorage whenever it changes
    useEffect(() => {
        if (!isInitialized) return;
        
        try {
            localStorage.setItem(STORAGE_KEYS.NAMA_PASIEN, namaPasien);
            localStorage.setItem(STORAGE_KEYS.SELECTED_LAYANAN, JSON.stringify(selectedLayanan));
            localStorage.setItem(STORAGE_KEYS.TOTAL_BAYAR, totalBayar);
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
        }
    }, [namaPasien, selectedLayanan, totalBayar, isInitialized]);

    // Calculate total price whenever selected services change
    useEffect(() => {
        console.log('Selected Layanan:', selectedLayanan);
        
        let total = 0;
        
        // Simple, direct calculation of total
        for (const item of selectedLayanan) {
            console.log('Processing item:', item);
            if (item && typeof item.total_harga === 'number') {
                console.log('Adding to total:', item.total_harga);
                total += item.total_harga;
                console.log('Running total:', total);
            }
        }
        
        console.log('Final total:', total);
        setTotalHarga(total);
        
        // Calculate change
        const bayar = parseInt(totalBayar || '0');
        setKembalian(bayar - total);
    }, [selectedLayanan, totalBayar]);

    // Handle click outside search results
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearching(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Search layanan with debounce
    const debouncedSearch = debounce(async (query: string) => {
        if (query.length < 1) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await axios.get(route('transaksi.search-layanan'), {
                params: { search: query }
            });
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error searching layanan:', error);
            toast.error('Gagal mencari layanan');
        }
    }, 300);

    const handleSearchLayanan = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchLayanan(query);
        setIsSearching(true);
        debouncedSearch(query);
    };

    const addLayanan = (layanan: Layanan) => {
        console.log('Adding layanan:', layanan);
        // Check if layanan is already selected
        if (!selectedLayanan.some(item => item.id_layanan === layanan.id_layanan)) {
            // Make sure total_harga is a number
            const layananToAdd = {
                ...layanan,
                total_harga: Number(layanan.total_harga)
            };
            console.log('Layanan to add (with number conversion):', layananToAdd);
            setSelectedLayanan(prev => [...prev, layananToAdd]);
        }
        setSearchLayanan('');
        setSearchResults([]);
        setIsSearching(false);
    };

    const removeLayanan = (id: number) => {
        setSelectedLayanan(selectedLayanan.filter(item => item.id_layanan !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!namaPasien) {
            toast.error('Nama pasien harus diisi');
            return;
        }

        if (selectedLayanan.length === 0) {
            toast.error('Minimal pilih satu layanan');
            return;
        }

        if (!totalBayar || parseFloat(totalBayar) < totalHarga) {
            toast.error('Nominal bayar harus diisi dan tidak boleh kurang dari total harga');
            return;
        }

        // Extract layanan IDs
        const layananIds = selectedLayanan.map(item => item.id_layanan);

        // Show loading toast
        const toastLoading = toast.loading('Menyimpan transaksi...');

        // Post data to server
        router.post(route('transaksi.store'), {
            nama_pasien: namaPasien,
            layanan_ids: layananIds,
            total_harga: totalHarga,
            total_bayar: parseFloat(totalBayar),
        }, {
            onSuccess: (page) => {
                toast.dismiss(toastLoading);
                toast.success('Transaksi berhasil disimpan');
                
                // Get the ID of the saved transaction from the response if available
                const savedTransactionId = typeof page.props.flash === 'object' && 
                    page.props.flash !== null && 
                    'saved_transaction_id' in page.props.flash ? 
                    (page.props.flash as any).saved_transaction_id : 
                    undefined;
                
                // Set receipt data for the modal
                setReceiptData({
                    id_transaksi: savedTransactionId,
                    nama_pasien: namaPasien,
                    layanan: selectedLayanan,
                    total_harga: totalHarga,
                    total_bayar: parseFloat(totalBayar),
                    kembalian: kembalian,
                    tanggal: new Date().toISOString()
                });

                // Show receipt modal
                setShowReceiptModal(true);
                
                // Clear form data
                setNamaPasien('');
                setSelectedLayanan([]);
                setTotalBayar('');
                setTotalHarga(0);
                setKembalian(0);
                
                // Clear localStorage
                localStorage.removeItem(STORAGE_KEYS.NAMA_PASIEN);
                localStorage.removeItem(STORAGE_KEYS.SELECTED_LAYANAN);
                localStorage.removeItem(STORAGE_KEYS.TOTAL_BAYAR);
            },
            onError: (errors) => {
                toast.dismiss(toastLoading);
                console.error('Error submitting transaction:', errors);
                toast.error('Terjadi kesalahan saat menyimpan transaksi');
            }
        });
    };

    // Handle print receipt
    const handlePrintReceipt = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Popup blocked. Please allow popups for printing.');
            return;
        }

        // Format today's date
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const today = new Date();
        const dayName = days[today.getDay()];
        
        // Get current date in DD-MM-YYYY format
        const formattedDate = today.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '-');

        // Generate receipt HTML based on the provided example
        const receiptHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Struk Pembayaran</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        width: 100%;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                        position: relative;
                    }
                    .logo-left {
                        position: absolute;
                        left: 0;
                        top: 10px;
                        height: 80px;
                    }
                    .logo-right {
                        position: absolute;
                        right: 0;
                        top: 10px;
                        height: 80px;
                    }
                    .header h2, .header h3, .header p {
                        margin: 5px 0;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                    .total-row td {
                        font-weight: bold;
                    }
                    .right-align {
                        text-align: right;
                    }
                    .footer {
                        margin-top: 30px;
                        text-align: right;
                    }
                    .signature-line {
                        margin-top: 70px;
                        border-top: 1px solid #000;
                        width: 200px;
                        display: inline-block;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="/storage/images/logokiri.png" alt="Logo Kiri" class="logo-left" />
                    <h2>PEMERINTAH KABUPATEN SERANG</h2>
                    <h3>DINAS KESEHATAN</h3>
                    <h3>UPT PUSKESMAS BOJONEGARA</h3>
                    <p>Jl. KH. Jakfar No. 3 Bojonegara Kab. Serang Banten</p>
                    <p>Email: pkm_bojonegara@yahoo.co.id</p>
                    <img src="/storage/images/logokanan.png" alt="Logo Kanan" class="logo-right" />
                </div>
                
                <table>
                    <tr>
                        <th width="20%">Tanggal</th>
                        <th width="25%">Nama</th>
                        <th width="25%">Pemeriksaan</th>
                        <th width="10%">JASAR</th>
                        <th width="10%">JASPEL</th>
                        <th width="10%">Total</th>
                    </tr>
                    <tr>
                        <td rowspan="${Math.max(receiptData.layanan.length, 1)}">
                            ${dayName}<br>
                            ${formattedDate}
                        </td>
                        <td rowspan="${Math.max(receiptData.layanan.length, 1)}">
                            ${receiptData.nama_pasien}
                        </td>
                        ${receiptData.layanan.length > 0 ? `
                        <td>${receiptData.layanan[0].nama_layanan}</td>
                        <td class="right-align">${formatRupiah(receiptData.layanan[0].total_harga * 0.4).replace('Rp. ', '')}</td>
                        <td class="right-align">${formatRupiah(receiptData.layanan[0].total_harga * 0.6).replace('Rp. ', '')}</td>
                        <td class="right-align">${formatRupiah(receiptData.layanan[0].total_harga).replace('Rp. ', '')}</td>
                        ` : `
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        `}
                    </tr>
                    ${receiptData.layanan.slice(1).map(item => `
                        <tr>
                            <td>${item.nama_layanan}</td>
                            <td class="right-align">${formatRupiah(item.total_harga * 0.4).replace('Rp. ', '')}</td>
                            <td class="right-align">${formatRupiah(item.total_harga * 0.6).replace('Rp. ', '')}</td>
                            <td class="right-align">${formatRupiah(item.total_harga).replace('Rp. ', '')}</td>
                        </tr>
                    `).join('')}
                    <tr class="total-row">
                        <td colspan="5" class="right-align">JUMLAH</td>
                        <td class="right-align">${formatRupiah(receiptData.total_harga).replace('Rp. ', '')}</td>
                    </tr>
                </table>
                
                <div class="footer">
                    <p>Mengetahui</p>
                    <div class="signature-line"></div>
                    <p>h ismat</p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        
        // Print after content is loaded
        printWindow.onload = function() {
            printWindow.print();
            // Close the window after print (or if print is cancelled)
            printWindow.setTimeout(() => {
                printWindow.close();
            }, 500);
        };
    };

    const formatRupiah = (amount: number) => {
        // Simple formatting without recalculation
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const handleTotalBayarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers
        setTotalBayar(e.target.value.replace(/\D/g, ''));
    };

    const handleReset = () => {
        setNamaPasien('');
        setSelectedLayanan([]);
        setTotalBayar('');
        localStorage.removeItem(STORAGE_KEYS.NAMA_PASIEN);
        localStorage.removeItem(STORAGE_KEYS.SELECTED_LAYANAN);
        localStorage.removeItem(STORAGE_KEYS.TOTAL_BAYAR);
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Transaksi', href: route('transaksi.index') },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transaksi" />
            
            <div className="flex h-full flex-1 flex-col gap-4 p-4 scrollbar-hide">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Column - Patient Info & Service Selection */}
                    <div className="space-y-6">
                        <Card className="shadow-sm rounded-xl border-primary/20">
                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <label htmlFor="nama_pasien" className="block text-sm font-medium mb-1">
                                        Nama Pasien
                                    </label>
                                    <Input
                                        id="nama_pasien"
                                        value={namaPasien}
                                        onChange={(e) => setNamaPasien(e.target.value)}
                                        placeholder="Masukkan nama pasien"
                                        className="border-primary/20"
                                    />
                                </div>

                                <div className="relative" ref={searchRef}>
                                    <label htmlFor="layanan" className="block text-sm font-medium mb-1">
                                        Layanan
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="layanan"
                                            type="text"
                                            value={searchLayanan}
                                            onChange={handleSearchLayanan}
                                            placeholder="Cari layanan berdasarkan nama atau ID"
                                            className="pl-8 border-primary/20"
                                            onFocus={() => setIsSearching(true)}
                                        />
                                    </div>
                                    
                                    {isSearching && searchResults.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-[#0A0A0A] border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto scrollbar-hide">
                                            {searchResults.map((item) => (
                                                <div
                                                    key={item.id_layanan}
                                                    className="px-4 py-2 hover:bg-gray-800 cursor-pointer flex justify-between items-center"
                                                    onClick={() => addLayanan(item)}
                                                >
                                                    <div>
                                                        <div className="font-medium text-white">{item.nama_layanan}</div>
                                                        <div className="text-sm text-gray-400">ID: {item.id_layanan}</div>
                                                    </div>
                                                    <div className="font-semibold text-white">{formatRupiah(item.total_harga)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Transactions Table */}
                        <Card className="shadow-sm rounded-xl border-primary/20 bg-[#121212]">
                            <CardContent className="p-4">
                                <h3 className="text-sm font-semibold mb-2 text-primary flex items-center">
                                    <span className="bg-primary/20 text-primary p-1 rounded-md mr-2 inline-flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-history"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
                                    </span>
                                    Transaksi Terakhir
                                </h3>
                                <Table>
                                    <TableHeader className="bg-[#1a1a1a]">
                                        <TableRow>
                                            <TableHead className="text-primary">Pasien</TableHead>
                                            <TableHead className="text-primary">Layanan</TableHead>
                                            <TableHead className="text-right text-primary">Total</TableHead>
                                            <TableHead className="text-right text-primary">Waktu</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transaksi.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                    Belum ada transaksi
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            transaksi.slice(0, 5).map((item, index) => (
                                                <TableRow key={item.id_transaksi} className={index % 2 === 0 ? "bg-[#151515]" : ""}>
                                                    <TableCell>{item.nama_pasien}</TableCell>
                                                    <TableCell>
                                                        {item.transaksi_details && item.transaksi_details.length > 0 ? (
                                                            <>
                                                                {item.transaksi_details.length <= 2 ? (
                                                                    // If 2 or fewer services, show all of them
                                                                    item.transaksi_details.map((detail, i) => (
                                                                        <span key={detail.id_transaksi_detail} className="block text-xs">
                                                                            {detail.layanan.nama_layanan}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    // If more than 2 services, show first one and "X lainnya"
                                                                    <>
                                                                        <span className="block text-xs">
                                                                            {item.transaksi_details[0].layanan.nama_layanan}
                                                                        </span>
                                                                        <span className="block text-xs text-primary/60">
                                                                            + {item.transaksi_details.length - 1} lainnya
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-primary/90">
                                                        {formatRupiah(item.total_harga)}
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs font-mono text-muted-foreground">
                                                        {new Date(item.created_at).toLocaleTimeString('id-ID', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Payment Section (Mobile Only) */}
                        <Card className="md:hidden shadow-sm rounded-xl border-primary/20">
                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <label htmlFor="nominal_bayar" className="block text-sm font-medium mb-1">
                                        Nominal Bayar
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp.</span>
                                        <Input
                                            id="nominal_bayar"
                                            type="text"
                                            value={totalBayar}
                                            onChange={handleTotalBayarChange}
                                            placeholder=""
                                            className="pl-10 text-xl font-bold border-primary/20"
                                        />
                                    </div>
                                </div>

                                {kembalian >= 0 && totalBayar !== '' && (
                                    <div className="pt-2">
                                        <label className="block text-sm font-medium mb-1">Kembalian</label>
                                        <div className="border rounded-md p-3 text-xl font-bold border-primary/20 bg-primary/5">
                                            {(() => {
                                                // Direct calculation of change
                                                let directTotal = 0;
                                                selectedLayanan.forEach(item => {
                                                    if (item && item.total_harga) {
                                                        directTotal += Number(item.total_harga);
                                                    }
                                                });
                                                
                                                const directBayar = parseInt(totalBayar || '0');
                                                const directKembalian = directBayar - directTotal;
                                                
                                                return new Intl.NumberFormat('id-ID', {
                                                    style: 'currency',
                                                    currency: 'IDR',
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                }).format(directKembalian >= 0 ? directKembalian : 0);
                                            })()}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-2">
                                    <Button 
                                        variant="destructive" 
                                        className="flex-1"
                                        onClick={handleReset}
                                    >
                                        BATAL
                                    </Button>
                                    <Button
                                        className="flex-1 bg-primary hover:bg-primary/90"
                                        disabled={totalHarga === 0 || parseInt(totalBayar || '0') < totalHarga}
                                        onClick={handleSubmit}
                                    >
                                        BAYAR
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Services & Payment */}
                    <div className="space-y-6">
                        <Card className="shadow-sm rounded-xl border-primary/20">
                            <CardContent className="p-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kode Layanan</TableHead>
                                            <TableHead>Nama Layanan</TableHead>
                                            <TableHead className="text-right">Harga</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedLayanan.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                    Belum ada layanan dipilih
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            selectedLayanan.map((item) => (
                                                <TableRow key={item.id_layanan}>
                                                    <TableCell>{item.id_layanan}</TableCell>
                                                    <TableCell>{item.nama_layanan}</TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatRupiah(item.total_harga)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeLayanan(item.id_layanan)}
                                                            className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>

                                <Separator className="my-4" />

                                <div className="flex justify-between items-center">
                                    <span className="text-xl font-bold">TOTAL</span>
                                    <span className="text-xl font-bold text-primary">
                                        {(() => {
                                            // Direct calculation without using state
                                            let directTotal = 0;
                                            selectedLayanan.forEach(item => {
                                                if (item && item.total_harga) {
                                                    directTotal += Number(item.total_harga);
                                                }
                                            });
                                            
                                            return new Intl.NumberFormat('id-ID', {
                                                style: 'currency',
                                                currency: 'IDR',
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0
                                            }).format(directTotal);
                                        })()}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Section (Desktop Only) */}
                        <Card className="hidden md:block shadow-sm rounded-xl border-primary/20">
                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <label htmlFor="nominal_bayar_desktop" className="block text-sm font-medium mb-1">
                                        Nominal Bayar
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp.</span>
                                        <Input
                                            id="nominal_bayar_desktop"
                                            type="text"
                                            value={totalBayar}
                                            onChange={handleTotalBayarChange}
                                            placeholder=""
                                            className="pl-10 text-xl font-bold border-primary/20"
                                        />
                                    </div>
                                </div>

                                {kembalian >= 0 && totalBayar !== '' && (
                                    <div className="pt-2">
                                        <label className="block text-sm font-medium mb-1">Kembalian</label>
                                        <div className="border rounded-md p-3 text-xl font-bold border-primary/20 bg-primary/5">
                                            {(() => {
                                                // Direct calculation of change
                                                let directTotal = 0;
                                                selectedLayanan.forEach(item => {
                                                    if (item && item.total_harga) {
                                                        directTotal += Number(item.total_harga);
                                                    }
                                                });
                                                
                                                const directBayar = parseInt(totalBayar || '0');
                                                const directKembalian = directBayar - directTotal;
                                                
                                                return new Intl.NumberFormat('id-ID', {
                                                    style: 'currency',
                                                    currency: 'IDR',
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                }).format(directKembalian >= 0 ? directKembalian : 0);
                                            })()}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-2">
                                    <Button 
                                        variant="destructive" 
                                        className="flex-1"
                                        onClick={handleReset}
                                    >
                                        BATAL
                                    </Button>
                                    <Button
                                        className="flex-1 bg-primary hover:bg-primary/90"
                                        disabled={totalHarga === 0 || parseInt(totalBayar || '0') < totalHarga}
                                        onClick={handleSubmit}
                                    >
                                        BAYAR
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
            <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Struk Pembayaran</DialogTitle>
                    </DialogHeader>
                    <div className="p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">Pasien:</span>
                            <span className="text-lg">{receiptData.nama_pasien}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">Tanggal:</span>
                            <span className="text-lg">{new Date(receiptData.tanggal).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">Layanan:</span>
                            <div className="flex flex-col">
                                {receiptData.layanan.map(item => (
                                    <span key={item.id_layanan} className="text-lg">{item.nama_layanan}</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">Total:</span>
                            <span className="text-lg">{formatRupiah(receiptData.total_harga)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">Bayar:</span>
                            <span className="text-lg">{formatRupiah(receiptData.total_bayar)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">Kembalian:</span>
                            <span className="text-lg">{formatRupiah(receiptData.kembalian)}</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button className="bg-primary hover:bg-primary/90" onClick={handlePrintReceipt}>
                            <Printer className="mr-2 h-4 w-4" />
                            CETAK STRUK
                        </Button>
                        <Button variant="outline" onClick={() => setShowReceiptModal(false)}>TUTUP</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
