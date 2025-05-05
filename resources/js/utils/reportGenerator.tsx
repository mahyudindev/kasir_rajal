import React from 'react';
import { formatRupiah } from './receiptGenerator';

const formatIndonesianDate = (dateStr: string) => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const year = parts[2];
  
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  return `${day} ${monthNames[month-1]} ${year}`;
};

export interface ReportData {
  title: string;
  period: string;
  periodType: 'daily' | 'weekly' | 'monthly';
  layananStats: LayananStat[];
  totalTransactions: number;
  totalAmount: number;
  startDate: string;
  endDate: string;
}

export interface LayananStat {
  id_layanan: number;
  nama_layanan: string;
  jumlah_transaksi: number;
  harga: number;
  total: number;
}

interface ReportOptions {
  logoKiri: string;
  logoKanan: string;
  dayName: string;
  formattedDate: string;
  reportData: ReportData;
}

export const generateReportHtml = ({ logoKiri, logoKanan, dayName, formattedDate, reportData }: ReportOptions): string => {
  let periodTypeTitle = '';
  switch (reportData.periodType) {
    case 'daily':
      periodTypeTitle = 'Harian';
      break;
    case 'weekly':
      periodTypeTitle = 'Mingguan';
      break;
    case 'monthly':
      periodTypeTitle = 'Bulanan';
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Laporan ${periodTypeTitle}</title>
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
                padding: 8px;
                box-sizing: border-box;
                font-size: 10px;
                line-height: 1.3;
                color: #1a1a1a;
                background-color: #f9f9f9;
            }
            .receipt-container {
                background-color: white;
                max-width: 800px;
                margin: 0 auto;
                overflow: hidden;
                padding-bottom: 15px;
            }
            .header {
                text-align: center;
                padding: 30px 100px;
                position: relative;
                border-bottom: 2px solid #000;
                min-height: 110px;
            }
            .logo-left {
                position: absolute;
                left: 10px;
                top: 50%;
                transform: translateY(-50%);
                height: 90px;
            }
            .logo-right {
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                height: 90px;
            }
            .header h2, .header h3, .header p {
                margin: 2px 0;
                color: #000;
            }
            .header h2 {
                font-weight: 700;
                font-size: 14px;
                letter-spacing: 1px;
            }
            .header h3 {
                font-weight: 600;
                font-size: 12px;
            }
            .header p {
                font-size: 10px;
                color: #333;
            }
            .title-section {
                text-align: center;
                padding: 8px 0;
                border-bottom: 1px solid #000;
                margin: 0 15px 8px;
            }
            .title-section h3 {
                margin: 0;
                color: #000;
                font-weight: 600;
                font-size: 12px;
            }
            .content-section {
                padding: 0 10px;
            }
            .period-info {
                text-align: center;
                margin-bottom: 8px;
                font-weight: 600;
                color: #000;
                font-size: 10px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            th, td {
                border: 1px solid #000;
                padding: 2px 4px;
                text-align: left;
                font-size: 9px;
            }
            th {
                background-color: #fff;
                font-weight: 600;
                color: #000;
            }
            tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            .compact-table tr {
                line-height: 1.1;
            }
            .compact-table td {
                padding: 1px 3px;
            }
            .total-row td {
                font-weight: 700;
                color: #000;
                background-color: #fff;
            }
            .right-align {
                text-align: right;
            }
            .center-align {
                text-align: center;
            }
            .summary-stats {
                background-color: #f8fcff;
                border: 1px solid #dce7f0;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 20px;
            }
            .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            .summary-label {
                font-weight: 600;
                color: #2c3e50;
            }
            .summary-value {
                font-weight: 700;
                color: #2c3e50;
            }
            .footer {
                margin-top: 20px;
                text-align: right;
                padding: 0 25px;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
            }
            .signature-image {
                display: block;
                max-width: 70px;
                height: auto;
                margin: 5px 0;
            }
            .date-time-info {
                font-size: 11px;
                color: #777;
                text-align: center;
                margin-bottom: 10px;
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
        </style>
    </head>
    <body>
        <div class="receipt-container">
            <div class="header">
                <img src="${logoKiri}" alt="Logo Kiri" class="logo-left" />
                <h2>PEMERINTAH KABUPATEN SERANG</h2>
                <h3>DINAS KESEHATAN</h3>
                <h3>UPT PUSKESMAS BOJONEGARA</h3>
                <p>Jl. KH. Bakrie No. 3 Bojonegara Kab. Serang Banten</p>
                <p>E-mail : pkm_bojonegara@yahoo.co.id</p>
                <img src="${logoKanan}" alt="Logo Kanan" class="logo-right" />
            </div>
            
            <div class="title-section">
                <h3>LAPORAN ${periodTypeTitle.toUpperCase()} E-REGISTER RAJAL</h3>
            </div>
            
            <div class="date-time-info" style="text-align: right; font-size: 8px; margin: 2px 10px;">
                Dicetak: ${dayName}, ${formatIndonesianDate(formattedDate)}
            </div>
            
            <div class="content-section">
                <div class="period-info">
                    Periode: ${reportData.period}
                </div>
                

                
                <table cellspacing="0" cellpadding="0">
                  <thead>
                    <tr>
                        <th width="5%" class="center-align">No</th>
                        <th width="40%">Nama Layanan</th>
                        <th width="15%" class="center-align">Jumlah</th>
                        <th width="20%" class="right-align">Harga</th>
                        <th width="20%" class="right-align">Total</th>
                    </tr>
                  </thead>
                  <tbody class="compact-table">
                    ${reportData.layananStats.map((item, index) => `
                      <tr>
                        <td class="center-align">${index + 1}</td>
                        <td>${item.nama_layanan}</td>
                        <td class="center-align">${item.jumlah_transaksi > 0 ? item.jumlah_transaksi : '-'}</td>
                        <td class="right-align">${formatRupiah(item.harga)}</td>
                        <td class="right-align">${item.total > 0 ? formatRupiah(item.total) : '-'}</td>
                      </tr>
                    `).join('')}
                    <tr class="total-row">
                      <td colspan="4" class="right-align"><strong>Total</strong></td>
                      <td class="right-align"><strong>${formatRupiah(reportData.totalAmount)}</strong></td>
                    </tr>
                  </tbody>
                </table>
            </div>
            
            <div style="text-align: right; margin: 10px 30px 0 0; font-size: 9px;">
                <div>Mengetahui, ${dayName} ${formatIndonesianDate(formattedDate)}</div>
                <div></div>
                <div>Kepala UPT Puskesmas Bojonegara</div>
                <div style="height: 40px;"></div>
                <div style="font-weight: bold;"><u>drg Yatni Suprapti Nafisah</u></div>
                <div>NIP: 197409052007012003</div>
            </div>
        </div>

        <div class="control-buttons no-print">
            <button id="printButton" class="btn btn-print">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 5px;"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 14h12v8H6z"></path></svg>
                Print Laporan
            </button>
            <button id="closeButton" class="btn btn-close">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 5px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                Tutup
            </button>
        </div>
        <script>
            // Use a flag to prevent multiple executions
            let printExecuted = false;
            let closeExecuted = false;
            
            document.getElementById('printButton').addEventListener('click', function(e) {
                e.preventDefault();
                if (!printExecuted) {
                    printExecuted = true;
                    window.print();
                    // Reset after a short delay
                    setTimeout(() => { printExecuted = false; }, 500);
                }
            });
            
            document.getElementById('closeButton').addEventListener('click', function(e) {
                e.preventDefault();
                if (!closeExecuted) {
                    closeExecuted = true;
                    window.close();
                }
            });
        </script>
    </body>
    </html>
  `;
};
