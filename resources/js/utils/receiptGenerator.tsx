import React from 'react';

export interface ReceiptData {
  id_transaksi?: number;
  nama_pasien: string;
  layanan: Array<{
    id_layanan: number;
    nama_layanan: string;
    total_harga: number;
  }>;
  total_harga: number;
  total_bayar: number;
  kembalian: number;
  tanggal: string;
}

interface ReceiptOptions {
  logoKiri: string;
  logoKanan: string;
  dayName: string;
  formattedDate: string;
  receiptData: ReceiptData;
}

export const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export const generateReceiptHtml = ({ logoKiri, logoKanan, dayName, formattedDate, receiptData }: ReceiptOptions): string => {
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
                display: flex;
                flex-direction: column;
                align-items: flex-end;
            }
            .signature-line {
                margin-top: 50px;
                border-top: 1px solid #555;
                width: 150px;
                display: inline-block;
            }
            .signature-image {
                display: block;
                max-width: 70px;
                height: auto;
                margin: 5px 0;
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
                    ${receiptData.layanan && receiptData.layanan.slice(1).map((item: any) => `
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
                <img src="/images/ttd.png" alt="Tanda Tangan" class="signature-image" />
                <p>H. Ismat</p>
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
