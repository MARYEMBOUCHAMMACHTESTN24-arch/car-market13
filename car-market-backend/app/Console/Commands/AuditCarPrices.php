<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Car;
use App\Services\PriceValidatorService;

class AuditCarPrices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cars:audit-prices {--fix : Automatically apply the corrected prices to the database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Audit all vehicle records and flag/correct suspicious prices against realistic market values';

    /**
     * Execute the console command.
     */
    public function handle(PriceValidatorService $validator)
    {
        $this->info("Starting Vehicle Price Audit...");
        $cars = Car::all();
        $this->info("Total cars found: " . $cars->count());

        $flaggedCount = 0;
        $fixedCount = 0;
        
        $tableData = [];

        foreach ($cars as $car) {
            $validation = $validator->validateAndCorrectPrice(
                $car->brand, 
                $car->model, 
                $car->year, 
                $car->mileage, 
                $car->category, 
                (float) $car->price
            );

            if ($validation['is_suspicious']) {
                $flaggedCount++;
                
                $originalPrice = $car->price;
                $correctedPrice = $validation['corrected_price'];
                $minPrice = $validation['expected_min'];
                
                $row = [
                    'id' => $car->id,
                    'vehicle' => $car->brand . ' ' . $car->model . ' (' . $car->year . ')',
                    'current_price' => number_format($originalPrice) . ' DH',
                    'expected_min' => number_format($minPrice) . ' DH',
                    'corrected_to' => number_format($correctedPrice) . ' DH',
                ];

                if ($this->option('fix')) {
                    $car->is_suspicious_price = true;
                    // Only store original price if it wasn't already stored to avoid overwriting with a previously corrected value
                    if (is_null($car->original_price)) {
                        $car->original_price = $originalPrice;
                    }
                    $car->price = $correctedPrice;
                    
                    // If offer exists, we should probably update it, but for now we just update the car base price
                    $car->save();
                    
                    $row['status'] = 'FIXED';
                    $fixedCount++;
                } else {
                    $row['status'] = 'FLAGGED';
                }

                $tableData[] = $row;
            } else {
                // If the car was previously flagged but now isn't (e.g. manual fix), we can clear the flag if --fix is on
                if ($car->is_suspicious_price && $this->option('fix')) {
                    $car->is_suspicious_price = false;
                    $car->save();
                }
            }
        }

        if (count($tableData) > 0) {
            $this->table(
                ['ID', 'Vehicle', 'Current Price', 'Expected Min', 'Corrected To', 'Status'],
                $tableData
            );
        }

        $this->info("Audit complete.");
        $this->info("Suspicious prices found: {$flaggedCount}");
        
        if ($this->option('fix')) {
            $this->info("Prices corrected: {$fixedCount}");
        } else {
            $this->warn("Run with --fix to automatically apply corrections to the database.");
        }
    }
}
