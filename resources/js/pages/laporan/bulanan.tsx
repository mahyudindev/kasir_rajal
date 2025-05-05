import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import axios from 'axios';
import { toast } from 'sonner';
import { formatRupiah } from '@/utils/receiptGenerator';
import { generateReportHtml } from '@/utils/reportGenerator';

interface LayananStat {
  id_layanan: number;
  nama_layanan: string;
  jumlah_transaksi: number;
  harga: number;
  total: number;
}

interface ReportData {
  layananStats: LayananStat[];
  totalTransactions: number;
  totalAmount: number;
  startDate: string;
  endDate: string;
}

const ReportBulananPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReport = async () => {
    if (!date) {
      toast.error('Pilih bulan terlebih dahulu');
      return;
    }

    // Clear existing report data
    setReportData(null);
    
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    const year = date.getFullYear();
    
    console.log('Button: Fetching monthly report for:', year, 'month:', month);

    try {
      setIsLoading(true);
      const response = await axios.get('/api/laporan/bulanan', {
        params: {
          month: month,
          year: year,
        },
      });

      console.log('Button: Monthly report data received:', response.data);
      
      const startDateFormatted = format(monthStart, 'yyyy-MM-dd');
      const endDateFormatted = format(monthEnd, 'yyyy-MM-dd');
      
      setReportData({
        ...response.data,
        startDate: startDateFormatted,
        endDate: endDateFormatted
      });
    } catch (error) {
      console.error('Button: Error fetching monthly report:', error, 'Month:', month, 'Year:', year);
      toast.error('Gagal mengambil data laporan bulanan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (!reportData) {
      toast.error('Tidak ada data laporan untuk dicetak');
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

    const monthPeriod = format(date!, 'MMMM yyyy', { locale: id });

    const reportHtml = generateReportHtml({
      logoKiri,
      logoKanan,
      dayName,
      formattedDate,
      reportData: {
        title: 'Laporan Bulanan',
        period: monthPeriod,
        periodType: 'monthly',
        layananStats: reportData.layananStats,
        totalTransactions: reportData.totalTransactions,
        totalAmount: reportData.totalAmount,
        startDate: reportData.startDate,
        endDate: reportData.endDate
      }
    });

    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();

    // Use only one print trigger to avoid duplicate dialogs
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const getMonthDisplay = () => {
    return date ? format(date, 'MMMM yyyy', { locale: id }) : 'Pilih bulan';
  };

  const breadcrumbs = [
    { title: 'Dashboard', href: '/' },
    { title: 'Laporan', href: '#' },
    { title: 'Bulanan', href: '/laporan/bulanan' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Laporan Bulanan" />
      
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg rounded-xl border-primary/20 bg-white dark:bg-[#0A0A0A] relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 md:mb-0">
                Laporan Bulanan
              </h1>
              
              <div className="flex space-x-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal border-primary/20",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {getMonthDisplay()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => {
                        setDate(newDate);
                        if (newDate) {
                          // Clear any existing report data when selecting a new date
                          setReportData(null);
                          
                          setTimeout(() => {
                            setIsLoading(true);
                            const month = newDate.getMonth() + 1; // JavaScript months are 0-indexed
                            const year = newDate.getFullYear();
                            
                            console.log('Fetching monthly report for:', year, 'month:', month);
                            
                            axios.get('/api/laporan/bulanan', {
                              params: {
                                month: month,
                                year: year,
                              },
                            })
                            .then(response => {
                              console.log('Monthly report data received:', response.data);
                              const monthStart = startOfMonth(newDate);
                              const monthEnd = endOfMonth(newDate);
                              
                              const startDateFormatted = format(monthStart, 'yyyy-MM-dd');
                              const endDateFormatted = format(monthEnd, 'yyyy-MM-dd');
                              
                              setReportData({
                                ...response.data,
                                startDate: startDateFormatted,
                                endDate: endDateFormatted
                              });
                              toast.success('Data laporan berhasil dimuat');
                            })
                            .catch(error => {
                              console.error('Error fetching monthly report:', error, 'Month:', month, 'Year:', year);
                              toast.error('Gagal mengambil data laporan bulanan');
                            })
                            .finally(() => {
                              setIsLoading(false);
                            });
                          }, 100);
                        }
                      }}
                      initialFocus
                      locale={id}
                    />
                  </PopoverContent>
                </Popover>
                
                <Button 
                  onClick={fetchReport} 
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isLoading ? 'Memuat...' : 'Lihat Laporan'}
                </Button>
              </div>
            </div>
            
            {reportData ? (
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 shadow-inner">
                  <div className="bg-white dark:bg-[#0A0A0A] p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Transaksi Bulanan</p>
                    <p className="text-2xl font-bold text-primary">{formatRupiah(reportData.totalAmount)}</p>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold mb-3">Detail Layanan</h2>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-[#0A0A0A]/80">
                          <TableHead className="w-[60px] text-center">No</TableHead>
                          <TableHead>Nama Layanan</TableHead>
                          <TableHead className="text-center">Jumlah</TableHead>
                          <TableHead className="text-right">Harga Satuan</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.layananStats.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                              Tidak ada data layanan untuk ditampilkan
                            </TableCell>
                          </TableRow>
                        ) : (
                          reportData.layananStats.map((item, index) => (
                            <TableRow key={item.id_layanan} className={index % 2 === 0 ? 
                              "bg-white dark:bg-[#0A0A0A]" : 
                              "bg-gray-50 dark:bg-[#0A0A0A]/80"
                            }>
                              <TableCell className="text-center">{index + 1}</TableCell>
                              <TableCell>{item.nama_layanan}</TableCell>
                              <TableCell className="text-center">{item.jumlah_transaksi}</TableCell>
                              <TableCell className="text-right">{formatRupiah(item.harga)}</TableCell>
                              <TableCell className="text-right font-medium">{formatRupiah(item.total)}</TableCell>
                            </TableRow>
                          ))
                        )}
                        {reportData.layananStats.length > 0 && (
                          <TableRow className="border-t-2 bg-primary/5 dark:bg-primary/10">
                            <TableCell colSpan={4} className="text-right font-semibold">TOTAL</TableCell>
                            <TableCell className="text-right font-bold text-primary">{formatRupiah(reportData.totalAmount)}</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleGenerateReport}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak Laporan
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 text-center">
                <p className="text-muted-foreground">
                  Pilih bulan dan klik "Lihat Laporan" untuk menampilkan laporan bulanan
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ReportBulananPage;
