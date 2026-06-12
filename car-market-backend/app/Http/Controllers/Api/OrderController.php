<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        if ($user->can('view_orders')) {
            $orders = Order::with(['user', 'car'])->latest()->get();
        } else {
            $orders = Order::with(['user', 'car'])->where('user_id', $user->id)->get();
        }
        
        return response()->json($orders);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'car_id' => 'required|exists:cars,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|digits:10',
            'status' => 'nullable|in:pending,approved,rejected'
        ], [
            'phone.digits' => 'Phone number must contain exactly 10 digits.'
        ]);

        $order = Order::create([
            'user_id' => $request->user()->id,
            'car_id' => $validated['car_id'],
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'status' => $validated['status'] ?? 'pending'
        ]);

        // Notify admin about new order request
        $admins = \App\Models\User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'new_request',
                'title' => 'New Car Request',
                'message' => "New order request from {$order->name} for {$order->car->brand} {$order->car->model}",
                'link' => '/admin/orders'
            ]);
        }

        return response()->json($order->load(['user', 'car']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user();
        $order = Order::with(['user', 'car'])->find($id);
        
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if (!$user->can('view_orders') && $order->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($order);
    }

    /**
     * Update the specified resource in storage.
     * Auto-generates invoice + rich notification when status => approved.
     */
    public function update(Request $request, string $id)
    {
        $user = $request->user();
        $order = Order::with(['user', 'car'])->find($id);
        
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if (!$user->can('manage_orders')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status'               => 'required|in:pending,approved,rejected,cancelled',
            'appointment_date'     => 'nullable|date',
            'appointment_time'     => 'nullable|string',
            'appointment_location' => 'nullable|string|max:255',
            'appointment_note'     => 'nullable|string',
        ]);

        $oldStatus = $order->status;
        $order->update($validated);
        $order->refresh();

        $car = $order->car;

        // ── APPROVAL: auto-generate invoice + rich notification ──────────────
        if ($oldStatus !== 'approved' && $validated['status'] === 'approved') {

            // 1. Auto-generate a Facture if one does not already exist
            $facture = \App\Models\Facture::where('order_id', $order->id)->first();
            if (!$facture) {
                $appointmentDatetime = null;
                if ($order->appointment_date) {
                    $appointmentDatetime = $order->appointment_date
                        . ($order->appointment_time ? ' ' . $order->appointment_time : ' 00:00:00');
                }

                $facture = \App\Models\Facture::create([
                    'invoice_number'   => 'INV-' . strtoupper(Str::random(8)),
                    'order_id'         => $order->id,
                    'client_id'        => $order->user_id,
                    'vehicle_id'       => $order->car_id,
                    'total_amount'     => $car ? (float) $car->price : 0,
                    'payment_status'   => 'pending',
                    'appointment_date' => $appointmentDatetime,
                ]);
            }

            // 2. Build the rich notification message
            $vehicleName = $car ? "{$car->brand} {$car->model}" : 'your vehicle';
            $apptDateStr = 'to be confirmed';
            if ($order->appointment_date) {
                try {
                    $apptDateStr = Carbon::parse($order->appointment_date)->format('F j, Y');
                    if ($order->appointment_time) {
                        $apptDateStr .= ' at ' . $order->appointment_time;
                    }
                } catch (\Exception $e) {
                    $apptDateStr = $order->appointment_date;
                }
            }

            $message = "Your purchase request for {$vehicleName} has been approved. "
                . "Your appointment is scheduled for {$apptDateStr}. "
                . "Your invoice is now available.";

            // 3. Send notification to client
            if ($order->user_id) {
                Notification::create([
                    'user_id' => $order->user_id,
                    'type'    => 'order_approved',
                    'title'   => 'Purchase Request Approved',
                    'message' => $message,
                    'link'    => '/invoice/' . $facture->id,
                ]);
            }
        }

        // ── REJECTION: simple notification ───────────────────────────────────
        if ($oldStatus !== 'rejected' && $validated['status'] === 'rejected') {
            $vehicleName = $car ? "{$car->brand} {$car->model}" : 'your vehicle';
            if ($order->user_id) {
                Notification::create([
                    'user_id' => $order->user_id,
                    'type'    => 'order_status',
                    'title'   => 'Order Rejected',
                    'message' => "Your request for {$vehicleName} has been rejected. Please contact us for more details.",
                    'link'    => '/client-dashboard',
                ]);
            }
        }

        return response()->json($order->load(['user', 'car']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        $user = $request->user();
        $order = Order::find($id);
        
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if (!$user->can('manage_orders')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $order->delete();
        return response()->json(['message' => 'Order deleted successfully']);
    }
}
