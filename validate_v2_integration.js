const http = require('http');

async function testEndpoint(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, error: 'Invalid JSON' });
        }
      });
    }).on('error', err => resolve({ status: 500, error: err.message }));
  });
}

async function validateIntegration() {
  console.log("=== V2 Integration Validation ===");
  const issues = {
    critical: [],
    warnings: [],
    successes: []
  };

  try {
    // 1. API Endpoint Testing
    console.log("\n[1] Testing V2 API Endpoints...");
    
    const endpoints = [
      '/api/cars?limit=1',
      '/api/featured',
      '/api/brands',
      '/api/categories',
    ];

    for (const ep of endpoints) {
      const result = await testEndpoint(ep);
      if (result.status === 200 && !result.error) {
        issues.successes.push(`Endpoint ${ep} is healthy`);
      } else {
        issues.critical.push(`Endpoint ${ep} failed: Status ${result.status}`);
      }
    }

    // 2. Data Integrity Testing (via API)
    console.log("\n[2] Testing Database Integrity via API...");
    const allCarsRes = await testEndpoint('/api/cars?limit=48');
    
    if (allCarsRes.status !== 200) {
      issues.critical.push(`Failed to load cars from /api/cars. Status: ${allCarsRes.status}. Error: ${allCarsRes.error || JSON.stringify(allCarsRes.data)}`);
      printSummary(issues);
      return;
    }
    
    const cars = allCarsRes.data?.data || [];
    const totalCount = allCarsRes.data?.total || 0;

    if (cars.length === 0) {
      issues.critical.push('No cars found in API response');
    } else {
      issues.successes.push(`Loaded ${cars.length} V2 cars from API`);
    }

    // Slug & Image validation
    let brokenSlugs = 0;
    let missingImages = 0;

    for (const car of cars) {
      if (!car.slug || car.slug.trim() === '') brokenSlugs++;
      
      const mainImage = car.mainImage;
      if (!mainImage) {
        issues.warnings.push(`Car ID ${car.id} (${car.title}) has no main image`);
        missingImages++;
      } else if (!mainImage.imageUrl || mainImage.imageUrl.trim() === '') {
        issues.warnings.push(`Car ID ${car.id} (${car.title}) main image URL is empty`);
        missingImages++;
      }

      // Test a random slug endpoint
      if (car.id % 20 === 0) {
        const slugRes = await testEndpoint(`/api/cars/${car.slug}`);
        if (slugRes.status !== 200) {
          issues.critical.push(`Failed to fetch car by slug: ${car.slug}`);
        }
      }
    }

    if (brokenSlugs > 0) issues.critical.push(`${brokenSlugs} cars have broken or missing slugs`);
    else issues.successes.push('All cars have valid slugs');

    if (missingImages > 0) issues.warnings.push(`${missingImages} cars are missing main images`);
    else issues.successes.push('All cars have correctly mapped main images');

    // Pagination bounds check
    const paginationTest = await testEndpoint('/api/cars?page=999');
    if (paginationTest.status === 200 && Array.isArray(paginationTest.data?.data) && paginationTest.data.data.length === 0) {
      issues.successes.push('Pagination out-of-bounds correctly returns empty array');
    } else {
      issues.warnings.push('Pagination out-of-bounds did not return expected empty state');
    }

    printSummary(issues);

  } catch (err) {
    console.error("Validation script crashed:", err);
  }
}

function printSummary(issues) {
    // Output summary
    console.log("\n--- VALIDATION SUMMARY ---");
    console.log(`\nCRITICAL ISSUES (${issues.critical.length}):`);
    issues.critical.forEach(i => console.log(`[X] ${i}`));
    
    console.log(`\nWARNINGS (${issues.warnings.length}):`);
    issues.warnings.forEach(i => console.log(`[!] ${i}`));
    
    console.log(`\nSUCCESSES (${issues.successes.length}):`);
    issues.successes.forEach(i => console.log(`[✓] ${i}`));
}

validateIntegration();
