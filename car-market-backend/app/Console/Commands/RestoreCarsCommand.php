<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class RestoreCarsCommand extends Command
{
    protected $signature = 'cars:restore';
    protected $description = 'Restore cars from public/car directory';

    private const COLOR_COLUMNS = ['color', 'colour', 'exterior_color', 'exterior_colour', 'paint'];

    public function handle()
    {
        $baseDir = public_path('car');
        
        if (!File::exists($baseDir)) {
            $this->error("Directory does not exist: $baseDir");
            return;
        }

        $brands = File::directories($baseDir);
        $count = 0;
        $colorIndex = $this->buildCsvColorIndex();

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('cars')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        foreach ($brands as $brandPath) {
            $brand = basename($brandPath);
            
            // Skip test folders and typos
            if (in_array($brand, ['TestBrand', 'TestUpdate', 'adui'])) {
                continue;
            }

            $models = File::directories($brandPath);
            
            foreach ($models as $modelPath) {
                $modelFolder = basename($modelPath);
                $modelName = str_replace('_', ' ', $modelFolder);
                
                // Parse mileage and year if possible
                $mileage = 0;
                $year = 2023; // default
                
                if (preg_match('/(\d+)k-Mile/i', $modelFolder, $matches)) {
                    $mileage = $matches[1] * 1000;
                    $modelName = trim(str_replace($matches[0], '', $modelName), ' -_');
                } elseif (preg_match('/(\d+)-Mile/i', $modelFolder, $matches)) {
                    $mileage = (int)$matches[1];
                    $modelName = trim(str_replace($matches[0], '', $modelName), ' -_');
                }
                
                if (preg_match('/(20\d{2})/', $modelFolder, $matches)) {
                    $year = (int)$matches[1];
                    $modelName = trim(str_replace($matches[0], '', $modelName), ' -_');
                }
                
                // Base data mapping from folder name
                $car = [
                    'brand' => $brand,
                    'model' => $modelName,
                    'year' => $year,
                    'price' => 50000, // Fixed default
                    'mileage' => $mileage,
                    'fuel_type' => 'Petrol',
                    'transmission' => 'Automatic',
                    'color' => $this->resolveColor($colorIndex, $brand, $modelName, $year),
                    'category' => 'Coupe',
                    'description' => "Original $brand $modelName imported from public/car folder structure.",
                    'is_premium' => 0,
                    'is_featured' => 0,
                    'is_deal_of_day' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                // Images mapping
                $images = File::files($modelPath);
                foreach ($images as $image) {
                    $filename = $image->getFilename();
                    $name = pathinfo($filename, PATHINFO_FILENAME);
                    
                    $dbPath = "/car/$brand/$modelFolder/$filename";
                    
                    if (str_starts_with($name, 'main')) $car['main_image'] = $dbPath;
                    if (str_starts_with($name, 'front')) $car['front_image'] = $dbPath;
                    if (str_starts_with($name, 'side')) $car['side_image'] = $dbPath;
                    if (str_starts_with($name, 'rear')) $car['rear_image'] = $dbPath;
                    if (str_starts_with($name, 'interior')) $car['interior_image'] = $dbPath;
                }
                
                if (!isset($car['main_image'])) {
                    $car['main_image'] = $car['front_image'] ?? null;
                }

                DB::table('cars')->insert($car);
                $count++;
                $this->info("Restored: $brand $modelName");
            }
        }

        $this->info("Successfully restored $count cars from public/car directory!");
    }

    private function buildCsvColorIndex(): array
    {
        $index = [];
        $directories = array_filter([
            base_path('car'),
            public_path('car'),
        ], fn ($directory) => File::exists($directory));

        foreach ($directories as $directory) {
            foreach (File::files($directory) as $file) {
                if (strtolower($file->getExtension()) !== 'csv') {
                    continue;
                }

                $this->indexCsvColors($file->getPathname(), $index);
            }
        }

        return $index;
    }

    private function indexCsvColors(string $path, array &$index): void
    {
        $handle = fopen($path, 'r');
        if (!$handle) {
            return;
        }

        $firstLine = fgets($handle) ?: '';
        $delimiter = substr_count($firstLine, ';') > substr_count($firstLine, ',') ? ';' : ',';
        rewind($handle);

        $headers = fgetcsv($handle, 0, $delimiter);
        if (!$headers) {
            fclose($handle);
            return;
        }

        $headers = array_map(fn ($header) => $this->normalizeHeader($header), $headers);
        $brandIndex = array_search('brand', $headers, true);
        $modelIndex = array_search('model', $headers, true);
        $yearIndex = array_search('year', $headers, true);
        $colorIndex = null;

        foreach (self::COLOR_COLUMNS as $column) {
            $found = array_search($column, $headers, true);
            if ($found !== false) {
                $colorIndex = $found;
                break;
            }
        }

        if ($brandIndex === false || $modelIndex === false || $colorIndex === null) {
            fclose($handle);
            return;
        }

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            $brand = $this->cleanText($row[$brandIndex] ?? '');
            $model = $this->cleanText($row[$modelIndex] ?? '');
            $color = $this->cleanText($row[$colorIndex] ?? '');
            $year = $yearIndex !== false ? (int) preg_replace('/[^\d]/', '', (string) ($row[$yearIndex] ?? '')) : 0;

            if ($brand === '' || $model === '' || $color === '') {
                continue;
            }

            if ($year > 0) {
                $index[$this->vehicleKey($brand, $model, $year)] = $color;
            }
            $index[$this->vehicleKey($brand, $model)] = $color;
        }

        fclose($handle);
    }

    private function resolveColor(array $colorIndex, string $brand, string $model, int $year): ?string
    {
        return $colorIndex[$this->vehicleKey($brand, $model, $year)]
            ?? $colorIndex[$this->vehicleKey($brand, $model)]
            ?? null;
    }

    private function vehicleKey(string $brand, string $model, ?int $year = null): string
    {
        $parts = [
            $this->normalizeKeyPart($brand),
            $this->normalizeKeyPart($model),
        ];

        if ($year) {
            $parts[] = (string) $year;
        }

        return implode('|', $parts);
    }

    private function normalizeKeyPart(string $value): string
    {
        return strtolower(trim(preg_replace('/[^a-z0-9]+/i', ' ', $value)));
    }

    private function normalizeHeader(mixed $value): string
    {
        $clean = trim((string) $value, " \t\n\r\0\x0B\xEF\xBB\xBF\"");
        return strtolower(str_replace([' ', '-'], '_', $clean));
    }

    private function cleanText(mixed $value): string
    {
        return trim(preg_replace('/\s+/u', ' ', (string) ($value ?? '')));
    }
}
