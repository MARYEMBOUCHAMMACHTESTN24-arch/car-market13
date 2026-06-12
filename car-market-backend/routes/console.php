<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Services\CarCsvImporter;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('cars:restore-from-csv {--path= : Directory containing the source CSV files} {--fresh : Delete all current car records before importing the CSV inventory}', function (CarCsvImporter $importer) {
    $result = $importer->import($this->option('path') ?: base_path('car'), (bool) $this->option('fresh'));

    $this->info('Cars restored from CSV source.');
    foreach ($result as $key => $value) {
        $this->line($key . ': ' . $value);
    }
})->purpose('Restore the cars table from the original CSV marketplace inventory');
