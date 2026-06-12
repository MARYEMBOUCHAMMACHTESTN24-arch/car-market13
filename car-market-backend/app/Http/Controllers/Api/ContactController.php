<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Mail\ContactMail;

class ContactController extends Controller
{
    public function send(Request $request)
    {
        Log::info('[ContactController] Contact form submission received.', ['data' => $request->all()]);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255', // User's frontend form sends "name" not "full_name"
            'email' => 'required|email',
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        if ($validator->fails()) {
            Log::warning('[ContactController] Validation failed.', ['errors' => $validator->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Target email
            $recipient = 'maryamabenchamacht@gmail.com';

            Log::info('Before Mail send');
            Log::info($request->all());

            // Send the email
            Mail::to($recipient)->send(new ContactMail(
                $request->name,
                $request->email,
                $request->subject,
                $request->message
            ));

            Log::info('After Mail send');

            Log::info('[ContactController] Contact email sent successfully to ' . $recipient);

            return response()->json([
                'success' => true,
                'message' => 'Message sent successfully'
            ], 200);

        } catch (\Exception $e) {
            Log::error($e->getMessage());
            Log::error($e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to send message. Please try again later.'
            ], 500);
        }
    }
}
