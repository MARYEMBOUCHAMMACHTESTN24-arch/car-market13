<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index()
    {
        $this->syncFromCars();

        $categories = Category::withCount('cars')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $validated = $this->validateCategory($request);
        $validated['slug'] = $this->uniqueSlug($validated['name']);

        if ($request->hasFile('image')) {
            $validated['image'] = $this->storeImage($request);
        }

        $category = Category::create($validated);

        return response()->json($category->loadCount('cars'), 201);
    }

    public function update(Request $request, string $id)
    {
        $category = Category::findOrFail($id);
        $oldName = $category->name;
        $validated = $this->validateCategory($request, $category->id);

        if (isset($validated['name']) && $validated['name'] !== $category->name) {
            $validated['slug'] = $this->uniqueSlug($validated['name'], $category->id);
        }

        if ($request->hasFile('image')) {
            $validated['image'] = $this->storeImage($request);
        }

        $category->update($validated);

        if ($oldName !== $category->name) {
            Car::where('category_id', $category->id)
                ->orWhere('category', $oldName)
                ->update(['category' => $category->name, 'category_id' => $category->id]);
        }

        return response()->json($category->fresh()->loadCount('cars'));
    }

    public function destroy(string $id)
    {
        $category = Category::findOrFail($id);

        Car::where('category_id', $category->id)
            ->orWhere('category', $category->name)
            ->update(['category_id' => null, 'category' => null]);

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }

    private function validateCategory(Request $request, ?int $ignoreId = null): array
    {
        $uniqueName = 'unique:categories,name';
        $uniqueSlug = 'unique:categories,slug';

        if ($ignoreId) {
            $uniqueName .= ',' . $ignoreId;
            $uniqueSlug .= ',' . $ignoreId;
        }

        return $request->validate([
            'name' => ['required', 'string', 'max:100', $uniqueName],
            'slug' => ['nullable', 'string', 'max:120', $uniqueSlug],
            'image' => ['nullable'],
            'description' => ['nullable', 'string'],
        ]);
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'category';
        $slug = $base;
        $index = 2;

        while (
            Category::where('slug', $slug)
                ->when($ignoreId, fn($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$index}";
            $index++;
        }

        return $slug;
    }

    private function storeImage(Request $request): ?string
    {
        $image = $request->file('image');

        if (!$image) {
            return is_string($request->input('image')) ? $request->input('image') : null;
        }

        $fileName = 'category_' . uniqid() . '.' . $image->getClientOriginalExtension();
        $destPath = public_path('category');

        if (!is_dir($destPath)) {
            mkdir($destPath, 0777, true);
        }

        $image->move($destPath, $fileName);

        return '/category/' . $fileName;
    }

    private function syncFromCars(): void
    {
        $names = Car::query()
            ->select('category')
            ->distinct()
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->pluck('category');

        foreach ($names as $name) {
            $category = Category::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name]
            );

            Car::where('category', $name)
                ->whereNull('category_id')
                ->update(['category_id' => $category->id]);
        }
    }
}
