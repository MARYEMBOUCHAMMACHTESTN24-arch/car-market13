<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class InvoiceController extends Controller
{
    public function index()
    {
        $invoices = Invoice::with('order.user', 'order.car')->get();
        return response()->json($invoices);
    }

    public function show($id)
    {
        $invoice = Invoice::with('order.user', 'order.car')->findOrFail($id);
        return response()->json($invoice);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'order_id' => 'required|exists:orders,id',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $order = Order::with('car')->findOrFail($request->order_id);

        // Check if invoice already exists for this order
        $existingInvoice = Invoice::where('order_id', $request->order_id)->first();
        if ($existingInvoice) {
            return response()->json([
                'message' => 'Invoice already exists for this order',
                'invoice' => $existingInvoice
            ], 409);
        }

        $invoice = Invoice::create([
            'order_id' => $request->order_id,
            'total_price' => $order->car->price,
            'date' => now(),
            'status' => 'pending'
        ]);

        return response()->json([
            'message' => 'Invoice created successfully',
            'invoice' => $invoice->load('order.user', 'order.car')
        ], 201);
    }
}
