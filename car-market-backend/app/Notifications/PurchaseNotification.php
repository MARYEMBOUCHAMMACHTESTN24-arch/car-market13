<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class PurchaseNotification extends Notification
{
    use Queueable;

    protected $type;
    protected $data;

    public function __construct($type, $data)
    {
        $this->type = $type;
        $this->data = $data;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toArray($notifiable)
    {
        return [
            'type' => $this->type,
            'message' => $this->data['message'] ?? 'You have a new update regarding your purchase.',
            'order_id' => $this->data['order_id'] ?? null,
            'facture_id' => $this->data['facture_id'] ?? null,
            'url' => $this->data['url'] ?? '/client-dashboard',
        ];
    }
}
