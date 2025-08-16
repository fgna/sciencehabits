#!/usr/bin/env node

/**
 * Production Content Fetcher v2.0
 * 
 * Fetches content from the private GitHub Pages Content API for the main
 * ScienceHabits application build process. Includes comprehensive fallback
 * strategies and performance optimization.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ProductionContentFetcher {
    constructor() {
        this.baseUrl = process.env.CONTENT_API_URL || 'https://your-username.github.io/sciencehabits-content-api';
        this.apiKey = process.env.CONTENT_API_KEY || process.env.BUILD_API_KEY;
        this.environment = process.env.NODE_ENV || 'development';
        this.retryAttempts = 3;
        this.retryDelay = 2000;
        this.timeout = 30000;
        
        this.supportedLanguages = ['en', 'de', 'fr', 'es'];
        this.contentTypes = ['habits', 'research', 'locales'];
        
        this.metrics = {
            startTime: Date.now(),
            apiCalls: 0,
            failedCalls: 0,
            fallbackUsed: false,
            contentSizes: {},
            responseTimeMs: 0
        };

        this.fallbackStrategies = [
            'github-pages-api',      // Primary: GitHub Pages API
            'local-cache',           // Secondary: Local cached content
            'static-fallback'        // Final: Static fallback content
        ];
    }

    async fetchAllContent() {
        console.log('🚀 Starting production content fetch v2.0...');
        console.log(`📍 Environment: ${this.environment}`);
        console.log(`🌐 API Base URL: ${this.baseUrl}`);
        console.log(`🔑 API Key: ${this.apiKey ? '✅ Configured' : '❌ Missing'}`);
        
        try {
            await this.validateEnvironment();
            this.ensureDirectories();
            await this.checkAPIHealth();
            
            const fetchPromises = this.supportedLanguages.map(language => 
                this.fetchLanguageContentWithRetry(language)
            );
            
            await Promise.all(fetchPromises);
            await this.fetchMetadata();
            await this.generateContentIndex();
            await this.validateContentIntegrity();
            
            this.logSuccessMetrics();
            console.log('✅ Production content fetch completed successfully!');
            
        } catch (error) {
            console.error('❌ Production content fetch failed:', error.message);
            console.log('🔄 Initiating comprehensive fallback procedures...');
            
            await this.executeFallbackStrategy();
            console.log('⚠️ Build continues with fallback content');
        }
    }

    async validateEnvironment() {
        if (!this.apiKey) {
            throw new Error('CONTENT_API_KEY or BUILD_API_KEY environment variable is required');
        }

        if (!this.baseUrl || this.baseUrl === 'https://your-username.github.io/sciencehabits-content-api') {
            throw new Error('CONTENT_API_URL environment variable must be configured with actual repository URL');
        }

        console.log('✅ Environment validation passed');
    }

    ensureDirectories() {
        const dirs = [
            'src/data/runtime',
            'src/data/runtime/habits',
            'src/data/runtime/research', 
            'src/data/runtime/locales',
            'src/data/cache',
            'src/data/fallback'
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        console.log('📁 Content directories prepared');
    }

    async checkAPIHealth() {
        console.log('🏥 Checking API health...');
        
        try {
            const healthData = await this.fetchWithTimeout(`${this.baseUrl}/?endpoint=health`, 10000);
            
            if (healthData.status === 'healthy') {
                console.log('✅ API health check passed');
                console.log(`   Version: ${healthData.version}`);
                console.log(`   Uptime: ${healthData.uptime}s`);
            } else {
                throw new Error('API health check failed');
            }
            
        } catch (error) {
            console.warn(`⚠️ API health check failed: ${error.message}`);
            throw new Error('Content API is not available');
        }
    }

    async fetchLanguageContentWithRetry(language) {
        console.log(`🌍 Fetching content for language: ${language.toUpperCase()}`);
        
        for (const strategy of this.fallbackStrategies) {
            try {
                await this.fetchLanguageContent(language, strategy);
                console.log(`✅ ${language.toUpperCase()} content fetched using ${strategy}`);
                return;
                
            } catch (error) {
                console.warn(`⚠️ ${strategy} failed for ${language}: ${error.message}`);
                continue;
            }
        }
        
        throw new Error(`All fallback strategies failed for language: ${language}`);
    }

    async fetchLanguageContent(language, strategy) {
        switch (strategy) {
            case 'github-pages-api':
                return await this.fetchFromGitHubPagesAPI(language);
            case 'local-cache':
                return await this.fetchFromLocalCache(language);
            case 'static-fallback':
                return await this.createStaticFallback(language);
            default:
                throw new Error(`Unknown strategy: ${strategy}`);
        }
    }

    async fetchFromGitHubPagesAPI(language) {
        // Fetch all content for this language in one request
        const allContentUrl = `${this.baseUrl}/?endpoint=all&lang=${language}&key=${this.apiKey}`;
        
        const startTime = Date.now();
        const allContent = await this.fetchWithTimeout(allContentUrl, this.timeout);
        this.metrics.responseTimeMs = Date.now() - startTime;
        this.metrics.apiCalls++;

        if (!allContent.data) {
            throw new Error('Invalid API response: missing data');
        }

        const { habits, research, locales } = allContent.data;

        // Save individual content types
        await this.saveContent('habits', language, habits || []);
        await this.saveContent('research', language, research || []);
        await this.saveContent('locales', language, locales || {});

        // Cache for fallback
        await this.cacheContent(language, allContent);

        console.log(`   📊 ${language.toUpperCase()}: ${habits?.length || 0} habits, ${research?.length || 0} research, ${Object.keys(locales || {}).length} locale keys`);
    }

    async fetchFromLocalCache(language) {
        const cacheFile = `src/data/cache/${language}-content.json`;
        
        if (!fs.existsSync(cacheFile)) {
            throw new Error(`No cached content found for ${language}`);
        }

        const cachedContent = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        const cacheAge = Date.now() - new Date(cachedContent.timestamp).getTime();
        
        // Use cache if less than 24 hours old
        if (cacheAge > 24 * 60 * 60 * 1000) {
            throw new Error(`Cached content for ${language} is too old`);
        }

        const { habits, research, locales } = cachedContent.data;
        
        await this.saveContent('habits', language, habits || []);
        await this.saveContent('research', language, research || []);
        await this.saveContent('locales', language, locales || {});

        this.metrics.fallbackUsed = true;
        console.log(`   📦 ${language.toUpperCase()}: Using cached content (${Math.round(cacheAge / 60000)} minutes old)`);
    }

    async createStaticFallback(language) {
        console.log(`   🛡️ Creating static fallback for ${language.toUpperCase()}`);
        
        const fallbackHabits = [
            {
                id: `fallback-habit-${language}`,
                title: this.getLocalizedText('Essential Daily Habit', language),
                description: this.getLocalizedText('A fundamental habit for daily well-being and productivity.', language),
                category: 'productivity',
                difficulty: 'beginner',
                timeMinutes: 10,
                language: language,
                researchBacked: true,
                sources: [],
                fallback: true
            }
        ];

        const fallbackResearch = [
            {
                id: `fallback-research-${language}`,
                title: this.getLocalizedText('Habit Formation Research Overview', language),
                summary: this.getLocalizedText('General overview of habit formation research and best practices for behavior change.', language),
                authors: 'ScienceHabits Team',
                year: new Date().getFullYear(),
                journal: 'ScienceHabits Research',
                category: 'productivity',
                evidenceLevel: 'systematic_review',
                qualityScore: 75,
                language: language,
                fallback: true
            }
        ];

        const fallbackLocales = {
            'navigation.dashboard': this.getLocalizedText('Dashboard', language),
            'navigation.habits': this.getLocalizedText('My Habits', language),
            'navigation.research': this.getLocalizedText('Research', language),
            'common.loading': this.getLocalizedText('Loading...', language),
            'common.error': this.getLocalizedText('Error', language),
            'fallback.notice': this.getLocalizedText('Using offline content', language)
        };

        await this.saveContent('habits', language, fallbackHabits);
        await this.saveContent('research', language, fallbackResearch);
        await this.saveContent('locales', language, fallbackLocales);

        this.metrics.fallbackUsed = true;
    }

    async saveContent(contentType, language, content) {
        const outputPath = `src/data/runtime/${contentType}/${language}.json`;
        const contentData = {
            timestamp: new Date().toISOString(),
            language: language,
            type: contentType,
            count: Array.isArray(content) ? content.length : Object.keys(content).length,
            data: content,
            metadata: {
                source: this.metrics.fallbackUsed ? 'fallback' : 'api',
                version: '2.0.0',
                fetchedAt: new Date().toISOString()
            }
        };

        fs.writeFileSync(outputPath, JSON.stringify(contentData, null, 2));
        
        this.metrics.contentSizes[`${contentType}-${language}`] = Buffer.byteLength(JSON.stringify(content), 'utf8');
    }

    async cacheContent(language, content) {
        const cacheFile = `src/data/cache/${language}-content.json`;
        const cacheData = {
            timestamp: new Date().toISOString(),
            language: language,
            data: content.data,
            metadata: content.metadata
        };

        fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
    }

    async fetchMetadata() {
        console.log('📊 Fetching content metadata...');
        
        try {
            const metadataUrl = `${this.baseUrl}/?endpoint=metadata&key=${this.apiKey}`;
            const metadata = await this.fetchWithTimeout(metadataUrl, this.timeout);
            
            const metadataFile = 'src/data/runtime/metadata.json';
            fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
            
            console.log('✅ Metadata fetched and saved');
            
        } catch (error) {
            console.warn('⚠️ Failed to fetch metadata, using fallback');
            await this.createFallbackMetadata();
        }
    }

    async createFallbackMetadata() {
        const fallbackMetadata = {
            timestamp: new Date().toISOString(),
            type: 'metadata',
            data: {
                api: {
                    version: '2.0.0',
                    source: 'fallback',
                    lastUpdated: new Date().toISOString()
                },
                content: {
                    languages: this.supportedLanguages,
                    types: this.contentTypes,
                    fallbackMode: true
                }
            }
        };

        fs.writeFileSync('src/data/runtime/metadata.json', JSON.stringify(fallbackMetadata, null, 2));
    }

    async generateContentIndex() {
        console.log('📋 Generating content index...');
        
        const index = {
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            languages: {},
            summary: {
                totalHabits: 0,
                totalResearch: 0,
                totalLocaleKeys: 0
            },
            metrics: this.metrics
        };

        for (const language of this.supportedLanguages) {
            const langIndex = {
                language: language,
                habits: 0,
                research: 0,
                localeKeys: 0,
                files: []
            };

            // Count content for each type
            for (const contentType of this.contentTypes) {
                const filePath = `src/data/runtime/${contentType}/${language}.json`;
                if (fs.existsSync(filePath)) {
                    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    const count = content.count || 0;
                    
                    langIndex[contentType === 'locales' ? 'localeKeys' : contentType] = count;
                    langIndex.files.push(`${contentType}/${language}.json`);
                    
                    if (contentType === 'habits') index.summary.totalHabits += count;
                    else if (contentType === 'research') index.summary.totalResearch += count;
                    else if (contentType === 'locales') index.summary.totalLocaleKeys += count;
                }
            }

            index.languages[language] = langIndex;
        }

        fs.writeFileSync('src/data/runtime/content-index.json', JSON.stringify(index, null, 2));
        console.log('✅ Content index generated');
    }

    async validateContentIntegrity() {
        console.log('🔒 Validating content integrity...');
        
        let validationErrors = 0;
        
        for (const language of this.supportedLanguages) {
            for (const contentType of this.contentTypes) {
                const filePath = `src/data/runtime/${contentType}/${language}.json`;
                
                if (fs.existsSync(filePath)) {
                    try {
                        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        
                        if (!content.data) {
                            console.warn(`⚠️ Missing data field in ${filePath}`);
                            validationErrors++;
                        }
                        
                        if (!content.timestamp) {
                            console.warn(`⚠️ Missing timestamp in ${filePath}`);
                            validationErrors++;
                        }
                        
                    } catch (error) {
                        console.error(`❌ Invalid JSON in ${filePath}: ${error.message}`);
                        validationErrors++;
                    }
                }
            }
        }
        
        if (validationErrors === 0) {
            console.log('✅ Content integrity validation passed');
        } else {
            console.warn(`⚠️ Found ${validationErrors} validation issues`);
        }
    }

    async fetchWithTimeout(url, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Request timeout after ${timeout}ms`));
            }, timeout);
            
            https.get(url, (res) => {
                clearTimeout(timer);
                
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    return;
                }
                
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        // GitHub Pages API returns HTML with JSON in <pre> tags
                        const html = data;
                        const jsonMatch = html.match(/<pre>(.*?)<\/pre>/s);
                        
                        if (jsonMatch) {
                            const content = JSON.parse(jsonMatch[1]);
                            
                            if (content.error) {
                                reject(new Error(content.message || 'API returned error'));
                                return;
                            }
                            
                            resolve(content);
                        } else {
                            reject(new Error('Invalid API response format'));
                        }
                    } catch (error) {
                        reject(new Error(`JSON parse error: ${error.message}`));
                    }
                });
            }).on('error', (error) => {
                clearTimeout(timer);
                reject(error);
            });
        });
    }

    getLocalizedText(text, language) {
        const translations = {
            'Essential Daily Habit': {
                en: 'Essential Daily Habit',
                de: 'Wesentliche tägliche Gewohnheit',
                fr: 'Habitude quotidienne essentielle',
                es: 'Hábito diario esencial'
            },
            'A fundamental habit for daily well-being and productivity.': {
                en: 'A fundamental habit for daily well-being and productivity.',
                de: 'Eine grundlegende Gewohnheit für tägliches Wohlbefinden und Produktivität.',
                fr: 'Une habitude fondamentale pour le bien-être quotidien et la productivité.',
                es: 'Un hábito fundamental para el bienestar diario y la productividad.'
            },
            'Dashboard': {
                en: 'Dashboard',
                de: 'Übersicht',
                fr: 'Tableau de bord',
                es: 'Panel'
            },
            'My Habits': {
                en: 'My Habits',
                de: 'Meine Gewohnheiten',
                fr: 'Mes habitudes',
                es: 'Mis hábitos'
            },
            'Research': {
                en: 'Research',
                de: 'Forschung',
                fr: 'Recherche',
                es: 'Investigación'
            },
            'Loading...': {
                en: 'Loading...',
                de: 'Laden...',
                fr: 'Chargement...',
                es: 'Cargando...'
            },
            'Error': {
                en: 'Error',
                de: 'Fehler',
                fr: 'Erreur',
                es: 'Error'
            },
            'Using offline content': {
                en: 'Using offline content',
                de: 'Verwende Offline-Inhalte',
                fr: 'Utilisation du contenu hors ligne',
                es: 'Usando contenido sin conexión'
            }
        };

        return translations[text]?.[language] || text;
    }

    async executeFallbackStrategy() {
        console.log('🔄 Executing comprehensive fallback strategy...');
        this.ensureDirectories();
        
        for (const language of this.supportedLanguages) {
            await this.createStaticFallback(language);
        }
        
        await this.createFallbackMetadata();
        await this.generateContentIndex();
        
        console.log('✅ Fallback strategy execution completed');
    }

    logSuccessMetrics() {
        const totalTime = Date.now() - this.metrics.startTime;
        const totalSize = Object.values(this.metrics.contentSizes).reduce((sum, size) => sum + size, 0);
        
        console.log('\n📊 Content Fetch Metrics:');
        console.log(`⏱️  Total time: ${totalTime}ms`);
        console.log(`📞 API calls: ${this.metrics.apiCalls}`);
        console.log(`❌ Failed calls: ${this.metrics.failedCalls}`);
        console.log(`📦 Total content size: ${Math.round(totalSize / 1024)}KB`);
        console.log(`⚡ Average response time: ${this.metrics.responseTimeMs}ms`);
        console.log(`🛡️  Fallback used: ${this.metrics.fallbackUsed ? 'Yes' : 'No'}`);
        
        if (this.metrics.responseTimeMs > 0) {
            const performanceRating = this.metrics.responseTimeMs < 200 ? '🚀 Excellent' :
                                     this.metrics.responseTimeMs < 500 ? '✅ Good' :
                                     this.metrics.responseTimeMs < 1000 ? '⚠️ Fair' : '🐌 Slow';
            console.log(`📈 Performance: ${performanceRating}`);
        }
    }
}

// CLI execution
if (require.main === module) {
    const fetcher = new ProductionContentFetcher();
    fetcher.fetchAllContent().catch(error => {
        console.error('💥 Content fetch crashed:', error);
        process.exit(1);
    });
}

module.exports = ProductionContentFetcher;