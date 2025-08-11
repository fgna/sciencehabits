const fs = require('fs');
const path = require('path');

// Replicate the exact loading logic from the validator
const dataDir = path.join(__dirname, '../src/data');
const researchMap = new Map();

// Load main research files
const researchFiles = [
  'research.json',
  'research_articles.json', 
  'enhanced_research.json'
];

console.log('Loading research exactly like the validator...');

for (const filename of researchFiles) {
  try {
    const researchPath = path.join(dataDir, filename);
    const researchContent = fs.readFileSync(researchPath, 'utf8');
    const researchData = JSON.parse(researchContent);
    const articles = Array.isArray(researchData) ? researchData : (researchData.articles || researchData.research || researchData.studies || []);
    
    console.log(`\nLoaded ${articles.length} articles from ${filename}`);
    
    articles.forEach((article, index) => {
      if (article && article.id) {
        researchMap.set(article.id, article);
      } else {
        console.log(`  Article at index ${index} has no ID or is invalid:`, {
          id: article?.id || 'MISSING',
          title: article?.title || 'MISSING',
          summary: article?.summary ? 'present' : 'MISSING'
        });
      }
    });
  } catch (error) {
    console.log(`Could not load ${filename}:`, error.message);
  }
}

// Convert to final array like the validator does
const finalResearch = Array.from(researchMap.values());
console.log(`\nFinal deduplicated array has ${finalResearch.length} articles`);

// Check for missing fields in final array
finalResearch.forEach((article, index) => {
  if (!article.id || !article.title || !article.summary) {
    console.log(`\nInvalid article at FINAL index ${index}:`);
    console.log(`  ID: ${article.id || 'MISSING'}`);
    console.log(`  Title: ${article.title || 'MISSING'}`);  
    console.log(`  Summary: ${article.summary ? 'present' : 'MISSING'}`);
    console.log(`  All keys: ${Object.keys(article).join(', ')}`);
  }
});