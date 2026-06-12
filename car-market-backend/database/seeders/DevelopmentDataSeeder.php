<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Carbon\Carbon;

class DevelopmentDataSeeder extends Seeder
{
    // Real car IDs from the database — READ ONLY, never modified
    private array $carIds = [
        298,300,362,363,372,299,301,302,303,304,
        305,314,323,346,348,352,358,359,360,369,
        377,306,307,308,309,310,311,312,313,316,
        317,320,321,338,341,342,345,350,351,364,
        365,366,315,354,355,361,318,319,344,347,
        349,356,357,367,373,375,376,322,324,325,
        326,327,328,329,330,331,332,333,334,335,
        336,337,339,340,343,368,370,371,374,378,353,
    ];

    private array $firstNames = [
        'Mohammed', 'Fatima', 'Youssef', 'Aicha', 'Khalid', 'Zineb',
        'Omar', 'Nadia', 'Rachid', 'Laila', 'Hassan', 'Samira',
        'Ahmed', 'Khadija', 'Abdelaziz', 'Meriem', 'Hamid', 'Soukaina',
        'Driss', 'Hasnaa', 'Samir', 'Houda', 'Karim', 'Imane',
        'Tariq', 'Widad', 'Bilal', 'Najat', 'Mehdi', 'Loubna',
        'Amine', 'Sana', 'Noureddine', 'Meryem', 'Hicham', 'Rim',
        'Mustapha', 'Ghita', 'Abderrahim', 'Salma', 'Smail', 'Nisrine',
        'Jawad', 'Hafsa', 'Reda', 'Chaima', 'Ilias', 'Amina',
        'Zakaria', 'Nawal',
    ];

    private array $lastNames = [
        'Benali', 'El Amrani', 'Ouahabi', 'Filali', 'Cherkaoui',
        'Berrada', 'Alaoui', 'Tahiri', 'Mansouri', 'Bakkali',
        'Ziani', 'Hassani', 'Idrissi', 'Benjelloun', 'Laghzaoui',
        'Sabiri', 'Bouazza', 'Ennaji', 'El Fassi', 'Kettani',
        'Boutaleb', 'Hamdouni', 'Soussi', 'Lamrani', 'Chraibi',
        'El Ouafi', 'Talbi', 'Zemmouri', 'Bennouna', 'Hajji',
    ];

    private array $moroccanPhones = [
        '0661', '0662', '0663', '0664', '0665',
        '0670', '0671', '0672', '0673', '0674',
        '0600', '0601', '0602', '0603', '0604',
        '0691', '0692', '0693', '0694', '0695',
    ];

    private array $moroccanCities = [
        'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger',
        'Agadir', 'Meknès', 'Oujda', 'Kenitra', 'Tétouan',
        'El Jadida', 'Béni Mellal', 'Nador', 'Mohammedia', 'Settat',
    ];

    private array $appointmentNotes = [
        'Veuillez confirmer le rendez-vous par SMS.',
        'Je préfère un essai routier avant la décision finale.',
        'Intéressé par le financement proposé.',
        'Disponible le matin uniquement.',
        'Souhaite discuter d\'une remise supplémentaire.',
        'Je viens accompagné d\'un expert mécanique.',
        'Merci de préparer tous les documents nécessaires.',
        'Paiement comptant prévu.',
        null, null, null, // Some orders have no note
    ];

    public function run(): void
    {
        $this->command->info('🚀 Starting DevelopmentDataSeeder...');
        $this->command->info('   ⚠  Cars table will NOT be touched.');

        // ─────────────────────────────────────────────
        // STEP 1: Create users until we have 100+
        // ─────────────────────────────────────────────
        $existingUserCount = User::count();
        $usersNeeded = max(0, 100 - $existingUserCount);

        if ($usersNeeded > 0) {
            $this->command->info("   👤 Creating {$usersNeeded} additional users...");
            User::factory()->count($usersNeeded)->create();
        } else {
            $this->command->info("   👤 Already have {$existingUserCount} users — skipping user creation.");
        }

        $totalUsers = User::count();
        $this->command->info("   ✅ Total users: {$totalUsers}");

        // ─────────────────────────────────────────────
        // STEP 2: Load all user IDs (fresh after creation)
        // ─────────────────────────────────────────────
        $userIds = User::pluck('id')->toArray();
        $userDetails = User::select('id', 'name', 'email')->get()->keyBy('id');

        // ─────────────────────────────────────────────
        // STEP 3: Truncate existing orders and rebuild
        // ─────────────────────────────────────────────
        $this->command->info('   🗑  Clearing existing orders...');
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('orders')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // ─────────────────────────────────────────────
        // STEP 4: Generate 160 realistic orders
        // ─────────────────────────────────────────────
        $this->command->info('   📦 Generating 160 realistic orders across 12 months...');

        $orders = [];
        $now = Carbon::now();

        /**
         * Status distribution targets:
         *   approved  ≈ 40%  → 64 orders
         *   pending   ≈ 35%  → 56 orders
         *   rejected  ≈ 25%  → 40 orders
         */
        $statusPool = array_merge(
            array_fill(0, 64, 'approved'),
            array_fill(0, 56, 'pending'),
            array_fill(0, 40, 'rejected')
        );
        shuffle($statusPool);

        for ($i = 0; $i < 160; $i++) {
            // Spread orders across the last 12 months with a natural ramp-up (more recent = more activity)
            $monthsAgo    = $this->weightedMonth();
            $daysOffset   = rand(0, 27);
            $createdAt    = $now->copy()
                ->subMonths($monthsAgo)
                ->subDays($daysOffset)
                ->setTime(rand(8, 20), rand(0, 59), rand(0, 59));

            // Random user
            $userId = $userIds[array_rand($userIds)];
            $user   = $userDetails[$userId];

            // Random car from real IDs
            $carId = $this->carIds[array_rand($this->carIds)];

            // Status from shuffled pool
            $status = $statusPool[$i];

            // Appointment data (70% of non-rejected orders have appointment info)
            $hasAppointment = ($status !== 'rejected') && (rand(1, 10) <= 7);
            $appointmentDate = null;
            $appointmentTime = null;
            $appointmentLocation = null;
            $appointmentNote = null;

            if ($hasAppointment) {
                $appointmentDate = $createdAt->copy()
                    ->addDays(rand(2, 14))
                    ->format('Y-m-d');
                $appointmentTime = sprintf('%02d:%02d', rand(9, 17), rand(0, 1) * 30);
                $appointmentLocation = $this->moroccanCities[array_rand($this->moroccanCities)];
                $appointmentNote = $this->appointmentNotes[array_rand($this->appointmentNotes)];
            }

            // Phone number
            $prefix = $this->moroccanPhones[array_rand($this->moroccanPhones)];
            $phone  = $prefix . rand(100000, 999999);

            $orders[] = [
                'user_id'              => $userId,
                'car_id'               => $carId,
                'name'                 => $user->name,
                'email'                => $user->email,
                'phone'                => $phone,
                'status'               => $status,
                'appointment_date'     => $appointmentDate,
                'appointment_time'     => $appointmentTime,
                'appointment_location' => $appointmentLocation,
                'appointment_note'     => $appointmentNote,
                'created_at'           => $createdAt->format('Y-m-d H:i:s'),
                'updated_at'           => $createdAt->format('Y-m-d H:i:s'),
            ];
        }

        // Batch insert in chunks of 50 for efficiency
        foreach (array_chunk($orders, 50) as $chunk) {
            DB::table('orders')->insert($chunk);
        }

        // ─────────────────────────────────────────────
        // STEP 5: Verification Report
        // ─────────────────────────────────────────────
        $totalOrders   = DB::table('orders')->count();
        $statusCounts  = DB::table('orders')
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $approvedCount = $statusCounts['approved']->count ?? 0;
        $pendingCount  = $statusCounts['pending']->count  ?? 0;
        $rejectedCount = $statusCounts['rejected']->count ?? 0;

        $totalUsersNow = User::count();
        $totalCarsNow  = DB::table('cars')->count(); // read-only check

        $this->command->newLine();
        $this->command->info('═══════════════════════════════════════════');
        $this->command->info('  ✅ DevelopmentDataSeeder — Final Report');
        $this->command->info('═══════════════════════════════════════════');
        $this->command->table(
            ['Metric', 'Value'],
            [
                ['Users in database',   $totalUsersNow],
                ['Cars in database',     $totalCarsNow . ' (UNTOUCHED)'],
                ['Total Orders',         $totalOrders],
                ['  → Approved',         $approvedCount . ' (' . round($approvedCount / $totalOrders * 100) . '%)'],
                ['  → Pending',          $pendingCount  . ' (' . round($pendingCount  / $totalOrders * 100) . '%)'],
                ['  → Rejected',         $rejectedCount . ' (' . round($rejectedCount / $totalOrders * 100) . '%)'],
            ]
        );
        $this->command->info('═══════════════════════════════════════════');
        $this->command->newLine();

        // Raw SQL verifications as requested
        $this->command->info('📊 SQL Verification:');
        $this->command->info('  SELECT COUNT(*) FROM users;  → ' . $totalUsersNow);
        $this->command->info('  SELECT COUNT(*) FROM orders; → ' . $totalOrders);
        $this->command->info('  SELECT status, COUNT(*) FROM orders GROUP BY status:');
        foreach ($statusCounts as $status => $row) {
            $this->command->info("    {$status}: {$row->count}");
        }
    }

    /**
     * Returns a month offset (0–11) with a natural market ramp-up curve.
     * More recent months have a higher probability of containing orders.
     */
    private function weightedMonth(): int
    {
        // Weights: index 0 = current month (highest), index 11 = 12 months ago (lowest)
        $weights = [20, 18, 16, 14, 12, 10, 8, 7, 6, 5, 4, 4]; // sums to ~124
        $total = array_sum($weights);
        $rand  = rand(1, $total);
        $cumulative = 0;
        foreach ($weights as $month => $weight) {
            $cumulative += $weight;
            if ($rand <= $cumulative) {
                return $month;
            }
        }
        return 11;
    }
}
