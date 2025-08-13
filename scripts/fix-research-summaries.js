#!/usr/bin/env node

/**
 * Script to add missing summary fields to research articles
 */

const fs = require('fs').promises;
const path = require('path');

async function fixResearchSummaries() {
  console.log('🔧 Fixing missing research summaries...');
  
  const researchDir = path.join(__dirname, '../public/data/research-articles');
  let fixedCount = 0;
  let errorCount = 0;

  try {
    const files = await fs.readdir(researchDir);
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const filePath = path.join(researchDir, file);
      
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        
        // Check if summary is missing
        if (!data.summary) {
          // Generate summary from available content
          let summary = '';
          
          // Try to extract from subtitle first
          if (data.subtitle) {
            summary = data.subtitle;
          }
          // Otherwise, use key takeaways
          else if (data.keyTakeaways && data.keyTakeaways.length > 0) {
            summary = `Key findings: ${data.keyTakeaways[0]}`;
          }
          // Otherwise, extract from content
          else if (data.content) {
            // Extract first meaningful paragraph from markdown content
            const lines = data.content.split('\n');
            for (const line of lines) {
              if (line.length > 50 && !line.startsWith('#') && !line.startsWith('*')) {
                summary = line.trim().substring(0, 200);
                break;
              }
            }
          }
          
          // If we found a summary, add it
          if (summary) {
            data.summary = summary;
            
            // Also ensure other critical fields exist
            if (!data.authors && data.author) {
              data.authors = data.author;
            }
            if (!data.year && data.studyDetails && data.studyDetails.year) {
              data.year = data.studyDetails.year;
            }
            if (!data.journal && data.studyDetails && data.studyDetails.journal) {
              data.journal = data.studyDetails.journal;
            }
            
            // Write back the fixed file
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            console.log(`✅ Fixed: ${file}`);
            fixedCount++;
          } else {
            console.warn(`⚠️  Could not generate summary for: ${file}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Fixed ${fixedCount} files`);
    console.log(`   ❌ ${errorCount} errors`);
    
  } catch (error) {
    console.error('❌ Failed to read research directory:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixResearchSummaries().catch(console.error);