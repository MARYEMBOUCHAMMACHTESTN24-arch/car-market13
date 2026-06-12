<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Facture {{ $facture->invoice_number }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #333;
            margin: 0;
            padding: 20px;
            font-size: 14px;
        }
        .info-section {
            width: 100%;
            margin-bottom: 30px;
        }
        .info-section td {
            vertical-align: top;
            width: 50%;
        }
        .box {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .box h3 {
            font-size: 12px;
            color: #D32F2F;
            text-transform: uppercase;
            margin-top: 0;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }
        .box p {
            margin: 5px 0;
            color: #111827;
        }
        .box .label {
            color: #6b7280;
            font-size: 12px;
            display: inline-block;
            width: 120px;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .details-table th, .details-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        .details-table th {
            background-color: #f3f4f6;
            color: #374151;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .details-table td {
            color: #111827;
        }
        .total-section {
            text-align: right;
            margin-top: 20px;
        }
        .total-section h3 {
            font-size: 24px;
            color: #D32F2F;
            margin: 0;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-paid { background-color: #d1fae5; color: #065f46; }
        .status-pending { background-color: #fef3c7; color: #92400e; }
        .status-cancelled { background-color: #fee2e2; color: #991b1b; }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
        }
        .footer h4 {
            color: #111827;
            margin: 0 0 10px 0;
        }
        .footer ul {
            padding-left: 20px;
            margin: 0;
        }
    </style>
</head>
<body>

    <div class="header">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:2px solid #e5e7eb; padding-bottom:20px; margin-bottom:40px;">
            <tr>
                <td style="vertical-align: middle; width: 50%;">
                    @php
                        $logoPath = public_path('logo-horizontal.svg');
                        $logoData = file_exists($logoPath)
                            ? 'data:image/svg+xml;base64,' . base64_encode(file_get_contents($logoPath))
                            : null;
                    @endphp
                    @if($logoData)
                        <img src="{{ $logoData }}" alt="AutoMark" style="height:40px; width:auto; display:block; margin-bottom:12px;" />
                    @else
                        <h1 style="color:#111827; font-size:26px; margin:0 0 4px 0; text-transform:uppercase;">AutoMark</h1>
                    @endif
                    <p style="color:#6b7280; margin:0; font-size:12px;">Premium Vehicles</p>
                    <p style="color:#6b7280; margin:2px 0 0 0; font-size:11px;">123 AutoMarket Boulevard, Casablanca 20000</p>
                    <p style="color:#6b7280; margin:2px 0 0 0; font-size:11px;">+212 522 000 000 &middot; contact@automarket.ma</p>
                    <p style="color:#6b7280; margin:2px 0 0 0; font-size:11px;">www.automarket.ma &middot; RC: 12345 &middot; ICE: 00000000000000</p>
                </td>
                <td style="vertical-align: middle; text-align: right; width: 50%;">
                    <h2 style="color:#111827; font-size:36px; margin:0; text-transform:uppercase; letter-spacing:4px;">FACTURE</h2>
                    <p style="color:#D32F2F; font-size:14px; font-weight:bold; margin:6px 0 0 0;">{{ $facture->invoice_number }}</p>
                </td>
            </tr>
        </table>
    </div>

    <table class="info-section">
        <tr>
            <td style="padding-right: 10px;">
                <div class="box">
                    <h3>Facturé à</h3>
                    <p><strong>{{ $facture->client->name ?? 'N/A' }}</strong></p>
                    <p><span class="label">Email:</span> {{ $facture->client->email ?? 'N/A' }}</p>
                    <p><span class="label">Téléphone:</span> {{ $facture->client->phone ?? $facture->order->phone ?? 'N/A' }}</p>
                </div>
            </td>
            <td style="padding-left: 10px;">
                <div class="box">
                    <h3>Détails de la commande</h3>
                    <p><span class="label">N° de commande:</span> #{{ str_pad($facture->order_id, 5, '0', STR_PAD_LEFT) }}</p>
                    <p><span class="label">Date d'émission:</span> {{ \Carbon\Carbon::parse($facture->created_at)->format('d/m/Y') }}</p>
                    <p><span class="label">Rendez-vous:</span> 
                        @if($facture->appointment_date)
                            {{ \Carbon\Carbon::parse($facture->appointment_date)->format('d/m/Y') }} à {{ substr($facture->order->appointment_time ?? '00:00', 0, 5) }}
                        @else
                            Non planifié
                        @endif
                    </p>
                    <p><span class="label">Lieu:</span> {{ $facture->order->appointment_location ?? 'N/A' }}</p>
                </div>
            </td>
        </tr>
    </table>

    <table class="details-table">
        <thead>
            <tr>
                <th>Description du véhicule</th>
                <th>Année</th>
                <th>Carburant</th>
                <th>Montant</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <strong>{{ $facture->vehicle->brand ?? '' }} {{ $facture->vehicle->model ?? '' }}</strong>
                </td>
                <td>{{ $facture->vehicle->year ?? '' }}</td>
                <td>{{ $facture->vehicle->fuel_type ?? '' }}</td>
                <td>{{ number_format($facture->total_amount, 2, ',', ' ') }} DH</td>
            </tr>
        </tbody>
    </table>

    <table class="info-section">
        <tr>
            <td style="padding-right: 10px;">
                <div class="box">
                    <h3>Statut du Paiement</h3>
                    @php
                        $statusClass = 'status-pending';
                        if($facture->payment_status == 'paid') $statusClass = 'status-paid';
                        if($facture->payment_status == 'cancelled') $statusClass = 'status-cancelled';
                    @endphp
                    <span class="status-badge {{ $statusClass }}">
                        {{ strtoupper($facture->payment_status) }}
                    </span>
                </div>
            </td>
            <td style="padding-left: 10px; text-align: right;">
                <div class="total-section">
                    <p style="color: #6b7280; margin-bottom: 5px; font-weight: bold; text-transform: uppercase;">Total à payer</p>
                    <h3>{{ number_format($facture->total_amount, 2, ',', ' ') }} DH</h3>
                </div>
            </td>
        </tr>
    </table>

    <div class="footer">
        <h4>Documents requis pour finaliser l'achat :</h4>
        <ul>
            <li>CIN / Carte d'identité nationale valide</li>
            <li>Preuve de paiement (virement bancaire ou chèque certifié)</li>
            <li>Contrat d'achat signé</li>
            <li>Permis de conduire valide</li>
            <li>Documents d'assurance (si requis)</li>
        </ul>
        <p style="margin-top: 20px; text-align: center; color: #9ca3af;">Merci pour votre confiance. AutoMarket vous accompagne.</p>
    </div>

</body>
</html>

