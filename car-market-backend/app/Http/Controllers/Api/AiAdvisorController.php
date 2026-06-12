<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiUserActivity;
use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AiAdvisorController extends Controller
{
    private const BRAND_ALIASES = [
        'Tesla' => ['tesla'],
        'BMW' => ['bmw', 'bimmer'],
        'Mercedes-Benz' => ['mercedes', 'mercedes benz', 'mercedes-benz', 'benz'],
        'Audi' => ['audi'],
        'Toyota' => ['toyota'],
        'Honda' => ['honda', 'acura'],
        'Hyundai' => ['hyundai'],
        'Kia' => ['kia'],
        'Nissan' => ['nissan'],
        'Mazda' => ['mazda'],
        'Volkswagen' => ['volkswagen', 'vw'],
        'Chevrolet' => ['chevrolet', 'chevy'],
        'Ford' => ['ford'],
        'Porsche' => ['porsche'],
        'Lexus' => ['lexus'],
        'Land Rover' => ['land rover', 'range rover', 'rangerover'],
        'Jeep' => ['jeep'],
        'Volvo' => ['volvo'],
        'Bentley' => ['bentley'],
        'Ferrari' => ['ferrari'],
        'Lamborghini' => ['lamborghini', 'lambo'],
        'McLaren' => ['mclaren'],
        'Cadillac' => ['cadillac'],
        'Genesis' => ['genesis'],
        'Subaru' => ['subaru'],
        'Mitsubishi' => ['mitsubishi'],
        'Peugeot' => ['peugeot'],
        'Renault' => ['renault'],
        'Dacia' => ['dacia'],
        'Fiat' => ['fiat'],
        'Mini' => ['mini'],
        'Skoda' => ['skoda'],
        'Seat' => ['seat'],
    ];

    private const FUEL_ALIASES = [
        'electric' => ['electric', 'ev'],
        'hybrid' => ['hybrid'],
        'petrol' => ['petrol', 'gasoline', 'gas'],
        'diesel' => ['diesel'],
    ];

    private const TRANSMISSION_ALIASES = [
        'automatic' => ['automatic', 'auto', 'pdk'],
        'manual' => ['manual'],
        'cvt' => ['cvt'],
    ];

    private const CATEGORY_ALIASES = [
        'suv' => ['suv', 'crossover'],
        'sedan' => ['sedan', 'saloon'],
        'coupe' => ['coupe'],
        'hatchback' => ['hatchback'],
        'truck' => ['truck', 'pickup'],
        'wagon' => ['wagon', 'avant'],
        'convertible' => ['convertible', 'cabriolet', 'roadster'],
    ];

    private const AUTOMOTIVE_TERMS = [
        'car', 'cars', 'vehicle', 'vehicles', 'auto', 'automotive', 'marketplace', 'inventory',
        'suv', 'sedan', 'coupe', 'hatchback', 'truck', 'pickup', 'wagon', 'convertible',
        'fuel', 'diesel', 'petrol', 'gasoline', 'hybrid', 'electric', 'ev',
        'transmission', 'automatic', 'manual', 'cvt', 'mileage', 'kilometers',
        'model', 'brand', 'trim', 'daily driver', 'family car', 'offroad', 'performance',
        'voiture', 'voitures', 'vehicule', 'vehicules', 'véhicule', 'véhicules',
        'automatique', 'manuelle', 'carburant', 'essence', 'electrique', 'électrique',
        'kilometrage', 'kilométrage', 'marque', 'modele', 'modèle', 'familial',
        'familiale', 'sportive', 'سيارة', 'سيارات', 'مركبة', 'مركبات', 'وقود',
        'بنزين', 'ديزل', 'هجين', 'كهربائية', 'أوتوماتيكي', 'اوتوماتيك', 'يدوي',
        'عائلية', 'رياضية',
    ];

    private const SHOPPING_TERMS = [
        'buy', 'purchase', 'looking for', 'recommend', 'recommendation', 'available',
        'do you have', 'show me', 'find', 'compare', 'budget', 'price', 'under', 'below',
        'cheap', 'affordable', 'premium', 'luxury', 'reliable',
        'acheter', 'cherche', 'recherche', 'recommander', 'recommandation', 'disponible',
        'disponibles', 'prix', 'sous', 'moins de', 'pas cher', 'abordable', 'luxe',
        'fiable', 'أبحث', 'ابحث', 'اريد', 'أريد', 'اشتري', 'شراء', 'اقترح',
        'توصية', 'متاحة', 'ميزانية', 'سعر', 'اقل', 'أقل', 'رخيصة', 'فاخرة',
        'موثوقة',
    ];

    public function search(Request $request)
    {
        $validated = $request->validate([
            'query' => 'required|string|min:2',
            'limit' => 'nullable|integer|min:1|max:24',
            'max_price' => 'nullable|numeric|min:0',
            'response_language' => 'nullable|string|in:en,fr,ar',
        ]);

        $query = $validated['query'];
        if (!empty($validated['max_price'])) {
            $query .= ' under ' . (int) $validated['max_price'];
        }

        $domain = $this->automotiveDomainAssessment($query);
        $this->debugAiPipeline('incoming_search', [
            'query' => $validated['query'],
            'effective_query' => $query,
            'domain_relevance' => $domain,
            'limit' => $validated['limit'] ?? 10,
        ]);

        if (!$domain['in_domain']) {
            $response = $this->outOfDomainResponse($validated['query'], $domain, $validated['response_language'] ?? null);
            $this->storeActivity($request, 'search', null, $validated['query'], [
                'max_price' => $validated['max_price'] ?? null,
                'domain_relevance_score' => $domain['score'],
            ]);

            return response()->json($response);
        }

        $constraints = $this->detectHardInventoryConstraints($query);
        $catalog = $this->catalogCars($constraints);
        $this->debugAiPipeline('catalog_prepared', [
            'query' => $query,
            'constraints' => $constraints,
            'catalog_count' => count($catalog),
            'sample_vehicle_ids' => collect($catalog)->pluck('id')->take(8)->values()->all(),
        ]);

        if ($constraints['explicit'] && empty($catalog)) {
            $response = $this->emptyInventoryResponse($validated['query'], $constraints, $validated['response_language'] ?? null);

            $this->storeActivity($request, 'search', null, $validated['query'], [
                'max_price' => $validated['max_price'] ?? null,
                'engine' => $response['engine'],
                'hard_inventory_filter' => true,
            ]);

            return response()->json($response);
        }

        $response = $this->postToAi('/ai-search', [
            'query' => $query,
            'cars' => $catalog,
            'user_profile' => $this->userProfile($request),
            'limit' => $validated['limit'] ?? 10,
            'response_language' => $validated['response_language'] ?? $this->detectResponseLanguage($validated['query']),
        ]);

        $this->debugAiPipeline('ai_response_received', [
            'query' => $query,
            'ai_confidence' => $response['ai_confidence'] ?? null,
            'intent' => $response['intent'] ?? null,
            'semantic_certainty' => $response['metrics']['semantic_certainty'] ?? null,
            'result_count' => count($response['results'] ?? $response['recommendations'] ?? []),
            'ranked_vehicle_ids' => collect($response['results'] ?? $response['recommendations'] ?? [])
                ->pluck('car.id')
                ->take(8)
                ->values()
                ->all(),
        ]);

        $this->storeActivity($request, 'search', null, $validated['query'], [
            'max_price' => $validated['max_price'] ?? null,
            'engine' => $response['engine'] ?? null,
        ]);

        return response()->json($this->normalizeAiResponse($response, $validated['query']));
    }

    public function recommend(Request $request)
    {
        $validated = $request->validate([
            'description' => 'required|string|min:2',
            'max_price' => 'nullable|numeric|min:0',
            'limit' => 'nullable|integer|min:1|max:24',
        ]);

        $request->merge([
            'query' => $validated['description'],
            'limit' => $validated['limit'] ?? 10,
        ]);

        return $this->search($request);
    }

    public function similarCars(Request $request)
    {
        $validated = $request->validate([
            'car_id' => 'required|integer|exists:cars,id',
            'limit' => 'nullable|integer|min:1|max:16',
        ]);

        $car = Car::findOrFail($validated['car_id']);
        $response = $this->postToAi('/similar-cars', [
            'car' => $this->normalizeCar($car),
            'cars' => $this->catalogCars(),
            'limit' => $validated['limit'] ?? 8,
        ]);

        return response()->json($this->normalizeAiResponse($response, 'similar vehicles'));
    }

    public function compare(Request $request)
    {
        $validated = $request->validate([
            'car_ids' => 'required|array|min:2|max:4',
            'car_ids.*' => 'integer|exists:cars,id',
        ]);

        $cars = Car::whereIn('id', $validated['car_ids'])->get()->map(fn ($car) => $this->normalizeCar($car))->values();
        $response = $this->postToAi('/compare', [
            'cars' => $cars,
        ]);

        return response()->json($response);
    }



    public function track(Request $request)
    {
        $validated = $request->validate([
            'event_type' => 'required|string|max:40',
            'car_id' => 'nullable|integer|exists:cars,id',
            'query' => 'nullable|string|max:1000',
            'metadata' => 'nullable|array',
        ]);

        $activity = $this->storeActivity(
            $request,
            $validated['event_type'],
            $validated['car_id'] ?? null,
            $validated['query'] ?? null,
            $validated['metadata'] ?? []
        );

        return response()->json([
            'stored' => true,
            'activity_id' => $activity->id,
        ]);
    }

    private function postToAi(string $path, array $payload): array
    {
        try {
            $response = Http::timeout(60)->post($this->aiUrl($path), $payload);
        } catch (ConnectionException $exception) {
            abort(response()->json([
                'message' => 'The AI advisor is warming up. Please try again in a moment.',
            ], 503));
        }

        if (!$response->successful()) {
            abort(response()->json([
                'message' => 'The AI advisor is temporarily unavailable. Please try again shortly.',
            ], 503));
        }

        return $response->json();
    }

    private function aiUrl(string $path): string
    {
        return rtrim(config('services.ai_engine.url', 'http://127.0.0.1:9000'), '/') . $path;
    }

    private function catalogCars(array $constraints = [])
    {
        $query = Car::query();
        $this->applyHardInventoryConstraints($query, $constraints);

        return $query->latest()
            ->get()
            ->map(fn ($car) => $this->normalizeCar($car))
            ->values()
            ->all();
    }

    private function automotiveDomainAssessment(string $query): array
    {
        $score = 0.0;
        $signals = [];

        if (!empty($this->detectTerms($query, self::BRAND_ALIASES))) {
            $score += 0.55;
            $signals[] = 'brand';
        }
        if (!empty($this->detectTerms($query, self::FUEL_ALIASES))) {
            $score += 0.3;
            $signals[] = 'fuel';
        }
        if (!empty($this->detectTerms($query, self::TRANSMISSION_ALIASES))) {
            $score += 0.3;
            $signals[] = 'transmission';
        }
        if (!empty($this->detectTerms($query, self::CATEGORY_ALIASES))) {
            $score += 0.35;
            $signals[] = 'vehicle_category';
        }
        if ($this->mentionsAny($query, self::AUTOMOTIVE_TERMS)) {
            $score += 0.45;
            $signals[] = 'automotive_term';
        }
        if ($this->mentionsAny($query, self::SHOPPING_TERMS)) {
            $score += 0.18;
            $signals[] = 'shopping_term';
        }
        if (preg_match('/\b\d+(?:k|m|000)?\b/i', $query)) {
            $score += 0.12;
            $signals[] = 'price_or_numeric';
        }

        $score = min(1.0, $score);

        return [
            'score' => round($score, 3),
            'signals' => array_values(array_unique($signals)),
            'in_domain' => $score >= 0.32,
        ];
    }

    private function detectResponseLanguage(string $query): string
    {
        if (preg_match('/[\x{0600}-\x{06FF}]/u', $query)) {
            return 'ar';
        }

        $text = ' ' . Str::lower($query) . ' ';
        $frenchMarkers = [
            ' je ', ' cherche ', ' recherche ', ' veux ', ' voudrais ', ' voiture ', ' voitures ',
            ' vehicule ', ' vehicules ', ' véhicule ', ' véhicules ', ' automatique ', ' manuelle ',
            ' familial ', ' familiale ', ' confortable ', ' economique ', ' économique ', ' carburant ',
            ' sous ', ' moins de ', ' disponible ', ' disponibles ', ' recommandez ', ' essence ',
            ' electrique ', ' électrique ', ' hybride ', ' citadine ', ' berline ',
        ];
        $englishMarkers = [
            ' looking ', ' want ', ' need ', ' car ', ' cars ', ' vehicle ', ' vehicles ',
            ' automatic ', ' manual ', ' family ', ' comfortable ', ' cheap ', ' efficient ',
            ' under ', ' below ', ' recommend ', ' available ', ' fuel ', ' daily ',
        ];

        $frenchScore = 0;
        foreach ($frenchMarkers as $marker) {
            if (str_contains($text, $marker)) {
                $frenchScore++;
            }
        }
        if (preg_match('/[àâçéèêëîïôùûüÿœ]/u', $text)) {
            $frenchScore += 2;
        }

        $englishScore = 0;
        foreach ($englishMarkers as $marker) {
            if (str_contains($text, $marker)) {
                $englishScore++;
            }
        }

        return $frenchScore > $englishScore ? 'fr' : 'en';
    }

    private function localizedOutOfDomainMessage(string $language): string
    {
        return match ($language) {
            'fr' => "Je suis specialise dans la recherche de vehicules et les recommandations du marketplace. Quel type de voiture recherchez-vous ?",
            'ar' => "أنا متخصص في البحث عن السيارات وتوصيات السوق. ما نوع السيارة التي تبحث عنها؟",
            default => "I'm specialized in helping with vehicle search and marketplace recommendations. What type of car are you looking for?",
        };
    }

    private function localizedEmptyInventoryMessage(string $query, array $constraints, ?string $language = null): string
    {
        $language = in_array($language, ['en', 'fr', 'ar'], true) ? $language : $this->detectResponseLanguage($query);

        return match ($language) {
            'fr' => "Actuellement, aucun vehicule correspondant a votre demande n'est disponible dans l'inventaire du marketplace.",
            'ar' => "لا توجد حاليا مركبات مطابقة لطلبك في مخزون السوق.",
            default => 'Currently, no ' . $this->inventoryConstraintLabel($constraints) . ' vehicles are available in the marketplace inventory.',
        };
    }

    private function mentionsAny(string $query, array $terms): bool
    {
        foreach ($terms as $term) {
            if ($this->queryMentionsTerm($query, $term)) {
                return true;
            }
        }

        return false;
    }

    private function outOfDomainResponse(string $query, array $domain, ?string $language = null): array
    {
        $language = in_array($language, ['en', 'fr', 'ar'], true) ? $language : $this->detectResponseLanguage($query);
        $message = $this->localizedOutOfDomainMessage($language);

        return [
            'query' => $query,
            'description' => $query,
            'intent' => [],
            'ai_confidence' => 'Out of Scope',
            'engine' => 'automotive-marketplace-assistant',
            'grounded_in_inventory' => true,
            'response_language' => $language,
            'domain_relevance' => $domain,
            'inventory_answer' => $message,
            'count' => 0,
            'results' => [],
            'recommendations' => [],
        ];
    }

    private function debugAiPipeline(string $stage, array $context): void
    {
        if (!config('app.debug')) {
            return;
        }

        Log::debug('AI advisor pipeline', [
            'stage' => $stage,
            ...$context,
        ]);
    }

    private function detectHardInventoryConstraints(string $query): array
    {
        $constraints = [
            'brands' => $this->detectTerms($query, self::BRAND_ALIASES),
            'fuel_types' => $this->detectTerms($query, self::FUEL_ALIASES),
            'transmissions' => $this->detectTerms($query, self::TRANSMISSION_ALIASES),
            'categories' => $this->detectTerms($query, self::CATEGORY_ALIASES),
        ];

        $constraints['explicit'] = !empty($constraints['brands'])
            || !empty($constraints['fuel_types'])
            || !empty($constraints['transmissions'])
            || !empty($constraints['categories']);

        return $constraints;
    }

    private function detectTerms(string $query, array $aliases): array
    {
        $matches = [];
        foreach ($aliases as $canonical => $terms) {
            foreach ($terms as $term) {
                if ($this->queryMentionsTerm($query, $term)) {
                    $matches[] = $canonical;
                    break;
                }
            }
        }

        return array_values(array_unique($matches));
    }

    private function queryMentionsTerm(string $query, string $term): bool
    {
        $normalizedQuery = preg_replace('/[^\p{L}\p{N}]+/u', ' ', Str::lower($query));
        $normalizedTerm = trim(preg_replace('/[^\p{L}\p{N}]+/u', ' ', Str::lower($term)));

        if ($normalizedTerm === '') {
            return false;
        }

        return (bool) preg_match('/(^| )' . preg_quote($normalizedTerm, '/') . '( |$)/', trim($normalizedQuery));
    }

    private function applyHardInventoryConstraints($query, array $constraints): void
    {
        $this->applyLikeFilter($query, 'brand', $constraints['brands'] ?? [], self::BRAND_ALIASES);
        $this->applyLikeFilter($query, 'fuel_type', $constraints['fuel_types'] ?? [], self::FUEL_ALIASES);
        $this->applyLikeFilter($query, 'transmission', $constraints['transmissions'] ?? [], self::TRANSMISSION_ALIASES);
        $this->applyLikeFilter($query, 'category', $constraints['categories'] ?? [], self::CATEGORY_ALIASES);
    }

    private function applyLikeFilter($query, string $column, array $values, array $aliases): void
    {
        if (empty($values)) {
            return;
        }

        $query->where(function ($nested) use ($column, $values, $aliases) {
            foreach ($values as $value) {
                $terms = array_values(array_unique([$value, ...($aliases[$value] ?? [])]));
                foreach ($terms as $term) {
                    $nested->orWhere($column, 'like', '%' . $term . '%');
                }
            }
        });
    }

    private function emptyInventoryResponse(string $query, array $constraints, ?string $language = null): array
    {
        $language = in_array($language, ['en', 'fr', 'ar'], true) ? $language : $this->detectResponseLanguage($query);
        $message = $this->localizedEmptyInventoryMessage($query, $constraints, $language);

        return [
            'query' => $query,
            'description' => $query,
            'intent' => [],
            'ai_confidence' => 'No Inventory Match',
            'engine' => 'inventory-grounded-hard-sql-filter',
            'grounded_in_inventory' => true,
            'source_catalog_size' => Car::count(),
            'catalog_size' => Car::count(),
            'filtered_catalog_size' => 0,
            'inventory_constraints' => $constraints,
            'response_language' => $language,
            'inventory_answer' => $message,
            'count' => 0,
            'results' => [],
            'recommendations' => [],
        ];
    }

    private function inventoryConstraintLabel(array $constraints): string
    {
        $parts = [];

        foreach ($constraints['fuel_types'] ?? [] as $fuelType) {
            $parts[] = $fuelType;
        }
        foreach ($constraints['transmissions'] ?? [] as $transmission) {
            $parts[] = $transmission;
        }
        foreach ($constraints['categories'] ?? [] as $category) {
            $parts[] = $category;
        }
        foreach ($constraints['brands'] ?? [] as $brand) {
            $parts[] = $brand;
        }

        return empty($parts) ? 'matching' : implode(' ', $parts);
    }

    private function normalizeCar(Car $car): array
    {
        return [
            'id' => (int) $car->id,
            'brand' => (string) $car->brand,
            'model' => (string) $car->model,
            'year' => $car->year ? (int) $car->year : null,
            'price' => $car->price ? (float) $car->price : null,
            'mileage' => $car->mileage ? (float) $car->mileage : null,
            'fuel_type' => (string) $car->fuel_type,
            'transmission' => (string) $car->transmission,
            'category' => (string) ($car->category ?: optional($car->category()->first())->name),
            'color' => (string) $car->color,
            'description' => (string) $car->description,
            'image_url' => $car->image_url,
            'main_image' => $car->main_image,
        ];
    }

    private function normalizeAiResponse(array $response, string $query): array
    {
        $language = $response['response_language'] ?? $this->detectResponseLanguage($query);
        $items = collect($response['results'] ?? $response['recommendations'] ?? [])
            ->map(function ($item) use ($language) {
                $car = $item['car'] ?? [];
                $defaultReason = match ($language) {
                    'fr' => 'Correspondance IA selon les vehicules disponibles',
                    'ar' => 'مطابقة ذكية حسب المركبات المتاحة',
                    default => 'AI semantic match',
                };
                $fallbackReasons = $item['reasons'] ?? [$item['match_reason'] ?? $defaultReason];
                $fallbackMatchReason = $item['match_reason'] ?? implode(' - ', $fallbackReasons);
                return [
                    ...$item,
                    'car' => $car,
                    'score' => $item['score'] ?? $item['ai_match_percentage'] ?? 0,
                    'ai_match_percentage' => $item['ai_match_percentage'] ?? $item['score'] ?? 0,
                    'reasons' => $fallbackReasons,
                    'match_reason' => $item['match_reason'] ?? implode(' • ', $item['reasons'] ?? []),
                    'personality_tag' => $item['personality_tag'] ?? $this->confidenceTierLabel((int) ($item['ai_match_percentage'] ?? $item['score'] ?? 0), $language),
                    'match_reason' => $fallbackMatchReason,
                ];
            })
            ->values();

        return [
            ...$response,
            'description' => $query,
            'query' => $query,
            'response_language' => $language,
            'count' => $items->count(),
            'results' => $items,
            'recommendations' => $items,
        ];
    }

    private function confidenceTierLabel(int $percent, string $language = 'en'): string
    {
        if ($language === 'fr') {
            if ($percent >= 90) {
                return 'Forte compatibilite';
            }

            if ($percent >= 70) {
                return 'Alternative pertinente';
            }

            return 'Correspondance faible';
        }

        if ($language === 'ar') {
            if ($percent >= 90) {
                return 'مطابقة قوية';
            }

            if ($percent >= 70) {
                return 'بديل مناسب';
            }

            return 'مطابقة ضعيفة';
        }

        if ($percent >= 90) {
            return 'Strong Match';
        }

        if ($percent >= 70) {
            return 'Relevant Alternative';
        }

        return 'Weak Fallback';
    }

    private function userProfile(Request $request): ?array
    {
        $user = $request->user();
        if (!$user) {
            return null;
        }

        $activities = AiUserActivity::where('user_id', $user->id)->latest()->limit(50)->get();
        $profile = [];
        foreach ($activities as $activity) {
            $text = strtolower(trim(($activity->query ?? '') . ' ' . json_encode($activity->metadata ?? [])));
            foreach (['luxury', 'performance', 'family', 'efficiency', 'budget', 'comfort'] as $trait) {
                if (str_contains($text, $trait)) {
                    $profile[$trait] = ($profile[$trait] ?? 0) + 0.2;
                }
            }
        }

        $profile = collect($profile)->map(fn ($value) => min(1, $value))->all();

        return empty($profile) ? null : $profile;
    }

    private function storeActivity(Request $request, string $eventType, ?int $carId, ?string $query, array $metadata): AiUserActivity
    {
        $sessionId = $request->header('X-AI-Session')
            ?: ($request->hasSession() ? $request->session()->getId() : null)
            ?: Str::uuid()->toString();

        return AiUserActivity::create([
            'user_id' => optional($request->user())->id,
            'session_id' => $sessionId,
            'car_id' => $carId,
            'event_type' => $eventType,
            'query' => $query,
            'metadata' => $metadata,
        ]);
    }

    private function normalizeActivity(AiUserActivity $activity): array
    {
        return [
            'event_type' => $activity->event_type,
            'query' => $activity->query,
            'metadata' => [
                ...($activity->metadata ?? []),
                'car' => $activity->car ? $this->normalizeCar($activity->car) : null,
            ],
        ];
    }
}
