<?php

namespace App\Services;

class PriceValidatorService
{
    /**
     * Checks if a price is suspicious based on market heuristics and returns a corrected price if it is.
     * 
     * @param string $brand
     * @param string|null $model
     * @param int|null $year
     * @param int|null $mileage
     * @param string|null $category
     * @param float $price
     * @return array ['is_suspicious' => bool, 'expected_min' => float, 'expected_max' => float, 'corrected_price' => float]
     */
    public function validateAndCorrectPrice($brand, $model, $year, $mileage, $category, $price)
    {
        $year = (int) $year ?: 2020;
        $mileage = (int) $mileage ?: 0;
        
        $luxuryBrands = ['Porsche', 'Mercedes-Benz', 'Mercedes', 'BMW', 'Audi', 'Acura', 'Lexus', 'Land Rover', 'Jaguar'];
        $supercarBrands = ['Ferrari', 'Lamborghini', 'McLaren', 'Aston Martin', 'Rolls-Royce', 'Bentley'];

        $isLuxury = in_array($brand, $luxuryBrands, true);
        $isSupercar = in_array($brand, $supercarBrands, true);

        // Baseline logic (values in DH - Moroccan Dirham)
        $expectedMin = 50000;
        $expectedMax = 500000;

        if ($isSupercar) {
            $expectedMin = 1000000;
            $expectedMax = 15000000;
        } elseif ($isLuxury) {
            $expectedMin = $year >= 2020 ? 250000 : 150000;
            $expectedMax = 2000000;
        } else {
            $expectedMin = $year >= 2020 ? 100000 : 50000;
            $expectedMax = 800000;
        }

        // Adjust for category
        if (in_array($category, ['Sports', 'Supercar'])) {
            $expectedMin *= 1.5;
            $expectedMax *= 2;
        } elseif (in_array($category, ['SUV', 'Truck'])) {
            $expectedMin *= 1.2;
        }

        // Adjust for mileage (high mileage decreases value)
        if ($mileage > 100000) {
            $expectedMin *= 0.7;
        }

        $expectedMin = round($expectedMin);
        $expectedMax = round($expectedMax);

        $isSuspicious = $price < $expectedMin || $price > $expectedMax;
        
        // Auto-correct price if suspicious
        $correctedPrice = $price;
        if ($isSuspicious) {
            if ($price < $expectedMin) {
                // If it's something like $5000 when it should be 50,000 DH, maybe it was entered in USD.
                // Or maybe they missed a zero.
                if ($price > 0 && ($price * 10) >= $expectedMin && ($price * 10) <= $expectedMax) {
                    $correctedPrice = $price * 10;
                } elseif ($price > 0 && ($price * 100) >= $expectedMin && ($price * 100) <= $expectedMax) {
                    $correctedPrice = $price * 100; // E.g., entered in dollars instead of DH
                } else {
                    $correctedPrice = $expectedMin; // Fallback to minimum bound
                }
            } elseif ($price > $expectedMax) {
                // If they added too many zeros
                if ($price > 0 && ($price / 10) >= $expectedMin && ($price / 10) <= $expectedMax) {
                    $correctedPrice = $price / 10;
                } else {
                    $correctedPrice = $expectedMax; // Fallback to maximum bound
                }
            }
        }

        return [
            'is_suspicious' => $isSuspicious,
            'expected_min' => $expectedMin,
            'expected_max' => $expectedMax,
            'corrected_price' => $correctedPrice,
        ];
    }
}
