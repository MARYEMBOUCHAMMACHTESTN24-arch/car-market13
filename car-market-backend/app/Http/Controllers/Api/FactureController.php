<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

use App\Notifications\PurchaseNotification;

class FactureController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->hasRole('admin') || $user->hasRole('manager')) {
            $factures = Facture::with(['client', 'vehicle', 'order'])->latest()->get();
        } else {
            $factures = Facture::with(['client', 'vehicle', 'order'])->where('client_id', $user->id)->latest()->get();
        }

        return response()->json($factures);
    }

    public function show($id, Request $request)
    {
        $facture = Facture::with(['client', 'vehicle', 'order'])->findOrFail($id);
        
        $user = $request->user();
        if (!$user->hasRole('admin') && !$user->hasRole('manager') && $facture->client_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($facture);
    }

    public function downloadPdf($id, Request $request)
    {
        $facture = Facture::with(['client', 'vehicle', 'order'])->findOrFail($id);
        
        $user = $request->user();
        if (!$user->hasRole('admin') && !$user->hasRole('manager') && $facture->client_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.invoice', compact('facture'));
        
        return $pdf->download('Invoice-' . $facture->invoice_number . '.pdf');
    }

    public function generate(Request $request, $orderId)
    {
        $request->validate([
            'appointment_date' => 'nullable|date',
            'payment_status' => 'nullable|string'
        ]);

        $order = Order::with(['car', 'user'])->findOrFail($orderId);
        
        if ($order->status !== 'validated') {
            $order->status = 'validated';
            $order->save();
        }

        $facture = Facture::where('order_id', $order->id)->first();
        $isNew = false;

        if (!$facture) {
            $facture = Facture::create([
                'invoice_number' => 'INV-' . strtoupper(Str::random(8)),
                'order_id' => $order->id,
                'client_id' => $order->user_id,
                'vehicle_id' => $order->car_id,
                'total_amount' => $order->car ? $order->car->price : 0,
                'payment_status' => $request->input('payment_status', 'pending'),
                'appointment_date' => $request->input('appointment_date') ?: ($order->appointment_date ? $order->appointment_date . ' ' . $order->appointment_time : null),
            ]);
            $isNew = true;
        }

        if ($isNew && $order->user) {
            $order->user->notify(new PurchaseNotification('invoice_generated', [
                'message' => 'An invoice has been generated for your purchase request.',
                'order_id' => $order->id,
                'facture_id' => $facture->id,
                'url' => '/invoice/' . $facture->id
            ]));

            // Notify for documents
            $order->user->notify(new PurchaseNotification('documents_required', [
                'message' => 'Please provide the required documents to complete your purchase.',
                'order_id' => $order->id,
                'facture_id' => $facture->id,
                'url' => '/invoice/' . $facture->id
            ]));
        }

        return response()->json(['message' => 'Invoice generated successfully', 'facture' => $facture]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'payment_status' => 'required|string'
        ]);

        $facture = Facture::with('client')->findOrFail($id);
        $facture->payment_status = $request->input('payment_status');
        $facture->save();

        if ($facture->client) {
            $facture->client->notify(new PurchaseNotification('payment_status_changed', [
                'message' => 'Your invoice payment status has been updated to: ' . $facture->payment_status,
                'facture_id' => $facture->id,
                'url' => '/invoice/' . $facture->id
            ]));
        }

        return response()->json(['message' => 'Payment status updated', 'facture' => $facture]);
    }

    public function scheduleAppointment(Request $request, $orderId)
    {
        $request->validate([
            'appointment_date' => 'required|date_format:Y-m-d',
            'appointment_time' => 'required|date_format:H:i',
            'appointment_location' => 'nullable|string',
            'appointment_note' => 'nullable|string',
        ]);

        $order = Order::with('user')->findOrFail($orderId);
        $order->appointment_date = $request->input('appointment_date');
        $order->appointment_time = $request->input('appointment_time');
        $order->appointment_location = $request->input('appointment_location');
        $order->appointment_note = $request->input('appointment_note');
        $order->save();

        if ($order->user) {
            $order->user->notify(new PurchaseNotification('appointment_scheduled', [
                'message' => 'An appointment has been scheduled for your purchase request on ' . $order->appointment_date . ' at ' . $order->appointment_time,
                'order_id' => $order->id,
                'url' => '/dashboard/orders'
            ]));
        }

        return response()->json(['message' => 'Appointment scheduled', 'order' => $order]);
    }
}
