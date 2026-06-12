<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $senderName;
    public string $senderEmail;
    public string $mailSubject;
    public string $userMessage;
    public string $submissionDate;

    /**
     * Create a new message instance.
     */
    public function __construct(string $senderName, string $senderEmail, string $mailSubject, string $userMessage)
    {
        $this->senderName   = $senderName;
        $this->senderEmail  = $senderEmail;
        $this->mailSubject  = $mailSubject;
        $this->userMessage  = $userMessage;
        $this->submissionDate = now()->format('F j, Y \a\t g:i A (T)');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[AutoMarket] Contact Form: ' . $this->mailSubject,
            replyTo: [
                new \Illuminate\Mail\Mailables\Address($this->senderEmail, $this->senderName),
            ],
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.contact',
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
