<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Car;

class CarSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Car::query()->delete();
        $cars = [
            [
                'brand' => 'Audi',
                'model' => 'RS6 Avant',
                'price' => 759000,
                'category' => 'Sport',
                'year' => 2024,
                'mileage' => 1200,
                'fuel_type' => 'Essence',
                'transmission' => 'Automatique',
                'color' => 'Gris',
                'description' => 'L\'Audi RS6 Avant est la variante haute performance de l\'Audi A6 Avant.',
                'listing_url' => 'https://example.com/audi-rs6',
                'main_image' => '/car/Audi/RS6_Avant/main.jpg',
                'front_image' => '/car/Audi/RS6_Avant/front.jpg',
                'side_image' => '/car/Audi/RS6_Avant/side.jpg',
                'rear_image' => '/car/Audi/RS6_Avant/rear.jpg',
                'interior_image' => '/car/Audi/RS6_Avant/interior.jpg'
            ],
            [
                'brand' => 'BMW',
                'model' => 'M4 Competition',
                'price' => 825000,
                'category' => 'Sport',
                'year' => 2024,
                'mileage' => 850,
                'fuel_type' => 'Essence',
                'transmission' => 'Automatique',
                'color' => 'Bleu',
                'description' => 'La BMW M4 est une version haute performance de la BMW Série 4.',
                'listing_url' => 'https://example.com/bmw-m4',
                'main_image' => '/car/BMW/M4_Competition/main.jpg',
                'front_image' => '/car/BMW/M4_Competition/front.jpg',
                'side_image' => '/car/BMW/M4_Competition/side.jpg',
                'rear_image' => '/car/BMW/M4_Competition/rear.jpg',
                'interior_image' => '/car/BMW/M4_Competition/interior.jpg'
            ],
            [
                'brand' => 'Mercedes-Benz',
                'model' => 'S65 AMG',
                'price' => 890000,
                'category' => 'Sport',
                'year' => 2023,
                'mileage' => 4500,
                'fuel_type' => 'Essence',
                'transmission' => 'Automatique',
                'color' => 'Noir',
                'description' => 'La Mercedes-AMG S65 est la variante haute performance la plus luxueuse de la Classe S.',
                'listing_url' => 'https://example.com/mercedes-s65',
                'main_image' => '/car/Mercedes-Benz/S65_AMG/main.jpg',
                'front_image' => '/car/Mercedes-Benz/S65_AMG/front.jpg',
                'side_image' => '/car/Mercedes-Benz/S65_AMG/side.jpg',
                'rear_image' => '/car/Mercedes-Benz/S65_AMG/rear.jpg',
                'interior_image' => '/car/Mercedes-Benz/S65_AMG/interior.jpg'
            ],
            [
                'brand' => 'Porsche',
                'model' => '911 Carrera T',
                'price' => 1144000,
                'category' => 'Sport',
                'year' => 2023,
                'mileage' => 2100,
                'fuel_type' => 'Essence',
                'transmission' => 'Manuelle',
                'color' => 'Blanc',
                'description' => 'La Porsche 911 Carrera T est un modèle puriste au poids réduit.',
                'listing_url' => 'https://example.com/porsche-911',
                'main_image' => '/car/Porsche/911_Carrera_T/main.jpg',
                'front_image' => '/car/Porsche/911_Carrera_T/front.jpg',
                'side_image' => '/car/Porsche/911_Carrera_T/side.jpg',
                'rear_image' => '/car/Porsche/911_Carrera_T/rear.jpg',
                'interior_image' => '/car/Porsche/911_Carrera_T/interior.jpg'
            ],
            [
                'brand' => 'Ford',
                'model' => 'Mustang',
                'price' => 429000,
                'category' => 'Sport',
                'year' => 2024,
                'mileage' => 500,
                'fuel_type' => 'Essence',
                'transmission' => 'Manuelle',
                'color' => 'Noir',
                'description' => 'La Ford Mustang est une icône américaine de la performance et du style.',
                'listing_url' => 'https://example.com/ford-mustang',
                'main_image' => '/car/Ford/Mustang/main.jpg',
                'front_image' => '/car/Ford/Mustang/front.jpg',
                'side_image' => '/car/Ford/Mustang/side.jpg',
                'rear_image' => '/car/Ford/Mustang/rear.jpg',
                'interior_image' => '/car/Ford/Mustang/interior.jpg'
            ],
            [
                'brand' => 'Toyota',
                'model' => 'Supra',
                'price' => 545000,
                'category' => 'Sport',
                'year' => 2023,
                'mileage' => 3200,
                'fuel_type' => 'Essence',
                'transmission' => 'Automatique',
                'color' => 'Noir',
                'description' => 'La Toyota GR Supra est une voiture de sport produite par Toyota depuis 1978.',
                'listing_url' => 'https://example.com/toyota-supra',
                'main_image' => '/car/Toyota/GR_Supra_A91-CF_Edition/main.jpg',
                'front_image' => '/car/Toyota/GR_Supra_A91-CF_Edition/front.jpg',
                'side_image' => '/car/Toyota/GR_Supra_A91-CF_Edition/side.jpg',
                'rear_image' => '/car/Toyota/GR_Supra_A91-CF_Edition/rear.jpg',
                'interior_image' => '/car/Toyota/GR_Supra_A91-CF_Edition/interior.jpg'
            ]
        ];

        foreach ($cars as $car) {
            Car::create($car);
        }
    }
}
