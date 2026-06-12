<?php

namespace App\Services;

use App\Models\Car;
use App\Models\Category;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use SplFileObject;

class CarCsvImporter
{
    public function import(?string $directory = null, bool $fresh = false): array
    {
        $directory ??= base_path('car');
        $rows = $this->readCsvDirectory($directory);

        $importedIds = [];
        $created = 0;
        $updated = 0;
        $beforeCount = Car::query()->count();

        DB::transaction(function () use ($rows, $fresh, &$importedIds, &$created, &$updated) {
            if ($fresh) {
                Car::query()->delete();
            }

            $existingByListing = Car::query()
                ->whereNotNull('listing_url')
                ->where('listing_url', '!=', '')
                ->get()
                ->keyBy(fn (Car $car) => $this->listingKey($car->listing_url));

            $existingByNaturalKey = Car::all()
                ->keyBy(fn (Car $car) => $this->naturalKey([
                    'brand' => $car->brand,
                    'model' => $car->model,
                    'year' => $car->year,
                    'listing_url' => $car->listing_url,
                ]));

            foreach ($rows as $row) {
                $attributes = $this->normalizeCarRow($row);
                $listingKey = $this->listingKey($attributes['listing_url'] ?? null);
                $naturalKey = $this->naturalKey($attributes);

                $car = null;
                if ($listingKey && $existingByListing->has($listingKey)) {
                    $car = $existingByListing->get($listingKey);
                } elseif ($existingByNaturalKey->has($naturalKey)) {
                    $car = $existingByNaturalKey->get($naturalKey);
                }

                if ($attributes['category']) {
                    $category = Category::firstOrCreate(
                        ['slug' => Str::slug($attributes['category'])],
                        ['name' => $attributes['category']]
                    );
                    $attributes['category_id'] = $category->id;
                }

                if ($car) {
                    $car->fill($attributes);
                    $car->save();
                    $updated++;
                } else {
                    $car = Car::create($attributes);
                    $created++;
                }

                $importedIds[] = $car->id;
            }

            Car::query()
                ->whereNotIn('id', $importedIds)
                ->delete();
        });

        return [
            'source_rows' => count($rows),
            'created' => $created,
            'updated' => $updated,
            'deleted' => max(0, $beforeCount + $created - Car::query()->count()),
            'final_count' => Car::query()->count(),
        ];
    }

    private function readCsvDirectory(string $directory): array
    {
        $files = glob(rtrim($directory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '*.csv') ?: [];
        sort($files);

        $rows = [];
        foreach ($files as $file) {
            foreach ($this->readCsvFile($file) as $row) {
                $rows[] = $row;
            }
        }

        return $rows;
    }

    private function readCsvFile(string $file): array
    {
        $firstLine = (string) fgets(fopen($file, 'rb'));
        $delimiter = substr_count($firstLine, ';') > substr_count($firstLine, ',') ? ';' : ',';

        $csv = new SplFileObject($file, 'rb');
        $csv->setFlags(SplFileObject::READ_CSV | SplFileObject::SKIP_EMPTY);
        $csv->setCsvControl($delimiter);

        $headers = null;
        $rows = [];
        foreach ($csv as $row) {
            if (!is_array($row) || $row === [null]) {
                continue;
            }

            if ($headers === null) {
                $headers = array_map(fn ($value) => trim((string) $value, "\xEF\xBB\xBF \t\n\r\0\x0B"), $row);
                continue;
            }

            if (count($row) < count($headers)) {
                $row = array_pad($row, count($headers), null);
            }

            $rows[] = array_combine($headers, array_slice($row, 0, count($headers)));
        }

        return $rows;
    }

    private function normalizeCarRow(array $row): array
    {
        return [
            'brand' => $this->cleanText($row['brand'] ?? ''),
            'model' => $this->cleanText($row['model'] ?? ''),
            'year' => (int) $this->digits($row['year'] ?? 0),
            'price' => (int) $this->digits($row['price'] ?? 0),
            'mileage' => (int) $this->digits($row['mileage'] ?? 0),
            'fuel_type' => $this->cleanText($row['fuel_type'] ?? ''),
            'transmission' => $this->cleanText($row['transmission'] ?? ''),
            'color' => $this->cleanText($row['color'] ?? ''),
            'category' => $this->cleanText($row['category'] ?? ''),
            'description' => $this->cleanText($row['description'] ?? ''),
            'listing_url' => $this->cleanText($row['listing_url'] ?? ''),
            'main_image' => $this->normalizeImagePath($row['main_image'] ?? ''),
            'front_image' => $this->normalizeImagePath($row['front_image'] ?? ''),
            'side_image' => $this->normalizeImagePath($row['side_image'] ?? ''),
            'rear_image' => $this->normalizeImagePath($row['rear_image'] ?? ''),
            'interior_image' => $this->normalizeImagePath($row['interior_image'] ?? ''),
        ];
    }

    private function cleanText(mixed $value): string
    {
        return trim(preg_replace('/\s+/u', ' ', (string) ($value ?? '')));
    }

    private function digits(mixed $value): string
    {
        return preg_replace('/[^\d]/', '', (string) ($value ?? '')) ?: '0';
    }

    private function normalizeImagePath(mixed $value): ?string
    {
        $path = $this->cleanText($value);
        if ($path === '') {
            return null;
        }

        return str_starts_with($path, '/') || preg_match('#^https?://#i', $path) ? $path : '/' . $path;
    }

    private function listingKey(?string $listingUrl): ?string
    {
        $listingUrl = $this->cleanText($listingUrl);
        return $listingUrl === '' ? null : strtolower($listingUrl);
    }

    private function naturalKey(array $row): string
    {
        return strtolower(implode('|', [
            $this->cleanText($row['brand'] ?? ''),
            $this->cleanText($row['model'] ?? ''),
            (string) ($row['year'] ?? ''),
            $this->cleanText($row['listing_url'] ?? ''),
        ]));
    }
}
