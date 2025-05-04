import { useState, useEffect, useRef } from 'react';
import { CreditCard, ShoppingCart, ShoppingBag, X, Loader2 } from 'lucide-react';
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
import { Eye } from 'lucide-react';

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
    transaksiDetails?: {
        id_transaksi_detail: number;
        id_transaksi: number;
        id_layanan: number;
        layanan: Layanan;
    }[];
}

interface PopularLayanan extends Layanan {
    transaction_count: number;
}

interface TransaksiIndexProps {
    transaksi: Transaksi[];
    layanan: Layanan[];
    popularLayanan: PopularLayanan[];
}

const STORAGE_KEYS = {
    NAMA_PASIEN: 'transaksi_nama_pasien',
    SELECTED_LAYANAN: 'transaksi_selected_layanan',
    TOTAL_BAYAR: 'transaksi_total_bayar'
};

export default function TransaksiIndex({ transaksi, layanan, popularLayanan = [] }: TransaksiIndexProps) {
    const [namaPasien, setNamaPasien] = useState('');
    const [searchLayanan, setSearchLayanan] = useState('');
    const [searchResults, setSearchResults] = useState<Layanan[]>([]);
    const [selectedLayanan, setSelectedLayanan] = useState<Layanan[]>([]);
    const [totalHarga, setTotalHarga] = useState(0);
    const [totalBayar, setTotalBayar] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [swipingItemId, setSwipingItemId] = useState<number | null>(null);
    const [swipePosition, setSwipePosition] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [startX, setStartX] = useState(0);
    const [kembalian, setKembalian] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    
    const [viewingTransaksi, setViewingTransaksi] = useState<Transaksi | null>(null);
    const [showTransaksiDetails, setShowTransaksiDetails] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [showAllTransaksiModal, setShowAllTransaksiModal] = useState(false);
    const [searchTransaksi, setSearchTransaksi] = useState('');
    const [filteredTransaksi, setFilteredTransaksi] = useState<Transaksi[]>([]);
    
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


    useEffect(() => {
        console.log('All transactions:', transaksi);
        if (transaksi.length > 0) {
            console.log('First transaction:', transaksi[0]);
            if (transaksi[0].transaksiDetails) {
                console.log('First transaction details:', transaksi[0].transaksiDetails);
                
                if (transaksi[0].transaksiDetails.length > 0) {
                    console.log('Detail structure sample:', transaksi[0].transaksiDetails[0]);
                    if (transaksi[0].transaksiDetails[0].layanan) {
                        console.log('Layanan structure:', transaksi[0].transaksiDetails[0].layanan);
                    } else {
                        console.log('Layanan is missing from the data structure!');
                    }
                }
            } else {
                console.log('No transaction details found on first transaction');
            }
        }
    }, [transaksi]);

    useEffect(() => {
        console.log('Transaksi data:', transaksi);
        const storedNamaPasien = localStorage.getItem(STORAGE_KEYS.NAMA_PASIEN);
        if (storedNamaPasien) {
            setNamaPasien(storedNamaPasien);
        }
        
        const storedSelectedLayanan = localStorage.getItem(STORAGE_KEYS.SELECTED_LAYANAN);
        if (storedSelectedLayanan) {
            try {
                const parsedLayanan = JSON.parse(storedSelectedLayanan);
                setSelectedLayanan(parsedLayanan);
            } catch (error) {
                console.error('Error parsing stored layanan:', error);
            }
        }
        
        const storedTotalBayar = localStorage.getItem(STORAGE_KEYS.TOTAL_BAYAR);
        if (storedTotalBayar) {
            setTotalBayar(storedTotalBayar);
        }
        
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [transaksi]);
    
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

    useEffect(() => {
        console.log('Selected Layanan:', selectedLayanan);
        
        let total = 0;
        
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
        const bayar = parseInt(totalBayar || '0');
        setKembalian(bayar - total);
    }, [selectedLayanan, totalBayar]);
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

    useEffect(() => {
        if (showAllTransaksiModal) {
            if (searchTransaksi.trim() === '') {
                setFilteredTransaksi(transaksi);
            } else {
                const filtered = transaksi.filter(item => 
                    item.nama_pasien.toLowerCase().includes(searchTransaksi.toLowerCase())
                );
                setFilteredTransaksi(filtered);
            }
        }
    }, [searchTransaksi, transaksi, showAllTransaksiModal]);

    useEffect(() => {
        if (window.location.search.includes('debug=true')) {
            console.log('Transaksi data:', transaksi);
            if (transaksi.length > 0) {
                console.log('First transaction:', transaksi[0]);
                console.log('Transaction details:', transaksi[0].transaksiDetails);
                if (transaksi[0].transaksiDetails && transaksi[0].transaksiDetails.length > 0) {
                    console.log('First detail:', transaksi[0].transaksiDetails[0]);
                    console.log('Layanan in first detail:', transaksi[0].transaksiDetails[0].layanan);
                }
            }
        }
    }, [transaksi]);

    const handleDeleteTransaction = async (id: number) => {
        try {
            const toastLoading = toast.loading('Menghapus transaksi...');
            await axios.delete(route('transaksi.destroy', id));
            toast.dismiss(toastLoading);
            toast.success('Transaksi berhasil dihapus');
            setShowConfirmDelete(false);
            setConfirmDeleteId(null);
            router.reload();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            toast.error('Gagal menghapus transaksi');
        }
    };

    const handleViewTransactionDetails = (transaksi: Transaksi) => {
        console.log("Transaction to view:", transaksi);
        if (transaksi.transaksiDetails) {
            console.log("Details count:", transaksi.transaksiDetails.length);
            transaksi.transaksiDetails.forEach((detail, i) => {
                console.log(`Detail ${i}:`, detail);
                console.log(`Layanan for detail ${i}:`, detail.layanan);
            });
        }
        setViewingTransaksi(transaksi);
        setShowTransaksiDetails(true);
    };

    const handleReprintReceipt = (transaction: Transaksi) => {
        if (!transaction.transaksiDetails?.length) {
            toast.error('Tidak ada detail transaksi');
            return;
        }

        const layananItems = transaction.transaksiDetails.map(detail => detail.layanan);
        
        setReceiptData({
            id_transaksi: transaction.id_transaksi,
            nama_pasien: transaction.nama_pasien,
            layanan: layananItems,
            total_harga: transaction.total_harga,
            total_bayar: transaction.total_bayar,
            kembalian: transaction.total_bayar - transaction.total_harga,
            tanggal: transaction.created_at
        });

        handlePrintReceipt();
    };

    const handleSearchLayanan = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        console.log('Search input changed:', query);
        
        setSearchLayanan(query);
        
        setIsSearching(true);
        
        if (!query || query.trim() === '') {
            console.log('Empty query, showing popular items');
            setSearchResults(popularLayanan.length > 0 ? 
                popularLayanan.slice(0, 10) : 
                layanan.slice(0, 10));
            return;
        }
        
        console.log('Searching in', layanan?.length || 0, 'items');
        try {
            const normalizedQuery = query.toLowerCase().trim();
            let results: Layanan[] = [];
            
            if (layanan && Array.isArray(layanan)) {
                results = layanan.filter(item => {
                    if (!item) return false;
                    
                    const nameMatch = item.nama_layanan && 
                        item.nama_layanan.toLowerCase().includes(normalizedQuery);
                    
                    const idMatch = item.id_layanan !== undefined && 
                        String(item.id_layanan).includes(normalizedQuery);
                    
                    return nameMatch || idMatch;
                });
            }
            
            console.log(`Found ${results.length} matches`);
            setSearchResults(results);
            
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults(popularLayanan.slice(0, 10));
        }
    };
    
    const handleSearchFocus = () => {
        console.log('Search input focused');
        setIsSearching(true);
        
        if (!searchLayanan || searchLayanan.trim() === '') {
            setSearchResults(popularLayanan.length > 0 ? 
                popularLayanan.slice(0, 10) : 
                layanan.slice(0, 10));
        }
    };

    const addLayanan = (layanan: Layanan) => {
        console.log('Adding layanan:', layanan);
        if (!selectedLayanan.some(item => item.id_layanan === layanan.id_layanan)) {
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

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }
        setIsProcessing(true);


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

        const layananIds = selectedLayanan.map(item => item.id_layanan);

        const toastLoading = toast.loading('Menyimpan transaksi...');

        router.post(route('transaksi.store'), {
            nama_pasien: namaPasien,
            layanan_ids: layananIds,
            total_harga: totalHarga,
            total_bayar: parseFloat(totalBayar),
        }, {
            onSuccess: (page) => {
                setIsProcessing(false);
                toast.dismiss(toastLoading);
                
                const flash = page.props.flash as any;
                if (flash && flash.transaction_failed) {
                    toast.error(flash.error || 'Gagal menyimpan transaksi');
                    return;
                }
                
                toast.success('Transaksi berhasil disimpan');
                
                let savedTransactionId = null;
                
                if (flash && flash.saved_transaction_id) {
                    savedTransactionId = flash.saved_transaction_id;
                    console.log('Found ID in flash:', savedTransactionId);
                }
                
                if (!savedTransactionId && page.props && page.props.saved_transaction_id) {
                    savedTransactionId = page.props.saved_transaction_id;
                    console.log('Found ID in props:', savedTransactionId);
                }
                
                if (!savedTransactionId) {
                    console.warn('Transaction appears successful but ID not found in response - continuing with receipt generation anyway');
                }
                
                setReceiptData({
                    id_transaksi: savedTransactionId,
                    nama_pasien: namaPasien,
                    layanan: selectedLayanan,
                    total_harga: totalHarga,
                    total_bayar: parseFloat(totalBayar),
                    kembalian: kembalian,
                    tanggal: new Date().toISOString()
                });

                setShowReceiptModal(true);
                
                setNamaPasien('');
                setSelectedLayanan([]);
                setTotalBayar('');
                setTotalHarga(0);
                setKembalian(0);
                
                localStorage.removeItem(STORAGE_KEYS.NAMA_PASIEN);
                localStorage.removeItem(STORAGE_KEYS.SELECTED_LAYANAN);
                localStorage.removeItem(STORAGE_KEYS.TOTAL_BAYAR);
            },
            onError: (errors) => {
                setIsProcessing(false);
                toast.dismiss(toastLoading);
                console.error('Error submitting transaction:', errors);
                toast.error('Terjadi kesalahan saat menyimpan transaksi');
            }
        });
    };

    const handlePrintReceipt = () => {
        if (!receiptData) {
            toast.error('Data receipt tidak tersedia');
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Popup blocked. Please allow popups for printing.');
            return;
        }

        const logoKiri = '/images/logokiri.png';
        const logoKanan = '/images/logokanan.png';

        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const today = new Date();
        const dayName = days[today.getDay()];
        
        const formattedDate = today.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '-');
        const receiptHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Struk Pembayaran</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 10mm 10mm 10mm 10mm;
                    }
                    *, *::before, *::after {
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Inter', system-ui, -apple-system, sans-serif;
                        width: 100%;
                        max-width: 100%;
                        margin: 0;
                        padding: 15px;
                        box-sizing: border-box;
                        font-size: 12px;
                        line-height: 1.5;
                        color: #1a1a1a;
                        background-color: #f9f9f9;
                    }
                    .receipt-container {
                        background-color: white;
                        max-width: 800px;
                        margin: 0 auto;
                        border-radius: 8px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                        overflow: hidden;
                        padding-bottom: 25px;
                    }
                    .header {
                        text-align: center;
                        padding: 15px 20px;
                        background-color: #f2f2f2;
                        position: relative;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    .logo-left {
                        position: absolute;
                        left: 20px;
                        top: 50%;
                        transform: translateY(-50%);
                        height: 60px;
                        border-radius: 4px;
                    }
                    .logo-right {
                        position: absolute;
                        right: 20px;
                        top: 50%;
                        transform: translateY(-50%);
                        height: 60px;
                        border-radius: 4px;
                    }
                    .header h2, .header h3, .header p {
                        margin: 4px 0;
                        color: #2c3e50;
                    }
                    .header h2 {
                        font-weight: 700;
                        font-size: 16px;
                    }
                    .header h3 {
                        font-weight: 600;
                        font-size: 14px;
                    }
                    .header p {
                        font-size: 12px;
                        color: #555;
                    }
                    .title-section {
                        text-align: center;
                        padding: 12px 0;
                        border-bottom: 2px dashed #e0e0e0;
                        margin: 0 25px 15px;
                    }
                    .title-section h3 {
                        margin: 0;
                        color: #2c3e50;
                        font-weight: 600;
                        font-size: 16px;
                    }
                    .content-section {
                        padding: 0 25px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    th, td {
                        border: 1px solid #e0e0e0;
                        padding: 8px 10px;
                        text-align: left;
                        font-size: 12px;
                    }
                    th {
                        background-color: #f8f9fa;
                        font-weight: 600;
                        color: #2c3e50;
                    }
                    tr:nth-child(even) {
                        background-color: #f8f9fa;
                    }
                    .total-row td {
                        font-weight: 700;
                        color: #2c3e50;
                        background-color: #e9f7ef;
                    }
                    .right-align {
                        text-align: right;
                    }
                    .footer {
                        margin-top: 20px;
                        text-align: right;
                        padding: 0 25px;
                    }
                    .signature-line {
                        margin-top: 50px;
                        border-top: 1px solid #555;
                        width: 150px;
                        display: inline-block;
                    }
                    .thank-you {
                        text-align: center;
                        margin-top: 25px;
                        color: #555;
                        font-size: 12px;
                        padding: 0 25px;
                    }
                    .receipt-info {
                        text-align: right;
                        font-size: 11px;
                        margin-top: 5px;
                        color: #777;
                        font-style: italic;
                    }
                    .stamp {
                        position: relative;
                        display: inline-block;
                        margin-top: 25px;
                        transform: rotate(-5deg);
                        opacity: 0.5;
                    }
                    .stamp-border {
                        position: absolute;
                        top: -10px;
                        left: -10px;
                        right: -10px;
                        bottom: -10px;
                        border: 2px dashed rgba(0, 128, 0, 0.5);
                        border-radius: 50%;
                    }
                    .stamp-text {
                        padding: 10px 15px;
                        font-weight: bold;
                        color: green;
                        font-size: 20px;
                        text-transform: uppercase;
                    }
                    @media print {
                        body {
                            width: 100%;
                            height: 100%;
                            background-color: white;
                            padding: 0;
                            margin: 0;
                        }
                        .receipt-container {
                            box-shadow: none;
                            max-width: 100%;
                            border-radius: 0;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                    .control-buttons {
                        text-align: center;
                        margin-top: 25px;
                    }
                    .btn {
                        padding: 10px 20px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 14px;
                        transition: all 0.2s ease;
                        margin: 0 5px;
                    }
                    .btn-print {
                        background-color: #4CAF50;
                        color: white;
                    }
                    .btn-print:hover {
                        background-color: #3e8e41;
                    }
                    .btn-close {
                        background-color: #f44336;
                        color: white;
                    }
                    .btn-close:hover {
                        background-color: #d32f2f;
                    }
                    .date-time-info {
                        font-size: 11px;
                        color: #777;
                        text-align: center;
                        margin-bottom: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="receipt-container">
                    <div class="header">
                        <img src="${logoKiri}" alt="Logo Kiri" class="logo-left" />
                        <h2>PEMERINTAH KABUPATEN SERANG</h2>
                        <h3>DINAS KESEHATAN</h3>
                        <h3>UPT PUSKESMAS BOJONEGARA</h3>
                        <p>Jl. KH. Jakfar No. 3 Bojonegara Kab. Serang Banten</p>
                        <p>Email: pkm_bojonegara@yahoo.co.id</p>
                        <img src="${logoKanan}" alt="Logo Kanan" class="logo-right" />
                    </div>
                    
                    <div class="title-section">
                        <h3>Struk Pembayaran E-Register Rajal</h3>
                    </div>
                    
                    <div class="date-time-info">
                        Dicetak pada: ${dayName}, ${formattedDate} ${new Date().toLocaleTimeString('id-ID')}
                    </div>
                    
                    <div class="content-section">
                        <table>
                            <tr>
                                <th width="15%">Tanggal</th>
                                <th width="25%">Nama</th>
                                <th width="30%">Pemeriksaan</th>
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
                                <td class="right-align">${formatRupiah(receiptData.layanan[0].total_harga * 0.4).replace('Rp', '')}</td>
                                <td class="right-align">${formatRupiah(receiptData.layanan[0].total_harga * 0.6).replace('Rp', '')}</td>
                                <td class="right-align">${formatRupiah(receiptData.layanan[0].total_harga).replace('Rp', '')}</td>
                                ` : `
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                `}
                            </tr>
                            ${receiptData.layanan.slice(1).map((item) => `
                                <tr>
                                    <td>${item.nama_layanan}</td>
                                    <td class="right-align">${formatRupiah(item.total_harga * 0.4).replace('Rp', '')}</td>
                                    <td class="right-align">${formatRupiah(item.total_harga * 0.6).replace('Rp', '')}</td>
                                    <td class="right-align">${formatRupiah(item.total_harga).replace('Rp', '')}</td>
                                </tr>
                            `).join('')}
                            <tr class="total-row">
                                <td colspan="5" class="right-align">JUMLAH</td>
                                <td class="right-align">${formatRupiah(receiptData.total_harga).replace('Rp', '')}</td>
                            </tr>
                        </table>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                            <div class="receipt-info">
                               
                            </div>
                            
                            <div class="stamp">
                                <div class="stamp-border"></div>
                                <div class="stamp-text">Lunas</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Mengetahui</p>
                        <div class="signature-line"></div>
                        <p>h ismat</p>
                    </div>
                    
                    <div class="thank-you">
                        <p>— Terima Kasih Atas Kunjungan Anda —</p>
                    </div>
                </div>

                <div class="control-buttons no-print">
                    <button onclick="window.print()" class="btn btn-print">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 5px;"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 14h12v8H6z"></path></svg>
                        Print Struk
                    </button>
                    <button onclick="window.close()" class="btn btn-close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 5px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        Tutup
                    </button>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        
        printWindow.onload = function() {
            printWindow.setTimeout(() => {
                printWindow.print();
            }, 500);
        };
    };

    const formatRupiah = (amount: number) => {
        
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const handleTotalBayarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const handlePrintTransaksi = (transaksi: Transaksi) => {
        const transactionReceiptData = {
            id_transaksi: transaksi.id_transaksi,
            nama_pasien: transaksi.nama_pasien,
            tanggal: transaksi.created_at,
            layanan: transaksi.transaksiDetails?.map(detail => detail.layanan) || [],
            total_harga: transaksi.total_harga,
            total_bayar: transaksi.total_bayar,
            kembalian: transaksi.total_bayar - transaksi.total_harga
        };
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Popup blocked. Please allow popups for printing.');
            return;
        }
        
        const logoKiri = '/images/logokiri.png';
        const logoKanan = '/images/logokanan.png';

        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const today = new Date();
        const dayName = days[today.getDay()];
        
        const formattedDate = today.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '-');

        const receiptHtml = generateReceiptHtml({
            logoKiri,
            logoKanan,
            dayName,
            formattedDate,
            receiptData: transactionReceiptData
        });
        
        printWindow.document.open();
        printWindow.document.write(receiptHtml);
        printWindow.document.close();

        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
        };
        setTimeout(() => {
            if (printWindow) {
                printWindow.focus();
                printWindow.print();
            }
        }, 1000);
    };
    
    const generateReceiptHtml = ({ logoKiri, logoKanan, dayName, formattedDate, receiptData }: any) => {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Struk Pembayaran</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 10mm 10mm 10mm 10mm;
                    }
                    *, *::before, *::after {
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Inter', system-ui, -apple-system, sans-serif;
                        width: 100%;
                        max-width: 100%;
                        margin: 0;
                        padding: 15px;
                        box-sizing: border-box;
                        font-size: 12px;
                        line-height: 1.5;
                        color: #1a1a1a;
                        background-color: #f9f9f9;
                    }
                    .receipt-container {
                        background-color: white;
                        max-width: 800px;
                        margin: 0 auto;
                        border-radius: 8px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                        overflow: hidden;
                        padding-bottom: 25px;
                    }
                    .header {
                        text-align: center;
                        padding: 15px 20px;
                        background-color: #f2f2f2;
                        position: relative;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    .logo-left {
                        position: absolute;
                        left: 20px;
                        top: 50%;
                        transform: translateY(-50%);
                        height: 60px;
                        border-radius: 4px;
                    }
                    .logo-right {
                        position: absolute;
                        right: 20px;
                        top: 50%;
                        transform: translateY(-50%);
                        height: 60px;
                        border-radius: 4px;
                    }
                    .header h2, .header h3, .header p {
                        margin: 4px 0;
                        color: #2c3e50;
                    }
                    .header h2 {
                        font-weight: 700;
                        font-size: 16px;
                    }
                    .header h3 {
                        font-weight: 600;
                        font-size: 14px;
                    }
                    .header p {
                        font-size: 12px;
                        color: #555;
                    }
                    .title-section {
                        text-align: center;
                        padding: 12px 0;
                        border-bottom: 2px dashed #e0e0e0;
                        margin: 0 25px 15px;
                    }
                    .title-section h3 {
                        margin: 0;
                        color: #2c3e50;
                        font-weight: 600;
                        font-size: 16px;
                    }
                    .content-section {
                        padding: 0 25px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    th, td {
                        border: 1px solid #e0e0e0;
                        padding: 8px 10px;
                        text-align: left;
                        font-size: 12px;
                    }
                    th {
                        background-color: #f8f9fa;
                        font-weight: 600;
                        color: #2c3e50;
                    }
                    tr:nth-child(even) {
                        background-color: #f8f9fa;
                    }
                    .total-row td {
                        font-weight: 700;
                        color: #2c3e50;
                        background-color: #e9f7ef;
                    }
                    .right-align {
                        text-align: right;
                    }
                    .footer {
                        margin-top: 20px;
                        text-align: right;
                        padding: 0 25px;
                    }
                    .signature-line {
                        margin-top: 50px;
                        border-top: 1px solid #555;
                        width: 150px;
                        display: inline-block;
                    }
                    .thank-you {
                        text-align: center;
                        margin-top: 25px;
                        color: #555;
                        font-size: 12px;
                        padding: 0 25px;
                    }
                    .receipt-info {
                        text-align: right;
                        font-size: 11px;
                        margin-top: 5px;
                        color: #777;
                        font-style: italic;
                    }
                    .stamp {
                        position: relative;
                        display: inline-block;
                        margin-top: 25px;
                        transform: rotate(-5deg);
                        opacity: 0.5;
                    }
                    .stamp-border {
                        position: absolute;
                        top: -10px;
                        left: -10px;
                        right: -10px;
                        bottom: -10px;
                        border: 2px dashed rgba(0, 128, 0, 0.5);
                        border-radius: 50%;
                    }
                    .stamp-text {
                        padding: 10px 15px;
                        font-weight: bold;
                        color: green;
                        font-size: 20px;
                        text-transform: uppercase;
                    }
                    @media print {
                        body {
                            width: 100%;
                            height: 100%;
                            background-color: white;
                            padding: 0;
                            margin: 0;
                        }
                        .receipt-container {
                            box-shadow: none;
                            max-width: 100%;
                            border-radius: 0;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                    .control-buttons {
                        text-align: center;
                        margin-top: 25px;
                    }
                    .btn {
                        padding: 10px 20px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 14px;
                        transition: all 0.2s ease;
                        margin: 0 5px;
                    }
                    .btn-print {
                        background-color: #4CAF50;
                        color: white;
                    }
                    .btn-print:hover {
                        background-color: #3e8e41;
                    }
                    .btn-close {
                        background-color: #f44336;
                        color: white;
                    }
                    .btn-close:hover {
                        background-color: #d32f2f;
                    }
                    .date-time-info {
                        font-size: 11px;
                        color: #777;
                        text-align: center;
                        margin-bottom: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="receipt-container">
                    <div class="header">
                        <img src="${logoKiri}" alt="Logo Kiri" class="logo-left" />
                        <h2>PEMERINTAH KABUPATEN SERANG</h2>
                        <h3>DINAS KESEHATAN</h3>
                        <h3>UPT PUSKESMAS BOJONEGARA</h3>
                        <p>Jl. KH. Jakfar No. 3 Bojonegara Kab. Serang Banten</p>
                        <p>Email: pkm_bojonegara@yahoo.co.id</p>
                        <img src="${logoKanan}" alt="Logo Kanan" class="logo-right" />
                    </div>
                    
                    <div class="title-section">
                        <h3>Struk Pembayaran E-Register Rajal</h3>
                    </div>
                    
                    <div class="date-time-info">
                        Dicetak pada: ${dayName}, ${formattedDate} ${new Date().toLocaleTimeString('id-ID')}
                    </div>
                    
                    <div class="content-section">
                        <table>
                            <tr>
                                <th width="15%">Tanggal</th>
                                <th width="25%">Nama</th>
                                <th width="30%">Pemeriksaan</th>
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
                                ${receiptData.layanan && receiptData.layanan.length > 0 ? `
                                <td>${receiptData.layanan[0].nama_layanan}</td>
                                <td class="right-align">${formatRupiah(receiptData.layanan[0].total_harga * 0.4).replace('Rp', '')}</td>
                                <td class="right-align">${formatRupiah(receiptData.layanan[0].total_harga * 0.6).replace('Rp', '')}</td>
                                <td class="right-align">${formatRupiah(receiptData.layanan[0].total_harga).replace('Rp', '')}</td>
                                ` : `
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                `}
                            </tr>
                            ${receiptData.layanan && receiptData.layanan.slice(1).map((item: any, index: number) => `
                                <tr>
                                    <td>${item.nama_layanan}</td>
                                    <td class="right-align">${formatRupiah(item.total_harga * 0.4).replace('Rp', '')}</td>
                                    <td class="right-align">${formatRupiah(item.total_harga * 0.6).replace('Rp', '')}</td>
                                    <td class="right-align">${formatRupiah(item.total_harga).replace('Rp', '')}</td>
                                </tr>
                            `).join('')}
                            <tr class="total-row">
                                <td colspan="5" class="right-align">JUMLAH</td>
                                <td class="right-align">${formatRupiah(receiptData.total_harga).replace('Rp', '')}</td>
                            </tr>
                        </table>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                            <div class="receipt-info">
                               
                            </div>
                            
                            <div class="stamp">
                                <div class="stamp-border"></div>
                                <div class="stamp-text">Lunas</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Mengetahui</p>
                        <div class="signature-line"></div>
                        <p>h ismat</p>
                    </div>
                    
                    <div class="thank-you">
                        <p>— Terima Kasih Atas Kunjungan Anda —</p>
                    </div>
                </div>

                <div class="control-buttons no-print">
                    <button onclick="window.print()" class="btn btn-print">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 5px;"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 14h12v8H6z"></path></svg>
                        Print Struk
                    </button>
                    <button onclick="window.close()" class="btn btn-close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 5px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        Tutup
                    </button>
                </div>
            </body>
            </html>
        `;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transaksi" />
            
            <style>{`
                @keyframes shimmer {
                    0% {
                        background-position: -200% 0;
                    }
                    100% {
                        background-position: 200% 0;
                    }
                }
                
                .swipe-action-row {
                    position: relative;
                    overflow: hidden;
                    touch-action: pan-y;
                    user-select: none;
                }
                
                .swipe-action-content {
                    transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
                    width: 100%;
                    z-index: 10;
                    background-color: inherit;
                }
                
                .swipe-action-delete {
                    position: absolute;
                    top: 0;
                    right: 0;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #ff4b4b, #ff0000);
                    color: white;
                    width: 80px;
                    opacity: 0;
                    transition: opacity 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
                    z-index: 5;
                    box-shadow: inset 4px 0 10px rgba(0, 0, 0, 0.1);
                }
                .card-3d {
                    transition: all 0.3s ease;
                    box-shadow: 0 10px 30px -15px rgba(0, 0, 0, 0.3);
                }
                .card-3d:hover {
                    box-shadow: 0 20px 40px -20px rgba(0, 0, 0, 0.4);
                }
                .shimmer-effect:hover::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
                    background-size: 200% 200%;
                    animation: shimmer 2s infinite;
                    z-index: 1;
                    pointer-events: none;
                }
                .dark .shimmer-effect:hover::before {
                    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.05), transparent);
                }
            `}</style>
            <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-10 gap-4">
                    <div className="space-y-4 md:col-span-6">
                        <Card className="shadow-lg rounded-xl border-primary/20 bg-white dark:bg-[#0A0A0A] relative overflow-hidden card-3d shimmer-effect">
                            <div className="absolute -right-5 -top-5 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-full z-0"></div>
                            <CardContent className="p-4 relative z-10">
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

                                <div className="space-y-2 mb-4">
                                    <label htmlFor="layanan" className="block text-sm font-medium">
                                        Layanan
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="layanan"
                                            type="text"
                                            value={searchLayanan}
                                            onChange={(e) => {
                                                setSearchLayanan(e.target.value);
                                                setIsDropdownVisible(e.target.value.length > 0);
                                            }}
                                            onFocus={(e) => {
                                                if (e.target.value.length > 0) {
                                                    setIsDropdownVisible(true);
                                                }
                                            }}
                                            placeholder="Cari layanan berdasarkan nama atau ID"
                                            className="pl-8 border-primary/20"
                                        />
                                    </div>
                                </div>
                                
                                <div 
                                    ref={dropdownRef}
                                    className={`border border-gray-200 dark:border-gray-700 rounded-lg shadow-md max-h-60 overflow-y-auto mb-4 ${!isDropdownVisible ? 'hidden' : ''}`}
                                >
                                    {layanan.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">
                                            Tidak ada layanan tersedia
                                        </div>
                                    ) : (
                                        layanan
                                            .filter(item => 
                                                !searchLayanan || 
                                                item.nama_layanan.toLowerCase().includes(searchLayanan.toLowerCase()) ||
                                                String(item.id_layanan).includes(searchLayanan)
                                            )
                                            .map((item) => (
                                                <div
                                                    key={item.id_layanan}
                                                    className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#111111] cursor-pointer flex justify-between items-center border-b border-gray-100 dark:border-gray-800 last:border-none"
                                                    onClick={() => {
                                                        addLayanan(item);
                                                        setIsDropdownVisible(false);
                                                    }}
                                                >
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white">{item.nama_layanan}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {item.id_layanan}</div>
                                                    </div>
                                                    <div className="font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">{formatRupiah(item.total_harga)}</div>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg rounded-xl border-primary/20 bg-white dark:bg-[#0A0A0A] relative overflow-hidden card-3d shimmer-effect">
                            <div className="absolute -right-5 -top-5 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-full z-0"></div>
                            <CardContent className="p-4 relative z-10">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-semibold text-primary flex items-center">
                                        <span className="bg-primary/20 text-primary p-1 rounded-md mr-2 inline-flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                        </span>
                                        Layanan Populer
                                    </h3>
                                    <Button
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                            setShowAllTransaksiModal(true);
                                            setFilteredTransaksi(transaksi);
                                            setSearchTransaksi('');
                                        }}
                                        className="text-xs bg-primary/20 text-primary border-primary/20"
                                    >
                                        Semua Transaksi
                                    </Button>
                                </div>

                                        <Table className="border-collapse">
                                    <TableHeader>
                                        <TableRow className="bg-gray-50 dark:bg-[#0A0A0A]/80">
                                            <TableHead className="text-primary font-medium py-3">Nama Layanan</TableHead>
                                            <TableHead className="text-right text-primary font-medium py-3">Harga</TableHead>
                                            <TableHead className="text-right text-primary font-medium py-3">Jumlah</TableHead>
                                            <TableHead className="text-right text-primary font-medium py-3">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {popularLayanan.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                                    Belum ada data layanan populer
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            popularLayanan.slice(0, 5).map((item, index) => (
                                                <TableRow key={item.id_layanan} className={index % 2 === 0 ? 
                                                    "bg-white dark:bg-[#0A0A0A]" : 
                                                    "bg-gray-50 dark:bg-[#0A0A0A]/80"
                                                }
                                                >
                                                    <TableCell className="font-medium">{item.nama_layanan}</TableCell>
                                                    <TableCell className="text-right font-medium text-primary">
                                                        {formatRupiah(item.total_harga)}
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm font-medium">
                                                        <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs">
                                                            {item.transaction_count}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => addLayanan(item)}
                                                            className="h-8 px-3 text-primary hover:text-white hover:bg-primary border border-primary/20 rounded-full transition-all duration-200"
                                                        >
                                                            <Plus className="h-4 w-4 mr-1" />
                                                            Tambah
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>


                    </div>
                    <div className="md:mt-0 md:col-span-4">
                        <Card className="shadow-xl rounded-xl border-none relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-[#0A0A0A] dark:to-[#0A0A0A] card-3d shimmer-effect">
                            <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-primary/20 to-transparent rounded-full z-0"></div>
                            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-tl from-primary/10 to-transparent rounded-full z-0"></div>
                            <CardContent className="p-5 relative z-10">
                                <div className="flex items-center space-x-2 mb-4">
                                    <ShoppingBag className="h-5 w-5 text-primary" />
                                    <h3 className="text-base font-semibold">Transaksi</h3>
                                </div>

                                <div className="space-y-4">
                                    {selectedLayanan.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>Belum ada layanan yang dipilih</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="rounded-lg border border-gray-200 dark:border-gray-800 w-full overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-gray-50 dark:bg-[#0A0A0A]/80">
                                                            <TableHead className="w-[60%] py-2 pl-3">Layanan</TableHead>
                                                            <TableHead className="text-right py-2 w-[40%]">Harga</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                </Table>
                                                <div className="max-h-56 overflow-y-auto custom-scrollbar w-full">
                                                    <Table>
                                                        <TableBody>
                                                            {selectedLayanan.map((layanan, index) => (
                                                                <TableRow 
                                                                    key={layanan.id_layanan}
                                                                    className={`swipe-action-row ${index % 2 === 0 ? 
                                                                        "bg-white dark:bg-[#0A0A0A]" : 
                                                                        "bg-gray-50 dark:bg-[#0A0A0A]/80"
                                                                    }`}
                                                                >
                                                                    <div 
                                                                        className="swipe-action-content flex w-full relative cursor-grab active:cursor-grabbing select-none"
                                                                        style={{
                                                                            transform: swipingItemId === layanan.id_layanan ? `translateX(${swipePosition}px)` : 'translateX(0)'
                                                                        }}
                                                                        onTouchStart={(e) => {
                                                                            e.preventDefault(); // Prevent text selection
                                                                            setSwipingItemId(layanan.id_layanan);
                                                                            setSwipePosition(0);
                                                                        }}
                                                                        onTouchMove={(e) => {
                                                                            if (swipingItemId === layanan.id_layanan) {
                                                                                const touch = e.touches[0];
                                                                                const element = e.currentTarget as HTMLElement;
                                                                                const newPosition = Math.min(0, Math.max(-80, touch.clientX - element.getBoundingClientRect().left - 200));
                                                                                setSwipePosition(newPosition);
                                                                            }
                                                                        }}
                                                                        onTouchEnd={(e) => {
                                                                            if (swipingItemId === layanan.id_layanan) {
                                                                                if (swipePosition < -40) {
                                                                                    removeLayanan(layanan.id_layanan);
                                                                                } else {
                                                                                    setSwipePosition(0);
                                                                                }
                                                                                setSwipingItemId(null);
                                                                            }
                                                                        }}
                                                                        onMouseDown={(e) => {
                                                                            e.preventDefault(); // Prevent text selection
                                                                            setIsDragging(true);
                                                                            setSwipingItemId(layanan.id_layanan);
                                                                            setStartX(e.clientX);
                                                                        }}
                                                                        onMouseMove={(e) => {
                                                                            if (isDragging && swipingItemId === layanan.id_layanan) {
                                                                                const newPosition = Math.min(0, Math.max(-80, e.clientX - startX));
                                                                                setSwipePosition(newPosition);
                                                                            }
                                                                        }}
                                                                        onMouseUp={(e) => {
                                                                            if (isDragging && swipingItemId === layanan.id_layanan) {
                                                                                if (swipePosition < -40) {
                                                                                    removeLayanan(layanan.id_layanan);
                                                                                } else {
                                                                                    setSwipePosition(0);
                                                                                }
                                                                                setIsDragging(false);
                                                                                setSwipingItemId(null);
                                                                            }
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            if (isDragging) {
                                                                                setSwipePosition(0);
                                                                                setIsDragging(false);
                                                                                setSwipingItemId(null);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <TableCell className="py-2 font-medium truncate w-[60%] pl-3">
                                                                            <div className="w-full truncate">{layanan.nama_layanan}</div>
                                                                        </TableCell>
                                                                        <TableCell className="py-2 text-right text-primary font-medium whitespace-nowrap pr-2 w-[40%]">
                                                                            <span className="inline-block min-w-[100px] text-right">{formatRupiah(layanan.total_harga)}</span>
                                                                        </TableCell>
                                                                    </div>
                                                                    <div 
                                                                        className="swipe-action-delete"
                                                                        style={{
                                                                            opacity: swipingItemId === layanan.id_layanan ? Math.min(1, Math.abs(swipePosition) / 80) : 0
                                                                        }}
                                                                    >
                                                                        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/10">
                                                                            <X className="h-5 w-5 mb-1 drop-shadow-sm" />
                                                                            <span className="text-xs font-medium tracking-wide drop-shadow-sm">Hapus</span>
                                                                        </div>
                                                                    </div>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/10">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-base font-medium">Total</p>
                                                    <p className="text-xl font-bold text-primary">{formatRupiah(totalHarga)}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <Button 
                                                    variant="outline" 
                                                    className="w-full font-medium rounded-xl border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                                                    onClick={handleReset}
                                                >
                                                    Batal
                                                </Button>
                                                <Button
                                                    className="w-full font-medium rounded-xl bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 hover:translate-y-[-2px] transition-all duration-200"
                                                    disabled={totalHarga === 0}
                                                    onClick={() => setShowPaymentModal(true)}
                                                >
                                                    <CreditCard className="mr-2 h-4 w-4" /> Bayar
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            
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
                            <div className="flex flex-col items-end">
                                {receiptData.layanan && receiptData.layanan.length > 0 ? (
                                    receiptData.layanan.map((layanan, index) => (
                                        <span key={`new-${layanan.id_layanan}-${index}`} className="text-lg">
                                            {layanan.nama_layanan || `Layanan #${layanan.id_layanan}`}
                                        </span>
                                    ))
                                ) : (
                                    viewingTransaksi?.transaksiDetails?.map((detail, index) => (
                                        <span key={detail.id_transaksi_detail || `existing-${index}`} className="text-lg">
                                            {detail.layanan?.nama_layanan || (detail.id_layanan ? `Layanan #${detail.id_layanan}` : '-')}
                                        </span>
                                    ))
                                )}
                                {(!receiptData.layanan || receiptData.layanan.length === 0) && (!viewingTransaksi?.transaksiDetails || viewingTransaksi.transaksiDetails.length === 0) && (
                                    <span className="text-lg text-muted-foreground">Tidak ada layanan</span>
                                )}
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


            <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus Transaksi</DialogTitle>
                    </DialogHeader>
                    <div className="p-4 space-y-4">
                        <p>Apakah Anda yakin ingin menghapus transaksi ini?</p>
                    </div>
                    <DialogFooter>
                        <Button variant="destructive" onClick={() => handleDeleteTransaction(confirmDeleteId as number)}>
                            HAPUS
                        </Button>
                        <Button variant="outline" onClick={() => setShowConfirmDelete(false)}>BATAL</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            <Dialog open={showTransaksiDetails} onOpenChange={setShowTransaksiDetails}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center">
                            Detail Transaksi
                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                #{viewingTransaksi?.id_transaksi}
                            </span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-4 space-y-4">
                        {viewingTransaksi && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-semibold text-muted-foreground text-sm">Pasien</h3>
                                            <p className="text-lg font-medium">{viewingTransaksi.nama_pasien}</p>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-muted-foreground text-sm">Tanggal</h3>
                                            <p className="text-base">{new Date(viewingTransaksi.created_at).toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-semibold text-muted-foreground text-sm">Total</h3>
                                            <p className="text-lg font-bold text-primary">{formatRupiah(viewingTransaksi.total_harga)}</p>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-muted-foreground text-sm">Status</h3>
                                            <p className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                                </svg>
                                                LUNAS
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="pt-2">
                                    <h3 className="font-semibold text-muted-foreground text-sm mb-2">Layanan</h3>
                                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                                        {viewingTransaksi.transaksiDetails?.map((detail, index) => (
                                            <div key={detail.id_transaksi_detail} className="flex justify-between items-center">
                                                <div className="flex items-center">
                                                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2">
                                                        {index + 1}
                                                    </span>
                                                    <span>{detail.layanan?.nama_layanan || `Layanan #${detail.id_layanan}`}</span>
                                                </div>
                                                {detail.layanan && (
                                                    <span className="text-sm font-semibold">{formatRupiah(detail.layanan.total_harga)}</span>
                                                )}
                                            </div>
                                        ))}
                                        {(!viewingTransaksi.transaksiDetails || viewingTransaksi.transaksiDetails.length === 0) && (
                                            <div className="text-center py-2 text-muted-foreground">Tidak ada layanan</div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <h3 className="font-semibold text-muted-foreground text-sm">Bayar</h3>
                                        <p className="text-lg font-medium">{formatRupiah(viewingTransaksi.total_bayar)}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-muted-foreground text-sm">Kembalian</h3>
                                        <p className="text-lg font-medium">{formatRupiah(viewingTransaksi.total_bayar - viewingTransaksi.total_harga)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowTransaksiDetails(false)}
                            className="flex-1"
                        >
                            TUTUP
                        </Button>
                        <Button 
                            className="flex-1 bg-primary hover:bg-primary/90"
                            onClick={() => {
                                if (viewingTransaksi) {
                                    handlePrintTransaksi(viewingTransaksi);
                                }
                            }}
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            CETAK
                        </Button>
                        <Button 
                            variant="destructive" 
                            className="flex-1"
                            onClick={() => {
                                if (viewingTransaksi) {
                                    setConfirmDeleteId(viewingTransaksi.id_transaksi);
                                    setShowConfirmDelete(true);
                                    setShowTransaksiDetails(false);
                                }
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            HAPUS
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-none shadow-xl">
                    <div className="relative">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/20 to-transparent rounded-full z-0"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tl from-primary/10 to-transparent rounded-full z-0"></div>
                        
                        <DialogHeader className="p-6 pb-2 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <CreditCard className="h-6 w-6 text-primary" />
                                </div>
                                <DialogTitle className="text-xl font-bold">Pembayaran</DialogTitle>
                            </div>
                        </DialogHeader>
                        
                        <div className="p-6 space-y-6 relative z-10">
                            <div className="flex justify-between items-center bg-primary/5 p-4 rounded-xl border border-primary/10">
                                <span className="text-base font-medium">Total Tagihan:</span>
                                <span className="text-2xl font-bold text-primary">{formatRupiah(totalHarga)}</span>
                            </div>
                            
                            <div className="space-y-3">
                                <label htmlFor="modal_nominal_bayar" className="block text-sm font-medium">
                                    Nominal Bayar
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-semibold text-lg">Rp</span>
                                    <Input
                                        id="modal_nominal_bayar"
                                        type="text"
                                        value={totalBayar}
                                        onChange={handleTotalBayarChange}
                                        placeholder=""
                                        className="pl-12 py-8 text-3xl font-bold border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-inner bg-white dark:bg-gray-950"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {kembalian >= 0 && totalBayar !== '' && (
                                <div className="space-y-2 animate-fadeIn">
                                    <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/40">
                                        <span className="text-base font-medium text-green-800 dark:text-green-300">Kembalian:</span>
                                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            {(() => {
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
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="p-6 pt-0 relative z-10">
                        <div className="grid grid-cols-2 gap-4">
                            <Button 
                                variant="outline" 
                                className="w-full font-medium rounded-xl py-6 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                                onClick={() => setShowPaymentModal(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                className="w-full font-medium rounded-xl py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:translate-y-[-2px] transition-all duration-200"
                                disabled={totalHarga === 0 || parseInt(totalBayar || '0') < totalHarga}
                                onClick={() => {
                                    handleSubmit();
                                    setShowPaymentModal(false);
                                }}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="mr-2 h-5 w-5" /> Konfirmasi Pembayaran
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            
            <Dialog open={showAllTransaksiModal} onOpenChange={setShowAllTransaksiModal}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Semua Transaksi</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                value={searchTransaksi}
                                onChange={(e) => setSearchTransaksi(e.target.value)}
                                placeholder="Cari berdasarkan nama pasien"
                                className="pl-8 border-primary/20"
                            />
                        </div>
                        
                        <div className="overflow-auto max-h-[60vh]">
                            <div className="border rounded-md overflow-hidden">
                                <div className="grid grid-cols-5 font-semibold bg-muted/50 p-2 text-sm border-b">
                                    <div className="col-span-1">Pasien</div>
                                    <div className="col-span-1">Layanan</div>
                                    <div className="col-span-1 text-right">Total</div>
                                    <div className="col-span-1 text-center">Waktu</div>
                                    <div className="col-span-1 text-center">Aksi</div>
                                </div>
                                <div className="max-h-[50vh] overflow-y-auto">
                                    {filteredTransaksi.length > 0 ? (
                                        filteredTransaksi.map((item) => (
                                            <div key={item.id_transaksi} className="grid grid-cols-5 p-2 text-sm border-b last:border-b-0 hover:bg-muted/20">
                                                <div className="col-span-1 flex items-center">{item.nama_pasien}</div>
                                                <div className="col-span-1 flex items-center">
                                                    {item.transaksiDetails && item.transaksiDetails.length > 0 ? (
                                                        <>
                                                            {item.transaksiDetails.length <= 1 ? (
                                                                // If only one service, show it
                                                                <span>
                                                                    {item.transaksiDetails[0].layanan?.nama_layanan || 
                                                                     (item.transaksiDetails[0].id_layanan ? `Layanan #${item.transaksiDetails[0].id_layanan}` : '-')}
                                                                </span>
                                                            ) : (
                                                                // If more than one service, show first one + count
                                                                <span>
                                                                    {item.transaksiDetails[0].layanan?.nama_layanan || 
                                                                     (item.transaksiDetails[0].id_layanan ? `Layanan #${item.transaksiDetails[0].id_layanan}` : '-')}
                                                                    <span className="text-xs text-muted-foreground ml-1">
                                                                        (+{item.transaksiDetails.length - 1} lainnya)
                                                                    </span>
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </div>
                                                <div className="col-span-1 flex items-center justify-end">
                                                    {formatRupiah(item.total_harga)}
                                                </div>
                                                <div className="col-span-1 flex items-center justify-center text-xs text-muted-foreground">
                                                    {new Date(item.created_at).toLocaleDateString('id-ID', { 
                                                        day: '2-digit', 
                                                        month: '2-digit', 
                                                        year: 'numeric'
                                                    }).replace(/\//g, '/')}
                                                    <br />
                                                    {new Date(item.created_at).toLocaleTimeString('id-ID', { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                                <div className="col-span-1 flex items-center justify-center space-x-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8"
                                                        title="Lihat Detail"
                                                        onClick={() => {
                                                            setViewingTransaksi(item);
                                                            setShowTransaksiDetails(true);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8"
                                                        title="Cetak Struk"
                                                        onClick={() => handlePrintTransaksi(item)}
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-destructive"
                                                        title="Hapus"
                                                        onClick={() => {
                                                            setConfirmDeleteId(item.id_transaksi);
                                                            setShowConfirmDelete(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-muted-foreground">
                                            Tidak ada transaksi yang ditemukan
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
